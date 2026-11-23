import { Router } from 'express';
import {
  comparisonAnalyticsHandler,
  distributionAnalyticsHandler,
  overviewAnalyticsHandler,
  topicAnalyticsHandler,
  trendsAnalyticsHandler,
} from '../controllers/analyticsController';

export const analyticsRouter = Router();

analyticsRouter.get('/overview', overviewAnalyticsHandler);
analyticsRouter.get('/trends', trendsAnalyticsHandler);
analyticsRouter.get('/distribution', distributionAnalyticsHandler);
analyticsRouter.get('/topics', topicAnalyticsHandler);
analyticsRouter.get('/comparison', comparisonAnalyticsHandler);
