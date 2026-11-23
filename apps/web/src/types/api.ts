export type TopicName =
  | 'cleanliness'
  | 'staff'
  | 'location'
  | 'breakfast'
  | 'wifi'
  | 'noise'
  | 'value'
  | 'room_comfort';

export type Sentiment = 'positive' | 'neutral' | 'negative';
export type TripType = 'couple' | 'family' | 'solo' | 'business' | 'friends';
export type DatePreset = '30d' | '90d' | '12m' | 'all';

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

export interface DateWindow {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
}

export interface SparklinePoint {
  period: string;
  avgScore: number;
  reviewCount: number;
}

export interface KpiSummaryMetrics {
  totalReviews: number;
  previousTotalReviews: number;
  reviewsDeltaPct: number;
  avgScore: number;
  previousAvgScore: number;
  avgScoreDelta: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  responseRatePct: number;
  previousResponseRatePct: number;
  responseRateDeltaPct: number;
  unresolvedFlaggedCount: number;
  sparkline: SparklinePoint[];
}

export interface PropertyOverviewCard extends KpiSummaryMetrics {
  propertyId: string;
  propertySlug: string;
  propertyName: string;
  city: string;
  country: string;
  starRating: number;
}

export interface OverviewResponse {
  period: DateWindow;
  selectedProperty: Property | null;
  summary: KpiSummaryMetrics;
  byProperty: PropertyOverviewCard[];
}

export interface TrendBucket {
  period: string;
  avgScore: number;
  reviewCount: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  responseRatePct: number;
}

export interface TrendsResponse {
  period: DateWindow;
  granularity: 'weekly' | 'monthly';
  series: TrendBucket[];
}

export interface ScoreHistogramBucket {
  bucket: number;
  label: string;
  count: number;
  percentage: number;
  sentiment: Sentiment;
}

export interface TripTypeBreakdownItem {
  tripType: TripType;
  label: string;
  count: number;
  percentage: number;
  avgScore: number;
}

export interface CountryBreakdownItem {
  countryCode: string;
  countryName: string;
  count: number;
  percentage: number;
  avgScore: number;
}

export interface DistributionResponse {
  period: DateWindow;
  totalReviews: number;
  scoreHistogram: ScoreHistogramBucket[];
  tripTypes: TripTypeBreakdownItem[];
  guestCountries: CountryBreakdownItem[];
}

export interface TopicInsightItem {
  topic: TopicName;
  label: string;
  mentionCount: number;
  mentionSharePct: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  netSentimentScore: number;
  avgReviewScore: number;
  samplePositiveSnippet: string | null;
  sampleNegativeSnippet: string | null;
}

export interface TopicsResponse {
  period: DateWindow;
  totalReviewsInPeriod: number;
  topics: TopicInsightItem[];
  strengths: TopicInsightItem[];
  weaknesses: TopicInsightItem[];
}

export interface ComparisonPropertyMetric {
  propertyId: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  starRating: number;
  totalReviews: number;
  avgScore: number;
  avgScoreDelta: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  responseRatePct: number;
  unresolvedFlaggedCount: number;
  topicScores: Record<
    string,
    {
      mentionCount: number;
      positivePct: number;
      netSentimentScore: number;
      avgReviewScore: number;
    }
  >;
}

export interface ComparisonResponse {
  period: DateWindow;
  properties: ComparisonPropertyMetric[];
  radarData: Array<Record<string, string | number>>;
}

export interface DetectedTopic {
  topic: TopicName;
  sentiment: Sentiment;
  matchedKeywords: string[];
  snippet: string;
}

export interface ReviewItem {
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

export interface ReviewsExplorerResponse {
  items: ReviewItem[];
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
}

export interface FlaggedReviewsResponse {
  summary: {
    totalFlagged: number;
    unresolvedCount: number;
    resolvedCount: number;
  };
  items: ReviewItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
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
  sourceType: 'seed' | 'csv' | 'json';
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  failedRows: number;
  errors: ImportRowError[];
  createdAt: string;
}
