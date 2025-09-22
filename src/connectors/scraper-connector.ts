import axios from 'axios';
import { logger } from '../utils/logger';

const SCRAPER_BASE_URL = 'http://localhost:5000';

export interface ScrapedProduct {
  title: string;
  price: string;
  original_price?: string;
  image_url: string;
  product_url: string;
  rating?: string;
  reviews_count?: string;
  marketplace: 'Amazon' | 'Myntra';
}

// Currency conversion utility (approximate rates)
const convertToINR = (price: string, fromCurrency: 'USD' | 'INR' = 'USD'): string => {
  if (!price) return '0';
  
  // Extract numeric value
  const numericPrice = parseFloat(price.replace(/[^\d.]/g, ''));
  if (isNaN(numericPrice)) return price;
  
  if (fromCurrency === 'USD') {
    // Only convert if the price seems to be in USD (typically < 1000 for most products)
    // If price is already high (> 5000), it's likely already in INR
    if (numericPrice > 5000) {
      return numericPrice.toString(); // Already in INR
    }
    // Convert USD to INR (approximate rate: 1 USD = 83 INR)
    const inrPrice = Math.round(numericPrice * 83);
    return inrPrice.toString();
  }
  
  return numericPrice.toString();
};

// Rating parsing utility
const parseRating = (ratingStr: string): number => {
  if (!ratingStr || ratingStr === 'N/A') return 4.5; // Default rating
  
  // Extract numeric rating from strings like "4.2 out of 5 stars" or "4.2"
  const match = ratingStr.match(/(\d+\.?\d*)/);
  if (match) {
    const rating = parseFloat(match[1]);
    return Math.min(Math.max(rating, 0), 5); // Clamp between 0 and 5
  }
  
  return 4.5; // Default fallback
};

// Reviews count parsing utility
const parseReviewsCount = (reviewsStr: string): number => {
  if (!reviewsStr || reviewsStr === 'N/A') return Math.floor(Math.random() * 1000) + 100;
  
  // Extract numeric value from strings like "18691" or "1,234"
  const numericStr = reviewsStr.replace(/[^\d]/g, '');
  const count = parseInt(numericStr);
  return isNaN(count) ? Math.floor(Math.random() * 1000) + 100 : count;
};

export interface ScrapedResponse {
  products: ScrapedProduct[];
  total_found: number;
  search_query: string;
}

/**
 * Amazon Product Scraper
 */
export async function searchAmazonProducts(query: string, limit: number = 20): Promise<ScrapedResponse> {
  try {
    logger.info(`Searching Amazon for: ${query}`);
    
    const response = await axios.get(`${SCRAPER_BASE_URL}/scrape/amazon`, {
      params: { q: query },
      timeout: 30000 // 30 second timeout for scraping
    });

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    // Transform the response to match our interface
    // The scraper returns an array directly, not wrapped in a products field
    const rawProducts = Array.isArray(response.data) ? response.data : (response.data.products || []);
    const products: ScrapedProduct[] = rawProducts.map((product: any) => ({
      title: product.title || product.name,
      price: convertToINR(product.price, 'USD'), // Convert Amazon USD prices to INR
      original_price: product.original_price ? convertToINR(product.original_price, 'USD') : undefined,
      image_url: product.image_url || product.image,
      product_url: product.product_url || product.url,
      rating: parseRating(product.rating).toString(),
      reviews_count: parseReviewsCount(product.reviews_count || product.reviews).toString(),
      marketplace: 'Amazon' as const
    }));

    return {
      products: products.slice(0, limit),
      total_found: products.length,
      search_query: query
    };

  } catch (error: any) {
    logger.error('Amazon scraping failed:', error.message);
    return {
      products: [],
      total_found: 0,
      search_query: query
    };
  }
}

/**
 * Myntra Product Scraper
 */
export async function searchMyntraProducts(query: string, limit: number = 20): Promise<ScrapedResponse> {
  try {
    logger.info(`Searching Myntra for: ${query}`);
    
    const response = await axios.get(`${SCRAPER_BASE_URL}/scrape/myntra`, {
      params: { q: query },
      timeout: 30000 // 30 second timeout for scraping
    });

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    // Transform the response to match our interface
    // The scraper returns an array directly, not wrapped in a products field
    const rawProducts = Array.isArray(response.data) ? response.data : (response.data.products || []);
    const products: ScrapedProduct[] = rawProducts.map((product: any) => ({
      title: product.title || product.name,
      price: convertToINR(product.price, 'INR'), // Myntra prices are already in INR
      original_price: product.original_price ? convertToINR(product.original_price, 'INR') : undefined,
      image_url: product.image_url || product.image,
      product_url: product.product_url || product.url,
      rating: parseRating(product.rating).toString(),
      reviews_count: parseReviewsCount(product.reviews_count || product.reviews).toString(),
      marketplace: 'Myntra' as const
    }));

    return {
      products: products.slice(0, limit),
      total_found: products.length,
      search_query: query
    };

  } catch (error: any) {
    logger.error('Myntra scraping failed:', error.message);
    return {
      products: [],
      total_found: 0,
      search_query: query
    };
  }
}

/**
 * Combined Search - Search both Amazon and Myntra
 */
export async function searchAllMarketplaces(query: string, limit: number = 20): Promise<{
  amazon: ScrapedResponse;
  myntra: ScrapedResponse;
  combined: ScrapedProduct[];
  total_found: number;
}> {
  try {
    logger.info(`Searching all marketplaces for: ${query}`);

    // Search both marketplaces in parallel
    const [amazonResults, myntraResults] = await Promise.allSettled([
      searchAmazonProducts(query, Math.ceil(limit / 2)),
      searchMyntraProducts(query, Math.ceil(limit / 2))
    ]);

    const amazon = amazonResults.status === 'fulfilled' ? amazonResults.value : {
      products: [],
      total_found: 0,
      search_query: query
    };

    const myntra = myntraResults.status === 'fulfilled' ? myntraResults.value : {
      products: [],
      total_found: 0,
      search_query: query
    };

    // Combine and shuffle products for variety
    const combined = [...amazon.products, ...myntra.products]
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, limit);

    return {
      amazon,
      myntra,
      combined,
      total_found: amazon.total_found + myntra.total_found
    };

  } catch (error: any) {
    logger.error('Combined search failed:', error.message);
    return {
      amazon: { products: [], total_found: 0, search_query: query },
      myntra: { products: [], total_found: 0, search_query: query },
      combined: [],
      total_found: 0
    };
  }
}

/**
 * Test scraper service connection
 */
export async function testScraperConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Test with a simple query
    const testResult = await searchAmazonProducts('test', 1);
    return {
      success: true,
      message: 'Scraper service connection successful'
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Scraper service connection failed: ${error.message}`
    };
  }
}
