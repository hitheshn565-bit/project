import { Router } from 'express';
import * as RecommendationController from '../../controllers/recommendationController';
import { requireAuth } from '../../middleware/auth';

export const router = Router();

/**
 * @openapi
 * /recommendations/cold-start:
 *   get:
 *     summary: Get cold-start recommendations based on user interests
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Personalized recommendations
 *       401:
 *         description: Authentication required
 */
router.get('/cold-start', requireAuth, RecommendationController.getColdStartRecommendations);

/**
 * @openapi
 * /recommendations/trending:
 *   get:
 *     summary: Get trending products
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Trending products
 */
router.get('/trending', RecommendationController.getTrendingProducts);

/**
 * @openapi
 * /recommendations/similar/{productId}:
 *   get:
 *     summary: Get similar products
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Similar products
 */
router.get('/similar/:productId', RecommendationController.getSimilarProducts);

/**
 * @openapi
 * /recommendations/duplicates/{productId}:
 *   get:
 *     summary: Find potential duplicate products
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Potential duplicate products
 */
router.get('/duplicates/:productId', RecommendationController.findDuplicates);
