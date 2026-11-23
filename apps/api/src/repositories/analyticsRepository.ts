import { query } from '../db/pool';
import { Sentiment, TOPIC_NAMES, TopicName, TripType } from '../types/domain';
import { DatePreset } from '../validators/queryValidators';

export interface ResolvedDateWindow {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
}

export interface SparklinePoint {
  period: string;
  avgScore: number;
  reviewCount: number;
}

export interface KpiSummaryMetrics {
  totalReviews: number;
  previousTotalReviews: number;
  reviewsDeltaPct: number;
  avgScore: number;
  previousAvgScore: number;
  avgScoreDelta: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  responseRatePct: number;
  previousResponseRatePct: number;
  responseRateDeltaPct: number;
  unresolvedFlaggedCount: number;
  sparkline: SparklinePoint[];
}

export interface PropertyOverviewCard extends KpiSummaryMetrics {
  propertyId: string;
  propertySlug: string;
  propertyName: string;
  city: string;
  country: string;
  starRating: number;
}

export interface TrendBucket {
  period: string;
  avgScore: number;
  reviewCount: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  responseRatePct: number;
}

export interface ScoreHistogramBucket {
  bucket: number;
  label: string;
  count: number;
  percentage: number;
  sentiment: Sentiment;
}

export interface TripTypeBreakdownItem {
  tripType: TripType;
  label: string;
  count: number;
  percentage: number;
  avgScore: number;
}

export interface CountryBreakdownItem {
  countryCode: string;
  countryName: string;
  count: number;
  percentage: number;
  avgScore: number;
}

export interface TopicInsightItem {
  topic: TopicName;
  label: string;
  mentionCount: number;
  mentionSharePct: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  netSentimentScore: number;
  avgReviewScore: number;
  samplePositiveSnippet: string | null;
  sampleNegativeSnippet: string | null;
}

export const TOPIC_LABELS: Record<TopicName, string> = {
  cleanliness: 'Cleanliness',
  staff: 'Staff & Service',
  location: 'Location',
  breakfast: 'Breakfast & Dining',
  wifi: 'Wi-Fi & Connectivity',
  noise: 'Quietness & Noise',
  value: 'Value for Money',
  room_comfort: 'Room Comfort',
};

const TRIP_TYPE_LABELS: Record<TripType, string> = {
  couple: 'Couples',
  family: 'Families',
  solo: 'Solo Travelers',
  business: 'Business',
  friends: 'Friends Group',
};

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

/**
 * Resolve date range window (and matching previous period window for period-over-period KPI deltas)
 * anchored to the dataset's maximum review_date when no explicit `to` date is supplied.
 */
export async function resolveDateWindow(input: {
  from?: string;
  to?: string;
  preset?: DatePreset;
}): Promise<ResolvedDateWindow> {
  const boundsResult = await query<{ min_date: string | null; max_date: string | null }>(
    `SELECT TO_CHAR(MIN(review_date), 'YYYY-MM-DD') AS min_date,
            TO_CHAR(MAX(review_date), 'YYYY-MM-DD') AS max_date
     FROM reviews`
  );

  const todayIso = new Date().toISOString().slice(0, 10);
  const maxDateStr = input.to ?? boundsResult.rows[0]?.max_date ?? todayIso;
  const minDateStr = boundsResult.rows[0]?.min_date ?? '2025-01-01';

  const endMs = Date.parse(`${maxDateStr}T00:00:00.000Z`);
  const dayMs = 24 * 60 * 60 * 1000;

  let startMs: number;
  if (input.from) {
    startMs = Date.parse(`${input.from}T00:00:00.000Z`);
  } else if (input.preset === '30d') {
    startMs = endMs - 30 * dayMs;
  } else if (input.preset === '90d') {
    startMs = endMs - 90 * dayMs;
  } else if (input.preset === '12m') {
    startMs = endMs - 365 * dayMs;
  } else {
    // For 'all', compare the most recent 180 days against the preceding 180 days for delta badges,
    // or use the full dataset span
    startMs = Date.parse(`${minDateStr}T00:00:00.000Z`);
  }

  const spanMs = Math.max(30 * dayMs, endMs - startMs);
  const prevEndMs = startMs - dayMs;
  const prevStartMs = prevEndMs - spanMs;

  return {
    from: new Date(startMs).toISOString().slice(0, 10),
    to: new Date(endMs).toISOString().slice(0, 10),
    previousFrom: new Date(prevStartMs).toISOString().slice(0, 10),
    previousTo: new Date(prevEndMs).toISOString().slice(0, 10),
  };
}

