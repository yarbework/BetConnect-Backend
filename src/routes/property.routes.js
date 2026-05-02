import express from "express";
import {
  createProperty,
  getMyProperties,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getNearbyProperties,
} from "../controllers/property.controller.js";
import { protect, approvedAgent } from "../middleware/auth.middleware.js";

import { upload } from "../middleware/upload.js"; 

const router = express.Router();

router.get("/", getProperties);
router.get("/nearby", getNearbyProperties);   


router.get("/mine", protect, getMyProperties);   

router.get("/:id", getPropertyById);

router.post("/", protect, upload.array('images', 5), createProperty);

router.put("/:id", protect, upload.array('images', 5), updateProperty);
router.delete("/:id", protect, deleteProperty);

export default router;