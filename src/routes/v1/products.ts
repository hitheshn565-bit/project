import { Router } from 'express';
import * as ProductController from '../../controllers/productController';
import * as TestController from '../../controllers/testController';
import * as SimpleProductController from '../../controllers/simpleProductController';

export const router = Router();

/**
 * @openapi
 * /products/search:
 *   get:
 *     summary: Search canonical products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Product category
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Product brand
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results
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
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 */
router.get('/search', ProductController.searchProducts);

/**
 * @openapi
 * /products/{productId}:
 *   get:
 *     summary: Get product details with all offers
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details with offers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   type: object
 *                 offers:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Product not found
 */
router.get('/:productId', ProductController.getProduct);

/**
 * @openapi
 * /products/{productId}/offers:
 *   get:
 *     summary: Get all offers for a product (sorted by price)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product offers sorted by price
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productId:
 *                   type: string
 *                 title:
 *                   type: string
 *                 offers:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Product not found
 */
router.get('/:productId/offers', ProductController.getProductOffers);

/**
 * @openapi
 * /products/ingest/ebay-item:
 *   post:
 *     summary: Ingest a single eBay item into canonical product format
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId]
 *             properties:
 *               itemId:
 *                 type: string
 *                 description: eBay item ID
 *     responses:
 *       201:
 *         description: New product created
 *       200:
 *         description: Existing product updated
 *       400:
 *         description: Invalid request
 *       404:
 *         description: eBay item not found
 */
router.post('/ingest/ebay-item', ProductController.ingestEbayProduct);

/**
 * @openapi
 * /products/ingest/ebay-search:
 *   post:
 *     summary: Bulk ingest eBay search results into canonical products
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [keywords]
 *             properties:
 *               keywords:
 *                 type: string
 *                 description: Search keywords
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 maximum: 50
 *                 description: Number of items to ingest
 *     responses:
 *       200:
 *         description: Bulk ingestion completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 summary:
 *                   type: object
 *                 results:
 *                   type: array
 *       400:
 *         description: Invalid request
 */
router.post('/ingest/ebay-search', ProductController.ingestEbaySearch);

/**
 * @openapi
 * /products/test/ingest:
 *   post:
 *     summary: Test product ingestion (simplified)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId]
 *             properties:
 *               itemId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Test product created
 */
router.post('/test/ingest', TestController.testProductIngestion);

// Simple working endpoints
router.post('/simple/create', SimpleProductController.createProductFromEbay);
router.post('/simple/bulk', SimpleProductController.bulkCreateFromSearch);
router.get('/simple/search', SimpleProductController.searchProducts);
router.get('/simple/:productId', SimpleProductController.getProduct);
