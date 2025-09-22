import { db } from '../config/db';
import { logger } from '../utils/logger';

export interface PriceSnapshot {
  id: number;
  offer_id: string;
  timestamp: string;
  price: number;
  currency: string;
}

export interface PriceHistory {
  offer_id: string;
  current_price: number;
  price_history: Array<{
    timestamp: string;
    price: number;
    change_percent?: number;
  }>;
  price_stats: {
    min_price: number;
    max_price: number;
    avg_price: number;
    price_trend: 'up' | 'down' | 'stable';
    last_change_percent: number;
  };
}

export class PriceHistoryService {
  
  async recordPriceSnapshot(offerId: string, price: number, currency: string): Promise<void> {
    try {
      // Get the current offer to check if price changed
      const currentOffer = await db('offers').where('id', offerId).first();
      
      if (!currentOffer) {
        logger.warn('Offer not found for price snapshot', { offerId });
        return;
      }
      
      const currentPrice = parseFloat(currentOffer.current_price);
      const newPrice = parseFloat(price.toString());
      
      // Only record if price has changed
      if (Math.abs(currentPrice - newPrice) > 0.01) {
        await db('price_snapshots').insert({
          offer_id: offerId,
          timestamp: db.fn.now(),
          price: newPrice,
          currency: currency
        });
        
        // Update current price in offers table
        await db('offers')
          .where('id', offerId)
          .update({
            current_price: newPrice,
            last_checked_at: db.fn.now(),
            updated_at: db.fn.now()
          });
        
        logger.info('Price snapshot recorded', {
          offerId,
          oldPrice: currentPrice,
          newPrice,
          changePercent: ((newPrice - currentPrice) / currentPrice * 100).toFixed(2)
        });
      } else {
        // Update last_checked_at even if price didn't change
        await db('offers')
          .where('id', offerId)
          .update({ last_checked_at: db.fn.now() });
      }
    } catch (error) {
      logger.error('Failed to record price snapshot', {
        error: error instanceof Error ? error.message : error,
        offerId,
        price
      });
      throw error;
    }
  }
  
