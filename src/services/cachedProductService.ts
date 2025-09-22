import { cacheService } from './cacheService';
import { simpleProductService } from './simpleProductService';
import { priceHistoryService } from './priceHistoryService';
import { logger } from '../utils/logger';

export class CachedProductService {
  
  async getProductWithOffers(productId: string, useCache = true) {
    if (useCache) {
      // Try to get from cache first
      const cached = await cacheService.getCachedProduct(productId);
      if (cached) {
        // Increment view count
        await cacheService.incrementProductView(productId);
        return cached;
      }
    }
    
    // Cache miss - get from database
    const product = await simpleProductService.getProductWithOffers(productId);
    
    if (product && useCache) {
      // Cache the result
      await cacheService.cacheProduct(productId, product);
      // Increment view count
      await cacheService.incrementProductView(productId);
    }
    
    return product;
  }
  
  async searchProducts(query: string, filters: any = {}, useCache = true) {
    const cacheKey = { query, ...filters };
    
    if (useCache) {
      // Try to get from cache first
      const cached = await cacheService.getCachedSearchResults(query, filters);
      if (cached) {
        logger.debug('Search cache hit', { query, filters });
        return cached;
      }
    }
    
    // Cache miss - search database
    const results = await simpleProductService.searchProducts(query, filters.limit || 20);
    
    if (useCache && results.length > 0) {
      // Cache the search results
      await cacheService.cacheSearchResults(query, filters, results, 1800); // 30 minutes
      logger.debug('Search results cached', { query, count: results.length });
    }
    
    return results;
  }
  
  async getProductOffers(productId: string, useCache = true) {
    if (useCache) {
      // Try to get from cache first
      const cached = await cacheService.getCachedProductOffers(productId);
      if (cached) {
        return cached;
      }
    }
    
    // Cache miss - get from database
    const product = await simpleProductService.getProductWithOffers(productId);
    
    if (product && useCache) {
      // Cache just the offers
      await cacheService.cacheProductOffers(productId, product.offers);
    }
    
    return product?.offers || [];
  }
  
  async getPriceHistory(offerId: string, days = 7, useCache = true) {
    if (useCache) {
      // Try to get from cache first
      const cached = await cacheService.getCachedPriceHistory(offerId);
      if (cached) {
        return cached;
      }
    }
    
    // Cache miss - get from database
    const history = await priceHistoryService.getPriceHistory(offerId, days);
    
    if (history && useCache) {
      // Cache the price history
      await cacheService.cachePriceHistory(offerId, history);
    }
    
    return history;
  }
  
  async getPopularProducts(limit = 10) {
    const popularProductIds = await cacheService.getPopularProducts(limit);
    
    const products = [];
    for (const productId of popularProductIds) {
      const product = await this.getProductWithOffers(productId, true);
      if (product) {
        products.push(product);
      }
    }
    
    return products;
  }
  
  async invalidateProductCache(productId: string) {
    await cacheService.invalidateProduct(productId);
    logger.info('Product cache invalidated', { productId });
  }
  
  async warmCache(productIds: string[]) {
    logger.info('Starting cache warming', { count: productIds.length });
    
    for (const productId of productIds) {
      try {
        // Force cache refresh
        await this.getProductWithOffers(productId, false);
        await this.getProductWithOffers(productId, true); // This will cache it
        
        logger.debug('Cache warmed for product', { productId });
      } catch (error) {
        logger.error('Error warming cache for product', {
          productId,
          error: error instanceof Error ? error.message : error
        });
      }
    }
    
    logger.info('Cache warming completed');
  }
  
  async getCacheStats() {
    return cacheService.getCacheStats();
  }
}

export const cachedProductService = new CachedProductService();
