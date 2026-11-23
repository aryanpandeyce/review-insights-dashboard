import { AlertTriangle, Inbox, RefreshCw, Server } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { subscribeColdStart } from '../../lib/api';

export function ColdStartBanner(): React.JSX.Element | null {
  const [isWakingUp, setIsWakingUp] = useState(false);

  useEffect(() => {
    return subscribeColdStart(setIsWakingUp);
  }, []);

  if (!isWakingUp) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex items-center gap-3 rounded-md border border-brand/30 bg-brand-subtle px-4 py-2.5 text-sm text-content-primary"
    >
      <Server className="h-4 w-4 text-brand animate-pulse shrink-0" />
      <div>
        <span className="font-medium">Waking up the API server...</span>{' '}
        <span className="text-content-secondary">
          Free-tier cloud instances spin down after inactivity and take ~15–30s on first request.
        </span>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-subtle text-content-secondary">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-content-primary">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-content-secondary">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 text-xs font-medium text-white hover:bg-brand-hover transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Unable to load analytics data',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}): React.JSX.Element {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-lg border border-sentiment-neg/30 bg-sentiment-neg-bg px-6 py-10 text-center"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-sentiment-neg shadow-card">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-content-primary">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-content-secondary">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-content-primary hover:bg-subtle transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry request
        </button>
      )}
    </div>
  );
}
