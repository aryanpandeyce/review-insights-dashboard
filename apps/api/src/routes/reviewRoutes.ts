import { Router } from 'express';
import {
  exportReviewsCsvHandler,
  getReviewByIdHandler,
  listFlaggedReviewsHandler,
  listReviewsHandler,
  resolveReviewHandler,
} from '../controllers/reviewController';

export const reviewRouter = Router();

reviewRouter.get('/', listReviewsHandler);
reviewRouter.get('/export.csv', exportReviewsCsvHandler);
reviewRouter.get('/flagged', listFlaggedReviewsHandler);
reviewRouter.get('/:id', getReviewByIdHandler);
reviewRouter.patch('/:id/resolve', resolveReviewHandler);
