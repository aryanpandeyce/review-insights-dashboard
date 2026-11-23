import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HighlightText, ScoreBadge, TopicPill } from '../components/ui/Badges';
import { KpiCard } from '../components/ui/KpiCard';

describe('Frontend UI Primitives — KpiCard, ScoreBadge, TopicPill & HighlightText', () => {
  it('renders KpiCard with value, subtitle, positive delta badge, and sparkline', () => {
    render(
      <KpiCard
        label="Average Guest Score"
        value="8.6 / 10"
        subtitle="Prior period: 8.3"
        delta={0.3}
        deltaSuffix=" pts"
        sparkline={[
          { period: '2026-07', avgScore: 8.3, reviewCount: 30 },
          { period: '2026-08', avgScore: 8.5, reviewCount: 35 },
          { period: '2026-09', avgScore: 8.6, reviewCount: 40 },
        ]}
      />
    );

    expect(screen.getByText('Average Guest Score')).toBeInTheDocument();
    expect(screen.getByText('8.6 / 10')).toBeInTheDocument();
    expect(screen.getByText('Prior period: 8.3')).toBeInTheDocument();
    expect(screen.getByText('+0.3 pts')).toBeInTheDocument();
  });

  it('formats ScoreBadge to 1 decimal place and renders TopicPill label', () => {
    render(
      <div>
        <ScoreBadge score={9} />
        <TopicPill topic="room_comfort" sentiment="positive" />
      </div>
    );

    expect(screen.getByText('9.0')).toBeInTheDocument();
    expect(screen.getByText('Room Comfort')).toBeInTheDocument();
  });

  it('highlights case-insensitive search matches in HighlightText', () => {
    const { container } = render(
      <HighlightText
        text="Spotless canal view room with fast wifi"
        highlight="CANAL"
      />
    );

    const mark = container.querySelector('mark');
    expect(mark).not.toBeNull();
    expect(mark?.textContent).toBe('canal');
  });
});
