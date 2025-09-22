import { redis } from '../config/redis';
import { logger } from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class CacheService {
  private defaultTTL = 3600; // 1 hour
  
  async get<T>(key: string, prefix = ''): Promise<T | null> {
    try {
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const cached = await redis.get(fullKey);
      
      if (cached) {
        logger.debug('Cache hit', { key: fullKey });
        return JSON.parse(cached);
      }
      
      logger.debug('Cache miss', { key: fullKey });
      return null;
    } catch (error) {
      logger.error('Cache get error', {
        error: error instanceof Error ? error.message : error,
        key
      });
      return null; // Fail gracefully
    }
  }
  
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const { ttl = this.defaultTTL, prefix = '' } = options;
      const fullKey = prefix ? `${prefix}:${key}` : key;
      
      await redis.setex(fullKey, ttl, JSON.stringify(value));
      
      logger.debug('Cache set', { key: fullKey, ttl });
    } catch (error) {
      logger.error('Cache set error', {
        error: error instanceof Error ? error.message : error,
        key
      });
      // Don't throw - caching should not break the application
    }
  }
  
  async del(key: string, prefix = ''): Promise<void> {
    try {
      const fullKey = prefix ? `${prefix}:${key}` : key;
      await redis.del(fullKey);
      
      logger.debug('Cache delete', { key: fullKey });
    } catch (error) {
      logger.error('Cache delete error', {
        error: error instanceof Error ? error.message : error,
        key
      });
    }
  }
  
  async exists(key: string, prefix = ''): Promise<boolean> {
    try {
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const result = await redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', {
        error: error instanceof Error ? error.message : error,
        key
      });
      return false;
    }
  }
  
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        const deleted = await redis.del(...keys);
        logger.info('Cache pattern invalidated', { pattern, deleted });
        return deleted;
      }
      return 0;
    } catch (error) {
      logger.error('Cache pattern invalidation error', {
        error: error instanceof Error ? error.message : error,
        pattern
      });
      return 0;
    }
  }
  
  // Product-specific caching methods
  async cacheProduct(productId: string, productData: any, ttl = 3600): Promise<void> {
    await this.set(productId, productData, { ttl, prefix: 'product' });
  }
  
  async getCachedProduct(productId: string): Promise<any | null> {
    return this.get(productId, 'product');
  }
  
  async invalidateProduct(productId: string): Promise<void> {
    await this.del(productId, 'product');
    // Also invalidate related caches
    await this.invalidatePattern(`search:*:${productId}*`);
    await this.invalidatePattern(`offers:${productId}*`);
  }
  
  // Search result caching
  async cacheSearchResults(query: string, filters: any, results: any, ttl = 1800): Promise<void> {
    const searchKey = this.generateSearchKey(query, filters);
    await this.set(searchKey, results, { ttl, prefix: 'search' });
  }
  
  async getCachedSearchResults(query: string, filters: any): Promise<any | null> {
    const searchKey = this.generateSearchKey(query, filters);
    return this.get(searchKey, 'search');
  }
  
  private generateSearchKey(query: string, filters: any): string {
    const filterStr = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    
    return `${query}:${filterStr}`.replace(/[^a-zA-Z0-9:|-]/g, '_');
  }
  
  // Offer caching
  async cacheProductOffers(productId: string, offers: any, ttl = 1800): Promise<void> {
    await this.set(productId, offers, { ttl, prefix: 'offers' });
  }
  
  async getCachedProductOffers(productId: string): Promise<any | null> {
    return this.get(productId, 'offers');
  }
  
  // Price history caching
  async cachePriceHistory(offerId: string, history: any, ttl = 3600): Promise<void> {
    await this.set(offerId, history, { ttl, prefix: 'price_history' });
  }
  
  async getCachedPriceHistory(offerId: string): Promise<any | null> {
    return this.get(offerId, 'price_history');
  }
  
  // Popular products tracking
  async incrementProductView(productId: string): Promise<number> {
    try {
      const key = `views:${productId}`;
      const views = await redis.incr(key);
      
      // Set expiry for view counter (24 hours)
      if (views === 1) {
        await redis.expire(key, 86400);
      }
      
      // Add to popular products sorted set
      await redis.zadd('popular_products', views, productId);
      
      return views;
    } catch (error) {
      logger.error('Error incrementing product view', {
        error: error instanceof Error ? error.message : error,
        productId
      });
      return 0;
    }
  }
  
  async getPopularProducts(limit = 10): Promise<string[]> {
    try {
      // Get top products by view count (descending order)
      return await redis.zrevrange('popular_products', 0, limit - 1);
    } catch (error) {
      logger.error('Error getting popular products', {
        error: error instanceof Error ? error.message : error
      });
      return [];
    }
  }
  
  // Cache warming methods
  async warmProductCache(productIds: string[]): Promise<void> {
    logger.info('Starting cache warming', { count: productIds.length });
    
    // This would typically fetch from database and cache
    // Implementation depends on your product service
    for (const productId of productIds) {
      try {
        // Placeholder - would fetch product data and cache it
        logger.debug('Warming cache for product', { productId });
      } catch (error) {
        logger.error('Error warming cache for product', {
          productId,
          error: error instanceof Error ? error.message : error
        });
      }
    }
  }
  
  // Cache statistics
  async getCacheStats(): Promise<{
    redis_info: any;
    cache_keys: {
      products: number;
      searches: number;
      offers: number;
      price_history: number;
    };
  }> {
    try {
      const info = await redis.info('memory');
      
      const [productKeys, searchKeys, offerKeys, priceHistoryKeys] = await Promise.all([
        redis.keys('product:*'),
        redis.keys('search:*'),
        redis.keys('offers:*'),
        redis.keys('price_history:*')
      ]);
      
      return {
        redis_info: this.parseRedisInfo(info),
        cache_keys: {
          products: productKeys.length,
          searches: searchKeys.length,
          offers: offerKeys.length,
          price_history: priceHistoryKeys.length
        }
      };
    } catch (error) {
      logger.error('Error getting cache stats', {
        error: error instanceof Error ? error.message : error
      });
      return {
        redis_info: {},
        cache_keys: { products: 0, searches: 0, offers: 0, price_history: 0 }
      };
    }
  }
  
  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const parsed: any = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        parsed[key] = value;
      }
    }
    
    return parsed;
  }
}

export const cacheService = new CacheService();
