import express from 'express';
import {
    createProperty,
    getProperties,
    getPropertyById,
    updateProperty,
    deleteProperty
} from '../controllers/property.controller.js';
import { protect, approvedAgent, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
    createPropertyValidator,
    updatePropertyValidator
} from '../validators/property.validator.js';
import {upload} from '../middleware/upload.js';

const router = express.Router();

router.post('/', protect, approvedAgent, upload.array('images', 5), createPropertyValidator, validate, createProperty)
router.get('/', optionalAuth, getProperties);

router.get('/:id', optionalAuth, getPropertyById);
router.put('/:id', protect, upload.array('images', 5), updatePropertyValidator, validate, updateProperty);
router.delete('/:id', protect, deleteProperty);

export default router;
