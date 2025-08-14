import { body } from 'express-validator';
import mongoose from 'mongoose';

export const createSaleValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items array is required and must contain at least one item'),
  
  body('items.*.product')
    .notEmpty()
    .withMessage('Product ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product ID');
      }
      return true;
    }),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be a positive integer'),
  
  body('items.*.unitPrice')
    .isNumeric()
    .withMessage('Item unit price must be a number')
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error('Item unit price cannot be negative');
      }
      return true;
    }),
  
  body('paymentMethod')
    .isIn(['cash', 'card', 'digital'])
    .withMessage('Payment method must be cash, card, or digital'),
  
  body('customerName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Customer name cannot be more than 100 characters'),
  
  body('customerPhone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Customer phone cannot be more than 20 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot be more than 500 characters'),
  
  body('status')
    .optional()
    .isIn(['completed', 'pending', 'cancelled', 'refunded'])
    .withMessage('Status must be completed, pending, cancelled, or refunded'),
];

export const updateSaleValidation = [
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Items array must contain at least one item'),
  
  body('items.*.product')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product ID');
      }
      return true;
    }),
  
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Item quantity must be a positive integer'),
  
  body('items.*.unitPrice')
    .optional()
    .isNumeric()
    .withMessage('Item unit price must be a number')
    .custom((value) => {
      if (value && parseFloat(value) < 0) {
        throw new Error('Item unit price cannot be negative');
      }
      return true;
    }),
  
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'digital'])
    .withMessage('Payment method must be cash, card, or digital'),
  
  body('customerName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Customer name cannot be more than 100 characters'),
  
  body('customerPhone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Customer phone cannot be more than 20 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot be more than 500 characters'),
  
  body('status')
    .optional()
    .isIn(['completed', 'pending', 'cancelled', 'refunded'])
    .withMessage('Status must be completed, pending, cancelled, or refunded'),
];
