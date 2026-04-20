import express from "express";
import {
  getPendingAgents,
  approveAgent
} from "../controllers/admin.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

/**
 * @openapi
 * /admin/agents/pending:
 *   get:
 *     summary: Get pending agents (admin protected)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending agents
 */
router.get('/agents/pending', protect, isAdmin, getPendingAgents);
/**
 * @openapi
 * /admin/agents/{id}/approve:
 *   put:
 *     summary: Approve an agent (admin protected)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Agent approved
 */
router.put('/agents/:id/approve', protect, isAdmin, approveAgent);

export default router;
