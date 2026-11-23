import { AppError } from '../middlewares/errorHandler';
import {
  buildKpiSummaryForProperty,
  CountryBreakdownItem,
  getDistributions,
  getTopicInsights,
  getTrendsTimeSeries,
  KpiSummaryMetrics,
  PropertyOverviewCard,
  ResolvedDateWindow,
  resolveDateWindow,
  ScoreHistogramBucket,
  TOPIC_LABELS,
  TopicInsightItem,
  TrendBucket,
  TripTypeBreakdownItem,
} from '../repositories/analyticsRepository';
import {
  findAllProperties,
  findPropertyBySlugOrId,
} from '../repositories/propertyRepository';
import { Property, TOPIC_NAMES } from '../types/domain';
import {
  AnalyticsFilterInput,
  ComparisonQueryInput,
  TrendsQueryInput,
} from '../validators/queryValidators';

async function resolveOptionalProperty(propertyIdentifier?: string): Promise<Property | undefined> {
  if (!propertyIdentifier || propertyIdentifier === 'all') {
    return undefined;
  }
  const prop = await findPropertyBySlugOrId(propertyIdentifier);
  if (!prop) {
    throw new AppError(
      404,
      'PROPERTY_NOT_FOUND',
      `Property "${propertyIdentifier}" was not found`
    );
  }
  return prop;
}

export async function getOverviewAnalytics(filter: AnalyticsFilterInput): Promise<{
  period: ResolvedDateWindow;
  selectedProperty: Property | null;
  summary: KpiSummaryMetrics;
  byProperty: PropertyOverviewCard[];
}> {
  const [selectedProperty, allProperties, period] = await Promise.all([
    resolveOptionalProperty(filter.propertyId),
    findAllProperties(),
    resolveDateWindow({
      ...(filter.from ? { from: filter.from } : {}),
      ...(filter.to ? { to: filter.to } : {}),
      ...(filter.preset ? { preset: filter.preset } : {}),
    }),
  ]);

  const isAllPreset = !filter.from && (!filter.preset || filter.preset === 'all');

  const [summary, perPropertyMetrics] = await Promise.all([
    buildKpiSummaryForProperty(selectedProperty?.id, period, isAllPreset),
    Promise.all(
      allProperties.map(async (prop) => {
        const kpis = await buildKpiSummaryForProperty(prop.id, period, isAllPreset);
        return {
          propertyId: prop.id,
          propertySlug: prop.slug,
          propertyName: prop.name,
          city: prop.city,
          country: prop.country,
          starRating: prop.starRating,
          ...kpis,
        };
      })
    ),
  ]);

  return {
    period,
    selectedProperty: selectedProperty ?? null,
    summary,
    byProperty: perPropertyMetrics,
  };
}

export async function getTrendsAnalytics(filter: TrendsQueryInput): Promise<{
  period: ResolvedDateWindow;
  granularity: 'weekly' | 'monthly';
  series: TrendBucket[];
}> {
  const [selectedProperty, period] = await Promise.all([
    resolveOptionalProperty(filter.propertyId),
    resolveDateWindow({
      ...(filter.from ? { from: filter.from } : {}),
      ...(filter.to ? { to: filter.to } : {}),
      ...(filter.preset ? { preset: filter.preset } : {}),
    }),
  ]);

  const series = await getTrendsTimeSeries({
    ...(selectedProperty ? { propertyId: selectedProperty.id } : {}),
    from: period.from,
    to: period.to,
    granularity: filter.granularity,
  });

  return {
    period,
    granularity: filter.granularity,
    series,
  };
}

export async function getDistributionAnalytics(filter: AnalyticsFilterInput): Promise<{
  period: ResolvedDateWindow;
  totalReviews: number;
  scoreHistogram: ScoreHistogramBucket[];
  tripTypes: TripTypeBreakdownItem[];
  guestCountries: CountryBreakdownItem[];
}> {
  const [selectedProperty, period] = await Promise.all([
    resolveOptionalProperty(filter.propertyId),
    resolveDateWindow({
      ...(filter.from ? { from: filter.from } : {}),
      ...(filter.to ? { to: filter.to } : {}),
      ...(filter.preset ? { preset: filter.preset } : {}),
    }),
  ]);

  const dist = await getDistributions({
    ...(selectedProperty ? { propertyId: selectedProperty.id } : {}),
    from: period.from,
    to: period.to,
  });

  return {
    period,
    ...dist,
  };
}

