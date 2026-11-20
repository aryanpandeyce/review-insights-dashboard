export const TOPIC_NAMES = [
  'cleanliness',
  'staff',
  'location',
  'breakfast',
  'wifi',
  'noise',
  'value',
  'room_comfort',
] as const;

export type TopicName = (typeof TOPIC_NAMES)[number];

export const SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const TRIP_TYPES = ['couple', 'family', 'solo', 'business', 'friends'] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const IMPORT_SOURCE_TYPES = ['seed', 'csv', 'json'] as const;
export type ImportSourceType = (typeof IMPORT_SOURCE_TYPES)[number];

export interface Property {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  starRating: number;
  totalRooms: number;
  description: string | null;
  createdAt: string;
}

export interface DetectedTopic {
  topic: TopicName;
  sentiment: Sentiment;
  matchedKeywords: string[];
  snippet: string;
}

export interface ReviewRecord {
  id: string;
  propertyId: string;
  importBatchId: string | null;
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
  createdAt: string;
}

export interface ImportRowError {
  rowNumber: number;
  externalId?: string;
  field?: string;
  message: string;
}

export interface ImportBatchResult {
  batchId: string;
  filename: string;
  sourceType: ImportSourceType;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  failedRows: number;
  errors: ImportRowError[];
  createdAt: string;
}
