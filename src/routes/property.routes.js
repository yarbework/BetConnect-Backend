import express from "express";
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getNearbyProperties,
} from "../controllers/property.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getProperties);
router.get("/nearby", getNearbyProperties);   // GPS search — must be before /:id
router.get("/:id", getPropertyById);

// Protected routes (agents/admins only)
router.post("/", protect, createProperty);
router.put("/:id", protect, updateProperty);
router.delete("/:id", protect, deleteProperty);

export default router;
