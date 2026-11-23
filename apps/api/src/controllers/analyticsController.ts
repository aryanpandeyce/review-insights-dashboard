import { NextFunction, Request, Response } from 'express';
import {
  getDistributionAnalytics,
  getOverviewAnalytics,
  getPropertyComparisonAnalytics,
  getTopicAnalytics,
  getTrendsAnalytics,
} from '../services/analyticsService';
import {
  analyticsFilterSchema,
  comparisonQuerySchema,
  trendsQuerySchema,
} from '../validators/queryValidators';

export async function overviewAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filter = analyticsFilterSchema.parse(req.query);
    const data = await getOverviewAnalytics(filter);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function trendsAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filter = trendsQuerySchema.parse(req.query);
    const data = await getTrendsAnalytics(filter);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function distributionAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filter = analyticsFilterSchema.parse(req.query);
    const data = await getDistributionAnalytics(filter);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function topicAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filter = analyticsFilterSchema.parse(req.query);
    const data = await getTopicAnalytics(filter);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function comparisonAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filter = comparisonQuerySchema.parse(req.query);
    const data = await getPropertyComparisonAnalytics(filter);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
