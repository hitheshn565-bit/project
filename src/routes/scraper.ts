import { Router, Request, Response } from 'express';
import { 
  searchAmazonProducts, 
  searchMyntraProducts, 
  searchAllMarketplaces,
  testScraperConnection 
} from '../connectors/scraper-connector';
import { logger } from '../utils/logger';
import { redis } from '../config/redis';

const router = Router();

/**
 * Test scraper service connection
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    const result = await testScraperConnection();
    res.json(result);
  } catch (error: any) {
    logger.error('Scraper test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Scraper service test failed',
      error: error.message
    });
  }
});

/**
 * Search Amazon products
 */
router.get('/amazon/search', async (req: Request, res: Response) => {
  try {
    const { q: query, limit = 20 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required'
      });
    }

    // Check cache first
    const cacheKey = `amazon_search:${query}:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info(`Returning cached Amazon results for: ${query}`);
      return res.json(JSON.parse(cached));
    }

    const results = await searchAmazonProducts(query, parseInt(limit as string));
    
    // Cache results for 10 minutes
    await redis.setEx(cacheKey, 600, JSON.stringify(results));
    
    res.json(results);
  } catch (error: any) {
    logger.error('Amazon search failed:', error);
    res.status(500).json({
      error: 'Amazon search failed',
      message: error.message
    });
  }
});

/**
 * Search Myntra products
 */
router.get('/myntra/search', async (req: Request, res: Response) => {
  try {
    const { q: query, limit = 20 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required'
      });
    }

    // Check cache first
    const cacheKey = `myntra_search:${query}:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info(`Returning cached Myntra results for: ${query}`);
      return res.json(JSON.parse(cached));
    }

    const results = await searchMyntraProducts(query, parseInt(limit as string));
    
    // Cache results for 10 minutes
    await redis.setEx(cacheKey, 600, JSON.stringify(results));
    
    res.json(results);
  } catch (error: any) {
    logger.error('Myntra search failed:', error);
    res.status(500).json({
      error: 'Myntra search failed',
      message: error.message
    });
  }
});

/**
 * Search all marketplaces (Amazon + Myntra)
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q: query, limit = 20 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required'
      });
    }

    // Check cache first
    const cacheKey = `combined_search:${query}:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info(`Returning cached combined results for: ${query}`);
      return res.json(JSON.parse(cached));
    }

    const results = await searchAllMarketplaces(query, parseInt(limit as string));
    
    // Cache results for 5 minutes (shorter for combined results)
    await redis.setEx(cacheKey, 300, JSON.stringify(results));
    
    // Return in the format expected by frontend
    const response = {
      combined: results.combined,
      amazon: results.amazon,
      myntra: results.myntra,
      total_found: results.total_found,
      search_query: query
    };
    
    res.json(response);
  } catch (error: any) {
    logger.error('Combined search failed:', error);
    res.status(500).json({
      error: 'Combined search failed',
      message: error.message
    });
  }
});

/**
 * Get single product by ID (URL-based lookup)
 */
router.get('/product/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: 'Product ID is required'
      });
    }

    // Decode the product URL from the ID
    const productUrl = decodeURIComponent(id);
    
    // Check cache first
    const cacheKey = `product_detail:${productUrl}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info(`Returning cached product details for: ${productUrl}`);
      return res.json(JSON.parse(cached));
    }

    // For now, we'll extract search terms from the product title/URL and search
    // In a real implementation, you'd store products in DB and fetch by ID
    let searchQuery = 'product'; // Default fallback
    
    // Try to extract meaningful search terms from the URL
    if (productUrl.includes('amazon') || productUrl.includes('myntra')) {
      // Extract product name from URL or use a generic search
      const urlParts = productUrl.split('/');
      const productPart = urlParts.find(part => part.includes('-') && part.length > 10);
      if (productPart) {
        searchQuery = productPart.split('-').slice(0, 3).join(' ');
      }
    } else {
      // If it's our internal ID format, extract search terms
      searchQuery = productUrl.split('-').slice(0, 2).join(' ');
    }

    // Search for similar products
    const results = await searchAllMarketplaces(searchQuery, 1);
    
    if (results.combined.length > 0) {
      const product = results.combined[0];
      
      // Cache the result for 30 minutes
      await redis.setEx(cacheKey, 1800, JSON.stringify(product));
      
      res.json(product);
    } else {
      res.status(404).json({
        error: 'Product not found'
      });
    }
  } catch (error: any) {
    logger.error('Product detail fetch failed:', error);
    res.status(500).json({
      error: 'Failed to fetch product details',
      message: error.message
    });
  }
});

/**
 * Get trending products (mock implementation)
 */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    // For now, return popular search results
    const trendingQueries = ['laptop', 'smartphone', 'headphones', 'shoes'];
    const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];
    
    const results = await searchAllMarketplaces(randomQuery, 10);
    res.json(results.combined);
  } catch (error: any) {
    logger.error('Trending products failed:', error);
    res.status(500).json({
      error: 'Failed to fetch trending products',
      message: error.message
    });
  }
});

export default router;
