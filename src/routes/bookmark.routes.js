import express from "express";
import {
  addBookmark,
  getBookmarks,
  removeBookmark
} from "../controllers/bookmark.controller.js";
import { bookmarkParamValidator } from "../validators/bookmark.validator.js";
import { validate } from "../middleware/validate.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @openapi
 * /bookmarks/{propertyId}:
 *   post:
 *     summary: Add bookmark (protected)
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookmark added
 */
router.post('/:propertyId', protect, bookmarkParamValidator, validate, addBookmark);
/**
 * @openapi
 * /bookmarks:
 *   get:
 *     summary: Get all bookmarks (protected)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookmarks
 */
router.get('/', protect, getBookmarks);
/**
 * @openapi
 * /bookmarks/{propertyId}:
 *   delete:
 *     summary: Remove bookmark (protected)
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookmark removed
 */
router.delete('/:propertyId', protect, bookmarkParamValidator, validate, removeBookmark);

export default router;
