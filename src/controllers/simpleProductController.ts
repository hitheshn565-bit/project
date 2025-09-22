import { Request, Response, NextFunction } from 'express';
import { ebayConnector } from '../connectors/ebayConnector';
import { simpleProductService } from '../services/simpleProductService';
import { logger } from '../utils/logger';

export async function createProductFromEbay(req: Request, res: Response, next: NextFunction) {
  try {
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }
    
    // Get eBay item
    const ebayItem = await ebayConnector.getItem(itemId);
    if (!ebayItem) {
      return res.status(404).json({ error: 'eBay item not found' });
    }
    
    // Create product
    const result = await simpleProductService.createProductFromEbay(ebayItem);
    
    res.status(201).json({
      message: 'Product created successfully',
      ...result
    });
    
  } catch (err) {
    logger.error('Failed to create product from eBay', {
      error: err instanceof Error ? err.message : err,
      itemId: req.body.itemId
    });
    next(err);
  }
}

export async function bulkCreateFromSearch(req: Request, res: Response, next: NextFunction) {
  try {
    const { keywords, limit = 5 } = req.body;
    
    if (!keywords) {
      return res.status(400).json({ error: 'keywords are required' });
    }
    
    // Search eBay
    const searchResult = await ebayConnector.searchItems({
      keywords,
      limit: Math.min(limit, 10)
    });
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Process each item
    for (const ebayItem of searchResult.itemSummaries || []) {
      try {
        const result = await simpleProductService.createProductFromEbay(ebayItem);
        results.push(result);
        successCount++;
      } catch (error) {
        logger.error('Failed to process eBay item in bulk', {
          itemId: ebayItem.itemId,
          error: error instanceof Error ? error.message : error
        });
        errorCount++;
      }
    }
    
    res.status(200).json({
      message: 'Bulk creation completed',
      summary: {
        total: searchResult.itemSummaries?.length || 0,
        successful: successCount,
        errors: errorCount,
        keywords
      },
      results
    });
    
  } catch (err) {
    logger.error('Bulk creation failed', {
      error: err instanceof Error ? err.message : err,
      keywords: req.body.keywords
    });
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    
    const result = await simpleProductService.getProductWithOffers(productId);
    if (!result) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function searchProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }
    
    const products = await simpleProductService.searchProducts(
      q as string, 
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      products,
      total: products.length,
      query: q
    });
  } catch (err) {
    next(err);
  }
}
