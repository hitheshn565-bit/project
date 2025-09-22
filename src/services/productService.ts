import { db } from '../config/db';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { EbayItem } from '../connectors/ebayConnector';

export interface CanonicalProduct {
  id: string;
  title: string;
  brand?: string;
  attributes: {
    model_no?: string;
    upc?: string;
    asin?: string;
    tags: string[];
    category?: string;
    condition?: string;
  };
  canonical_description?: string;
  images: string[];
  category?: string;
  avg_rating?: number;
  review_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductOffer {
  id: string;
  product_id: string;
  seller_name: string;
  seller_site: string;
  seller_site_id: string;
  current_price: number;
  currency: string;
  url: string;
  availability: string;
  shipping_info: any;
  rating?: number;
  review_count: number;
  last_checked_at?: string;
  created_at?: string;
  updated_at?: string;
}

export class ProductService {
  
  async normalizeEbayItem(ebayItem: EbayItem): Promise<{
    canonicalProduct: Partial<CanonicalProduct>;
    offer: Partial<ProductOffer>;
  }> {
    // Extract brand from title (simple heuristic)
    const brand = this.extractBrand(ebayItem.title);
    
    // Extract model/product attributes
    const attributes = {
      tags: this.extractTags(ebayItem.title),
      category: ebayItem.categories?.[0]?.categoryName,
      condition: ebayItem.condition,
      model_no: this.extractModelNumber(ebayItem.title),
    };

    // Create canonical product representation
    const canonicalProduct: Partial<CanonicalProduct> = {
      title: this.normalizeTitle(ebayItem.title),
      brand,
      attributes,
      canonical_description: ebayItem.shortDescription || ebayItem.title,
      images: ebayItem.image ? [ebayItem.image.imageUrl] : [],
      category: ebayItem.categories?.[0]?.categoryName,
      review_count: 0, // Will be populated from reviews
    };

    // Create offer representation
    const offer: Partial<ProductOffer> = {
      seller_name: ebayItem.seller?.username || 'Unknown',
      seller_site: 'ebay',
      seller_site_id: ebayItem.itemId,
      current_price: parseFloat(ebayItem.price.value),
      currency: ebayItem.price.currency,
      url: ebayItem.itemWebUrl,
      availability: 'available', // eBay items are generally available if listed
      shipping_info: {
        options: ebayItem.shippingOptions || [],
        location: ebayItem.itemLocation
      },
      rating: ebayItem.seller?.feedbackPercentage ? 
        parseFloat(ebayItem.seller.feedbackPercentage) / 20 : undefined, // Convert % to 5-star
      review_count: ebayItem.seller?.feedbackScore || 0,
    };

    return { canonicalProduct, offer };
  }

  private extractBrand(title: string): string | undefined {
    const commonBrands = [
      'Apple', 'Samsung', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI',
      'Microsoft', 'Google', 'Sony', 'LG', 'Huawei', 'OnePlus', 'Xiaomi',
      'Nintendo', 'PlayStation', 'Xbox', 'Canon', 'Nikon', 'GoPro'
    ];
    
    const titleUpper = title.toUpperCase();
    for (const brand of commonBrands) {
      if (titleUpper.includes(brand.toUpperCase())) {
        return brand;
      }
    }
    
    // Try to extract first word as potential brand
    const firstWord = title.split(' ')[0];
    if (firstWord && firstWord.length > 2 && /^[A-Za-z]+$/.test(firstWord)) {
      return firstWord;
    }
    
    return undefined;
  }

