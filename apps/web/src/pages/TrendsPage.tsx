import { useQuery } from '@tanstack/react-query';
import { Calendar, Table } from 'lucide-react';
import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/StateViews';
import { useGlobalFilters } from '../context/FilterContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

export function TrendsPage(): React.JSX.Element {
  const [granularity, setGranularity] = useState<'monthly' | 'weekly'>('monthly');
  const [showDataTable, setShowDataTable] = useState(false);
  const { propertyId, preset, from, to, resetGlobalFilters } = useGlobalFilters();
  const { resolvedTheme } = useTheme();

  const trendsQuery = useQuery({
    queryKey: ['trends', propertyId, preset, from, to, granularity],
    queryFn: () =>
      api.getTrends({
        propertyId,
        preset,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        granularity,
      }),
  });

  if (trendsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <ChartCardSkeleton height="h-80" />
        <ChartCardSkeleton height="h-80" />
      </div>
    );
  }

  if (trendsQuery.isError) {
    return (
      <ErrorState
        message={trendsQuery.error.message}
        onRetry={() => void trendsQuery.refetch()}
      />
    );
  }

  const series = trendsQuery.data?.series ?? [];

  if (series.length === 0) {
    return (
      <EmptyState
        title="No trend data available"
        description="No guest reviews match the active date range and property filter."
        actionLabel="Reset filters"
        onAction={resetGlobalFilters}
      />
    );
  }

  const gridColor = resolvedTheme === 'dark' ? '#1e293b' : '#e2e8f0';
  const axisColor = resolvedTheme === 'dark' ? '#94a3b8' : '#64748b';
  const tooltipBg = resolvedTheme === 'dark' ? '#1e293b' : '#ffffff';
  const tooltipBorder = resolvedTheme === 'dark' ? '#334155' : '#e2e8f0';

  return (
    <div className="space-y-6">
      {/* Toolbar: Granularity Toggle & Accessible Table Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
        <div className="flex items-center gap-2 text-xs text-content-secondary">
          <Calendar className="h-4 w-4 text-brand" />
          <span>
            Showing <strong>{series.length}</strong> {granularity} intervals (
            {trendsQuery.data?.period.from} to {trendsQuery.data?.period.to})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Time granularity"
            className="inline-flex rounded-md border border-border bg-subtle p-0.5 text-xs"
          >
            <button
              type="button"
              onClick={() => setGranularity('monthly')}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                granularity === 'monthly'
                  ? 'bg-surface text-content-primary shadow-2xs'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setGranularity('weekly')}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                granularity === 'weekly'
                  ? 'bg-surface text-content-primary shadow-2xs'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Weekly
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowDataTable((v) => !v)}
            aria-pressed={showDataTable}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-content-secondary hover:border-border-strong hover:text-content-primary"
          >
            <Table className="h-3.5 w-3.5" />
            {showDataTable ? 'Show Charts' : 'Accessible Data Table'}
          </button>
        </div>
      </div>

      {showDataTable ? (
        <div className="rounded-lg border border-border bg-surface shadow-card overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="border-b border-border bg-subtle/60 text-content-secondary uppercase">
              <tr>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Avg Score</th>
                <th className="px-4 py-3">Total Reviews</th>
                <th className="px-4 py-3">Positive</th>
                <th className="px-4 py-3">Neutral</th>
                <th className="px-4 py-3">Negative</th>
                <th className="px-4 py-3">Response Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {series.map((row) => (
                <tr key={row.period} className="hover:bg-subtle/30">
                  <td className="px-4 py-2.5 font-medium text-content-primary">{row.period}</td>
                  <td className="px-4 py-2.5 font-semibold">{row.avgScore.toFixed(1)}</td>
                  <td className="px-4 py-2.5">{row.reviewCount}</td>
                  <td className="px-4 py-2.5 text-sentiment-pos">{row.positiveCount}</td>
                  <td className="px-4 py-2.5 text-sentiment-neu">{row.neutralCount}</td>
                  <td className="px-4 py-2.5 text-sentiment-neg">{row.negativeCount}</td>
                  <td className="px-4 py-2.5">{row.responseRatePct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Chart 1: Average Guest Score Trajectory */}
          <section
            aria-label="Average Score Over Time Chart"
            className="rounded-lg border border-border bg-surface p-5 shadow-card"
          >
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-content-primary">
                  Average Review Score Trajectory (1–10 Scale)
                </h2>
                <p className="text-xs text-content-secondary">
                  Dashed benchmark line indicates the 8.0 positive hospitality threshold
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="period"
                    stroke={axisColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[4, 10]}
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
                  <ReferenceLine
                    y={8.0}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Target 8.0',
                      position: 'insideTopRight',
                      fill: '#10b981',
                      fontSize: 11,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgScore"
                    name="Avg Score"
                    stroke="#6366f1"
                    strokeWidth={2.25}
                    fillOpacity={1}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Chart 2: Review Volume & Sentiment Composition */}
          <section
            aria-label="Review Volume by Sentiment Chart"
            className="rounded-lg border border-border bg-surface p-5 shadow-card"
          >
            <div className="mb-4">
              <h2 className="text-base font-semibold text-content-primary">
                Review Volume & Sentiment Composition
              </h2>
              <p className="text-xs text-content-secondary">
                Stacked volume of Positive (≥8.0), Neutral (6.0–7.9), and Negative (&lt;6.0) reviews
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="period"
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
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="positiveCount"
                    name="Positive (≥8)"
                    stackId="a"
                    fill="#10b981"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="neutralCount"
                    name="Neutral (6–7.9)"
                    stackId="a"
                    fill="#f59e0b"
                  />
                  <Bar
                    dataKey="negativeCount"
                    name="Negative (<6)"
                    stackId="a"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
