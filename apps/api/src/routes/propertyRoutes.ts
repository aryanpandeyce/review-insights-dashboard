import { Router } from 'express';
import { listPropertiesHandler } from '../controllers/propertyController';

export const propertyRouter = Router();

propertyRouter.get('/', listPropertiesHandler);
