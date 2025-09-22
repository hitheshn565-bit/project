import { db } from '../config/db';
import { cacheService } from './cacheService';
import { logger } from '../utils/logger';

export class RecommendationService {
  
  async getColdStartRecommendations(userId: string, limit = 10): Promise<any[]> {
    try {
      // Get user interests
      const user = await db('users').where('id', userId).first();
      if (!user) return [];
      
      const interests = JSON.parse(user.declared_interests || '[]');
      
      // Get popular products in user's interest categories
      let query = db('products')
        .select('products.*', db.raw('COUNT(offers.id) as offer_count'))
        .leftJoin('offers', 'products.id', 'offers.product_id')
        .groupBy('products.id')
        .orderBy('offer_count', 'desc')
        .limit(limit);
      
      // Filter by interests if available
      if (interests.length > 0) {
        query = query.where(function() {
          for (const interest of interests) {
            this.orWhere('products.category', 'ilike', `%${interest}%`)
                .orWhere('products.title', 'ilike', `%${interest}%`);
          }
        });
      }
      
      const products = await query;
      
      return products.map(product => ({
        ...product,
        attributes: JSON.parse(product.attributes || '{}'),
        images: JSON.parse(product.images || '[]'),
        recommendation_score: parseFloat(product.offer_count) || 0
      }));
      
    } catch (error) {
      logger.error('Cold start recommendation error', { error, userId });
      return [];
    }
  }
  
  async getTrendingProducts(limit = 10): Promise<any[]> {
    try {
      const products = await db('products')
        .select('products.*', db.raw('MIN(offers.current_price) as best_price'))
        .join('offers', 'products.id', 'offers.product_id')
        .groupBy('products.id')
        .orderBy('best_price', 'asc')
        .limit(limit);
      
      return products.map(product => ({
        ...product,
        attributes: JSON.parse(product.attributes || '{}'),
        images: JSON.parse(product.images || '[]')
      }));
      
    } catch (error) {
      logger.error('Trending products error', { error });
      return [];
    }
  }
  
  async getSimilarProducts(productId: string, limit = 5): Promise<any[]> {
    try {
      const product = await db('products').where('id', productId).first();
      if (!product) return [];
      
      const similar = await db('products')
        .select('*')
        .where('id', '!=', productId)
        .where('brand', 'ilike', `%${product.brand}%`)
        .orWhere('category', 'ilike', `%${product.category}%`)
        .limit(limit);
      
      return similar.map(p => ({
        ...p,
        attributes: JSON.parse(p.attributes || '{}'),
        images: JSON.parse(p.images || '[]')
      }));
      
    } catch (error) {
      logger.error('Similar products error', { error, productId });
      return [];
    }
  }
}

export const recommendationService = new RecommendationService();
