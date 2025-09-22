import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/authService';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login({ email, password, userAgent: req.headers['user-agent'], ip: req.ip });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refresh_token } = req.body;
    const result = await AuthService.refresh({ refresh_token });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
