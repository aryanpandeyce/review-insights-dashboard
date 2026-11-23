import { AppError } from '../middlewares/errorHandler';
import { resolveDateWindow } from '../repositories/analyticsRepository';
import { findPropertyBySlugOrId } from '../repositories/propertyRepository';
import {
  findReviewById,
  getFlaggedSummaryCounts,
  ReviewExplorerItem,
  searchReviewsPaginated,
  updateReviewResolution,
} from '../repositories/reviewRepository';
import {
  ResolveReviewBodyInput,
  ReviewsExplorerQueryInput,
} from '../validators/queryValidators';

async function resolvePropertyId(identifier?: string): Promise<string | undefined> {
  if (!identifier || identifier === 'all') {
    return undefined;
  }
  const prop = await findPropertyBySlugOrId(identifier);
  if (!prop) {
    throw new AppError(404, 'PROPERTY_NOT_FOUND', `Property "${identifier}" not found`);
  }
  return prop.id;
}

export async function listExplorerReviews(queryInput: ReviewsExplorerQueryInput): Promise<{
  items: ReviewExplorerItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  period: {
    from: string;
    to: string;
  };
}> {
  const [propertyId, period] = await Promise.all([
    resolvePropertyId(queryInput.propertyId),
    resolveDateWindow({
      ...(queryInput.from ? { from: queryInput.from } : {}),
      ...(queryInput.to ? { to: queryInput.to } : {}),
      ...(queryInput.preset ? { preset: queryInput.preset } : {}),
    }),
  ]);

  const res = await searchReviewsPaginated({
    ...(propertyId ? { propertyId } : {}),
    from: period.from,
    to: period.to,
    ...(queryInput.search ? { search: queryInput.search } : {}),
    ...(queryInput.minScore !== undefined ? { minScore: queryInput.minScore } : {}),
    ...(queryInput.maxScore !== undefined ? { maxScore: queryInput.maxScore } : {}),
    ...(queryInput.topic ? { topic: queryInput.topic } : {}),
    ...(queryInput.sentiment ? { sentiment: queryInput.sentiment } : {}),
    ...(queryInput.tripType ? { tripType: queryInput.tripType } : {}),
    ...(queryInput.guestCountry ? { guestCountry: queryInput.guestCountry } : {}),
    ...(queryInput.flagged !== undefined ? { flagged: queryInput.flagged } : {}),
    ...(queryInput.resolved !== undefined ? { resolved: queryInput.resolved } : {}),
    ...(queryInput.hasResponse !== undefined ? { hasResponse: queryInput.hasResponse } : {}),
    sortBy: queryInput.sortBy,
    sortOrder: queryInput.sortOrder,
    page: queryInput.page,
    pageSize: queryInput.pageSize,
  });

  return {
    items: res.items,
    pagination: {
      page: res.page,
      pageSize: res.pageSize,
      totalItems: res.totalItems,
      totalPages: res.totalPages,
    },
    period: {
      from: period.from,
      to: period.to,
    },
  };
}

export async function getFlaggedReviewsQueue(queryInput: ReviewsExplorerQueryInput): Promise<{
  summary: {
    totalFlagged: number;
    unresolvedCount: number;
    resolvedCount: number;
  };
  items: ReviewExplorerItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const propertyId = await resolvePropertyId(queryInput.propertyId);

  const [summary, listResult] = await Promise.all([
    getFlaggedSummaryCounts(propertyId),
    listExplorerReviews({
      ...queryInput,
      flagged: true,
    }),
  ]);

  return {
    summary,
    items: listResult.items,
    pagination: listResult.pagination,
  };
}

export async function getReviewDetailById(id: string): Promise<ReviewExplorerItem> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) {
    throw new AppError(400, 'INVALID_REVIEW_ID', 'Review ID must be a valid UUID');
  }

  const review = await findReviewById(id);
  if (!review) {
    throw new AppError(404, 'REVIEW_NOT_FOUND', `Review with ID "${id}" not found`);
  }
  return review;
}

export async function setReviewResolvedState(
  id: string,
  body: ResolveReviewBodyInput
): Promise<ReviewExplorerItem> {
  await getReviewDetailById(id);

  const updated = await updateReviewResolution({
    id,
    resolved: body.resolved,
    resolvedNotes: body.resolvedNotes ?? null,
  });

  if (!updated) {
    throw new AppError(404, 'REVIEW_NOT_FOUND', `Review with ID "${id}" not found`);
  }
  return updated;
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportFilteredReviewsToCsv(
  queryInput: ReviewsExplorerQueryInput
): Promise<string> {
  const result = await listExplorerReviews({
    ...queryInput,
    page: 1,
    pageSize: 5000,
  });

  const headers = [
    'review_id',
    'property_slug',
    'property_name',
    'review_date',
    'score',
    'sentiment',
    'reviewer_name',
    'guest_country_code',
    'guest_country_name',
    'trip_type',
    'room_type',
    'stay_nights',
    'title',
    'positive_comment',
    'negative_comment',
    'topics',
    'owner_response',
    'is_flagged',
    'is_resolved',
    'resolved_notes',
  ];

  const lines: string[] = [headers.join(',')];

  for (const item of result.items) {
    const topicSummary = item.topics.map((t) => `${t.topic}:${t.sentiment}`).join('; ');
    const row = [
      escapeCsvCell(item.id),
      escapeCsvCell(item.propertySlug),
      escapeCsvCell(item.propertyName),
      escapeCsvCell(item.reviewDate),
      escapeCsvCell(item.score.toFixed(1)),
      escapeCsvCell(item.sentiment),
      escapeCsvCell(item.reviewerName),
      escapeCsvCell(item.guestCountryCode),
      escapeCsvCell(item.guestCountryName),
      escapeCsvCell(item.tripType),
      escapeCsvCell(item.roomType),
      escapeCsvCell(item.stayNights),
      escapeCsvCell(item.title),
      escapeCsvCell(item.positiveComment),
      escapeCsvCell(item.negativeComment),
      escapeCsvCell(topicSummary),
      escapeCsvCell(item.ownerResponse),
      escapeCsvCell(item.isFlagged),
      escapeCsvCell(item.isResolved),
      escapeCsvCell(item.resolvedNotes),
    ];
    lines.push(row.join(','));
  }

  return lines.join('\r\n');
}