interface PeriodAggRow {
  total_reviews: string;
  avg_score: string | null;
  positive_count: string;
  neutral_count: string;
  negative_count: string;
  responded_count: string;
  unresolved_flagged_count: string;
}

async function fetchPeriodKpis(
  propertyId: string | undefined,
  from: string,
  to: string
): Promise<{
  totalReviews: number;
  avgScore: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  responseRatePct: number;
  unresolvedFlaggedCount: number;
}> {
  const params: unknown[] = [from, to];
  const propClause = propertyId ? `AND property_id = $3` : '';
  if (propertyId) params.push(propertyId);

  const sql = `
    SELECT
      COUNT(*)::text AS total_reviews,
      ROUND(AVG(score), 2)::text AS avg_score,
      COUNT(*) FILTER (WHERE sentiment = 'positive')::text AS positive_count,
      COUNT(*) FILTER (WHERE sentiment = 'neutral')::text AS neutral_count,
      COUNT(*) FILTER (WHERE sentiment = 'negative')::text AS negative_count,
      COUNT(*) FILTER (WHERE owner_response IS NOT NULL)::text AS responded_count,
      COUNT(*) FILTER (WHERE is_flagged = TRUE AND is_resolved = FALSE)::text AS unresolved_flagged_count
    FROM reviews
    WHERE review_date >= $1::date
      AND review_date <= $2::date
      ${propClause}
  `;

  const res = await query<PeriodAggRow>(sql, params);
  const row = res.rows[0];

  const totalReviews = Number(row?.total_reviews ?? 0);
  const avgScore = round1(Number(row?.avg_score ?? 0));
  const positiveCount = Number(row?.positive_count ?? 0);
  const neutralCount = Number(row?.neutral_count ?? 0);
  const negativeCount = Number(row?.negative_count ?? 0);
  const respondedCount = Number(row?.responded_count ?? 0);
  const unresolvedFlaggedCount = Number(row?.unresolved_flagged_count ?? 0);

  return {
    totalReviews,
    avgScore,
    positiveCount,
    neutralCount,
    negativeCount,
    positivePct: totalReviews > 0 ? round1((positiveCount / totalReviews) * 100) : 0,
    neutralPct: totalReviews > 0 ? round1((neutralCount / totalReviews) * 100) : 0,
    negativePct: totalReviews > 0 ? round1((negativeCount / totalReviews) * 100) : 0,
    responseRatePct: totalReviews > 0 ? round1((respondedCount / totalReviews) * 100) : 0,
    unresolvedFlaggedCount,
  };
}

async function fetchSparkline(
  propertyId: string | undefined,
  from: string,
  to: string
): Promise<SparklinePoint[]> {
  const params: unknown[] = [from, to];
  const propClause = propertyId ? `AND property_id = $3` : '';
  if (propertyId) params.push(propertyId);

  const sql = `
    SELECT
      TO_CHAR(DATE_TRUNC('month', review_date), 'YYYY-MM') AS period,
      ROUND(AVG(score), 1)::text AS avg_score,
      COUNT(*)::text AS review_count
    FROM reviews
    WHERE review_date >= $1::date
      AND review_date <= $2::date
      ${propClause}
    GROUP BY DATE_TRUNC('month', review_date)
    ORDER BY DATE_TRUNC('month', review_date) ASC
  `;

  const res = await query<{ period: string; avg_score: string; review_count: string }>(
    sql,
    params
  );

  return res.rows.map((r) => ({
    period: r.period,
    avgScore: Number(r.avg_score),
    reviewCount: Number(r.review_count),
  }));
}

