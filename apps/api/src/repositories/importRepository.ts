import { PoolClient } from 'pg';
import { query } from '../db/pool';
import {
  DetectedTopic,
  ImportBatchResult,
  ImportRowError,
  ImportSourceType,
  Sentiment,
  TripType,
} from '../types/domain';

export interface InsertReviewParams {
  propertyId: string;
  importBatchId: string;
  externalId: string | null;
  contentHash: string;
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
  topics: DetectedTopic[];
}

interface ImportBatchRow {
  id: string;
  filename: string;
  source_type: ImportSourceType;
  total_rows: number;
  imported_rows: number;
  duplicate_rows: number;
  failed_rows: number;
  error_report: ImportRowError[];
  created_at: Date;
}

export async function createImportBatchRecord(
  client: PoolClient,
  input: {
    filename: string;
    sourceType: ImportSourceType;
    totalRows: number;
  }
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO import_batches (filename, source_type, total_rows)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [input.filename, input.sourceType, input.totalRows]
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create import_batches record');
  }
  return row.id;
}

export async function finalizeImportBatchRecord(
  client: PoolClient,
  input: {
    batchId: string;
    importedRows: number;
    duplicateRows: number;
    failedRows: number;
    errors: ImportRowError[];
  }
): Promise<ImportBatchResult> {
  const result = await client.query<ImportBatchRow>(
    `UPDATE import_batches
     SET imported_rows = $2,
         duplicate_rows = $3,
         failed_rows = $4,
         error_report = $5::jsonb
     WHERE id = $1
     RETURNING id, filename, source_type, total_rows, imported_rows, duplicate_rows, failed_rows, error_report, created_at`,
    [
      input.batchId,
      input.importedRows,
      input.duplicateRows,
      input.failedRows,
      JSON.stringify(input.errors),
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error(`Failed to finalize import batch ${input.batchId}`);
  }

  return {
    batchId: row.id,
    filename: row.filename,
    sourceType: row.source_type,
    totalRows: row.total_rows,
    importedRows: row.imported_rows,
    duplicateRows: row.duplicate_rows,
    failedRows: row.failed_rows,
    errors: row.error_report ?? [],
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * Idempotently insert a single review and its detected topic tags inside a transaction.
 * Returns true if inserted, or false if skipped due to duplicate external_id or content_hash.
 */
export async function insertReviewIfNotDuplicate(
  client: PoolClient,
  params: InsertReviewParams
): Promise<boolean> {
  // Check for existing duplicate by content_hash or non-null external_id
  const duplicateCheck = await client.query<{ id: string }>(
    `SELECT id
     FROM reviews
     WHERE content_hash = $1
        OR ($2::varchar IS NOT NULL AND external_id = $2::varchar)
     LIMIT 1`,
    [params.contentHash, params.externalId]
  );

  if ((duplicateCheck.rowCount ?? 0) > 0) {
    return false;
  }

  const insertResult = await client.query<{ id: string }>(
    `INSERT INTO reviews (
      property_id,
      import_batch_id,
      external_id,
      content_hash,
      reviewer_name,
      guest_country_code,
      guest_country_name,
      trip_type,
      room_type,
      stay_nights,
      score,
      sentiment,
      title,
      positive_comment,
      negative_comment,
      full_text,
      review_date,
      owner_response,
      owner_responded_at,
      is_flagged,
      is_resolved,
      resolved_at,
      resolved_notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23
    )
    ON CONFLICT DO NOTHING
    RETURNING id`,
    [
      params.propertyId,
      params.importBatchId,
      params.externalId,
      params.contentHash,
      params.reviewerName,
      params.guestCountryCode,
      params.guestCountryName,
      params.tripType,
      params.roomType,
      params.stayNights,
      params.score,
      params.sentiment,
      params.title,
      params.positiveComment,
      params.negativeComment,
      params.fullText,
      params.reviewDate,
      params.ownerResponse,
      params.ownerRespondedAt,
      params.isFlagged,
      params.isResolved,
      params.resolvedAt,
      params.resolvedNotes,
    ]
  );

  const insertedReview = insertResult.rows[0];
  if (!insertedReview) {
    return false;
  }

  for (const topic of params.topics) {
    await client.query(
      `INSERT INTO review_topics (review_id, topic, sentiment, matched_keywords, snippet)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (review_id, topic) DO NOTHING`,
      [
        insertedReview.id,
        topic.topic,
        topic.sentiment,
        topic.matchedKeywords,
        topic.snippet,
      ]
    );
  }

  return true;
}

export async function listRecentImportBatches(limit = 20): Promise<ImportBatchResult[]> {
  const result = await query<ImportBatchRow>(
    `SELECT id, filename, source_type, total_rows, imported_rows, duplicate_rows, failed_rows, error_report, created_at
     FROM import_batches
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    batchId: row.id,
    filename: row.filename,
    sourceType: row.source_type,
    totalRows: row.total_rows,
    importedRows: row.imported_rows,
    duplicateRows: row.duplicate_rows,
    failedRows: row.failed_rows,
    errors: row.error_report ?? [],
    createdAt: row.created_at.toISOString(),
  }));
}
