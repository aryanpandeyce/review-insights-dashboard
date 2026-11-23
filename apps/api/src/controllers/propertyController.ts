import { NextFunction, Request, Response } from 'express';
import { findAllProperties } from '../repositories/propertyRepository';

export async function listPropertiesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const properties = await findAllProperties();
    res.status(200).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    next(error);
  }
}