export async function buildKpiSummaryForProperty(
  propertyId: string | undefined,
  window: ResolvedDateWindow,
  isAllPreset: boolean
): Promise<KpiSummaryMetrics> {
  // When 'all' preset is active, compute period-over-period delta by comparing last 90 days vs prior 90 days
  let prevWindowFrom = window.previousFrom;
  let prevWindowTo = window.previousTo;
  let deltaCurrentFrom = window.from;
  let deltaCurrentTo = window.to;

  if (isAllPreset) {
    const endMs = Date.parse(`${window.to}T00:00:00.000Z`);
    const dayMs = 24 * 60 * 60 * 1000;
    deltaCurrentFrom = new Date(endMs - 90 * dayMs).toISOString().slice(0, 10);
    deltaCurrentTo = window.to;
    prevWindowTo = new Date(endMs - 91 * dayMs).toISOString().slice(0, 10);
    prevWindowFrom = new Date(endMs - 181 * dayMs).toISOString().slice(0, 10);
  }

  const [current, deltaCurrent, previous, sparkline] = await Promise.all([
    fetchPeriodKpis(propertyId, window.from, window.to),
    isAllPreset
      ? fetchPeriodKpis(propertyId, deltaCurrentFrom, deltaCurrentTo)
      : Promise.resolve(null),
    fetchPeriodKpis(propertyId, prevWindowFrom, prevWindowTo),
    fetchSparkline(propertyId, window.from, window.to),
  ]);

  const activeForDelta = deltaCurrent ?? current;

  const avgScoreDelta =
    previous.totalReviews > 0 ? round1(activeForDelta.avgScore - previous.avgScore) : 0;

  const reviewsDeltaPct =
    previous.totalReviews > 0
      ? round1(((activeForDelta.totalReviews - previous.totalReviews) / previous.totalReviews) * 100)
      : 0;

  const responseRateDeltaPct =
    previous.totalReviews > 0
      ? round1(activeForDelta.responseRatePct - previous.responseRatePct)
      : 0;

  return {
    totalReviews: current.totalReviews,
    previousTotalReviews: previous.totalReviews,
    reviewsDeltaPct,
    avgScore: current.avgScore,
    previousAvgScore: previous.avgScore,
    avgScoreDelta,
    positiveCount: current.positiveCount,
    neutralCount: current.neutralCount,
    negativeCount: current.negativeCount,
    positivePct: current.positivePct,
    neutralPct: current.neutralPct,
    negativePct: current.negativePct,
    responseRatePct: current.responseRatePct,
    previousResponseRatePct: previous.responseRatePct,
    responseRateDeltaPct,
    unresolvedFlaggedCount: current.unresolvedFlaggedCount,
    sparkline,
  };
}

export async function getTrendsTimeSeries(input: {
  propertyId?: string;
  from: string;
  to: string;
  granularity: 'weekly' | 'monthly';
}): Promise<TrendBucket[]> {
  const truncUnit = input.granularity === 'weekly' ? 'week' : 'month';
  const formatPattern = input.granularity === 'weekly' ? 'YYYY-MM-DD' : 'YYYY-MM';

  const params: unknown[] = [input.from, input.to];
  const propClause = input.propertyId ? `AND property_id = $3` : '';
  if (input.propertyId) params.push(input.propertyId);

  const sql = `
    SELECT
      TO_CHAR(DATE_TRUNC('${truncUnit}', review_date), '${formatPattern}') AS period,
      ROUND(AVG(score), 2)::text AS avg_score,
      COUNT(*)::text AS review_count,
      COUNT(*) FILTER (WHERE sentiment = 'positive')::text AS positive_count,
      COUNT(*) FILTER (WHERE sentiment = 'neutral')::text AS neutral_count,
      COUNT(*) FILTER (WHERE sentiment = 'negative')::text AS negative_count,
      COUNT(*) FILTER (WHERE owner_response IS NOT NULL)::text AS responded_count
    FROM reviews
    WHERE review_date >= $1::date
      AND review_date <= $2::date
      ${propClause}
    GROUP BY DATE_TRUNC('${truncUnit}', review_date)
    ORDER BY DATE_TRUNC('${truncUnit}', review_date) ASC
  `;

  const res = await query<{
    period: string;
    avg_score: string;
    review_count: string;
    positive_count: string;
    neutral_count: string;
    negative_count: string;
    responded_count: string;
  }>(sql, params);

  return res.rows.map((r) => {
    const count = Number(r.review_count);
    const responded = Number(r.responded_count);
    return {
      period: r.period,
      avgScore: round1(Number(r.avg_score)),
      reviewCount: count,
      positiveCount: Number(r.positive_count),
      neutralCount: Number(r.neutral_count),
      negativeCount: Number(r.negative_count),
      responseRatePct: count > 0 ? round1((responded / count) * 100) : 0,
    };
  });
}

