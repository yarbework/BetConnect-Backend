import { body, query, param } from 'express-validator';

export const createPropertyValidator = [
  body('size')
    .notEmpty().withMessage('Size is required')
    .isNumeric().withMessage('Size must be a number'),

  body('type')
    .notEmpty().withMessage('Property type is required')
    .isIn(['apartment', 'house', 'villa', 'condo', 'studio', 'commercial', 'land'])
    .withMessage('Invalid property type'),

  body('floor')
    .notEmpty().withMessage('Floor is required')
    .isString().withMessage('Floor must be a string'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('listingType')
    .notEmpty().withMessage('Listing type is required')
    .isIn(['rent', 'sale']).withMessage('Listing type must be rent or sale'),

  body('images')
    .optional()
    .isArray().withMessage('Images must be an array'),

  body('subcity')
    .notEmpty().withMessage('Subcity is required'),

  body('woreda')
    .notEmpty().withMessage('Woreda is required'),

  body('kebele')
    .notEmpty().withMessage('Kebele is required'),

  body('description')
    .optional()
    .isString(),

  body('bedrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bedrooms must be a positive number'),

  body('bathrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bathrooms must be a positive number')
];

export const updatePropertyValidator = [
  param('id')
    .isMongoId().withMessage('Invalid property ID'),

  body('size')
    .optional()
    .isNumeric().withMessage('Size must be a number'),

  body('type')
    .optional()
    .isIn(['apartment', 'house', 'villa', 'condo', 'studio', 'commercial', 'land'])
    .withMessage('Invalid property type'),

  body('floor')
    .optional()
    .isString().withMessage('Floor must be a string'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be positive'),

  body('listingType')
    .optional()
    .isIn(['rent', 'sale']).withMessage('Listing type must be rent or sale'),

  body('images')
    .optional()
    .isArray().withMessage('Images must be an array'),

  body('subcity')
    .optional()
    .isString(),

  body('woreda')
    .optional()
    .isString(),

  body('kebele')
    .optional()
    .isString(),

  body('description')
    .optional()
    .isString(),

  body('bedrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bedrooms must be a positive number'),

  body('bathrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bathrooms must be a positive number'),

  body('status')
    .optional()
    .isIn(['available', 'sold', 'rented']).withMessage('Invalid status')
];

export const propertyQueryValidator = [
  query('minPrice')
    .optional()
    .isFloat({ min: 0 }),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }),

  query('listingType')
    .optional()
    .isIn(['rent', 'sale']),

  query('type')
    .optional()
    .isIn(['apartment', 'house', 'villa', 'condo', 'studio', 'commercial', 'land']),

  query('woreda')
    .optional()
    .isString(),

  query('subcity')
    .optional()
    .isString(),

  query('kebele')
    .optional()
    .isString(),

  query('minSize')
    .optional()
    .isFloat({ min: 0 }),

  query('maxSize')
    .optional()
    .isFloat({ min: 0 }),

  query('bedrooms')
    .optional()
    .isInt({ min: 0 }),

  query('status')
    .optional()
    .isIn(['available', 'sold', 'rented']),

  query('page')
    .optional()
    .isInt({ min: 1 }),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
];