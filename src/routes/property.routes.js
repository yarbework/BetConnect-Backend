import express from 'express';
import {
    createProperty,
    getProperties,
    getPropertyById,
    updateProperty,
    deleteProperty,
    getMyProperties
} from '../controllers/property.controller.js';
import { protect, approvedAgent, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
    createPropertyValidator,
    updatePropertyValidator
} from '../validators/property.validator.js';
import {upload} from '../middleware/upload.js';

const router = express.Router();

router.get('/', optionalAuth, getProperties);
router.get('/mine', protect, getMyProperties);

router.post('/', protect, approvedAgent, upload.array('images', 5), createPropertyValidator, validate, createProperty)

router.get('/:id', optionalAuth, getPropertyById);
router.put('/:id', protect, upload.array('images', 5), updatePropertyValidator, validate, updateProperty);
router.delete('/:id', protect, deleteProperty);

export default router;
