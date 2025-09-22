import { logger } from '../utils/logger';
import { redis } from '../config/redis';
import { searchAllMarketplaces } from '../connectors/scraper-connector';

export interface UserInterest {
  category: string;
  interest_level: number; // 1-10 scale
}

export interface UserInteraction {
  product_id: string;
  interaction_type: 'view' | 'search' | 'wishlist' | 'purchase';
  marketplace: string;
  category?: string;
  price?: number;
  timestamp: Date;
}

export interface RecommendationItem {
  product: any;
  score: number;
  reason: string;
  algorithm: 'cold_start' | 'behavioral' | 'trending' | 'similar';
}

/**
 * Cold-Start Recommendations for New Users
 * Based on interests provided during signup
 */
export async function getColdStartRecommendations(
  userId: string,
  interests: UserInterest[],
  limit: number = 20
): Promise<RecommendationItem[]> {
  try {
    logger.info(`Generating cold-start recommendations for user ${userId}`);
    
    // Check cache first
    const cacheKey = `recommendations:cold_start:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const recommendations: RecommendationItem[] = [];
    
    // Category mapping for interests
    const categoryQueries: Record<string, string[]> = {
      'Electronics': ['laptop', 'smartphone', 'headphones', 'tablet'],
      'Fashion': ['shirt', 'dress', 'shoes', 'jacket'],
      'Sports': ['running shoes', 'fitness tracker', 'sports equipment'],
      'Home & Garden': ['furniture', 'home decor', 'kitchen appliances'],
      'Books': ['books', 'ebooks', 'educational books'],
      'Automotive': ['car accessories', 'automotive parts']
    };

    for (const interest of interests) {
      const queries = categoryQueries[interest.category] || [interest.category.toLowerCase()];
      
      for (const query of queries) {
        try {
          const searchResults = await searchAllMarketplaces(query, 5);
          
          for (const product of searchResults.combined) {
            const popularityScore = calculatePopularityScore(product);
            const finalScore = popularityScore * (interest.interest_level / 10);
            
            recommendations.push({
              product,
              score: finalScore,
              reason: `Popular in ${interest.category}`,
              algorithm: 'cold_start'
            });
          }
        } catch (error) {
          logger.error(`Failed to get recommendations for query: ${query}`, error);
        }
      }
    }

    // Sort by score and remove duplicates
    const uniqueRecs = removeDuplicateProducts(recommendations);
    const sortedRecs = uniqueRecs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache for 6 hours
    await redis.setEx(cacheKey, 21600, JSON.stringify(sortedRecs));
    
    return sortedRecs;
  } catch (error) {
    logger.error('Cold-start recommendations failed:', error);
    return [];
  }
}

/**
 * Behavioral Recommendations for Existing Users
 * Based on user interaction history
 */
export async function getBehavioralRecommendations(
  userId: string,
  interactions: UserInteraction[],
  limit: number = 20
): Promise<RecommendationItem[]> {
  try {
    logger.info(`Generating behavioral recommendations for user ${userId}`);
    
    const cacheKey = `recommendations:behavioral:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Extract user preferences from interactions
    const preferences = extractUserPreferences(interactions);
    const recommendations: RecommendationItem[] = [];

    // Content-based recommendations
    for (const [category, weight] of Object.entries(preferences.categories)) {
      try {
        const searchResults = await searchAllMarketplaces(category, 5);
        
        for (const product of searchResults.combined) {
          const contentScore = calculateContentScore(product, preferences);
          const finalScore = contentScore * weight;
          
          recommendations.push({
            product,
            score: finalScore,
            reason: `Based on your ${category} interests`,
            algorithm: 'behavioral'
          });
        }
      } catch (error) {
        logger.error(`Failed to get behavioral recommendations for category: ${category}`, error);
      }
    }

    // Sort and deduplicate
    const uniqueRecs = removeDuplicateProducts(recommendations);
    const sortedRecs = uniqueRecs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache for 2 hours
    await redis.setEx(cacheKey, 7200, JSON.stringify(sortedRecs));
    
    return sortedRecs;
  } catch (error) {
    logger.error('Behavioral recommendations failed:', error);
    return [];
  }
}

/**
 * Trending Recommendations
 * Popular products across all categories
 */
export async function getTrendingRecommendations(limit: number = 20): Promise<RecommendationItem[]> {
  try {
    const cacheKey = 'recommendations:trending';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const trendingQueries = ['laptop', 'smartphone', 'shoes', 'headphones', 'watch'];
    const recommendations: RecommendationItem[] = [];

    for (const query of trendingQueries) {
      try {
        const searchResults = await searchAllMarketplaces(query, 4);
        
        for (const product of searchResults.combined) {
          const trendingScore = calculateTrendingScore(product);
          
          recommendations.push({
            product,
            score: trendingScore,
            reason: 'Trending now',
            algorithm: 'trending'
          });
        }
      } catch (error) {
        logger.error(`Failed to get trending recommendations for query: ${query}`, error);
      }
    }

    // Sort and deduplicate
    const uniqueRecs = removeDuplicateProducts(recommendations);
    const sortedRecs = uniqueRecs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache for 30 minutes
    await redis.setEx(cacheKey, 1800, JSON.stringify(sortedRecs));
    
    return sortedRecs;
  } catch (error) {
    logger.error('Trending recommendations failed:', error);
    return [];
  }
}