  async getPriceHistory(offerId: string, days = 7): Promise<PriceHistory | null> {
    try {
      // Get current offer
      const offer = await db('offers').where('id', offerId).first();
      if (!offer) return null;
      
      // Get price snapshots for the last N days
      const snapshots = await db('price_snapshots')
        .where('offer_id', offerId)
        .where('timestamp', '>=', db.raw(`NOW() - INTERVAL '${days} days'`))
        .orderBy('timestamp', 'asc');
      
      if (snapshots.length === 0) {
        return {
          offer_id: offerId,
          current_price: parseFloat(offer.current_price),
          price_history: [],
          price_stats: {
            min_price: parseFloat(offer.current_price),
            max_price: parseFloat(offer.current_price),
            avg_price: parseFloat(offer.current_price),
            price_trend: 'stable',
            last_change_percent: 0
          }
        };
      }
      
      // Calculate price history with change percentages
      const priceHistory = snapshots.map((snapshot, index) => {
        const price = parseFloat(snapshot.price);
        let changePercent = 0;
        
        if (index > 0) {
          const prevPrice = parseFloat(snapshots[index - 1].price);
          changePercent = ((price - prevPrice) / prevPrice) * 100;
        }
        
        return {
          timestamp: snapshot.timestamp,
          price,
          change_percent: changePercent
        };
      });
      
      // Calculate statistics
      const prices = snapshots.map(s => parseFloat(s.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      // Determine trend
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const lastChangePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
      
      let priceTrend: 'up' | 'down' | 'stable' = 'stable';
      if (lastChangePercent > 2) priceTrend = 'up';
      else if (lastChangePercent < -2) priceTrend = 'down';
      
      return {
        offer_id: offerId,
        current_price: parseFloat(offer.current_price),
        price_history: priceHistory,
        price_stats: {
          min_price: minPrice,
          max_price: maxPrice,
          avg_price: parseFloat(avgPrice.toFixed(2)),
          price_trend: priceTrend,
          last_change_percent: parseFloat(lastChangePercent.toFixed(2))
        }
      };
      
    } catch (error) {
      logger.error('Failed to get price history', {
        error: error instanceof Error ? error.message : error,
        offerId
      });
      throw error;
    }
  }
  
  async getProductPriceHistory(productId: string, days = 7): Promise<{
    product_id: string;
    offers_with_history: Array<PriceHistory & { seller_name: string; seller_site: string; }>;
    best_price: { current: number; historical: number; };
  } | null> {
    try {
      // Get all offers for the product
      const offers = await db('offers').where('product_id', productId);
      
      if (offers.length === 0) return null;
      
      const offersWithHistory = [];
      let currentBestPrice = Infinity;
      let historicalBestPrice = Infinity;
      
      for (const offer of offers) {
        const history = await this.getPriceHistory(offer.id, days);
        if (history) {
          offersWithHistory.push({
            ...history,
            seller_name: offer.seller_name,
            seller_site: offer.seller_site
          });
          
          // Track best prices
          currentBestPrice = Math.min(currentBestPrice, history.current_price);
          historicalBestPrice = Math.min(historicalBestPrice, history.price_stats.min_price);
        }
      }
      
      return {
        product_id: productId,
        offers_with_history: offersWithHistory,
        best_price: {
          current: currentBestPrice === Infinity ? 0 : currentBestPrice,
          historical: historicalBestPrice === Infinity ? 0 : historicalBestPrice
        }
      };
      
    } catch (error) {
      logger.error('Failed to get product price history', {
        error: error instanceof Error ? error.message : error,
        productId
      });
      throw error;
    }
  }
  
  async getPriceAlerts(userId: string): Promise<Array<{
    product_id: string;
    product_title: string;
    target_price: number;
    current_best_price: number;
    alert_triggered: boolean;
  }>> {
    try {
      // This would integrate with a user preferences system
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      logger.error('Failed to get price alerts', {
        error: error instanceof Error ? error.message : error,
        userId
      });
      throw error;
    }
  }
  
  async bulkUpdatePrices(offers: Array<{ id: string; price: number; currency: string }>): Promise<{
    updated: number;
    errors: number;
  }> {
    let updated = 0;
    let errors = 0;
    
    for (const offer of offers) {
      try {
        await this.recordPriceSnapshot(offer.id, offer.price, offer.currency);
        updated++;
      } catch (error) {
        errors++;
        logger.error('Failed to update price in bulk', {
          offerId: offer.id,
          error: error instanceof Error ? error.message : error
        });
      }
    }
    
    logger.info('Bulk price update completed', { updated, errors, total: offers.length });
    
    return { updated, errors };
  }
  
  async getMarketTrends(category?: string, days = 30): Promise<{
    category?: string;
    total_products: number;
    price_trends: {
      increasing: number;
      decreasing: number;
      stable: number;
    };
    avg_price_change: number;
  }> {
    try {
      let query = db('offers')
        .join('products', 'offers.product_id', 'products.id')
        .join('price_snapshots', 'offers.id', 'price_snapshots.offer_id')
        .where('price_snapshots.timestamp', '>=', db.raw(`NOW() - INTERVAL '${days} days'`));
      
      if (category) {
        query = query.where('products.category', 'ilike', `%${category}%`);
      }
      
      const results = await query
        .select('offers.id', 'offers.current_price', 'price_snapshots.price', 'price_snapshots.timestamp')
        .orderBy('price_snapshots.timestamp', 'desc');
      
      // Process results to calculate trends
      const offerTrends = new Map();
      
      results.forEach(row => {
        if (!offerTrends.has(row.id)) {
          offerTrends.set(row.id, {
            current: parseFloat(row.current_price),
            first: parseFloat(row.price),
            prices: []
          });
        }
        offerTrends.get(row.id).prices.push(parseFloat(row.price));
      });
      
      let increasing = 0;
      let decreasing = 0;
      let stable = 0;
      let totalChange = 0;
      
      offerTrends.forEach(trend => {
        const changePercent = ((trend.current - trend.first) / trend.first) * 100;
        totalChange += changePercent;
        
        if (changePercent > 2) increasing++;
        else if (changePercent < -2) decreasing++;
        else stable++;
      });
      
      return {
        category,
        total_products: offerTrends.size,
        price_trends: { increasing, decreasing, stable },
        avg_price_change: parseFloat((totalChange / offerTrends.size).toFixed(2))
      };
      
    } catch (error) {
      logger.error('Failed to get market trends', {
        error: error instanceof Error ? error.message : error,
        category
      });
      throw error;
    }
  }
}

export const priceHistoryService = new PriceHistoryService();