export async function getDistributions(input: {
  propertyId?: string;
  from: string;
  to: string;
}): Promise<{
  totalReviews: number;
  scoreHistogram: ScoreHistogramBucket[];
  tripTypes: TripTypeBreakdownItem[];
  guestCountries: CountryBreakdownItem[];
}> {
  const params: unknown[] = [input.from, input.to];
  const propClause = input.propertyId ? `AND property_id = $3` : '';
  if (input.propertyId) params.push(input.propertyId);

  const [scoreRes, tripRes, countryRes] = await Promise.all([
    query<{ bucket: number; count: string }>(
      `SELECT
         LEAST(10, GREATEST(1, FLOOR(score)))::int AS bucket,
         COUNT(*)::text AS count
       FROM reviews
       WHERE review_date >= $1::date AND review_date <= $2::date ${propClause}
       GROUP BY 1
       ORDER BY 1 ASC`,
      params
    ),
    query<{ trip_type: TripType; count: string; avg_score: string }>(
      `SELECT
         trip_type,
         COUNT(*)::text AS count,
         ROUND(AVG(score), 1)::text AS avg_score
       FROM reviews
       WHERE review_date >= $1::date AND review_date <= $2::date ${propClause}
       GROUP BY trip_type
       ORDER BY COUNT(*) DESC`,
      params
    ),
    query<{
      guest_country_code: string;
      guest_country_name: string;
      count: string;
      avg_score: string;
    }>(
      `SELECT
         guest_country_code,
         MAX(guest_country_name) AS guest_country_name,
         COUNT(*)::text AS count,
         ROUND(AVG(score), 1)::text AS avg_score
       FROM reviews
       WHERE review_date >= $1::date AND review_date <= $2::date ${propClause}
       GROUP BY guest_country_code
       ORDER BY COUNT(*) DESC
       LIMIT 12`,
      params
    ),
  ]);

  const countByBucket = new Map<number, number>();
  let totalReviews = 0;
  for (const r of scoreRes.rows) {
    const b = Number(r.bucket);
    const c = Number(r.count);
    countByBucket.set(b, c);
    totalReviews += c;
  }

  const scoreHistogram: ScoreHistogramBucket[] = [];
  for (let b = 1; b <= 10; b++) {
    const count = countByBucket.get(b) ?? 0;
    const sentiment: Sentiment = b >= 8 ? 'positive' : b >= 6 ? 'neutral' : 'negative';
    scoreHistogram.push({
      bucket: b,
      label: b === 10 ? '10' : `${b}.0–${b}.9`,
      count,
      percentage: totalReviews > 0 ? round1((count / totalReviews) * 100) : 0,
      sentiment,
    });
  }

  const tripTypes: TripTypeBreakdownItem[] = tripRes.rows.map((r) => {
    const count = Number(r.count);
    return {
      tripType: r.trip_type,
      label: TRIP_TYPE_LABELS[r.trip_type] ?? r.trip_type,
      count,
      percentage: totalReviews > 0 ? round1((count / totalReviews) * 100) : 0,
      avgScore: Number(r.avg_score),
    };
  });

  const guestCountries: CountryBreakdownItem[] = countryRes.rows.map((r) => {
    const count = Number(r.count);
    return {
      countryCode: r.guest_country_code,
      countryName: r.guest_country_name,
      count,
      percentage: totalReviews > 0 ? round1((count / totalReviews) * 100) : 0,
      avgScore: Number(r.avg_score),
    };
  });

  return {
    totalReviews,
    scoreHistogram,
    tripTypes,
    guestCountries,
  };
}

