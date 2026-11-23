import { useQuery } from '@tanstack/react-query';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  Flag,
  MessageSquareReply,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReviewDetailDrawer } from '../components/reviews/ReviewDetailDrawer';
import {
  HighlightText,
  ScoreBadge,
  SentimentBadge,
  TOPIC_DISPLAY_NAMES,
  TopicPill,
} from '../components/ui/Badges';
import { TableRowsSkeleton } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/StateViews';
import { useGlobalFilters } from '../context/FilterContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { ReviewItem, Sentiment, TopicName, TripType } from '../types/api';

interface SavedFilterView {
  id: string;
  name: string;
  queryString: string;
}

const SAVED_VIEWS_STORAGE_KEY = 'review-insights-saved-views';

export function ReviewsExplorerPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const { propertyId, preset, from, to } = useGlobalFilters();
  const { showToast } = useToast();

  const urlSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [savedViews, setSavedViews] = useState<SavedFilterView[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SavedFilterView[]) : [];
    } catch {
      return [];
    }
  });

  // Sync local search input when URL changes externally
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // 300ms debounced URL sync for search input
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== urlSearch) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput.trim()) {
            next.set('search', searchInput.trim());
          } else {
            next.delete('search');
          }
          next.set('page', '1');
          return next;
        });
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, setSearchParams, urlSearch]);

  const topic = (searchParams.get('topic') as TopicName | null) || undefined;
  const sentiment = (searchParams.get('sentiment') as Sentiment | null) || undefined;
  const tripType = (searchParams.get('tripType') as TripType | null) || undefined;
  const minScoreRaw = searchParams.get('minScore');
  const maxScoreRaw = searchParams.get('maxScore');
  const minScore = minScoreRaw ? Number(minScoreRaw) : undefined;
  const maxScore = maxScoreRaw ? Number(maxScoreRaw) : undefined;
  const sortBy = (searchParams.get('sortBy') as 'review_date' | 'score' | null) || 'review_date';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc' | null) || 'desc';
  const page = Math.max(1, Number(searchParams.get('page') || 1));

  const updateFilterParam = (key: string, value: string | undefined): void => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'all') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== 'page') {
        next.set('page', '1');
      }
      return next;
    });
  };

  const resetExplorerFilters = (): void => {
    setSearchInput('');
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      if (prev.get('propertyId')) next.set('propertyId', prev.get('propertyId')!);
      if (prev.get('preset')) next.set('preset', prev.get('preset')!);
      return next;
    });
  };

  const saveCurrentView = (): void => {
    const labelParts = [
      propertyId !== 'all' ? propertyId : 'All Hotels',
      topic ? TOPIC_DISPLAY_NAMES[topic] : null,
      sentiment ?? null,
      urlSearch ? `"${urlSearch}"` : null,
    ].filter(Boolean);
    const name = labelParts.join(' • ') || 'Custom View';
    const nextView: SavedFilterView = {
      id: String(Date.now()),
      name,
      queryString: searchParams.toString(),
    };
    const updated = [nextView, ...savedViews.slice(0, 4)];
    setSavedViews(updated);
    try {
      localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage error
    }
    showToast({
      title: 'Filter view saved',
      description: name,
      variant: 'success',
    });
  };

  const queryParams = {
    propertyId,
    preset,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(urlSearch ? { search: urlSearch } : {}),
    ...(topic ? { topic } : {}),
    ...(sentiment ? { sentiment } : {}),
    ...(tripType ? { tripType } : {}),
    ...(minScore !== undefined ? { minScore } : {}),
    ...(maxScore !== undefined ? { maxScore } : {}),
    sortBy,
    sortOrder,
    page,
    pageSize: 15,
  };

  const reviewsQuery = useQuery({
    queryKey: ['reviews', queryParams],
    queryFn: () => api.getReviews(queryParams),
  });

  const handleExportCsv = (): void => {
    const exportUrl = api.getCsvExportUrl(queryParams);
    window.open(exportUrl, '_blank', 'noopener,noreferrer');
    showToast({
      title: 'Exporting filtered CSV',
      description: 'Downloading current filtered review dataset.',
      variant: 'info',
    });
  };

  return (
    <div className="space-y-5">
      {/* Filter & Search Bar */}
      <section
        aria-label="Review Search and Filters"
        className="rounded-lg border border-border bg-surface p-4 shadow-card space-y-3"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-content-muted" />
            <input
              type="search"
              aria-label="Search reviews by keyword, title, or guest name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search review text, keywords, or guest name (trigram indexed)..."
              className="w-full rounded-md border border-border bg-canvas pl-9 pr-4 py-1.5 text-xs text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
            />
          </div>

          {/* Actions: Save View, Reset, CSV Export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveCurrentView}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-content-secondary hover:border-border-strong hover:text-content-primary"
            >
              <Bookmark className="h-3.5 w-3.5" />
              Save View
            </button>

            <button
              type="button"
              onClick={resetExplorerFilters}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-content-secondary hover:border-border-strong hover:text-content-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Multi-Facet Dropdown Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
          <span className="inline-flex items-center gap-1 text-content-muted font-medium mr-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters:
          </span>

          {/* Topic Filter */}
          <select
            aria-label="Filter by topic"
            value={topic ?? 'all'}
            onChange={(e) => updateFilterParam('topic', e.target.value)}
            className="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs text-content-primary"
          >
            <option value="all">All Topics (8)</option>
            {Object.entries(TOPIC_DISPLAY_NAMES).map(([key, label]) => (
              <option key={key} value={key}>
                Topic: {label}
              </option>
            ))}
          </select>

          {/* Sentiment Filter */}
          <select
            aria-label="Filter by sentiment"
            value={sentiment ?? 'all'}
            onChange={(e) => updateFilterParam('sentiment', e.target.value)}
            className="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs text-content-primary"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive (≥8.0)</option>
            <option value="neutral">Neutral (6.0–7.9)</option>
            <option value="negative">Negative (&lt;6.0)</option>
          </select>

          {/* Trip Type Filter */}
          <select
            aria-label="Filter by trip type"
            value={tripType ?? 'all'}
            onChange={(e) => updateFilterParam('tripType', e.target.value)}
            className="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs text-content-primary"
          >
            <option value="all">All Trip Types</option>
            <option value="couple">Couples</option>
            <option value="family">Families</option>
            <option value="business">Business</option>
            <option value="solo">Solo Travelers</option>
            <option value="friends">Friends Group</option>
          </select>

          {/* Min Score Filter */}
          <select
            aria-label="Filter by minimum score"
            value={minScoreRaw ?? 'all'}
            onChange={(e) => updateFilterParam('minScore', e.target.value)}
            className="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs text-content-primary"
          >
            <option value="all">Min Score: Any</option>
            <option value="9">Min Score: 9.0+</option>
            <option value="8">Min Score: 8.0+</option>
            <option value="6">Min Score: 6.0+</option>
          </select>

          {/* Max Score Filter */}
          <select
            aria-label="Filter by maximum score"
            value={maxScoreRaw ?? 'all'}
            onChange={(e) => updateFilterParam('maxScore', e.target.value)}
            className="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs text-content-primary"
          >
            <option value="all">Max Score: Any</option>
            <option value="5.9">Max Score: &lt; 6.0 (Low)</option>
            <option value="7.9">Max Score: &lt; 8.0</option>
          </select>

          {/* Sort Order */}
          <select
            aria-label="Sort reviews"
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [nextSortBy, nextSortOrder] = e.target.value.split(':');
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set('sortBy', nextSortBy || 'review_date');
                next.set('sortOrder', nextSortOrder || 'desc');
                next.set('page', '1');
                return next;
              });
            }}
            className="ml-auto rounded-md border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-content-primary"
          >
            <option value="review_date:desc">Sort: Newest First</option>
            <option value="review_date:asc">Sort: Oldest First</option>
            <option value="score:desc">Sort: Highest Score</option>
            <option value="score:asc">Sort: Lowest Score</option>
          </select>
        </div>

        {/* Saved Filter Views Pills */}
        {savedViews.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40 text-[11px]">
            <span className="text-content-muted">Saved views:</span>
            {savedViews.map((sv) => (
              <button
                key={sv.id}
                type="button"
                onClick={() => setSearchParams(new URLSearchParams(sv.queryString))}
                className="rounded-full border border-border bg-subtle px-2.5 py-0.5 text-content-secondary hover:border-brand hover:text-brand"
              >
                {sv.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Results List / Table */}
      {reviewsQuery.isLoading ? (
        <TableRowsSkeleton rows={6} />
      ) : reviewsQuery.isError ? (
        <ErrorState
          message={reviewsQuery.error.message}
          onRetry={() => void reviewsQuery.refetch()}
        />
      ) : !reviewsQuery.data || reviewsQuery.data.items.length === 0 ? (
        <EmptyState
          title="No matching guest reviews"
          description="Try clearing your search term or widening your topic and score filters."
          actionLabel="Clear all filters"
          onAction={resetExplorerFilters}
        />
      ) : (
        <>
          <div className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-subtle/40 px-4 py-2.5 text-xs text-content-secondary">
              <span>
                Showing{' '}
                <strong className="text-content-primary tabular-nums">
                  {reviewsQuery.data.items.length}
                </strong>{' '}
                of{' '}
                <strong className="text-content-primary tabular-nums">
                  {reviewsQuery.data.pagination.totalItems.toLocaleString()}
                </strong>{' '}
                matching reviews
              </span>
              <span>Click any review to open full detail drawer</span>
            </div>

            <div className="divide-y divide-border">
              {reviewsQuery.data.items.map((rev) => (
                <article
                  key={rev.id}
                  onClick={() => setSelectedReview(rev)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedReview(rev);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Inspect review by ${rev.reviewerName}, score ${rev.score}`}
                  className="p-4 hover:bg-subtle/40 transition-colors cursor-pointer focus:bg-subtle/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <ScoreBadge score={rev.score} />
                      <h3 className="text-sm font-semibold text-content-primary">
                        <HighlightText text={rev.title} highlight={urlSearch} />
                      </h3>
                      <SentimentBadge sentiment={rev.sentiment} />
                      {rev.isFlagged && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            rev.isResolved
                              ? 'bg-sentiment-pos-bg text-sentiment-pos'
                              : 'bg-sentiment-neg-bg text-sentiment-neg'
                          }`}
                        >
                          <Flag className="h-3 w-3" />
                          {rev.isResolved ? 'Resolved' : 'Flagged'}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-content-muted tabular-nums">
                      {rev.reviewDate}
                    </span>
                  </div>

                  {/* Comment Preview with Highlighted Search Matches */}
                  <p className="mt-2 text-xs leading-relaxed text-content-secondary line-clamp-2">
                    <HighlightText
                      text={
                        [rev.positiveComment, rev.negativeComment]
                          .filter(Boolean)
                          .join(' — ') || rev.fullText
                      }
                      highlight={urlSearch}
                    />
                  </p>

                  {/* Footer Metadata & Topic Pills */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {rev.topics.map((t) => (
                        <TopicPill
                          key={t.topic}
                          topic={t.topic}
                          sentiment={t.sentiment}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-content-muted">
                      {rev.ownerResponse && (
                        <span className="inline-flex items-center gap-1 text-brand font-medium">
                          <MessageSquareReply className="h-3 w-3" />
                          Responded
                        </span>
                      )}
                      <span>
                        <HighlightText text={rev.reviewerName} highlight={urlSearch} /> (
                        {rev.guestCountryCode})
                      </span>
                      <span className="capitalize">• {rev.tripType}</span>
                      <span className="font-medium text-content-secondary">
                        • {rev.propertyName}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between border-t border-border bg-subtle/30 px-4 py-3 text-xs">
              <span className="text-content-secondary tabular-nums">
                Page <strong>{reviewsQuery.data.pagination.page}</strong> of{' '}
                <strong>{reviewsQuery.data.pagination.totalPages}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => updateFilterParam('page', String(page - 1))}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 font-medium text-content-primary hover:bg-subtle disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= reviewsQuery.data.pagination.totalPages}
                  onClick={() => updateFilterParam('page', String(page + 1))}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 font-medium text-content-primary hover:bg-subtle disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ReviewDetailDrawer
        review={selectedReview}
        onClose={() => setSelectedReview(null)}
        onReviewUpdated={(updated) => setSelectedReview(updated)}
      />
    </div>
  );
}
