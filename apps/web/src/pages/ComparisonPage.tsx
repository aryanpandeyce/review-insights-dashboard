import { useQuery } from '@tanstack/react-query';
import { BarChart2, Check, Radar as RadarIcon, Trophy } from 'lucide-react';
import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ScoreBadge, TOPIC_DISPLAY_NAMES } from '../components/ui/Badges';
import { ChartCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/StateViews';
import { useGlobalFilters } from '../context/FilterContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { TopicName } from '../types/api';

const PROPERTY_PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

const ALL_TOPICS: TopicName[] = [
  'cleanliness',
  'staff',
  'location',
  'breakfast',
  'wifi',
  'noise',
  'value',
  'room_comfort',
];

export function ComparisonPage(): React.JSX.Element {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([
    'amsterdam-canal-house',
    'barcelona-beach-resort',
    'berlin-business-hotel',
    'zurich-alpine-lodge',
  ]);
  const [chartMode, setChartMode] = useState<'radar' | 'bar'>('radar');

  const { preset, from, to, resetGlobalFilters } = useGlobalFilters();
  const { resolvedTheme } = useTheme();

  const comparisonQuery = useQuery({
    queryKey: ['comparison', preset, from, to],
    queryFn: () =>
      api.getComparison({
        preset,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
  });

  if (comparisonQuery.isLoading) {
    return (
      <div className="space-y-6">
        <ChartCardSkeleton height="h-96" />
        <ChartCardSkeleton height="h-80" />
      </div>
    );
  }

  if (comparisonQuery.isError) {
    return (
      <ErrorState
        message={comparisonQuery.error.message}
        onRetry={() => void comparisonQuery.refetch()}
      />
    );
  }

  const allProperties = comparisonQuery.data?.properties ?? [];
  const activeProperties = allProperties.filter((p) =>
    selectedSlugs.includes(p.slug)
  );

  if (allProperties.length === 0) {
    return (
      <EmptyState
        title="No property comparison data available"
        description="Seed the database or adjust the active date range."
        actionLabel="Reset filters"
        onAction={resetGlobalFilters}
      />
    );
  }

  const toggleProperty = (slug: string): void => {
    if (selectedSlugs.includes(slug)) {
      if (selectedSlugs.length <= 2) return; // Require at least 2 properties for comparison
      setSelectedSlugs(selectedSlugs.filter((s) => s !== slug));
    } else {
      setSelectedSlugs([...selectedSlugs, slug]);
    }
  };

  const gridColor = resolvedTheme === 'dark' ? '#1e293b' : '#e2e8f0';
  const axisColor = resolvedTheme === 'dark' ? '#94a3b8' : '#64748b';
  const tooltipBg = resolvedTheme === 'dark' ? '#1e293b' : '#ffffff';
  const tooltipBorder = resolvedTheme === 'dark' ? '#334155' : '#e2e8f0';

  const bestAvgScore = Math.max(...activeProperties.map((p) => p.avgScore));

  return (
    <div className="space-y-6">
      {/* Property Selector Bar & Chart Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-content-secondary mr-1">
            Compare Properties (2–4):
          </span>
          {allProperties.map((prop, idx) => {
            const isChecked = selectedSlugs.includes(prop.slug);
            const color = PROPERTY_PALETTE[idx % PROPERTY_PALETTE.length];
            return (
              <button
                key={prop.slug}
                type="button"
                onClick={() => toggleProperty(prop.slug)}
                aria-pressed={isChecked}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isChecked
                    ? 'border-brand bg-brand-subtle text-content-primary'
                    : 'border-border bg-surface text-content-muted hover:text-content-primary'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {prop.city} ({prop.avgScore.toFixed(1)})
                {isChecked && <Check className="h-3.5 w-3.5 text-brand" />}
              </button>
            );
          })}
        </div>

        <div
          role="group"
          aria-label="Comparison chart type"
          className="inline-flex rounded-md border border-border bg-subtle p-0.5 text-xs"
        >
          <button
            type="button"
            onClick={() => setChartMode('radar')}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium ${
              chartMode === 'radar'
                ? 'bg-surface text-content-primary shadow-2xs'
                : 'text-content-secondary'
            }`}
          >
            <RadarIcon className="h-3.5 w-3.5" />
            Radar View
          </button>
          <button
            type="button"
            onClick={() => setChartMode('bar')}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium ${
              chartMode === 'bar'
                ? 'bg-surface text-content-primary shadow-2xs'
                : 'text-content-secondary'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Grouped Bars
          </button>
        </div>
      </div>

      {/* Topic Satisfaction Chart (Radar or Grouped Bar) */}
      <section
        aria-label="Multi-Property Topic Comparison Chart"
        className="rounded-lg border border-border bg-surface p-5 shadow-card"
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold text-content-primary">
            Topic Positive Sentiment Share (%) Across Properties
          </h2>
          <p className="text-xs text-content-secondary">
            Percentage of topic mentions classified as positive (0% – 100%) per property
          </p>
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'radar' ? (
              <RadarChart data={comparisonQuery.data?.radarData ?? []}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="label" tick={{ fill: axisColor, fontSize: 12 }} />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: axisColor, fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {allProperties.map((prop, idx) =>
                  selectedSlugs.includes(prop.slug) ? (
                    <Radar
                      key={prop.slug}
                      name={prop.name}
                      dataKey={prop.slug}
                      stroke={PROPERTY_PALETTE[idx % PROPERTY_PALETTE.length]}
                      fill={PROPERTY_PALETTE[idx % PROPERTY_PALETTE.length]}
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                  ) : null
                )}
              </RadarChart>
            ) : (
              <BarChart
                data={comparisonQuery.data?.radarData ?? []}
                margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {allProperties.map((prop, idx) =>
                  selectedSlugs.includes(prop.slug) ? (
                    <Bar
                      key={prop.slug}
                      name={prop.name}
                      dataKey={prop.slug}
                      fill={PROPERTY_PALETTE[idx % PROPERTY_PALETTE.length]}
                      radius={[3, 3, 0, 0]}
                    />
                  ) : null
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>

      {/* Side-by-Side Benchmarking Matrix Table */}
      <section
        aria-label="Side-by-Side Property Benchmarking Table"
        className="rounded-lg border border-border bg-surface shadow-card overflow-x-auto"
      >
        <table className="w-full text-left text-xs tabular-nums">
          <thead className="border-b border-border bg-subtle/60 text-content-secondary">
            <tr>
              <th className="px-4 py-3.5 font-semibold uppercase">Metric / Dimension</th>
              {activeProperties.map((prop) => (
                <th key={prop.slug} className="px-4 py-3.5 font-semibold text-content-primary">
                  <div className="flex items-center gap-1.5">
                    <span>{prop.name}</span>
                    {prop.avgScore === bestAvgScore && (
                      <Trophy
                        className="h-3.5 w-3.5 text-amber-500 shrink-0"
                        aria-label="Top rated property"
                      />
                    )}
                  </div>
                  <span className="font-normal text-content-muted">
                    {prop.city} • {prop.starRating}★
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="px-4 py-3 font-medium text-content-secondary">Average Score</td>
              {activeProperties.map((prop) => (
                <td key={prop.slug} className="px-4 py-3">
                  <ScoreBadge score={prop.avgScore} />
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-content-secondary">
                Period Delta (vs prior)
              </td>
              {activeProperties.map((prop) => (
                <td
                  key={prop.slug}
                  className={`px-4 py-3 font-semibold ${
                    prop.avgScoreDelta > 0
                      ? 'text-sentiment-pos'
                      : prop.avgScoreDelta < 0
                        ? 'text-sentiment-neg'
                        : 'text-content-secondary'
                  }`}
                >
                  {prop.avgScoreDelta > 0 ? '+' : ''}
                  {prop.avgScoreDelta.toFixed(1)} pts
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-content-secondary">Total Reviews</td>
              {activeProperties.map((prop) => (
                <td key={prop.slug} className="px-4 py-3 font-medium">
                  {prop.totalReviews}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-content-secondary">
                Positive / Neutral / Negative
              </td>
              {activeProperties.map((prop) => (
                <td key={prop.slug} className="px-4 py-3">
                  <span className="text-sentiment-pos font-medium">{prop.positivePct}%</span> /{' '}
                  <span className="text-sentiment-neu">{prop.neutralPct}%</span> /{' '}
                  <span className="text-sentiment-neg">{prop.negativePct}%</span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-content-secondary">
                Owner Response Rate
              </td>
              {activeProperties.map((prop) => (
                <td key={prop.slug} className="px-4 py-3 font-medium">
                  {prop.responseRatePct.toFixed(1)}%
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-content-secondary">
                Open Flagged Reviews
              </td>
              {activeProperties.map((prop) => (
                <td
                  key={prop.slug}
                  className={`px-4 py-3 font-semibold ${
                    prop.unresolvedFlaggedCount > 0
                      ? 'text-sentiment-neg'
                      : 'text-sentiment-pos'
                  }`}
                >
                  {prop.unresolvedFlaggedCount}
                </td>
              ))}
            </tr>

            {/* Per-Topic Rows */}
            <tr className="bg-subtle/40">
              <td
                colSpan={activeProperties.length + 1}
                className="px-4 py-2 font-semibold uppercase tracking-wider text-content-secondary text-[11px]"
              >
                Topic Positive Sentiment Share (%)
              </td>
            </tr>
            {ALL_TOPICS.map((topicKey) => {
              const bestForTopic = Math.max(
                ...activeProperties.map(
                  (p) => p.topicScores[topicKey]?.positivePct ?? 0
                )
              );

              return (
                <tr key={topicKey} className="hover:bg-subtle/20">
                  <td className="px-4 py-2.5 font-medium text-content-primary">
                    {TOPIC_DISPLAY_NAMES[topicKey]}
                  </td>
                  {activeProperties.map((prop) => {
                    const pct = prop.topicScores[topicKey]?.positivePct ?? 0;
                    const mentions = prop.topicScores[topicKey]?.mentionCount ?? 0;
                    const isBest = pct === bestForTopic && mentions > 0;
                    return (
                      <td key={prop.slug} className="px-4 py-2.5">
                        <span
                          className={`font-semibold ${
                            isBest
                              ? 'text-sentiment-pos'
                              : pct < 55
                                ? 'text-sentiment-neg'
                                : 'text-content-primary'
                          }`}
                        >
                          {pct.toFixed(0)}%
                        </span>{' '}
                        <span className="text-content-muted">({mentions}m)</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
