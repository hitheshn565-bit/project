import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/authService';

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, declared_interests } = req.body;
    const result = await AuthService.signup({ email, password, declared_interests });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