export async function getTopicAnalytics(filter: AnalyticsFilterInput): Promise<{
  period: ResolvedDateWindow;
  totalReviewsInPeriod: number;
  topics: TopicInsightItem[];
  strengths: TopicInsightItem[];
  weaknesses: TopicInsightItem[];
}> {
  const [selectedProperty, period] = await Promise.all([
    resolveOptionalProperty(filter.propertyId),
    resolveDateWindow({
      ...(filter.from ? { from: filter.from } : {}),
      ...(filter.to ? { to: filter.to } : {}),
      ...(filter.preset ? { preset: filter.preset } : {}),
    }),
  ]);

  const insights = await getTopicInsights({
    ...(selectedProperty ? { propertyId: selectedProperty.id } : {}),
    from: period.from,
    to: period.to,
  });

  return {
    period,
    ...insights,
  };
}

export async function getPropertyComparisonAnalytics(filter: ComparisonQueryInput): Promise<{
  period: ResolvedDateWindow;
  properties: Array<{
    propertyId: string;
    slug: string;
    name: string;
    city: string;
    country: string;
    starRating: number;
    totalReviews: number;
    avgScore: number;
    avgScoreDelta: number;
    positivePct: number;
    neutralPct: number;
    negativePct: number;
    responseRatePct: number;
    unresolvedFlaggedCount: number;
    topicScores: Record<
      string,
      {
        mentionCount: number;
        positivePct: number;
        netSentimentScore: number;
        avgReviewScore: number;
      }
    >;
  }>;
  radarData: Array<Record<string, string | number>>;
}> {
  const [allProperties, period] = await Promise.all([
    findAllProperties(),
    resolveDateWindow({
      ...(filter.from ? { from: filter.from } : {}),
      ...(filter.to ? { to: filter.to } : {}),
      ...(filter.preset ? { preset: filter.preset } : {}),
    }),
  ]);

  let targetProperties = allProperties;
  if (filter.propertyIds && filter.propertyIds.length > 0) {
    const requestedSet = new Set(filter.propertyIds.map((id) => id.toLowerCase()));
    targetProperties = allProperties.filter(
      (p) => requestedSet.has(p.slug.toLowerCase()) || requestedSet.has(p.id.toLowerCase())
    );
  }

  const isAllPreset = !filter.from && (!filter.preset || filter.preset === 'all');

  const propertyBreakdowns = await Promise.all(
    targetProperties.map(async (prop) => {
      const [kpis, topicRes] = await Promise.all([
        buildKpiSummaryForProperty(prop.id, period, isAllPreset),
        getTopicInsights({ propertyId: prop.id, from: period.from, to: period.to }),
      ]);

      const topicScores: Record<
        string,
        {
          mentionCount: number;
          positivePct: number;
          netSentimentScore: number;
          avgReviewScore: number;
        }
      > = {};

      for (const t of topicRes.topics) {
        topicScores[t.topic] = {
          mentionCount: t.mentionCount,
          positivePct: t.positivePct,
          netSentimentScore: t.netSentimentScore,
          avgReviewScore: t.avgReviewScore,
        };
      }

      return {
        propertyId: prop.id,
        slug: prop.slug,
        name: prop.name,
        city: prop.city,
        country: prop.country,
        starRating: prop.starRating,
        totalReviews: kpis.totalReviews,
        avgScore: kpis.avgScore,
        avgScoreDelta: kpis.avgScoreDelta,
        positivePct: kpis.positivePct,
        neutralPct: kpis.neutralPct,
        negativePct: kpis.negativePct,
        responseRatePct: kpis.responseRatePct,
        unresolvedFlaggedCount: kpis.unresolvedFlaggedCount,
        topicScores,
      };
    })
  );

  // Build Recharts-friendly radar/grouped-bar array (one item per topic, keyed by property slug)
  const radarData = TOPIC_NAMES.map((topicName) => {
    const entry: Record<string, string | number> = {
      topic: topicName,
      label: TOPIC_LABELS[topicName],
    };
    for (const prop of propertyBreakdowns) {
      entry[prop.slug] = prop.topicScores[topicName]?.positivePct ?? 0;
    }
    return entry;
  });

  return {
    period,
    properties: propertyBreakdowns,
    radarData,
  };
}
