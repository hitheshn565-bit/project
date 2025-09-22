import { Router } from 'express';
import * as ConnectorController from '../../controllers/connectorController';
import * as DebugController from '../../controllers/debugController';

export const router = Router();

/**
 * @openapi
 * /connectors/ebay/test:
 *   get:
 *     summary: Test eBay API connection
 *     tags: [Connectors]
 *     responses:
 *       200:
 *         description: Connection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Connection failed
 */
router.get('/ebay/test', ConnectorController.testEbayConnection);

/**
 * @openapi
 * /connectors/ebay/search:
 *   get:
 *     summary: Search eBay items
 *     tags: [Connectors]
 *     parameters:
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: Search keywords
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: eBay category ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 itemSummaries:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/ebay/search', ConnectorController.searchEbayItems);

/**
 * @openapi
 * /connectors/ebay/item/{itemId}:
 *   get:
 *     summary: Get eBay item details
 *     tags: [Connectors]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: eBay item ID
 *     responses:
 *       200:
 *         description: Item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/ebay/item/:itemId', ConnectorController.getEbayItem);

/**
 * @openapi
 * /connectors/ebay/config:
 *   get:
 *     summary: Check eBay API configuration
 *     tags: [Connectors]
 *     responses:
 *       200:
 *         description: Configuration status
 */
router.get('/ebay/config', DebugController.checkEbayConfig);
