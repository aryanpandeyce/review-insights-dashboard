import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  Flag,
  MessageSquareReply,
  SmilePlus,
  Star,
  Users,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { ScoreBadge } from '../components/ui/Badges';
import { KpiCard } from '../components/ui/KpiCard';
import { KpiGridSkeleton } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/StateViews';
import { useGlobalFilters } from '../context/FilterContext';
import { api } from '../lib/api';

export function OverviewPage(): React.JSX.Element {
  const { propertyId, preset, from, to, setPropertyId, resetGlobalFilters } =
    useGlobalFilters();

  const overviewQuery = useQuery({
    queryKey: ['overview', propertyId, preset, from, to],
    queryFn: () =>
      api.getOverview({
        propertyId,
        preset,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
  });

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-6">
        <KpiGridSkeleton count={4} />
        <KpiGridSkeleton count={4} />
      </div>
    );
  }

  if (overviewQuery.isError) {
    return (
      <ErrorState
        message={overviewQuery.error.message}
        onRetry={() => void overviewQuery.refetch()}
      />
    );
  }

  const data = overviewQuery.data;
  if (!data || data.summary.totalReviews === 0) {
    return (
      <EmptyState
        title="No reviews in this date range"
        description="Try expanding your date filter preset to All (18m) or switching properties."
        actionLabel="Reset filters"
        onAction={resetGlobalFilters}
      />
    );
  }

  const { summary, byProperty, period } = data;

  return (
    <div className="space-y-8">
      {/* Primary Portfolio / Property KPIs */}
      <section aria-label="Key Performance Indicators">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Average Guest Score"
            value={`${summary.avgScore.toFixed(1)} / 10`}
            subtitle={`Prior period: ${summary.previousAvgScore.toFixed(1)}`}
            delta={summary.avgScoreDelta}
            deltaSuffix=" pts"
            sparkline={summary.sparkline}
            sparklineKey="avgScore"
            icon={<Star className="h-4 w-4" />}
          />

          <KpiCard
            label="Total Reviews"
            value={summary.totalReviews.toLocaleString()}
            subtitle={`${period.from} to ${period.to}`}
            delta={summary.reviewsDeltaPct}
            deltaSuffix="%"
            sparkline={summary.sparkline}
            sparklineKey="reviewCount"
            icon={<Users className="h-4 w-4" />}
          />

          <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-content-secondary">
                Sentiment Split
              </span>
              <SmilePlus className="h-4 w-4 text-content-muted" />
            </div>

            <div className="mt-2.5">
              <p className="text-2xl font-semibold tracking-tight text-sentiment-pos tabular-nums">
                {summary.positivePct.toFixed(1)}%{' '}
                <span className="text-xs font-normal text-content-secondary">Positive</span>
              </p>

              {/* Stacked Sentiment Bar */}
              <div
                aria-label="Sentiment proportion bar"
                className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-subtle"
              >
                <div
                  style={{ width: `${summary.positivePct}%` }}
                  className="bg-sentiment-pos transition-all"
                  title={`Positive: ${summary.positivePct}%`}
                />
                <div
                  style={{ width: `${summary.neutralPct}%` }}
                  className="bg-sentiment-neu transition-all"
                  title={`Neutral: ${summary.neutralPct}%`}
                />
                <div
                  style={{ width: `${summary.negativePct}%` }}
                  className="bg-sentiment-neg transition-all"
                  title={`Negative: ${summary.negativePct}%`}
                />
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between pt-3 border-t border-border/70 text-xs tabular-nums">
              <span className="text-sentiment-pos font-medium">
                Pos: {summary.positivePct}%
              </span>
              <span className="text-sentiment-neu font-medium">
                Neu: {summary.neutralPct}%
              </span>
              <span className="text-sentiment-neg font-medium">
                Neg: {summary.negativePct}%
              </span>
            </div>
          </div>

          <KpiCard
            label="Owner Response Rate"
            value={`${summary.responseRatePct.toFixed(1)}%`}
            subtitle={`${summary.unresolvedFlaggedCount} flagged reviews awaiting action`}
            delta={summary.responseRateDeltaPct}
            deltaSuffix="%"
            icon={<MessageSquareReply className="h-4 w-4" />}
          />
        </div>
      </section>

      {/* Property Performance Cards Grid */}
      <section aria-label="Property Performance Breakdown" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-content-primary">
              Property Performance Breakdown
            </h2>
            <p className="text-xs text-content-secondary">
              Click any property card to filter the entire dashboard or inspect flagged items
            </p>
          </div>
          {propertyId !== 'all' && (
            <button
              type="button"
              onClick={() => setPropertyId('all')}
              className="text-xs font-medium text-brand hover:underline"
            >
              Show all 4 properties
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {byProperty.map((prop) => {
            const isSelected =
              propertyId === prop.propertySlug || propertyId === prop.propertyId;

            return (
              <div
                key={prop.propertyId}
                className={`rounded-lg border bg-surface p-5 shadow-card transition-all ${
                  isSelected
                    ? 'border-brand ring-1 ring-brand/30'
                    : 'border-border hover:border-border-strong'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-brand" />
                      <h3 className="text-sm font-semibold text-content-primary">
                        {prop.propertyName}
                      </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-content-muted">
                      {prop.city}, {prop.country} • {'★'.repeat(prop.starRating)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <ScoreBadge score={prop.avgScore} size="lg" />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="mt-4 grid grid-cols-4 gap-2 rounded-md border border-border bg-subtle/40 p-3 text-xs tabular-nums">
                  <div>
                    <p className="text-content-muted">Reviews</p>
                    <p className="mt-0.5 font-semibold text-content-primary">
                      {prop.totalReviews}
                    </p>
                  </div>
                  <div>
                    <p className="text-content-muted">Delta</p>
                    <p
                      className={`mt-0.5 font-semibold ${
                        prop.avgScoreDelta > 0
                          ? 'text-sentiment-pos'
                          : prop.avgScoreDelta < 0
                            ? 'text-sentiment-neg'
                            : 'text-content-secondary'
                      }`}
                    >
                      {prop.avgScoreDelta > 0 ? '+' : ''}
                      {prop.avgScoreDelta.toFixed(1)} pts
                    </p>
                  </div>
                  <div>
                    <p className="text-content-muted">Response</p>
                    <p className="mt-0.5 font-semibold text-content-primary">
                      {prop.responseRatePct.toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-content-muted">Flagged</p>
                    <p
                      className={`mt-0.5 font-semibold ${
                        prop.unresolvedFlaggedCount > 0
                          ? 'text-sentiment-neg'
                          : 'text-sentiment-pos'
                      }`}
                    >
                      {prop.unresolvedFlaggedCount} open
                    </p>
                  </div>
                </div>

                {/* Sentiment Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-content-secondary tabular-nums mb-1">
                    <span>Positive {prop.positivePct}%</span>
                    <span>Neutral {prop.neutralPct}%</span>
                    <span>Negative {prop.negativePct}%</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-subtle">
                    <div
                      style={{ width: `${prop.positivePct}%` }}
                      className="bg-sentiment-pos"
                    />
                    <div
                      style={{ width: `${prop.neutralPct}%` }}
                      className="bg-sentiment-neu"
                    />
                    <div
                      style={{ width: `${prop.negativePct}%` }}
                      className="bg-sentiment-neg"
                    />
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/70 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setPropertyId(isSelected ? 'all' : prop.propertySlug)
                    }
                    className="font-medium text-brand hover:underline inline-flex items-center gap-1"
                  >
                    {isSelected ? 'Clear property filter' : 'Filter dashboard to property'}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  {prop.unresolvedFlaggedCount > 0 && (
                    <Link
                      to={`/flagged?propertyId=${prop.propertySlug}`}
                      className="inline-flex items-center gap-1 text-sentiment-neg hover:underline font-medium"
                    >
                      <Flag className="h-3 w-3" />
                      Review {prop.unresolvedFlaggedCount} flagged
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
