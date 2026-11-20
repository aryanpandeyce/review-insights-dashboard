import { z } from 'zod';
import { TRIP_TYPES } from '../types/domain';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Zod schema for validating a single review row during CSV or JSON import.
 * Accepts either camelCase or snake_case keys after normalization.
 */
export const rawImportRowSchema = z
  .object({
    property_slug: z.string().trim().min(1, 'property_slug is required'),
    external_id: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    reviewer_name: z.string().trim().min(1, 'reviewer_name is required').max(120),
    guest_country_code: z
      .string()
      .trim()
      .length(2, 'guest_country_code must be a 2-letter ISO code')
      .transform((val) => val.toUpperCase()),
    guest_country_name: z.string().trim().min(1, 'guest_country_name is required').max(100),
    trip_type: z
      .string()
      .trim()
      .toLowerCase()
      .refine((val): val is (typeof TRIP_TYPES)[number] =>
        (TRIP_TYPES as readonly string[]).includes(val),
        {
          message: `trip_type must be one of: ${TRIP_TYPES.join(', ')}`,
        }
      ),
    room_type: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    stay_nights: z.coerce
      .number()
      .int()
      .min(1, 'stay_nights must be at least 1')
      .max(365, 'stay_nights cannot exceed 365')
      .default(2),
    score: z.coerce
      .number()
      .min(1.0, 'score must be between 1.0 and 10.0')
      .max(10.0, 'score must be between 1.0 and 10.0'),
    title: z.string().trim().min(1, 'title is required').max(255),
    positive_comment: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    negative_comment: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    full_text: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    review_date: z
      .string()
      .trim()
      .regex(isoDateRegex, 'review_date must be in YYYY-MM-DD format')
      .refine((val) => !Number.isNaN(Date.parse(val)), 'review_date must be a valid calendar date'),
    owner_response: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    owner_responded_at: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    is_resolved: z
      .union([z.boolean(), z.string()])
      .nullable()
      .optional()
      .transform((val) => val === true || val === 'true' || val === '1'),
    resolved_notes: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
  })
  .refine(
    (row) =>
      Boolean(
        (row.full_text && row.full_text.length > 0) ||
          (row.positive_comment && row.positive_comment.length > 0) ||
          (row.negative_comment && row.negative_comment.length > 0)
      ),
    {
      message: 'At least one of full_text, positive_comment, or negative_comment must be provided',
      path: ['full_text'],
    }
  );

export type ValidatedImportRow = z.infer<typeof rawImportRowSchema>;

/**
 * Normalize an incoming JSON or CSV object so both camelCase and snake_case keys map cleanly.
 */
export function normalizeRawImportObject(raw: Record<string, unknown>): Record<string, unknown> {
  const get = (snake: string, camel: string): unknown =>
    raw[snake] !== undefined ? raw[snake] : raw[camel];

  return {
    property_slug: get('property_slug', 'propertySlug'),
    external_id: get('external_id', 'externalId'),
    reviewer_name: get('reviewer_name', 'reviewerName'),
    guest_country_code: get('guest_country_code', 'guestCountryCode'),
    guest_country_name: get('guest_country_name', 'guestCountryName'),
    trip_type: get('trip_type', 'tripType'),
    room_type: get('room_type', 'roomType'),
    stay_nights: get('stay_nights', 'stayNights') ?? 2,
    score: raw['score'],
    title: raw['title'],
    positive_comment: get('positive_comment', 'positiveComment'),
    negative_comment: get('negative_comment', 'negativeComment'),
    full_text: get('full_text', 'fullText'),
    review_date: get('review_date', 'reviewDate'),
    owner_response: get('owner_response', 'ownerResponse'),
    owner_responded_at: get('owner_responded_at', 'ownerRespondedAt'),
    is_resolved: get('is_resolved', 'isResolved'),
    resolved_notes: get('resolved_notes', 'resolvedNotes'),
  };
}
