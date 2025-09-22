import { Router } from 'express';
import { router as authRouter } from './v1/auth';
import { router as userRouter } from './v1/users';
import { router as connectorRouter } from './v1/connectors';
import { router as productRouter } from './v1/products';
import { router as priceRouter } from './v1/prices';
import { router as cacheRouter } from './v1/cache';
import { router as recommendationRouter } from './v1/recommendations';
import scraperRouter from './scraper';

export const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/connectors', connectorRouter);
router.use('/products', productRouter);
router.use('/prices', priceRouter);
router.use('/cache', cacheRouter);
router.use('/recommendations', recommendationRouter);
router.use('/scraper', scraperRouter);
