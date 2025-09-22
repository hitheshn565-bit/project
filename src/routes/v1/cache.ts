import { Router } from 'express';
import * as CacheController from '../../controllers/cacheController';

export const router = Router();

/**
 * @openapi
 * /cache/products/{productId}:
 *   get:
 *     summary: Get product with caching
 *     tags: [Cache]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: useCache
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'true'
 *     responses:
 *       200:
 *         description: Product data (possibly cached)
 *       404:
 *         description: Product not found
 */
router.get('/products/:productId', CacheController.getCachedProduct);

/**
 * @openapi
 * /cache/search:
 *   get:
 *     summary: Search products with caching
 *     tags: [Cache]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: useCache
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'true'
 *     responses:
 *       200:
 *         description: Search results (possibly cached)
 */
router.get('/search', CacheController.searchCachedProducts);

/**
 * @openapi
 * /cache/popular:
 *   get:
 *     summary: Get popular products based on view count
 *     tags: [Cache]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Popular products
 */
router.get('/popular', CacheController.getPopularProducts);

/**
 * @openapi
 * /cache/products/{productId}/invalidate:
 *   delete:
 *     summary: Invalidate product cache
 *     tags: [Cache]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cache invalidated
 */
router.delete('/products/:productId/invalidate', CacheController.invalidateProductCache);

/**
 * @openapi
 * /cache/warm:
 *   post:
 *     summary: Warm cache for specific products
 *     tags: [Cache]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productIds]
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       202:
 *         description: Cache warming started
 */
router.post('/warm', CacheController.warmCache);

/**
 * @openapi
 * /cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     tags: [Cache]
 *     responses:
 *       200:
 *         description: Cache statistics
 */
router.get('/stats', CacheController.getCacheStats);

/**
 * @openapi
 * /cache/clear:
 *   delete:
 *     summary: Clear cache by pattern
 *     tags: [Cache]
 *     parameters:
 *       - in: query
 *         name: pattern
 *         schema:
 *           type: string
 *           default: '*'
 *     responses:
 *       200:
 *         description: Cache cleared
 */
router.delete('/clear', CacheController.clearCache);
