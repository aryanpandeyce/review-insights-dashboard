import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  Info,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { ScoreBadge } from '../components/ui/Badges';
import { ChartCardSkeleton, KpiGridSkeleton } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/StateViews';
import { useGlobalFilters } from '../context/FilterContext';
import { api } from '../lib/api';

export function TopicsPage(): React.JSX.Element {
  const { propertyId, preset, from, to, resetGlobalFilters } = useGlobalFilters();

  const topicsQuery = useQuery({
    queryKey: ['topics', propertyId, preset, from, to],
    queryFn: () =>
      api.getTopics({
        propertyId,
        preset,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
  });

  if (topicsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <KpiGridSkeleton count={2} />
        <ChartCardSkeleton height="h-96" />
      </div>
    );
  }

  if (topicsQuery.isError) {
    return (
      <ErrorState
        message={topicsQuery.error.message}
        onRetry={() => void topicsQuery.refetch()}
      />
    );
  }

  const data = topicsQuery.data;
  if (!data || data.totalReviewsInPeriod === 0) {
    return (
      <EmptyState
        title="No topic insights available"
        description="No reviews matched the active property and date filters."
        actionLabel="Reset filters"
        onAction={resetGlobalFilters}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Ranked Strengths vs. Weaknesses */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Strengths */}
        <section
          aria-label="Ranked Topic Strengths"
          className="rounded-lg border border-sentiment-pos/30 bg-surface p-5 shadow-card"
        >
          <div className="flex items-center gap-2 text-sentiment-pos">
            <ThumbsUp className="h-4 w-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Top Operational Strengths
            </h2>
          </div>
          <p className="mt-1 text-xs text-content-secondary">
            Highest net sentiment topics driving positive guest advocacy
          </p>

          <div className="mt-4 space-y-3">
            {data.strengths.map((item, idx) => (
              <div
                key={item.topic}
                className="rounded-md border border-border bg-subtle/30 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sentiment-pos-bg text-[11px] font-bold text-sentiment-pos tabular-nums">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-content-primary">
                      {item.label}
                    </span>
                    <span className="text-xs text-content-muted tabular-nums">
                      ({item.mentionCount} mentions • {item.mentionSharePct}% of reviews)
                    </span>
                  </div>

                  <span className="rounded-full bg-sentiment-pos-bg px-2.5 py-0.5 text-xs font-semibold text-sentiment-pos tabular-nums">
                    {item.positivePct}% positive
                  </span>
                </div>

                {item.samplePositiveSnippet && (
                  <p className="mt-2 text-xs text-content-secondary italic line-clamp-2">
                    “{item.samplePositiveSnippet}”
                  </p>
                )}

                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-content-muted tabular-nums">
                    Net Sentiment:{' '}
                    <strong className="text-sentiment-pos">
                      +{item.netSentimentScore}
                    </strong>
                  </span>
                  <Link
                    to={`/reviews?topic=${item.topic}&sentiment=positive${
                      propertyId !== 'all' ? `&propertyId=${propertyId}` : ''
                    }`}
                    className="inline-flex items-center gap-0.5 font-medium text-brand hover:underline"
                  >
                    Explore positive reviews
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Weaknesses / Pain Points */}
        <section
          aria-label="Ranked Topic Weaknesses"
          className="rounded-lg border border-sentiment-neg/30 bg-surface p-5 shadow-card"
        >
          <div className="flex items-center gap-2 text-sentiment-neg">
            <ThumbsDown className="h-4 w-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Priority Improvement Areas (Weaknesses)
            </h2>
          </div>
          <p className="mt-1 text-xs text-content-secondary">
            Topics with the highest negative sentiment share or lowest net score
          </p>

          <div className="mt-4 space-y-3">
            {data.weaknesses.map((item, idx) => (
              <div
                key={item.topic}
                className="rounded-md border border-border bg-subtle/30 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sentiment-neg-bg text-[11px] font-bold text-sentiment-neg tabular-nums">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-content-primary">
                      {item.label}
                    </span>
                    <span className="text-xs text-content-muted tabular-nums">
                      ({item.negativeCount} complaints / {item.mentionCount} mentions)
                    </span>
                  </div>

                  <span className="rounded-full bg-sentiment-neg-bg px-2.5 py-0.5 text-xs font-semibold text-sentiment-neg tabular-nums">
                    {item.negativePct}% negative
                  </span>
                </div>

                {item.sampleNegativeSnippet && (
                  <p className="mt-2 text-xs text-content-secondary italic line-clamp-2">
                    “{item.sampleNegativeSnippet}”
                  </p>
                )}

                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-content-muted tabular-nums">
                    Net Sentiment:{' '}
                    <strong
                      className={
                        item.netSentimentScore < 0
                          ? 'text-sentiment-neg'
                          : 'text-content-primary'
                      }
                    >
                      {item.netSentimentScore > 0 ? '+' : ''}
                      {item.netSentimentScore}
                    </strong>
                  </span>
                  <Link
                    to={`/reviews?topic=${item.topic}${
                      propertyId !== 'all' ? `&propertyId=${propertyId}` : ''
                    }`}
                    className="inline-flex items-center gap-0.5 font-medium text-brand hover:underline"
                  >
                    Inspect {item.label} reviews
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Complete 8-Topic Matrix */}
      <section
        aria-label="All 8 Topics Sentiment Matrix"
        className="rounded-lg border border-border bg-surface p-5 shadow-card"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-content-primary">
              Complete Topic Sentiment Breakdown (All 8 Dimensions)
            </h2>
            <p className="text-xs text-content-secondary">
              Ranked by mention volume across {data.totalReviewsInPeriod.toLocaleString()} reviews
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="border-b border-border bg-subtle/60 text-content-secondary uppercase">
              <tr>
                <th className="px-3 py-3">Topic</th>
                <th className="px-3 py-3">Mentions</th>
                <th className="px-3 py-3 w-64">Sentiment Distribution</th>
                <th className="px-3 py-3">Net Score (-100..+100)</th>
                <th className="px-3 py-3">Avg Review Score</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.topics.map((t) => (
                <tr key={t.topic} className="hover:bg-subtle/30">
                  <td className="px-3 py-3 font-semibold text-content-primary">{t.label}</td>
                  <td className="px-3 py-3">
                    {t.mentionCount}{' '}
                    <span className="text-content-muted">({t.mentionSharePct}%)</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-sentiment-pos">{t.positivePct}% Pos</span>
                      <span className="text-sentiment-neg">{t.negativePct}% Neg</span>
                    </div>
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-subtle">
                      <div
                        style={{ width: `${t.positivePct}%` }}
                        className="bg-sentiment-pos"
                      />
                      <div
                        style={{ width: `${t.neutralPct}%` }}
                        className="bg-sentiment-neu"
                      />
                      <div
                        style={{ width: `${t.negativePct}%` }}
                        className="bg-sentiment-neg"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${
                        t.netSentimentScore >= 40
                          ? 'bg-sentiment-pos-bg text-sentiment-pos'
                          : t.netSentimentScore < 0
                            ? 'bg-sentiment-neg-bg text-sentiment-neg'
                            : 'bg-sentiment-neu-bg text-sentiment-neu'
                      }`}
                    >
                      {t.netSentimentScore > 0 ? '+' : ''}
                      {t.netSentimentScore}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {t.mentionCount > 0 ? (
                      <ScoreBadge score={t.avgReviewScore} size="sm" />
                    ) : (
                      <span className="text-content-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      to={`/reviews?topic=${t.topic}${
                        propertyId !== 'all' ? `&propertyId=${propertyId}` : ''
                      }`}
                      className="font-medium text-brand hover:underline"
                    >
                      Filter reviews →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Transparent Methodology Note */}
        <div className="mt-5 flex items-start gap-2.5 rounded-md border border-border bg-subtle/40 p-3.5 text-xs text-content-secondary">
          <Info className="h-4 w-4 text-brand shrink-0 mt-0.5" />
          <div>
            <strong className="text-content-primary">
              Transparent Rule-Based Tagging Methodology:
            </strong>{' '}
            Reviews are split into clauses on sentence boundaries and contrast conjunctions (
            <code>but</code>, <code>however</code>, <code>although</code>). Each clause is matched
            against our 8-topic hospitality keyword dictionary and scored with a polarity lexicon +
            3-word negation lookbehind window (so <em>“no street noise”</em> scores positive and{' '}
            <em>“not clean”</em> scores negative).
          </div>
        </div>
      </section>
    </div>
  );
}
export { AlertTriangle };