  private extractTags(title: string): string[] {
    const tags: string[] = [];
    const titleLower = title.toLowerCase();
    
    // Technology tags
    const techKeywords = [
      'laptop', 'desktop', 'tablet', 'smartphone', 'phone', 'computer',
      'gaming', 'business', 'professional', 'student', 'home',
      'wireless', 'bluetooth', 'wifi', 'usb', 'hdmi',
      'ssd', 'hdd', 'ram', 'memory', 'storage',
      'intel', 'amd', 'nvidia', 'core', 'ryzen',
      'new', 'used', 'refurbished', 'open box'
    ];
    
    for (const keyword of techKeywords) {
      if (titleLower.includes(keyword)) {
        tags.push(keyword);
      }
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private extractModelNumber(title: string): string | undefined {
    // Look for common model number patterns
    const modelPatterns = [
      /\b([A-Z]{2,4}[-\s]?\d{3,6}[A-Z]*)\b/i, // e.g., MB990LL, XPS-13
      /\b(\d{4}[A-Z]{1,3})\b/i, // e.g., 2023M1
      /\b([A-Z]\d+[A-Z]*)\b/i, // e.g., M1, M3
    ];
    
    for (const pattern of modelPatterns) {
      const match = title.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return undefined;
  }

  private normalizeTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
      .trim()
      .substring(0, 200); // Limit length
  }

  async findSimilarProducts(canonicalProduct: Partial<CanonicalProduct>): Promise<CanonicalProduct[]> {
    const { title, brand, attributes } = canonicalProduct;
    
    // Build similarity query - simplified for now
    let query = db('products').select('*');
    
    // Exact brand match gets highest priority
    if (brand) {
      query = query.where('brand', 'ilike', `%${brand}%`);
      
      // Add title similarity for same brand
      if (title) {
        query = query.where('title', 'ilike', `%${title.split(' ').slice(0, 3).join('%')}%`);
      }
    }
    
    // Model number exact match
    if (attributes?.model_no) {
      query = query.orWhereRaw(
        "attributes->>'model_no' = ?", 
        [attributes.model_no]
      );
    }
    
    const results = await query.limit(10);
    return results.map(product => ({
      ...product,
      attributes: typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images
    }));
  }

  async createOrUpdateProduct(
    ebayItem: EbayItem
  ): Promise<{ product: CanonicalProduct; offer: ProductOffer; isNew: boolean }> {
    try {
      logger.info('Normalizing eBay item', { itemId: ebayItem.itemId });
      const { canonicalProduct, offer } = await this.normalizeEbayItem(ebayItem);
      
      logger.info('Searching for similar products', { 
        title: canonicalProduct.title,
        brand: canonicalProduct.brand 
      });
      
      // Check for existing similar products
      const similarProducts = await this.findSimilarProducts(canonicalProduct);
      
      let product: CanonicalProduct;
      let isNew = false;
    
    if (similarProducts.length > 0) {
      // Use existing product (take the most similar one)
      product = similarProducts[0];
      logger.info('Found similar product', { 
        productId: product.id, 
        title: product.title,
        ebayTitle: ebayItem.title 
      });
      
      // Update product with any new information
      await this.updateProductFromOffer(product.id, canonicalProduct);
    } else {
      // Create new canonical product
      const productId = uuidv4();
      const [newProduct] = await db('products')
        .insert({
          id: productId,
          title: canonicalProduct.title,
          brand: canonicalProduct.brand,
          canonical_description: canonicalProduct.canonical_description,
          category: canonicalProduct.category,
          avg_rating: canonicalProduct.avg_rating,
          attributes: JSON.stringify(canonicalProduct.attributes || {}),
          images: JSON.stringify(canonicalProduct.images || []),
          review_count: 0
        })
        .returning('*');
      
      product = {
        ...newProduct,
        attributes: JSON.parse(newProduct.attributes || '{}'),
        images: JSON.parse(newProduct.images || '[]')
      };
      isNew = true;
      
      logger.info('Created new canonical product', { 
        productId: product.id, 
        title: product.title 
      });
    }
    
      // Create or update offer
      const productOffer = await this.createOrUpdateOffer(product.id, offer);
      
      return { product, offer: productOffer, isNew };
    } catch (error) {
      logger.error('Error in createOrUpdateProduct', { 
        error: error instanceof Error ? error.message : error,
        itemId: ebayItem.itemId 
      });
      throw error;
    }
  }

  private async updateProductFromOffer(
    productId: string, 
    canonicalProduct: Partial<CanonicalProduct>
  ): Promise<void> {
    // Update product with any new images or attributes
    const updates: any = {
      updated_at: db.fn.now()
    };
    
    if (canonicalProduct.images && canonicalProduct.images.length > 0) {
      // Merge new images with existing ones
      const existing = await db('products').select('images').where('id', productId).first();
      const existingImages = JSON.parse(existing?.images || '[]');
      const newImages = [...new Set([...existingImages, ...canonicalProduct.images])];
      updates.images = JSON.stringify(newImages);
    }
    
    if (Object.keys(updates).length > 1) { // More than just updated_at
      await db('products').where('id', productId).update(updates);
    }
  }

  private async createOrUpdateOffer(
    productId: string, 
    offer: Partial<ProductOffer>
  ): Promise<ProductOffer> {
    // Check if offer already exists for this seller_site_id
    const existingOffer = await db('offers')
      .where('seller_site', offer.seller_site)
      .where('seller_site_id', offer.seller_site_id)
      .first();
    
    if (existingOffer) {
      // Update existing offer
      const [updatedOffer] = await db('offers')
        .where('id', existingOffer.id)
        .update({
          seller_name: offer.seller_name,
          current_price: offer.current_price,
          currency: offer.currency,
          url: offer.url,
          availability: offer.availability,
          rating: offer.rating,
          review_count: offer.review_count,
          product_id: productId,
          shipping_info: JSON.stringify(offer.shipping_info || {}),
          last_checked_at: db.fn.now(),
          updated_at: db.fn.now()
        })
        .returning('*');
      
      logger.info('Updated existing offer', { 
        offerId: updatedOffer.id,
        productId,
        price: offer.current_price 
      });
      
      return {
        ...updatedOffer,
        shipping_info: JSON.parse(updatedOffer.shipping_info || '{}')
      };
    } else {
      // Create new offer
      const offerId = uuidv4();
      const [newOffer] = await db('offers')
        .insert({
          id: offerId,
          product_id: productId,
          seller_name: offer.seller_name,
          seller_site: offer.seller_site,
          seller_site_id: offer.seller_site_id,
          current_price: offer.current_price,
          currency: offer.currency,
          url: offer.url,
          availability: offer.availability,
          rating: offer.rating,
          review_count: offer.review_count,
          shipping_info: JSON.stringify(offer.shipping_info || {}),
          last_checked_at: db.fn.now()
        })
        .returning('*');
      
      logger.info('Created new offer', { 
        offerId: newOffer.id,
        productId,
        price: offer.current_price 
      });
      
      return {
        ...newOffer,
        shipping_info: JSON.parse(newOffer.shipping_info || '{}')
      };
    }
  }

  async getProductWithOffers(productId: string): Promise<{
    product: CanonicalProduct;
    offers: ProductOffer[];
  } | null> {
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

  async searchProducts(query: {
    q?: string;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  }): Promise<{
    products: CanonicalProduct[];
    total: number;
  }> {
    let dbQuery = db('products').select('products.*');
    let countQuery = db('products').count('* as count');
    
    // Text search
    if (query.q) {
      const searchCondition = `
        to_tsvector('english', title || ' ' || coalesce(brand, '') || ' ' || coalesce(canonical_description, '')) 
        @@ plainto_tsquery('english', ?)
      `;
      dbQuery = dbQuery.whereRaw(searchCondition, [query.q]);
      countQuery = countQuery.whereRaw(searchCondition, [query.q]);
    }
    
    // Category filter
    if (query.category) {
      dbQuery = dbQuery.where('category', 'ilike', `%${query.category}%`);
      countQuery = countQuery.where('category', 'ilike', `%${query.category}%`);
    }
    
    // Brand filter
    if (query.brand) {
      dbQuery = dbQuery.where('brand', 'ilike', `%${query.brand}%`);
      countQuery = countQuery.where('brand', 'ilike', `%${query.brand}%`);
    }
    
    // Price range filter (join with offers)
    if (query.minPrice || query.maxPrice) {
      dbQuery = dbQuery.join('offers', 'products.id', 'offers.product_id');
      countQuery = countQuery.join('offers', 'products.id', 'offers.product_id');
      
      if (query.minPrice) {
        dbQuery = dbQuery.where('offers.current_price', '>=', query.minPrice);
        countQuery = countQuery.where('offers.current_price', '>=', query.minPrice);
      }
      if (query.maxPrice) {
        dbQuery = dbQuery.where('offers.current_price', '<=', query.maxPrice);
        countQuery = countQuery.where('offers.current_price', '<=', query.maxPrice);
      }
      
      dbQuery = dbQuery.groupBy('products.id');
    }
    
    // Get total count
    const [{ count }] = await countQuery;
    const total = parseInt(count as string, 10);
    
    // Apply pagination and ordering
    const products = await dbQuery
      .orderBy('products.created_at', 'desc')
      .limit(query.limit || 20)
      .offset(query.offset || 0);
    
    return {
      products: products.map(product => ({
        ...product,
        attributes: JSON.parse(product.attributes || '{}'),
        images: JSON.parse(product.images || '[]')
      })),
      total
    };
  }
}

export const productService = new ProductService();
