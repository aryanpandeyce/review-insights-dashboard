import React from 'react';

export function SkeletonBlock({ className = '' }: { className?: string }): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-subtle ${className}`}
    />
  );
}

export function KpiGridSkeleton({ count = 4 }: { count?: number }): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="Loading metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-border bg-surface p-5 shadow-card"
        >
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-5 w-14 rounded-full" />
          </div>
          <SkeletonBlock className="mt-3 h-8 w-24" />
          <SkeletonBlock className="mt-4 h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ChartCardSkeleton({ height = 'h-72' }: { height?: string }): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="Loading chart"
      className="rounded-lg border border-border bg-surface p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="mt-1.5 h-3.5 w-64" />
        </div>
        <SkeletonBlock className="h-8 w-28" />
      </div>
      <SkeletonBlock className={`w-full ${height}`} />
    </div>
  );
}

export function TableRowsSkeleton({ rows = 6 }: { rows?: number }): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="Loading reviews"
      className="rounded-lg border border-border bg-surface divide-y divide-border shadow-card"
    >
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-48" />
            <SkeletonBlock className="h-6 w-12 rounded-md" />
          </div>
          <SkeletonBlock className="h-4 w-3/4" />
          <div className="flex gap-2">
            <SkeletonBlock className="h-5 w-20 rounded-full" />
            <SkeletonBlock className="h-5 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
