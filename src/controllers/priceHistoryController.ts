import { Request, Response, NextFunction } from 'express';
import { priceHistoryService } from '../services/priceHistoryService';
import { logger } from '../utils/logger';

export async function getOfferPriceHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { offerId } = req.params;
    const { days = 7 } = req.query;
    
    const history = await priceHistoryService.getPriceHistory(
      offerId, 
      parseInt(days as string, 10)
    );
    
    if (!history) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
}

export async function getProductPriceHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const { days = 7 } = req.query;
    
    const history = await priceHistoryService.getProductPriceHistory(
      productId,
      parseInt(days as string, 10)
    );
    
    if (!history) {
      return res.status(404).json({ error: 'Product not found or no price history' });
    }
    
    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
}

export async function recordPriceUpdate(req: Request, res: Response, next: NextFunction) {
  try {
    const { offerId, price, currency } = req.body;
    
    if (!offerId || !price || !currency) {
      return res.status(400).json({ 
        error: 'offerId, price, and currency are required' 
      });
    }
    
    await priceHistoryService.recordPriceSnapshot(offerId, price, currency);
    
    res.status(200).json({ 
      message: 'Price snapshot recorded successfully',
      offerId,
      price,
      currency
    });
  } catch (err) {
    next(err);
  }
}

export async function bulkUpdatePrices(req: Request, res: Response, next: NextFunction) {
  try {
    const { offers } = req.body;
    
    if (!Array.isArray(offers)) {
      return res.status(400).json({ error: 'offers must be an array' });
    }
    
    const result = await priceHistoryService.bulkUpdatePrices(offers);
    
    res.status(200).json({
      message: 'Bulk price update completed',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function getMarketTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, days = 30 } = req.query;
    
    const trends = await priceHistoryService.getMarketTrends(
      category as string,
      parseInt(days as string, 10)
    );
    
    res.status(200).json(trends);
  } catch (err) {
    next(err);
  }
}

export async function getUserPriceAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const alerts = await priceHistoryService.getPriceAlerts(userId);
    
    res.status(200).json({
      user_id: userId,
      alerts
    });
  } catch (err) {
    next(err);
  }
}
