import { Router } from 'express';
import * as UserController from '../../controllers/userController';

export const router = Router();

/**
 * @openapi
 * /users:
 *   post:
 *     summary: User signup
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               declared_interests:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created user with tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *       409:
 *         description: Email already in use
 */
router.post('/', UserController.createUser);
