import type { Request, Response, NextFunction } from 'express';
import type { ValidationError } from '../utils/validators.js';

export interface ValidatedRequest extends Request {
  validationErrors?: ValidationError[];
}

export function handleValidationErrors(
  req: ValidatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (req.validationErrors && req.validationErrors.length > 0) {
    res.status(400).json({
      success: false,
      errors: req.validationErrors,
    });
    return;
  }
  next();
}
