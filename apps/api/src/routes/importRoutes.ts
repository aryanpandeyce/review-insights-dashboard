import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import { env } from '../config/env';
import { createImportHandler, listImportsHandler } from '../controllers/importController';
import { AppError } from '../middlewares/errorHandler';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = new Set(['.csv', '.json']);
const ALLOWED_MIME_TYPES = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/json',
  'text/plain',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new AppError(
          400,
          'UNSUPPORTED_FILE_TYPE',
          'Only .csv and .json files up to 5MB are allowed'
        )
      );
      return;
    }
    cb(null, true);
  },
});

const importRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_IMPORTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many import requests. Please wait before uploading another file.',
    },
  },
});

export const importRouter = Router();

importRouter.get('/', listImportsHandler);
importRouter.post('/', importRateLimiter, upload.single('file'), createImportHandler);
