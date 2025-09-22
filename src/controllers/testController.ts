import { Request, Response, NextFunction } from 'express';
import { ebayConnector } from '../connectors/ebayConnector';
import { db } from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export async function testProductIngestion(req: Request, res: Response, next: NextFunction) {
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
    
    // Simple product creation without similarity search
    const productId = uuidv4();
    const offerId = uuidv4();
    
    // Extract basic info
    const brand = ebayItem.title.split(' ')[0]; // Simple brand extraction
    const price = parseFloat(ebayItem.price.value);
    
    // Create product
    const [product] = await db('products').insert({
      id: productId,
      title: ebayItem.title,
      brand: brand,
      canonical_description: ebayItem.title,
      category: ebayItem.categories?.[0]?.categoryName || 'Electronics',
      attributes: JSON.stringify({
        condition: ebayItem.condition,
        tags: ['laptop', 'computer']
      }),
      images: JSON.stringify(ebayItem.image ? [ebayItem.image.imageUrl] : []),
      review_count: 0
    }).returning('*');
    
    // Create offer
    const [offer] = await db('offers').insert({
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
        options: ebayItem.shippingOptions || []
      }),
      review_count: ebayItem.seller?.feedbackScore || 0,
      last_checked_at: db.fn.now()
    }).returning('*');
    
    logger.info('Test product ingestion successful', {
      productId: product.id,
      offerId: offer.id,
      title: product.title
    });
    
    res.status(201).json({
      message: 'Test product created successfully',
      product: {
        ...product,
        attributes: JSON.parse(product.attributes),
        images: JSON.parse(product.images)
      },
      offer: {
        ...offer,
        shipping_info: JSON.parse(offer.shipping_info)
      }
    });
    
  } catch (err) {
    logger.error('Test product ingestion failed', { 
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined
    });
    next(err);
  }
}
