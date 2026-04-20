import express from 'express';
import {handleChat} from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @openapi
 * /ai/chat:
 *   post:
 *     summary: Chat with AI assistant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message to AI
 *     responses:
 *       200:
 *         description: AI response
 *       401:
 *         description: Unauthorized
 */
router.post('/chat', protect, handleChat);

export default router;