export async function getTopicInsights(input: {
  propertyId?: string;
  from: string;
  to: string;
}): Promise<{
  totalReviewsInPeriod: number;
  topics: TopicInsightItem[];
  strengths: TopicInsightItem[];
  weaknesses: TopicInsightItem[];
}> {
  const params: unknown[] = [input.from, input.to];
  const propClause = input.propertyId ? `AND r.property_id = $3` : '';
  if (input.propertyId) params.push(input.propertyId);

  const [totalRes, topicRes] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM reviews r
       WHERE r.review_date >= $1::date AND r.review_date <= $2::date ${propClause}`,
      params
    ),
    query<{
      topic: TopicName;
      mention_count: string;
      positive_count: string;
      neutral_count: string;
      negative_count: string;
      avg_review_score: string;
      sample_positive_snippet: string | null;
      sample_negative_snippet: string | null;
    }>(
      `SELECT
         rt.topic,
         COUNT(*)::text AS mention_count,
         COUNT(*) FILTER (WHERE rt.sentiment = 'positive')::text AS positive_count,
         COUNT(*) FILTER (WHERE rt.sentiment = 'neutral')::text AS neutral_count,
         COUNT(*) FILTER (WHERE rt.sentiment = 'negative')::text AS negative_count,
         ROUND(AVG(r.score), 1)::text AS avg_review_score,
         MAX(rt.snippet) FILTER (WHERE rt.sentiment = 'positive') AS sample_positive_snippet,
         MAX(rt.snippet) FILTER (WHERE rt.sentiment = 'negative') AS sample_negative_snippet
       FROM review_topics rt
       INNER JOIN reviews r ON r.id = rt.review_id
       WHERE r.review_date >= $1::date
         AND r.review_date <= $2::date
         ${propClause}
       GROUP BY rt.topic`,
      params
    ),
  ]);

  const totalReviewsInPeriod = Number(totalRes.rows[0]?.count ?? 0);
  const rowByTopic = new Map(topicRes.rows.map((r) => [r.topic, r]));

  const topics: TopicInsightItem[] = TOPIC_NAMES.map((topicName) => {
    const row = rowByTopic.get(topicName);
    const mentionCount = Number(row?.mention_count ?? 0);
    const positiveCount = Number(row?.positive_count ?? 0);
    const neutralCount = Number(row?.neutral_count ?? 0);
    const negativeCount = Number(row?.negative_count ?? 0);

    const positivePct = mentionCount > 0 ? round1((positiveCount / mentionCount) * 100) : 0;
    const neutralPct = mentionCount > 0 ? round1((neutralCount / mentionCount) * 100) : 0;
    const negativePct = mentionCount > 0 ? round1((negativeCount / mentionCount) * 100) : 0;
    const netSentimentScore =
      mentionCount > 0
        ? round1(((positiveCount - negativeCount) / mentionCount) * 100)
        : 0;

    return {
      topic: topicName,
      label: TOPIC_LABELS[topicName],
      mentionCount,
      mentionSharePct:
        totalReviewsInPeriod > 0 ? round1((mentionCount / totalReviewsInPeriod) * 100) : 0,
      positiveCount,
      neutralCount,
      negativeCount,
      positivePct,
      neutralPct,
      negativePct,
      netSentimentScore,
      avgReviewScore: Number(row?.avg_review_score ?? 0),
      samplePositiveSnippet: row?.sample_positive_snippet ?? null,
      sampleNegativeSnippet: row?.sample_negative_snippet ?? null,
    };
  });

  const activeTopics = topics.filter((t) => t.mentionCount > 0);

  const strengths = [...activeTopics]
    .sort((a, b) => b.netSentimentScore - a.netSentimentScore || b.positiveCount - a.positiveCount)
    .slice(0, 4);

  const weaknesses = [...activeTopics]
    .sort((a, b) => a.netSentimentScore - b.netSentimentScore || b.negativeCount - a.negativeCount)
    .slice(0, 4);

  return {
    totalReviewsInPeriod,
    topics: [...topics].sort((a, b) => b.mentionCount - a.mentionCount),
    strengths,
    weaknesses,
  };
}
