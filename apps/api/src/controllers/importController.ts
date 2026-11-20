import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler';
import {
  getImportHistory,
  parseImportFileBuffer,
  processReviewImport,
} from '../services/importService';

const jsonImportBodySchema = z.object({
  filename: z.string().trim().min(1).max(255).default('api-payload.json'),
  reviews: z.array(z.record(z.unknown())).min(1, 'reviews array cannot be empty'),
});

/**
 * POST /api/v1/imports
 * Supports multipart/form-data file upload (.csv or .json) OR application/json body.
 */
export async function createImportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.file) {
      const { originalname, buffer, mimetype } = req.file;
      const { sourceType, rawRows } = parseImportFileBuffer(originalname, buffer, mimetype);

      if (rawRows.length === 0) {
        throw new AppError(400, 'EMPTY_IMPORT_FILE', 'The uploaded file contains no review rows');
      }

      const result = await processReviewImport({
        filename: originalname,
        sourceType,
        rawRows,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
      return;
    }

    // Handle direct application/json payload
    const parsedBody = jsonImportBodySchema.parse(req.body);
    const result = await processReviewImport({
      filename: parsedBody.filename,
      sourceType: 'json',
      rawRows: parsedBody.reviews,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/imports
 * List recent import batch runs and their row-level error summaries.
 */
export async function listImportsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const batches = await getImportHistory(20);
    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
    next(error);
  }
}
