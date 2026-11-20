import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { pool, query } from '../db/pool';
import { SEED_PROPERTIES } from '../db/seedData';
import { upsertProperty } from '../repositories/propertyRepository';

const app = createApp();

describe('POST /api/v1/imports — Idempotent CSV & JSON Import Integration Tests', () => {
  beforeAll(async () => {
    // Ensure schema exists in the test database by applying the up migration SQL
    const migrationPath = path.resolve(
      __dirname,
      '../../migrations/1700000000001_initial_schema.sql'
    );
    const fullSql = fs.readFileSync(migrationPath, 'utf8');
    const upSql = fullSql.split('-- Down Migration')[0] ?? fullSql;

    await query('DROP TABLE IF EXISTS review_topics, reviews, import_batches, properties CASCADE');
    await query(upSql);

    for (const prop of SEED_PROPERTIES) {
      await upsertProperty(prop);
    }
  });

  beforeEach(async () => {
    await query('TRUNCATE TABLE review_topics, reviews, import_batches RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('imports valid JSON reviews, tags topics, and deduplicates idempotently on re-import', async () => {
    const payload = {
      filename: 'test-batch.json',
      reviews: [
        {
          property_slug: 'amsterdam-canal-house',
          external_id: 'EXT-101',
          reviewer_name: 'Alice M.',
          guest_country_code: 'GB',
          guest_country_name: 'United Kingdom',
          trip_type: 'couple',
          room_type: 'Canal View Deluxe',
          stay_nights: 3,
          score: 9.2,
          title: 'Wonderful canal stay',
          positive_comment: 'Spotless room, friendly staff, and delicious breakfast.',
          negative_comment: 'A bit of street noise on Saturday night.',
          review_date: '2026-08-15',
        },
        {
          property_slug: 'berlin-business-hotel',
          external_id: 'EXT-102',
          reviewer_name: 'Markus K.',
          guest_country_code: 'DE',
          guest_country_name: 'Germany',
          trip_type: 'business',
          stay_nights: 2,
          score: 4.8,
          title: 'Poor wifi and cold breakfast',
          negative_comment: 'Slow wifi disconnected during my calls and cold breakfast eggs.',
          review_date: '2026-08-16',
        },
      ],
    };

    // First import: both rows should be imported
    const firstRes = await request(app).post('/api/v1/imports').send(payload).expect(201);

    expect(firstRes.body.success).toBe(true);
    expect(firstRes.body.data.totalRows).toBe(2);
    expect(firstRes.body.data.importedRows).toBe(2);
    expect(firstRes.body.data.duplicateRows).toBe(0);
    expect(firstRes.body.data.failedRows).toBe(0);

    // Verify topics and flagged status were persisted in Postgres
    const topicsCount = await query<{ count: string }>('SELECT COUNT(*) AS count FROM review_topics');
    expect(Number(topicsCount.rows[0]?.count)).toBeGreaterThanOrEqual(4);

    const flaggedCount = await query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM reviews WHERE is_flagged = TRUE'
    );
    expect(Number(flaggedCount.rows[0]?.count)).toBe(1);

    // Second import of identical data: 0 imported, 2 duplicates skipped
    const secondRes = await request(app).post('/api/v1/imports').send(payload).expect(201);

    expect(secondRes.body.data.totalRows).toBe(2);
    expect(secondRes.body.data.importedRows).toBe(0);
    expect(secondRes.body.data.duplicateRows).toBe(2);
    expect(secondRes.body.data.failedRows).toBe(0);
  });

  it('imports a multipart/form-data CSV upload and reports row-level validation errors without aborting valid rows', async () => {
    const csvContent = [
      'property_slug,external_id,reviewer_name,guest_country_code,guest_country_name,trip_type,stay_nights,score,title,positive_comment,negative_comment,review_date',
      'barcelona-beach-resort,CSV-001,Carlos R.,ES,Spain,family,4,8.8,"Great beachfront resort","Beachfront location and spacious room were fantastic.","Overpriced breakfast.",2026-07-20',
      'unknown-hotel-slug,CSV-002,Bad Slug,US,United States,solo,2,7.5,"Wrong property","Nice bed","",2026-07-21',
      'zurich-alpine-lodge,CSV-003,Invalid Score,CH,Switzerland,couple,2,14.5,"Score too high","Spotless room","",2026-07-22',
    ].join('\n');

    const res = await request(app)
      .post('/api/v1/imports')
      .attach('file', Buffer.from(csvContent, 'utf8'), {
        filename: 'mixed-reviews.csv',
        contentType: 'text/csv',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.sourceType).toBe('csv');
    expect(res.body.data.totalRows).toBe(3);
    expect(res.body.data.importedRows).toBe(1);
    expect(res.body.data.failedRows).toBe(2);
    expect(res.body.data.errors).toHaveLength(2);
    expect(res.body.data.errors[0].rowNumber).toBe(2);
    expect(res.body.data.errors[0].field).toBe('property_slug');
    expect(res.body.data.errors[1].rowNumber).toBe(3);
    expect(res.body.data.errors[1].field).toBe('score');
  });

  it('rejects unsupported file extensions (.exe / .pdf)', async () => {
    const res = await request(app)
      .post('/api/v1/imports')
      .attach('file', Buffer.from('malicious binary'), {
        filename: 'payload.exe',
        contentType: 'application/octet-stream',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });
});
