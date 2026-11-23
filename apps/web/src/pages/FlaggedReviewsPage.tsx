import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
} from 'lucide-react';
import React, { useState } from 'react';
import { ReviewDetailDrawer } from '../components/reviews/ReviewDetailDrawer';
import {
  ScoreBadge,
  TOPIC_DISPLAY_NAMES,
  TopicPill,
} from '../components/ui/Badges';
import { TableRowsSkeleton } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/StateViews';
import { useGlobalFilters } from '../context/FilterContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { ReviewItem, TopicName } from '../types/api';

export function FlaggedReviewsPage(): React.JSX.Element {
  const [statusFilter, setStatusFilter] = useState<'unresolved' | 'resolved' | 'all'>(
    'unresolved'
  );
  const [topicFilter, setTopicFilter] = useState<TopicName | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);

  const { propertyId, preset, from, to } = useGlobalFilters();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const resolvedParam =
    statusFilter === 'unresolved'
      ? false
      : statusFilter === 'resolved'
        ? true
        : undefined;

  const flaggedQuery = useQuery({
    queryKey: [
      'flagged-reviews',
      propertyId,
      preset,
      from,
      to,
      statusFilter,
      topicFilter,
      page,
    ],
    queryFn: () =>
      api.getFlaggedReviews({
        propertyId,
        preset,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(resolvedParam !== undefined ? { resolved: resolvedParam } : {}),
        ...(topicFilter !== 'all' ? { topic: topicFilter } : {}),
        page,
        pageSize: 12,
      }),
  });

  const quickResolveMutation = useMutation({
    mutationFn: (payload: { id: string; resolved: boolean }) =>
      api.resolveReview(payload.id, {
        resolved: payload.resolved,
        resolvedNotes: payload.resolved
          ? 'Marked as resolved from Flagged Reviews action queue.'
          : null,
      }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['flagged-reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['overview'] });
      void queryClient.invalidateQueries({ queryKey: ['overview-badge'] });
      void queryClient.invalidateQueries({ queryKey: ['reviews'] });
      showToast({
        title: updated.isResolved ? 'Review marked as resolved' : 'Review reopened',
        description: `${updated.reviewerName} — ${updated.propertyName}`,
        variant: 'success',
      });
    },
    onError: (err: Error) => {
      showToast({
        title: 'Could not update flagged review',
        description: err.message,
        variant: 'error',
      });
    },
  });

  const summary = flaggedQuery.data?.summary ?? {
    totalFlagged: 0,
    unresolvedCount: 0,
    resolvedCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Operational Status Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-sentiment-neg/30 bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between text-xs font-medium text-sentiment-neg">
            <span>Awaiting Management Action</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-content-primary tabular-nums">
            {summary.unresolvedCount}
          </p>
          <p className="mt-0.5 text-xs text-content-secondary">
            Unresolved low-score operational issues
          </p>
        </div>

        <div className="rounded-lg border border-sentiment-pos/30 bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between text-xs font-medium text-sentiment-pos">
            <span>Resolved Issues</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-content-primary tabular-nums">
            {summary.resolvedCount}
          </p>
          <p className="mt-0.5 text-xs text-content-secondary">
            Completed service recovery actions
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between text-xs font-medium text-content-secondary">
            <span>Total Flagged Reviews</span>
            <Flag className="h-4 w-4 text-content-muted" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-content-primary tabular-nums">
            {summary.totalFlagged}
          </p>
          <p className="mt-0.5 text-xs text-content-secondary">
            Auto-flagged for score &lt; 6.0 with topic complaints
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
        <div
          role="group"
          aria-label="Filter flagged reviews by resolution status"
          className="inline-flex rounded-md border border-border bg-subtle p-0.5 text-xs"
        >
          <button
            type="button"
            onClick={() => {
              setStatusFilter('unresolved');
              setPage(1);
            }}
            className={`rounded px-3 py-1 font-medium ${
              statusFilter === 'unresolved'
                ? 'bg-surface text-content-primary shadow-2xs'
                : 'text-content-secondary'
            }`}
          >
            Needs Action ({summary.unresolvedCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('resolved');
              setPage(1);
            }}
            className={`rounded px-3 py-1 font-medium ${
              statusFilter === 'resolved'
                ? 'bg-surface text-content-primary shadow-2xs'
                : 'text-content-secondary'
            }`}
          >
            Resolved ({summary.resolvedCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setPage(1);
            }}
            className={`rounded px-3 py-1 font-medium ${
              statusFilter === 'all'
                ? 'bg-surface text-content-primary shadow-2xs'
                : 'text-content-secondary'
            }`}
          >
            All ({summary.totalFlagged})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="flagged-topic-filter" className="text-content-secondary">
            Topic:
          </label>
          <select
            id="flagged-topic-filter"
            value={topicFilter}
            onChange={(e) => {
              setTopicFilter(e.target.value as TopicName | 'all');
              setPage(1);
            }}
            className="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs text-content-primary"
          >
            <option value="all">All Topics</option>
            {Object.entries(TOPIC_DISPLAY_NAMES).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Queue Items */}
      {flaggedQuery.isLoading ? (
        <TableRowsSkeleton rows={5} />
      ) : flaggedQuery.isError ? (
        <ErrorState
          message={flaggedQuery.error.message}
          onRetry={() => void flaggedQuery.refetch()}
        />
      ) : !flaggedQuery.data || flaggedQuery.data.items.length === 0 ? (
        <EmptyState
          title={
            statusFilter === 'unresolved'
              ? 'All caught up! Zero unresolved flagged reviews'
              : 'No flagged reviews match this filter'
          }
          description="Try switching to the Resolved tab or clearing the topic filter."
          actionLabel="View all flagged reviews"
          onAction={() => {
            setStatusFilter('all');
            setTopicFilter('all');
          }}
        />
      ) : (
        <div className="space-y-3">
          {flaggedQuery.data.items.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border bg-surface p-4 shadow-card transition-colors ${
                item.isResolved
                  ? 'border-border opacity-85'
                  : 'border-sentiment-neg/35'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ScoreBadge score={item.score} />
                  <h3 className="text-sm font-semibold text-content-primary">
                    {item.title}
                  </h3>
                  <span className="text-xs font-medium text-brand">
                    • {item.propertyName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-content-muted tabular-nums">
                    {item.reviewDate}
                  </span>
                  {item.isResolved ? (
                    <button
                      type="button"
                      disabled={quickResolveMutation.isPending}
                      onClick={() =>
                        quickResolveMutation.mutate({
                          id: item.id,
                          resolved: false,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-subtle px-2.5 py-1 text-xs font-medium text-content-secondary hover:text-content-primary"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reopen
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={quickResolveMutation.isPending}
                      onClick={() =>
                        quickResolveMutation.mutate({
                          id: item.id,
                          resolved: true,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-md bg-sentiment-pos px-3 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark as Resolved
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedReview(item)}
                    className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-content-primary hover:bg-subtle"
                  >
                    Details & Notes
                  </button>
                </div>
              </div>

              <p className="mt-2 text-xs text-content-secondary leading-relaxed">
                {item.negativeComment || item.fullText}
              </p>

              {item.resolvedNotes && (
                <p className="mt-2 rounded border border-sentiment-pos/25 bg-sentiment-pos-bg/60 px-2.5 py-1.5 text-xs text-content-primary">
                  <strong className="text-sentiment-pos">Resolution note:</strong>{' '}
                  {item.resolvedNotes}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/60">
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.topics.map((t) => (
                    <TopicPill
                      key={t.topic}
                      topic={t.topic}
                      sentiment={t.sentiment}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-content-muted">
                  Guest: {item.reviewerName} ({item.guestCountryName}) • {item.tripType}
                </span>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {flaggedQuery.data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-xs">
              <span className="text-content-secondary tabular-nums">
                Page {flaggedQuery.data.pagination.page} of{' '}
                {flaggedQuery.data.pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= flaggedQuery.data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ReviewDetailDrawer
        review={selectedReview}
        onClose={() => setSelectedReview(null)}
        onReviewUpdated={(updated) => setSelectedReview(updated)}
      />
    </div>
  );
}
