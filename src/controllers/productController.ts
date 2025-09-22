import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/productService';
import { ebayConnector } from '../connectors/ebayConnector';
import { logger } from '../utils/logger';

export async function ingestEbayProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }
    
    logger.info('Starting eBay product ingestion', { itemId });
    
    // Get item details from eBay
    const ebayItem = await ebayConnector.getItem(itemId);
    if (!ebayItem) {
      return res.status(404).json({ error: 'eBay item not found' });
    }
    
    logger.info('eBay item retrieved', { 
      itemId, 
      title: ebayItem.title,
      price: ebayItem.price 
    });
    
    // Create or update canonical product and offer
    const result = await productService.createOrUpdateProduct(ebayItem);
    
    logger.info('Product ingested successfully', {
      productId: result.product.id,
      offerId: result.offer.id,
      isNew: result.isNew,
      ebayItemId: itemId
    });
    
    res.status(result.isNew ? 201 : 200).json({
      message: result.isNew ? 'New product created' : 'Product updated',
      product: result.product,
      offer: result.offer,
      isNew: result.isNew
    });
  } catch (err) {
    logger.error('Product ingestion failed', { 
      itemId: req.body.itemId,
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined
    });
    next(err);
  }
}

export async function ingestEbaySearch(req: Request, res: Response, next: NextFunction) {
  try {
    const { keywords, limit = 10 } = req.body;
    
    if (!keywords) {
      return res.status(400).json({ error: 'keywords are required' });
    }
    
    // Search eBay for items
    const searchResult = await ebayConnector.searchItems({
      keywords,
      limit: Math.min(limit, 50) // Cap at 50 for safety
    });
    
    const results = [];
    let newProducts = 0;
    let updatedProducts = 0;
    
    // Process each item
    for (const ebayItem of searchResult.itemSummaries || []) {
      try {
        const result = await productService.createOrUpdateProduct(ebayItem);
        results.push({
          productId: result.product.id,
          offerId: result.offer.id,
          isNew: result.isNew,
          title: result.product.title,
          price: result.offer.current_price
        });
        
        if (result.isNew) {
          newProducts++;
        } else {
          updatedProducts++;
        }
      } catch (itemError) {
        logger.error('Failed to process eBay item', {
          itemId: ebayItem.itemId,
          error: itemError
        });
      }
    }
    
    logger.info('Bulk eBay ingestion completed', {
      keywords,
      totalProcessed: results.length,
      newProducts,
      updatedProducts
    });
    
    res.status(200).json({
      message: 'Bulk ingestion completed',
      summary: {
        totalProcessed: results.length,
        newProducts,
        updatedProducts,
        keywords
      },
      results
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    
    const result = await productService.getProductWithOffers(productId);
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
    const {
      q,
      category,
      brand,
      minPrice,
      maxPrice,
      limit = 20,
      offset = 0
    } = req.query;
    
    const result = await productService.searchProducts({
      q: q as string,
      category: category as string,
      brand: brand as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      limit: Math.min(parseInt(limit as string, 10), 100),
      offset: parseInt(offset as string, 10)
    });
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProductOffers(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    
    const result = await productService.getProductWithOffers(productId);
    if (!result) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Sort offers by price
    const sortedOffers = result.offers.sort((a, b) => a.current_price - b.current_price);
    
    res.status(200).json({
      productId: result.product.id,
      title: result.product.title,
      offers: sortedOffers
    });
  } catch (err) {
    next(err);
  }
}
