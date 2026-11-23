import React from 'react';
import { Sentiment, TopicName } from '../../types/api';

export const TOPIC_DISPLAY_NAMES: Record<TopicName, string> = {
  cleanliness: 'Cleanliness',
  staff: 'Staff & Service',
  location: 'Location',
  breakfast: 'Breakfast',
  wifi: 'Wi-Fi',
  noise: 'Noise & Quietness',
  value: 'Value',
  room_comfort: 'Room Comfort',
};

export function ScoreBadge({
  score,
  size = 'md',
}: {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}): React.JSX.Element {
  const colorClasses =
    score >= 8.0
      ? 'bg-sentiment-pos-bg text-sentiment-pos border-sentiment-pos/25'
      : score >= 6.0
        ? 'bg-sentiment-neu-bg text-sentiment-neu border-sentiment-neu/25'
        : 'bg-sentiment-neg-bg text-sentiment-neg border-sentiment-neg/25';

  const sizeClasses =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-xs'
      : size === 'lg'
        ? 'px-3 py-1 text-base font-bold'
        : 'px-2 py-0.5 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md border tabular-nums ${colorClasses} ${sizeClasses}`}
    >
      {score.toFixed(1)}
    </span>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }): React.JSX.Element {
  const styles: Record<Sentiment, string> = {
    positive: 'bg-sentiment-pos-bg text-sentiment-pos border-sentiment-pos/25',
    neutral: 'bg-sentiment-neu-bg text-sentiment-neu border-sentiment-neu/25',
    negative: 'bg-sentiment-neg-bg text-sentiment-neg border-sentiment-neg/25',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${styles[sentiment]}`}
    >
      {sentiment}
    </span>
  );
}

export function TopicPill({
  topic,
  sentiment,
  onClick,
}: {
  topic: TopicName;
  sentiment?: Sentiment;
  onClick?: () => void;
}): React.JSX.Element {
  const dotColor =
    sentiment === 'positive'
      ? 'bg-sentiment-pos'
      : sentiment === 'negative'
        ? 'bg-sentiment-neg'
        : 'bg-sentiment-neu';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-subtle px-2.5 py-0.5 text-xs font-medium text-content-primary ${
        onClick ? 'hover:border-brand hover:bg-brand-subtle cursor-pointer' : 'cursor-default'
      }`}
    >
      {sentiment && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
      {TOPIC_DISPLAY_NAMES[topic] ?? topic}
    </button>
  );
}

/**
 * Safely highlight case-insensitive search term matches inside review titles and comments.
 */
export function HighlightText({
  text,
  highlight,
}: {
  text: string;
  highlight?: string;
}): React.JSX.Element {
  if (!highlight || !highlight.trim()) {
    return <>{text}</>;
  }

  const escaped = highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, idx) =>
        regex.test(part) ? (
          <mark
            key={idx}
            className="rounded bg-brand-subtle px-0.5 font-medium text-brand dark:text-indigo-300"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
