import { PoolClient } from 'pg';
import { query } from '../db/pool';
import { Property } from '../types/domain';

interface PropertyRow {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  country_code: string;
  star_rating: number;
  total_rooms: number;
  description: string | null;
  created_at: Date;
}

function mapPropertyRow(row: PropertyRow): Property {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    country: row.country,
    countryCode: row.country_code,
    starRating: Number(row.star_rating),
    totalRooms: Number(row.total_rooms),
    description: row.description,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findAllProperties(): Promise<Property[]> {
  const result = await query<PropertyRow>(
    `SELECT id, slug, name, city, country, country_code, star_rating, total_rooms, description, created_at
     FROM properties
     ORDER BY name ASC`
  );
  return result.rows.map(mapPropertyRow);
}

export async function findPropertyBySlugOrId(identifier: string): Promise<Property | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    identifier
  );
  const sql = isUuid
    ? `SELECT id, slug, name, city, country, country_code, star_rating, total_rooms, description, created_at
       FROM properties WHERE id = $1`
    : `SELECT id, slug, name, city, country, country_code, star_rating, total_rooms, description, created_at
       FROM properties WHERE slug = $1`;

  const result = await query<PropertyRow>(sql, [identifier]);
  const row = result.rows[0];
  return row ? mapPropertyRow(row) : null;
}

export async function upsertProperty(
  input: {
    slug: string;
    name: string;
    city: string;
    country: string;
    countryCode: string;
    starRating: number;
    totalRooms: number;
    description: string;
  },
  client?: PoolClient
): Promise<Property> {
  const sql = `
    INSERT INTO properties (slug, name, city, country, country_code, star_rating, total_rooms, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      city = EXCLUDED.city,
      country = EXCLUDED.country,
      country_code = EXCLUDED.country_code,
      star_rating = EXCLUDED.star_rating,
      total_rooms = EXCLUDED.total_rooms,
      description = EXCLUDED.description
    RETURNING id, slug, name, city, country, country_code, star_rating, total_rooms, description, created_at
  `;
  const params = [
    input.slug,
    input.name,
    input.city,
    input.country,
    input.countryCode,
    input.starRating,
    input.totalRooms,
    input.description,
  ];

  const result = client
    ? await client.query<PropertyRow>(sql, params)
    : await query<PropertyRow>(sql, params);

  const row = result.rows[0];
  if (!row) {
    throw new Error(`Failed to upsert property ${input.slug}`);
  }
  return mapPropertyRow(row);
}
