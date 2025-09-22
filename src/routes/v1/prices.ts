import { Router } from 'express';
import * as PriceHistoryController from '../../controllers/priceHistoryController';
import { requireAuth } from '../../middleware/auth';

export const router = Router();

/**
 * @openapi
 * /prices/offers/{offerId}/history:
 *   get:
 *     summary: Get price history for a specific offer
 *     tags: [Price History]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days of history to retrieve
 *     responses:
 *       200:
 *         description: Price history data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 offer_id:
 *                   type: string
 *                 current_price:
 *                   type: number
 *                 price_history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                       price:
 *                         type: number
 *                       change_percent:
 *                         type: number
 *                 price_stats:
 *                   type: object
 *       404:
 *         description: Offer not found
 */
router.get('/offers/:offerId/history', PriceHistoryController.getOfferPriceHistory);

/**
 * @openapi
 * /prices/products/{productId}/history:
 *   get:
 *     summary: Get price history for all offers of a product
 *     tags: [Price History]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days of history to retrieve
 *     responses:
 *       200:
 *         description: Product price history with all offers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product_id:
 *                   type: string
 *                 offers_with_history:
 *                   type: array
 *                 best_price:
 *                   type: object
 *       404:
 *         description: Product not found
 */
router.get('/products/:productId/history', PriceHistoryController.getProductPriceHistory);

/**
 * @openapi
 * /prices/update:
 *   post:
 *     summary: Record a price update for an offer
 *     tags: [Price History]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offerId, price, currency]
 *             properties:
 *               offerId:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Price snapshot recorded
 *       400:
 *         description: Invalid request
 */
router.post('/update', PriceHistoryController.recordPriceUpdate);

/**
 * @openapi
 * /prices/bulk-update:
 *   post:
 *     summary: Bulk update prices for multiple offers
 *     tags: [Price History]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offers]
 *             properties:
 *               offers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     price:
 *                       type: number
 *                     currency:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk update completed
 */
router.post('/bulk-update', PriceHistoryController.bulkUpdatePrices);

/**
 * @openapi
 * /prices/market-trends:
 *   get:
 *     summary: Get market price trends
 *     tags: [Price History]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Product category to filter by
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Market trends data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   type: string
 *                 total_products:
 *                   type: integer
 *                 price_trends:
 *                   type: object
 *                 avg_price_change:
 *                   type: number
 */
router.get('/market-trends', PriceHistoryController.getMarketTrends);

/**
 * @openapi
 * /prices/alerts:
 *   get:
 *     summary: Get user's price alerts
 *     tags: [Price History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's price alerts
 *       401:
 *         description: Authentication required
 */
router.get('/alerts', requireAuth, PriceHistoryController.getUserPriceAlerts);
