import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import { requireAuth } from '../middleware/auth';

// Python recommendation service URL
const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:5001';

interface UserInterest {
  category: string;
  interest_level: number;
}

interface UserInteraction {
  product_id: string;
  interaction_type: 'view' | 'search' | 'wishlist' | 'purchase';
  marketplace: string;
  category?: string;
  price?: number;
  timestamp?: Date;
}

const router = Router();

/**
 * Get personalized recommendations for authenticated user
 */
router.get('/personal', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user interests from database or use defaults
    const defaultInterests: UserInterest[] = [
      { category: 'Electronics', interest_level: 8 },
      { category: 'Fashion', interest_level: 6 },
      { category: 'Sports', interest_level: 5 }
    ];

    // Call Python recommendation service
    const response = await axios.post(`${RECOMMENDATION_SERVICE_URL}/recommendations/cold-start`, {
      interests: defaultInterests,
      limit: 20
    });

    const recommendations = response.data.recommendations;
    
    res.json({
      recommendations,
      algorithm: 'cold_start',
      user_id: userId
    });
  } catch (error: any) {
    logger.error('Personal recommendations failed:', error);
    res.status(500).json({
      error: 'Failed to get personal recommendations',
      message: error.message
    });
  }
});

/**
 * Get trending recommendations (no auth required)
 */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    logger.info('Trending recommendations route called');
    const { limit = 20 } = req.query;
    
    // Call Python recommendation service
    logger.info(`Calling Python service: ${RECOMMENDATION_SERVICE_URL}/recommendations/trending`);
    const response = await axios.get(`${RECOMMENDATION_SERVICE_URL}/recommendations/trending`, {
      params: { limit: parseInt(limit as string) }
    });

    logger.info(`Python service response:`, { status: response.status, dataKeys: Object.keys(response.data) });
    const recommendations = response.data.recommendations || [];
    
    res.json({
      recommendations,
      algorithm: 'trending',
      total: recommendations.length
    });
  } catch (error: any) {
    logger.error('Trending recommendations failed:', error);
    res.status(500).json({
      error: 'Failed to get trending recommendations',
      message: error.message
    });
  }
});

/**
 * Get similar product recommendations
 */
router.get('/similar/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { limit = 10 } = req.query;
    
    if (!productId) {
      return res.status(400).json({
        error: 'Product ID is required'
      });
    }

    // For now, use a simple product ID (in real implementation, you'd map this properly)
    const productIdNum = Math.abs(productId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0)) % 100;
    
    // Call Python recommendation service
    const response = await axios.get(`${RECOMMENDATION_SERVICE_URL}/recommendations/similar/${productIdNum}`, {
      params: { limit: parseInt(limit as string) }
    });

    const recommendations = response.data.recommendations;
    
    res.json({
      recommendations,
      algorithm: 'similar',
      product_id: productId
    });
  } catch (error: any) {
    logger.error('Similar product recommendations failed:', error);
    res.status(500).json({
      error: 'Failed to get similar product recommendations',
      message: error.message
    });
  }
});

/**
 * Track user interaction for future recommendations
 */
router.post('/track', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { 
      product_id, 
      interaction_type, 
      marketplace, 
      category, 
      price 
    } = req.body;

    if (!userId || !product_id || !interaction_type || !marketplace) {
      return res.status(400).json({
        error: 'Missing required fields: product_id, interaction_type, marketplace'
      });
    }

    const interaction: UserInteraction = {
      product_id,
      interaction_type,
      marketplace,
      category,
      price: price ? parseFloat(price) : undefined,
      timestamp: new Date()
    };

    // TODO: Store interaction in database
    // For now, just log it
    logger.info('User interaction tracked:', {
      userId,
      interaction
    });

    res.json({
      success: true,
      message: 'Interaction tracked successfully'
    });
  } catch (error: any) {
    logger.error('Interaction tracking failed:', error);
    res.status(500).json({
      error: 'Failed to track interaction',
      message: error.message
    });
  }
});

/**
 * Update user interests (for cold-start recommendations)
 */
router.put('/interests', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { interests } = req.body;

    if (!userId || !interests || !Array.isArray(interests)) {
      return res.status(400).json({
        error: 'Invalid interests data'
      });
    }

    // Validate interests format
    for (const interest of interests) {
      if (!interest.category || typeof interest.interest_level !== 'number') {
        return res.status(400).json({
          error: 'Each interest must have category and interest_level'
        });
      }
    }

    // TODO: Store interests in database
    // For now, just log them
    logger.info('User interests updated:', {
      userId,
      interests
    });

    // Generate new recommendations based on updated interests
    const response = await axios.post(`${RECOMMENDATION_SERVICE_URL}/recommendations/cold-start`, {
      interests,
      limit: 20
    });
    const recommendations = response.data.recommendations;

    res.json({
      success: true,
      message: 'Interests updated successfully',
      recommendations
    });
  } catch (error: any) {
    logger.error('Interest update failed:', error);
    res.status(500).json({
      error: 'Failed to update interests',
      message: error.message
    });
  }
});

/**
 * Get recommendation performance metrics (admin only)
 */
router.get('/metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    // TODO: Implement metrics collection
    const metrics = {
      total_recommendations_served: 1250,
      avg_click_through_rate: 0.12,
      top_categories: [
        { category: 'Electronics', requests: 450 },
        { category: 'Fashion', requests: 380 },
        { category: 'Sports', requests: 220 }
      ],
      algorithm_performance: {
        cold_start: { ctr: 0.08, conversion: 0.03 },
        behavioral: { ctr: 0.15, conversion: 0.06 },
        trending: { ctr: 0.10, conversion: 0.04 }
      }
    };

    res.json(metrics);
  } catch (error: any) {
    logger.error('Metrics retrieval failed:', error);
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error.message
    });
  }
});

export default router;