/**
 * Similar Product Recommendations
 * Products similar to a given product
 */
export async function getSimilarProductRecommendations(
  productTitle: string,
  limit: number = 10
): Promise<RecommendationItem[]> {
  try {
    // Extract key terms from product title for similarity search
    const searchTerms = extractSearchTerms(productTitle);
    const searchQuery = searchTerms.slice(0, 3).join(' '); // Use top 3 terms
    
    const cacheKey = `recommendations:similar:${searchQuery}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const searchResults = await searchAllMarketplaces(searchQuery, limit * 2);
    const recommendations: RecommendationItem[] = [];

    for (const product of searchResults.combined) {
      // Skip if it's the same product
      if (product.title.toLowerCase().includes(productTitle.toLowerCase().slice(0, 20))) {
        continue;
      }

      const similarityScore = calculateSimilarityScore(productTitle, product.title);
      
      recommendations.push({
        product,
        score: similarityScore,
        reason: 'Similar products',
        algorithm: 'similar'
      });
    }

    const sortedRecs = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache for 1 hour
    await redis.setEx(cacheKey, 3600, JSON.stringify(sortedRecs));
    
    return sortedRecs;
  } catch (error) {
    logger.error('Similar product recommendations failed:', error);
    return [];
  }
}

// Helper Functions

function calculatePopularityScore(product: any): number {
  const rating = parseFloat(product.rating) || 4.0;
  const reviewCount = parseInt(product.reviews_count) || 0;
  const price = parseFloat(product.price) || 0;

  // Normalize scores (0-1 range)
  const ratingScore = (rating / 5.0) * 0.4;
  const reviewScore = Math.min(reviewCount / 1000, 1.0) * 0.3;
  const priceScore = price > 0 ? Math.min(10000 / price, 1.0) * 0.3 : 0; // Lower price = higher score

  return ratingScore + reviewScore + priceScore;
}

function calculateContentScore(product: any, preferences: any): number {
  const popularityScore = calculatePopularityScore(product);
  
  // Boost score if product matches user's preferred price range
  let priceBoost = 1.0;
  const productPrice = parseFloat(product.price) || 0;
  if (preferences.avgPrice && productPrice > 0) {
    const priceDiff = Math.abs(productPrice - preferences.avgPrice) / preferences.avgPrice;
    priceBoost = Math.max(0.5, 1.0 - priceDiff); // Reduce score if price is very different
  }

  return popularityScore * priceBoost;
}

function calculateTrendingScore(product: any): number {
  const popularityScore = calculatePopularityScore(product);
  const recencyBoost = 1.2; // Boost for trending items
  
  return popularityScore * recencyBoost;
}

function calculateSimilarityScore(title1: string, title2: string): number {
  const terms1 = extractSearchTerms(title1.toLowerCase());
  const terms2 = extractSearchTerms(title2.toLowerCase());
  
  // Calculate Jaccard similarity
  const intersection = terms1.filter(term => terms2.includes(term));
  const union = [...new Set([...terms1, ...terms2])];
  
  const jaccardSimilarity = intersection.length / union.length;
  
  // Combine with popularity score
  const popularityScore = calculatePopularityScore({ rating: '4.0', reviews_count: '100', price: '1000' });
  
  return jaccardSimilarity * 0.7 + popularityScore * 0.3;
}

function extractSearchTerms(text: string): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const terms = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.includes(term));
  
  return [...new Set(terms)]; // Remove duplicates
}

function extractUserPreferences(interactions: UserInteraction[]): any {
  const categories: Record<string, number> = {};
  let totalPrice = 0;
  let priceCount = 0;

  for (const interaction of interactions) {
    // Weight different interaction types
    const weight = {
      'purchase': 3.0,
      'wishlist': 2.0,
      'view': 1.0,
      'search': 0.5
    }[interaction.interaction_type] || 1.0;

    if (interaction.category) {
      categories[interaction.category] = (categories[interaction.category] || 0) + weight;
    }

    if (interaction.price) {
      totalPrice += interaction.price;
      priceCount++;
    }
  }

  // Normalize category weights
  const maxWeight = Math.max(...Object.values(categories));
  for (const category in categories) {
    categories[category] = categories[category] / maxWeight;
  }

  return {
    categories,
    avgPrice: priceCount > 0 ? totalPrice / priceCount : null
  };
}

function removeDuplicateProducts(recommendations: RecommendationItem[]): RecommendationItem[] {
  const seen = new Set<string>();
  return recommendations.filter(rec => {
    const key = rec.product.title.toLowerCase().slice(0, 50); // Use first 50 chars as key
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
