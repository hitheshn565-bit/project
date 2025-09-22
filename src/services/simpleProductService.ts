import { db } from '../config/db';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { EbayItem } from '../connectors/ebayConnector';

export class SimpleProductService {
  
  async createProductFromEbay(ebayItem: EbayItem): Promise<{
    productId: string;
    offerId: string;
    title: string;
    price: number;
  }> {
    try {
      const productId = uuidv4();
      const offerId = uuidv4();
      
      // Extract basic information
      const title = ebayItem.title.substring(0, 200);
      const brand = this.extractBrand(ebayItem.title);
      const price = parseFloat(ebayItem.price.value);
      const category = ebayItem.categories?.[0]?.categoryName || 'Electronics';
      
      // Create product
      await db('products').insert({
        id: productId,
        title: title,
        brand: brand,
        canonical_description: title,
        category: category,
        attributes: JSON.stringify({
          condition: ebayItem.condition,
          source: 'ebay',
          tags: this.extractTags(title)
        }),
        images: JSON.stringify(ebayItem.image ? [ebayItem.image.imageUrl] : []),
        review_count: 0
      });
      
      // Create offer
      await db('offers').insert({
        id: offerId,
        product_id: productId,
        seller_name: ebayItem.seller?.username || 'Unknown',
        seller_site: 'ebay',
        seller_site_id: ebayItem.itemId,
        current_price: price,
        currency: ebayItem.price.currency,
        url: ebayItem.itemWebUrl,
        availability: 'available',
        shipping_info: JSON.stringify({
          options: ebayItem.shippingOptions || [],
          location: ebayItem.itemLocation
        }),
        rating: ebayItem.seller?.feedbackPercentage ? 
          parseFloat(ebayItem.seller.feedbackPercentage) / 20 : null,
        review_count: ebayItem.seller?.feedbackScore || 0,
        last_checked_at: db.fn.now()
      });
      
      logger.info('Simple product created', {
        productId,
        offerId,
        title,
        price,
        brand
      });
      
      return { productId, offerId, title, price };
      
    } catch (error) {
      logger.error('Failed to create simple product', {
        error: error instanceof Error ? error.message : error,
        itemId: ebayItem.itemId
      });
      throw error;
    }
  }
  
  private extractBrand(title: string): string | undefined {
    const commonBrands = [
      'Apple', 'Samsung', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI',
      'Microsoft', 'Google', 'Sony', 'LG'
    ];
    
    const titleUpper = title.toUpperCase();
    for (const brand of commonBrands) {
      if (titleUpper.includes(brand.toUpperCase())) {
        return brand;
      }
    }
    
    // Try first word
    const firstWord = title.split(' ')[0];
    if (firstWord && firstWord.length > 2) {
      return firstWord;
    }
    
    return undefined;
  }
  
  private extractTags(title: string): string[] {
    const tags: string[] = [];
    const titleLower = title.toLowerCase();
    
    const keywords = [
      'laptop', 'desktop', 'tablet', 'phone', 'computer',
      'gaming', 'business', 'new', 'used', 'refurbished'
    ];
    
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        tags.push(keyword);
      }
    }
    
    return tags;
  }
  
  async getProductWithOffers(productId: string) {
    const product = await db('products').where('id', productId).first();
    if (!product) return null;
    
    const offers = await db('offers').where('product_id', productId);
    
    return {
      product: {
        ...product,
        attributes: JSON.parse(product.attributes || '{}'),
        images: JSON.parse(product.images || '[]')
      },
      offers: offers.map(offer => ({
        ...offer,
        shipping_info: JSON.parse(offer.shipping_info || '{}')
      }))
    };
  }
  
  async searchProducts(query: string, limit = 20) {
    const products = await db('products')
      .select('products.*')
      .where('title', 'ilike', `%${query}%`)
      .orWhere('brand', 'ilike', `%${query}%`)
      .limit(limit);
    
    return products.map(product => ({
      ...product,
      attributes: JSON.parse(product.attributes || '{}'),
      images: JSON.parse(product.images || '[]')
    }));
  }
}

export const simpleProductService = new SimpleProductService();
