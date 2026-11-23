import { z } from 'zod';
import { SENTIMENTS, TOPIC_NAMES, TRIP_TYPES } from '../types/domain';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const DATE_PRESETS = ['30d', '90d', '12m', 'all'] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export const analyticsFilterSchema = z.object({
  propertyId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (!v || v === 'all' ? undefined : v)),
  from: z
    .string()
    .trim()
    .regex(isoDateRegex, 'from must be YYYY-MM-DD')
    .optional(),
  to: z
    .string()
    .trim()
    .regex(isoDateRegex, 'to must be YYYY-MM-DD')
    .optional(),
  preset: z.enum(DATE_PRESETS).optional().default('all'),
});

export const trendsQuerySchema = analyticsFilterSchema.extend({
  granularity: z.enum(['weekly', 'monthly']).optional().default('monthly'),
});

export const comparisonQuerySchema = analyticsFilterSchema.extend({
  propertyIds: z
    .string()
    .trim()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined
    ),
});

export const reviewsExplorerQuerySchema = z.object({
  propertyId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (!v || v === 'all' ? undefined : v)),
  from: z.string().trim().regex(isoDateRegex, 'from must be YYYY-MM-DD').optional(),
  to: z.string().trim().regex(isoDateRegex, 'to must be YYYY-MM-DD').optional(),
  preset: z.enum(DATE_PRESETS).optional().default('all'),
  search: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  minScore: z.coerce.number().min(1).max(10).optional(),
  maxScore: z.coerce.number().min(1).max(10).optional(),
  topic: z.enum(TOPIC_NAMES).optional(),
  sentiment: z.enum(SENTIMENTS).optional(),
  tripType: z.enum(TRIP_TYPES).optional(),
  guestCountry: z
    .string()
    .trim()
    .length(2)
    .transform((v) => v.toUpperCase())
    .optional(),
  flagged: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  resolved: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  hasResponse: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  sortBy: z.enum(['review_date', 'score']).optional().default('review_date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(15),
});

export const resolveReviewBodySchema = z.object({
  resolved: z.boolean(),
  resolvedNotes: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type AnalyticsFilterInput = z.infer<typeof analyticsFilterSchema>;
export type TrendsQueryInput = z.infer<typeof trendsQuerySchema>;
export type ComparisonQueryInput = z.infer<typeof comparisonQuerySchema>;
export type ReviewsExplorerQueryInput = z.infer<typeof reviewsExplorerQuerySchema>;
export type ResolveReviewBodyInput = z.infer<typeof resolveReviewBodySchema>;
