import {
  ComparisonResponse,
  DatePreset,
  DistributionResponse,
  FlaggedReviewsResponse,
  ImportBatchResult,
  OverviewResponse,
  Property,
  ReviewItem,
  ReviewsExplorerResponse,
  Sentiment,
  TopicName,
  TopicsResponse,
  TrendsResponse,
  TripType,
} from '../types/api';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

type ColdStartListener = (isWakingUp: boolean) => void;
const coldStartListeners = new Set<ColdStartListener>();

export function subscribeColdStart(listener: ColdStartListener): () => void {
  coldStartListeners.add(listener);
  return () => {
    coldStartListeners.delete(listener);
  };
}

function notifyColdStart(isWakingUp: boolean): void {
  for (const listener of coldStartListeners) {
    listener(isWakingUp);
  }
}

export interface BaseAnalyticsParams {
  propertyId?: string;
  preset?: DatePreset;
  from?: string;
  to?: string;
}

export interface ReviewsQueryParams extends BaseAnalyticsParams {
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
  sortBy?: 'review_date' | 'score';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  // Show friendly "Waking up the server..." banner if a request takes > 2.2 seconds (free-tier cold start)
  const coldStartTimer = window.setTimeout(() => {
    notifyColdStart(true);
  }, 2200);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(init?.headers ?? {}),
      },
    });

    const json = (await response.json()) as {
      success: boolean;
      data?: T;
      error?: { code: string; message: string };
    };

    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || `Request failed with status ${response.status}`);
    }

    return json.data as T;
  } finally {
    window.clearTimeout(coldStartTimer);
    notifyColdStart(false);
  }
}

export const api = {
  getProperties(): Promise<Property[]> {
    return fetchJson<Property[]>('/properties');
  },

  getOverview(params: BaseAnalyticsParams): Promise<OverviewResponse> {
    return fetchJson<OverviewResponse>(
      `/analytics/overview${buildQueryString({ ...params })}`
    );
  },

  getTrends(
    params: BaseAnalyticsParams & { granularity: 'weekly' | 'monthly' }
  ): Promise<TrendsResponse> {
    return fetchJson<TrendsResponse>(
      `/analytics/trends${buildQueryString({ ...params })}`
    );
  },

  getDistribution(params: BaseAnalyticsParams): Promise<DistributionResponse> {
    return fetchJson<DistributionResponse>(
      `/analytics/distribution${buildQueryString({ ...params })}`
    );
  },

  getTopics(params: BaseAnalyticsParams): Promise<TopicsResponse> {
    return fetchJson<TopicsResponse>(
      `/analytics/topics${buildQueryString({ ...params })}`
    );
  },

  getComparison(
    params: BaseAnalyticsParams & { propertyIds?: string[] }
  ): Promise<ComparisonResponse> {
    const { propertyIds, ...rest } = params;
    return fetchJson<ComparisonResponse>(
      `/analytics/comparison${buildQueryString({
        ...rest,
        propertyIds: propertyIds && propertyIds.length > 0 ? propertyIds.join(',') : undefined,
      })}`
    );
  },

  getReviews(params: ReviewsQueryParams): Promise<ReviewsExplorerResponse> {
    return fetchJson<ReviewsExplorerResponse>(
      `/reviews${buildQueryString({ ...params })}`
    );
  },

  getFlaggedReviews(params: ReviewsQueryParams): Promise<FlaggedReviewsResponse> {
    return fetchJson<FlaggedReviewsResponse>(
      `/reviews/flagged${buildQueryString({ ...params })}`
    );
  },

  getReviewById(id: string): Promise<ReviewItem> {
    return fetchJson<ReviewItem>(`/reviews/${id}`);
  },

  resolveReview(
    id: string,
    payload: { resolved: boolean; resolvedNotes?: string | null }
  ): Promise<ReviewItem> {
    return fetchJson<ReviewItem>(`/reviews/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  uploadImportFile(file: File): Promise<ImportBatchResult> {
    const formData = new FormData();
    formData.append('file', file);
    return fetchJson<ImportBatchResult>('/imports', {
      method: 'POST',
      body: formData,
    });
  },

  getImportHistory(): Promise<ImportBatchResult[]> {
    return fetchJson<ImportBatchResult[]>('/imports');
  },

  getCsvExportUrl(params: ReviewsQueryParams): string {
    return `${API_BASE_URL}/reviews/export.csv${buildQueryString({ ...params })}`;
  },
};
