import { useQuery } from '@tanstack/react-query';
import { Globe, Luggage, Table } from 'lucide-react';
import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ScoreBadge } from '../components/ui/Badges';
import { ChartCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/StateViews';
import { useGlobalFilters } from '../context/FilterContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

export function DistributionPage(): React.JSX.Element {
  const [showHistogramTable, setShowHistogramTable] = useState(false);
  const { propertyId, preset, from, to, resetGlobalFilters } = useGlobalFilters();
  const { resolvedTheme } = useTheme();

  const distQuery = useQuery({
    queryKey: ['distribution', propertyId, preset, from, to],
    queryFn: () =>
      api.getDistribution({
        propertyId,
        preset,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
  });

  if (distQuery.isLoading) {
    return (
      <div className="space-y-6">
        <ChartCardSkeleton height="h-72" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCardSkeleton height="h-64" />
          <ChartCardSkeleton height="h-64" />
        </div>
      </div>
    );
  }

  if (distQuery.isError) {
    return (
      <ErrorState
        message={distQuery.error.message}
        onRetry={() => void distQuery.refetch()}
      />
    );
  }

  const data = distQuery.data;
  if (!data || data.totalReviews === 0) {
    return (
      <EmptyState
        title="No distribution data"
        description="No guest reviews found for the selected property and date range."
        actionLabel="Reset filters"
        onAction={resetGlobalFilters}
      />
    );
  }

  const gridColor = resolvedTheme === 'dark' ? '#1e293b' : '#e2e8f0';
  const axisColor = resolvedTheme === 'dark' ? '#94a3b8' : '#64748b';
  const tooltipBg = resolvedTheme === 'dark' ? '#1e293b' : '#ffffff';
  const tooltipBorder = resolvedTheme === 'dark' ? '#334155' : '#e2e8f0';

  const getBucketColor = (bucket: number): string => {
    if (bucket >= 8) return '#10b981';
    if (bucket >= 6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      {/* Score Histogram (1-10) */}
      <section
        aria-label="Review Score Histogram"
        className="rounded-lg border border-border bg-surface p-5 shadow-card"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-content-primary">
              Review Score Histogram (1.0 – 10.0)
            </h2>
            <p className="text-xs text-content-secondary">
              Distribution of {data.totalReviews.toLocaleString()} reviews across 10 rating buckets
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowHistogramTable((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-content-secondary hover:text-content-primary"
          >
            <Table className="h-3.5 w-3.5" />
            {showHistogramTable ? 'View Histogram Chart' : 'View Table'}
          </button>
        </div>

        {showHistogramTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="border-b border-border bg-subtle/60 text-content-secondary">
                <tr>
                  <th className="px-3 py-2">Score Bucket</th>
                  <th className="px-3 py-2">Sentiment Tier</th>
                  <th className="px-3 py-2">Review Count</th>
                  <th className="px-3 py-2">Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.scoreHistogram.map((b) => (
                  <tr key={b.bucket}>
                    <td className="px-3 py-2 font-medium">{b.label}</td>
                    <td className="px-3 py-2 capitalize">{b.sentiment}</td>
                    <td className="px-3 py-2">{b.count}</td>
                    <td className="px-3 py-2">{b.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.scoreHistogram}
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
                <Bar dataKey="count" name="Reviews" radius={[4, 4, 0, 0]}>
                  {data.scoreHistogram.map((entry) => (
                    <Cell key={entry.bucket} fill={getBucketColor(entry.bucket)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Two-Column Breakdown: Trip Types & Top Guest Countries */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Trip Type Breakdown */}
        <section
          aria-label="Trip Type Breakdown"
          className="rounded-lg border border-border bg-surface p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-content-primary flex items-center gap-2">
                <Luggage className="h-4 w-4 text-brand" />
                Trip-Type Segmentation
              </h2>
              <p className="text-xs text-content-secondary">
                Review volume and average rating by traveler segment
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {data.tripTypes.map((item) => (
              <div key={item.tripType} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-content-primary">{item.label}</span>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-content-secondary">
                      {item.count} ({item.percentage}%)
                    </span>
                    <ScoreBadge score={item.avgScore} size="sm" />
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-subtle">
                  <div
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                    className="h-full rounded-full bg-brand transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Guest Country Breakdown */}
        <section
          aria-label="Guest Country Breakdown"
          className="rounded-lg border border-border bg-surface p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-content-primary flex items-center gap-2">
                <Globe className="h-4 w-4 text-brand" />
                Guest Origin Markets (Top 12)
              </h2>
              <p className="text-xs text-content-secondary">
                Geographic distribution and satisfaction by guest country
              </p>
            </div>
          </div>

          <div className="divide-y divide-border text-xs tabular-nums">
            {data.guestCountries.map((country) => (
              <div
                key={country.countryCode}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-7 items-center justify-center rounded border border-border bg-subtle font-mono text-[11px] font-semibold text-content-secondary">
                    {country.countryCode}
                  </span>
                  <span className="font-medium text-content-primary">
                    {country.countryName}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-24 hidden sm:block">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                      <div
                        style={{ width: `${Math.min(100, country.percentage * 2.5)}%` }}
                        className="h-full rounded-full bg-brand"
                      />
                    </div>
                  </div>
                  <span className="w-20 text-right text-content-secondary">
                    {country.count} ({country.percentage}%)
                  </span>
                  <ScoreBadge score={country.avgScore} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
