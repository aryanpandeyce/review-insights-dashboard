import { NextFunction, Request, Response } from 'express';
import {
  exportFilteredReviewsToCsv,
  getFlaggedReviewsQueue,
  getReviewDetailById,
  listExplorerReviews,
  setReviewResolvedState,
} from '../services/reviewService';
import {
  resolveReviewBodySchema,
  reviewsExplorerQuerySchema,
} from '../validators/queryValidators';

export async function listReviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedQuery = reviewsExplorerQuerySchema.parse(req.query);
    const data = await listExplorerReviews(parsedQuery);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listFlaggedReviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedQuery = reviewsExplorerQuerySchema.parse(req.query);
    const data = await getFlaggedReviewsQueue(parsedQuery);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function exportReviewsCsvHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedQuery = reviewsExplorerQuerySchema.parse(req.query);
    const csvContent = await exportFilteredReviewsToCsv(parsedQuery);
    const timestamp = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reviews-export-${timestamp}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

export async function getReviewByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params['id'] ?? '');
    const data = await getReviewDetailById(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function resolveReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params['id'] ?? '');
    const body = resolveReviewBodySchema.parse(req.body);
    const data = await setReviewResolvedState(id, body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
