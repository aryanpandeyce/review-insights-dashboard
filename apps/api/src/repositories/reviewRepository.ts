import { query } from '../db/pool';
import { DetectedTopic, Sentiment, TopicName, TripType } from '../types/domain';

export interface ReviewExplorerItem {
  id: string;
  propertyId: string;
  propertySlug: string;
  propertyName: string;
  propertyCity: string;
  externalId: string | null;
  reviewerName: string;
  guestCountryCode: string;
  guestCountryName: string;
  tripType: TripType;
  roomType: string | null;
  stayNights: number;
  score: number;
  sentiment: Sentiment;
  title: string;
  positiveComment: string | null;
  negativeComment: string | null;
  fullText: string;
  reviewDate: string;
  ownerResponse: string | null;
  ownerRespondedAt: string | null;
  isFlagged: boolean;
  isResolved: boolean;
  resolvedAt: string | null;
  resolvedNotes: string | null;
  createdAt: string;
  topics: DetectedTopic[];
}

export interface ReviewSearchFilterParams {
  propertyId?: string;
  from?: string;
  to?: string;
  search?: string;
  minScore?: number;
  maxScore?: number;
  topic?: TopicName;
  sentiment?: Sentiment;
  tripType?: TripType;
  guestCountry?: string;
  flagged?: boolean;
  resolved?: boolean;
  hasResponse?: boolean;
  sortBy: 'review_date' | 'score';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

interface RawReviewRow {
  id: string;
  property_id: string;
  property_slug: string;
  property_name: string;
  property_city: string;
  external_id: string | null;
  reviewer_name: string;
  guest_country_code: string;
  guest_country_name: string;
  trip_type: TripType;
  room_type: string | null;
  stay_nights: number;
  score: string;
  sentiment: Sentiment;
  title: string;
  positive_comment: string | null;
  negative_comment: string | null;
  full_text: string;
  review_date: string;
  owner_response: string | null;
  owner_responded_at: Date | null;
  is_flagged: boolean;
  is_resolved: boolean;
  resolved_at: Date | null;
  resolved_notes: string | null;
  created_at: Date;
  topics: DetectedTopic[] | null;
}

function mapRawReviewRow(row: RawReviewRow): ReviewExplorerItem {
  return {
    id: row.id,
    propertyId: row.property_id,
    propertySlug: row.property_slug,
    propertyName: row.property_name,
    propertyCity: row.property_city,
    externalId: row.external_id,
    reviewerName: row.reviewer_name,
    guestCountryCode: row.guest_country_code,
    guestCountryName: row.guest_country_name,
    tripType: row.trip_type,
    roomType: row.room_type,
    stayNights: Number(row.stay_nights),
    score: Number(row.score),
    sentiment: row.sentiment,
    title: row.title,
    positiveComment: row.positive_comment,
    negativeComment: row.negative_comment,
    fullText: row.full_text,
    reviewDate: row.review_date,
    ownerResponse: row.owner_response,
    ownerRespondedAt: row.owner_responded_at ? row.owner_responded_at.toISOString() : null,
    isFlagged: row.is_flagged,
    isResolved: row.is_resolved,
    resolvedAt: row.resolved_at ? row.resolved_at.toISOString() : null,
    resolvedNotes: row.resolved_notes,
    createdAt: row.created_at.toISOString(),
    topics: Array.isArray(row.topics) ? row.topics : [],
  };
}

function buildWhereClauses(filters: Omit<ReviewSearchFilterParams, 'sortBy' | 'sortOrder' | 'page' | 'pageSize'>): {
  whereSql: string;
  params: unknown[];
} {
  const conditions: string[] = [];
  const params: unknown[] = [];

  const addParam = (val: unknown): string => {
    params.push(val);
    return `$${params.length}`;
  };

  if (filters.propertyId) {
    conditions.push(`r.property_id = ${addParam(filters.propertyId)}`);
  }
  if (filters.from) {
    conditions.push(`r.review_date >= ${addParam(filters.from)}::date`);
  }
  if (filters.to) {
    conditions.push(`r.review_date <= ${addParam(filters.to)}::date`);
  }
  if (filters.minScore !== undefined) {
    conditions.push(`r.score >= ${addParam(filters.minScore)}`);
  }
  if (filters.maxScore !== undefined) {
    conditions.push(`r.score <= ${addParam(filters.maxScore)}`);
  }
  if (filters.sentiment) {
    conditions.push(`r.sentiment = ${addParam(filters.sentiment)}`);
  }
  if (filters.tripType) {
    conditions.push(`r.trip_type = ${addParam(filters.tripType)}`);
  }
  if (filters.guestCountry) {
    conditions.push(`r.guest_country_code = ${addParam(filters.guestCountry)}`);
  }
  if (filters.flagged !== undefined) {
    conditions.push(`r.is_flagged = ${addParam(filters.flagged)}`);
  }
  if (filters.resolved !== undefined) {
    conditions.push(`r.is_resolved = ${addParam(filters.resolved)}`);
  }
  if (filters.hasResponse !== undefined) {
    conditions.push(
      filters.hasResponse ? `r.owner_response IS NOT NULL` : `r.owner_response IS NULL`
    );
  }
  if (filters.topic) {
    const topicParam = addParam(filters.topic);
    conditions.push(
      `EXISTS (SELECT 1 FROM review_topics rt_filter WHERE rt_filter.review_id = r.id AND rt_filter.topic = ${topicParam})`
    );
  }
  if (filters.search) {
    const likePattern = `%${filters.search}%`;
    const p = addParam(likePattern);
    conditions.push(
      `(r.full_text ILIKE ${p} OR r.title ILIKE ${p} OR r.reviewer_name ILIKE ${p})`
    );
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereSql, params };
}

export async function searchReviewsPaginated(
  filters: ReviewSearchFilterParams
): Promise<{
  items: ReviewExplorerItem[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const { whereSql, params } = buildWhereClauses(filters);

  const sortColumn = filters.sortBy === 'score' ? 'r.score' : 'r.review_date';
  const sortDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

  const countSql = `
    SELECT COUNT(*)::text AS count
    FROM reviews r
    ${whereSql}
  `;

  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;
  const offset = (filters.page - 1) * filters.pageSize;

  const dataSql = `
    SELECT
      r.id,
      r.property_id,
      p.slug AS property_slug,
      p.name AS property_name,
      p.city AS property_city,
      r.external_id,
      r.reviewer_name,
      r.guest_country_code,
      r.guest_country_name,
      r.trip_type,
      r.room_type,
      r.stay_nights,
      r.score::text AS score,
      r.sentiment,
      r.title,
      r.positive_comment,
      r.negative_comment,
      r.full_text,
      TO_CHAR(r.review_date, 'YYYY-MM-DD') AS review_date,
      r.owner_response,
      r.owner_responded_at,
      r.is_flagged,
      r.is_resolved,
      r.resolved_at,
      r.resolved_notes,
      r.created_at,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'topic', rt.topic,
              'sentiment', rt.sentiment,
              'matchedKeywords', rt.matched_keywords,
              'snippet', rt.snippet
            )
            ORDER BY rt.topic ASC
          )
          FROM review_topics rt
          WHERE rt.review_id = r.id
        ),
        '[]'::json
      ) AS topics
    FROM reviews r
    INNER JOIN properties p ON p.id = r.property_id
    ${whereSql}
    ORDER BY ${sortColumn} ${sortDirection}, r.created_at DESC
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  const [countRes, dataRes] = await Promise.all([
    query<{ count: string }>(countSql, params),
    query<RawReviewRow>(dataSql, [...params, filters.pageSize, offset]),
  ]);

  const totalItems = Number(countRes.rows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));

  return {
    items: dataRes.rows.map(mapRawReviewRow),
    totalItems,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages,
  };
}

export async function findReviewById(id: string): Promise<ReviewExplorerItem | null> {
  const res = await query<RawReviewRow>(
    `SELECT
      r.id,
      r.property_id,
      p.slug AS property_slug,
      p.name AS property_name,
      p.city AS property_city,
      r.external_id,
      r.reviewer_name,
      r.guest_country_code,
      r.guest_country_name,
      r.trip_type,
      r.room_type,
      r.stay_nights,
      r.score::text AS score,
      r.sentiment,
      r.title,
      r.positive_comment,
      r.negative_comment,
      r.full_text,
      TO_CHAR(r.review_date, 'YYYY-MM-DD') AS review_date,
      r.owner_response,
      r.owner_responded_at,
      r.is_flagged,
      r.is_resolved,
      r.resolved_at,
      r.resolved_notes,
      r.created_at,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'topic', rt.topic,
              'sentiment', rt.sentiment,
              'matchedKeywords', rt.matched_keywords,
              'snippet', rt.snippet
            )
            ORDER BY rt.topic ASC
          )
          FROM review_topics rt
          WHERE rt.review_id = r.id
        ),
        '[]'::json
      ) AS topics
    FROM reviews r
    INNER JOIN properties p ON p.id = r.property_id
    WHERE r.id = $1`,
    [id]
  );

  const row = res.rows[0];
  return row ? mapRawReviewRow(row) : null;
}

export async function updateReviewResolution(input: {
  id: string;
  resolved: boolean;
  resolvedNotes: string | null;
}): Promise<ReviewExplorerItem | null> {
  const updateRes = await query<{ id: string }>(
    `UPDATE reviews
     SET is_resolved = $2,
         resolved_at = CASE WHEN $2 = TRUE THEN NOW() ELSE NULL END,
         resolved_notes = CASE WHEN $2 = TRUE THEN $3 ELSE NULL END
     WHERE id = $1
     RETURNING id`,
    [input.id, input.resolved, input.resolvedNotes]
  );

  if (!updateRes.rows[0]) {
    return null;
  }

  return findReviewById(input.id);
}

export async function getFlaggedSummaryCounts(propertyId?: string): Promise<{
  totalFlagged: number;
  unresolvedCount: number;
  resolvedCount: number;
}> {
  const params: unknown[] = [];
  const propClause = propertyId ? `AND property_id = $1` : '';
  if (propertyId) params.push(propertyId);

  const res = await query<{
    total_flagged: string;
    unresolved_count: string;
    resolved_count: string;
  }>(
    `SELECT
       COUNT(*)::text AS total_flagged,
       COUNT(*) FILTER (WHERE is_resolved = FALSE)::text AS unresolved_count,
       COUNT(*) FILTER (WHERE is_resolved = TRUE)::text AS resolved_count
     FROM reviews
     WHERE is_flagged = TRUE ${propClause}`,
    params
  );

  const row = res.rows[0];
  return {
    totalFlagged: Number(row?.total_flagged ?? 0),
    unresolvedCount: Number(row?.unresolved_count ?? 0),
    resolvedCount: Number(row?.resolved_count ?? 0),
  };
}
