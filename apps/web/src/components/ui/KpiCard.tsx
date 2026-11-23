import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import React from 'react';
import { SparklinePoint } from '../../types/api';

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  delta?: number;
  deltaSuffix?: string;
  deltaLabel?: string;
  sparkline?: SparklinePoint[];
  sparklineKey?: 'avgScore' | 'reviewCount';
  icon?: React.ReactNode;
}

function MiniSparkline({
  points,
  dataKey,
  positive,
}: {
  points: SparklinePoint[];
  dataKey: 'avgScore' | 'reviewCount';
  positive: boolean;
}): React.JSX.Element | null {
  if (points.length < 2) return null;
  const values = points.map((p) => p[dataKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 120;
  const height = 28;
  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const strokeColor = positive ? 'var(--sentiment-pos)' : 'var(--brand-primary)';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  subtitle,
  delta,
  deltaSuffix = '',
  deltaLabel = 'vs prior period',
  sparkline,
  sparklineKey = 'avgScore',
  icon,
}: KpiCardProps): React.JSX.Element {
  const hasDelta = delta !== undefined && !Number.isNaN(delta);
  const isPositive = (delta ?? 0) > 0;
  const isNegative = (delta ?? 0) < 0;

  return (
    <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5 shadow-card transition-colors duration-150 hover:border-border-strong">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-content-secondary">
          {label}
        </span>
        {icon && <span className="text-content-muted">{icon}</span>}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-content-primary tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-content-secondary tabular-nums">{subtitle}</p>
          )}
        </div>

        {sparkline && sparkline.length > 1 && (
          <MiniSparkline
            points={sparkline}
            dataKey={sparklineKey}
            positive={!isNegative}
          />
        )}
      </div>

      {hasDelta && (
        <div className="mt-3.5 flex items-center gap-1.5 pt-3 border-t border-border/70">
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
              isPositive
                ? 'bg-sentiment-pos-bg text-sentiment-pos'
                : isNegative
                  ? 'bg-sentiment-neg-bg text-sentiment-neg'
                  : 'bg-subtle text-content-secondary'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : isNegative ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {isPositive ? '+' : ''}
            {delta}
            {deltaSuffix}
          </span>
          <span className="text-xs text-content-muted">{deltaLabel}</span>
        </div>
      )}
    </div>
  );
}
