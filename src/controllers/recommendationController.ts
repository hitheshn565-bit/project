import { Request, Response, NextFunction } from 'express';
import { recommendationService } from '../services/recommendationService';
import { deduplicationService } from '../services/deduplicationService';

export async function getColdStartRecommendations(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { limit = 10 } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const recommendations = await recommendationService.getColdStartRecommendations(
      userId,
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      user_id: userId,
      recommendations,
      count: recommendations.length,
      type: 'cold_start'
    });
  } catch (err) {
    next(err);
  }
}

export async function getTrendingProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit = 10 } = req.query;
    
    const trending = await recommendationService.getTrendingProducts(
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      trending_products: trending,
      count: trending.length
    });
  } catch (err) {
    next(err);
  }
}

export async function getSimilarProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;
    
    const similar = await recommendationService.getSimilarProducts(
      productId,
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      product_id: productId,
      similar_products: similar,
      count: similar.length
    });
  } catch (err) {
    next(err);
  }
}

export async function findDuplicates(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    
    const duplicates = await deduplicationService.findDuplicates(productId);
    
    res.status(200).json({
      product_id: productId,
      potential_duplicates: duplicates,
      count: duplicates.length
    });
  } catch (err) {
    next(err);
  }
}
