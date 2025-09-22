import { Request, Response, NextFunction } from 'express';
import { cachedProductService } from '../services/cachedProductService';
import { cacheService } from '../services/cacheService';
import { logger } from '../utils/logger';

export async function getCachedProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const { useCache = 'true' } = req.query;
    
    const product = await cachedProductService.getProductWithOffers(
      productId, 
      useCache === 'true'
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(200).json({
      ...product,
      cached: useCache === 'true'
    });
  } catch (err) {
    next(err);
  }
}

export async function searchCachedProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, limit = 20, useCache = 'true' } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }
    
    const filters = { limit: parseInt(limit as string, 10) };
    const products = await cachedProductService.searchProducts(
      q as string,
      filters,
      useCache === 'true'
    );
    
    res.status(200).json({
      products,
      total: products.length,
      query: q,
      cached: useCache === 'true'
    });
  } catch (err) {
    next(err);
  }
}

export async function getPopularProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit = 10 } = req.query;
    
    const products = await cachedProductService.getPopularProducts(
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      popular_products: products,
      count: products.length
    });
  } catch (err) {
    next(err);
  }
}

export async function invalidateProductCache(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    
    await cachedProductService.invalidateProductCache(productId);
    
    res.status(200).json({
      message: 'Product cache invalidated',
      productId
    });
  } catch (err) {
    next(err);
  }
}

export async function warmCache(req: Request, res: Response, next: NextFunction) {
  try {
    const { productIds } = req.body;
    
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds must be an array' });
    }
    
    // Start cache warming in background
    cachedProductService.warmCache(productIds).catch(error => {
      logger.error('Cache warming failed', { error });
    });
    
    res.status(202).json({
      message: 'Cache warming started',
      count: productIds.length
    });
  } catch (err) {
    next(err);
  }
}

export async function getCacheStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await cachedProductService.getCacheStats();
    
    res.status(200).json({
      message: 'Cache statistics',
      ...stats
    });
  } catch (err) {
    next(err);
  }
}

export async function clearCache(req: Request, res: Response, next: NextFunction) {
  try {
    const { pattern = '*' } = req.query;
    
    const deleted = await cacheService.invalidatePattern(pattern as string);
    
    res.status(200).json({
      message: 'Cache cleared',
      pattern,
      deleted
    });
  } catch (err) {
    next(err);
  }
}
