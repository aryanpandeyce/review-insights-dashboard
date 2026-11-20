import { withTransaction } from '../db/pool';
import { AppError } from '../middlewares/errorHandler';
import {
  createImportBatchRecord,
  finalizeImportBatchRecord,
  insertReviewIfNotDuplicate,
  listRecentImportBatches,
} from '../repositories/importRepository';
import { findAllProperties } from '../repositories/propertyRepository';
import {
  ImportBatchResult,
  ImportRowError,
  ImportSourceType,
} from '../types/domain';
import { parseCsvToRecords } from '../utils/csvParser';
import {
  normalizeRawImportObject,
  rawImportRowSchema,
  ValidatedImportRow,
} from '../validators/importValidators';
import {
  analyzeReviewTopics,
  classifyOverallSentiment,
  computeContentHash,
  shouldFlagReview,
} from './topicAnalyzer';

export interface ImportPayloadInput {
  filename: string;
  sourceType: ImportSourceType;
  rawRows: Record<string, unknown>[];
}

/**
 * Parse a raw uploaded file buffer (.csv or .json) into an array of row objects.
 */
export function parseImportFileBuffer(
  filename: string,
  buffer: Buffer,
  mimeType?: string
): { sourceType: 'csv' | 'json'; rawRows: Record<string, unknown>[] } {
  const lowerName = filename.toLowerCase();
  const content = buffer.toString('utf8');

  if (lowerName.endsWith('.csv') || mimeType === 'text/csv') {
    const rawRows = parseCsvToRecords(content);
    return { sourceType: 'csv', rawRows };
  }

  if (lowerName.endsWith('.json') || mimeType === 'application/json') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new AppError(400, 'INVALID_JSON_FILE', 'Uploaded JSON file could not be parsed');
    }

    if (Array.isArray(parsed)) {
      return {
        sourceType: 'json',
        rawRows: parsed.filter(
          (item): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null && !Array.isArray(item)
        ),
      };
    }

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'reviews' in parsed &&
      Array.isArray((parsed as { reviews: unknown }).reviews)
    ) {
      return {
        sourceType: 'json',
        rawRows: (parsed as { reviews: unknown[] }).reviews.filter(
          (item): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null && !Array.isArray(item)
        ),
      };
    }

    throw new AppError(
      400,
      'INVALID_JSON_STRUCTURE',
      'JSON import must be an array of review objects or { "reviews": [...] }'
    );
  }

  throw new AppError(
    400,
    'UNSUPPORTED_FILE_TYPE',
    'Only .csv and .json files are supported for review imports'
  );
}

/**
 * Validate, deduplicate, tag topics, and transactionally insert a batch of review rows.
 * Invalid rows are recorded in the batch's row-level error_report without aborting valid rows.
 */
export async function processReviewImport(
  input: ImportPayloadInput
): Promise<ImportBatchResult> {
  const properties = await findAllProperties();
  const propertyBySlug = new Map(properties.map((p) => [p.slug.toLowerCase(), p]));
  const propertyById = new Map(properties.map((p) => [p.id.toLowerCase(), p]));

  const errors: ImportRowError[] = [];
  const validRows: Array<{
    rowNumber: number;
    propertyId: string;
    data: ValidatedImportRow;
  }> = [];

  for (let index = 0; index < input.rawRows.length; index++) {
    const rowNumber = index + 1;
    const rawRow = input.rawRows[index] ?? {};
    const normalized = normalizeRawImportObject(rawRow);
    const externalIdHint =
      typeof normalized['external_id'] === 'string' && normalized['external_id'].length > 0
        ? normalized['external_id']
        : undefined;

    const validation = rawImportRowSchema.safeParse(normalized);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      errors.push({
        rowNumber,
        ...(externalIdHint ? { externalId: externalIdHint } : {}),
        ...(firstIssue?.path[0] ? { field: String(firstIssue.path[0]) } : {}),
        message: firstIssue?.message ?? 'Invalid row data',
      });
      continue;
    }

    const slugKey = validation.data.property_slug.toLowerCase();
    const matchedProperty = propertyBySlug.get(slugKey) ?? propertyById.get(slugKey);

    if (!matchedProperty) {
      errors.push({
        rowNumber,
        ...(validation.data.external_id ? { externalId: validation.data.external_id } : {}),
        field: 'property_slug',
        message: `Unknown property_slug "${validation.data.property_slug}". Valid slugs: ${Array.from(
          propertyBySlug.keys()
        ).join(', ')}`,
      });
      continue;
    }

    validRows.push({
      rowNumber,
      propertyId: matchedProperty.id,
      data: validation.data,
    });
  }

  return withTransaction(async (client) => {
    const batchId = await createImportBatchRecord(client, {
      filename: input.filename,
      sourceType: input.sourceType,
      totalRows: input.rawRows.length,
    });

    let importedRows = 0;
    let duplicateRows = 0;

    // Also track hashes/external_ids seen within the same upload batch
    const seenHashesInBatch = new Set<string>();
    const seenExternalIdsInBatch = new Set<string>();

    for (const item of validRows) {
      const { propertyId, data } = item;

      const combinedTextParts = [
        data.title,
        data.positive_comment,
        data.negative_comment,
      ].filter((part): part is string => Boolean(part && part.trim().length > 0));

      const fullText =
        data.full_text && data.full_text.trim().length > 0
          ? data.full_text.trim()
          : combinedTextParts.join('. ');

      const contentHash = computeContentHash({
        propertyId,
        reviewerName: data.reviewer_name,
        reviewDate: data.review_date,
        score: data.score,
        fullText,
      });

      if (
        seenHashesInBatch.has(contentHash) ||
        (data.external_id && seenExternalIdsInBatch.has(data.external_id))
      ) {
        duplicateRows++;
        continue;
      }

      const sentiment = classifyOverallSentiment(data.score);
      const topics = analyzeReviewTopics({
        score: data.score,
        title: data.title,
        positiveComment: data.positive_comment,
        negativeComment: data.negative_comment,
        fullText,
      });
      const isFlagged = shouldFlagReview(data.score, topics);

      const inserted = await insertReviewIfNotDuplicate(client, {
        propertyId,
        importBatchId: batchId,
        externalId: data.external_id,
        contentHash,
        reviewerName: data.reviewer_name,
        guestCountryCode: data.guest_country_code,
        guestCountryName: data.guest_country_name,
        tripType: data.trip_type,
        roomType: data.room_type,
        stayNights: data.stay_nights,
        score: Number(data.score.toFixed(1)),
        sentiment,
        title: data.title,
        positiveComment: data.positive_comment,
        negativeComment: data.negative_comment,
        fullText,
        reviewDate: data.review_date,
        ownerResponse: data.owner_response,
        ownerRespondedAt:
          data.owner_responded_at ??
          (data.owner_response ? `${data.review_date}T14:00:00.000Z` : null),
        isFlagged,
        isResolved: data.is_resolved,
        resolvedAt: data.is_resolved ? `${data.review_date}T18:00:00.000Z` : null,
        resolvedNotes: data.resolved_notes,
        topics,
      });

      if (inserted) {
        importedRows++;
        seenHashesInBatch.add(contentHash);
        if (data.external_id) {
          seenExternalIdsInBatch.add(data.external_id);
        }
      } else {
        duplicateRows++;
      }
    }

    return finalizeImportBatchRecord(client, {
      batchId,
      importedRows,
      duplicateRows,
      failedRows: errors.length,
      errors,
    });
  });
}

export async function getImportHistory(limit = 20): Promise<ImportBatchResult[]> {
  return listRecentImportBatches(limit);
}
