import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import AppError from '../middleware/AppError.js';
import { validationResult } from 'express-validator';

// Get all sales
export const getAllSales = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, status, paymentMethod, startDate, endDate,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(filter)
      .populate('items.product', 'name sku')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ saleDate: -1 });

    const total = await Sale.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        sales,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single sale
export const getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('items.product', 'name sku');

    if (!sale) {
      return next(new AppError('Sale not found', 404));
    }

    res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

// Create sale
export const createSale = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 422, errors.array()));
    }

    const { items } = req.body;

    // Validate and calculate totals
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return next(new AppError(`Product with ID ${item.product} not found`, 404));
      }

      if (product.quantity < item.quantity) {
        return next(new AppError(`Insufficient stock for product ${product.name}`, 400));
      }

      const subtotal = item.quantity * item.unitPrice;
      totalAmount += subtotal;

      processedItems.push({
        ...item,
        subtotal,
      });
    }

    // Create sale
    const saleData = {
      ...req.body,
      items: processedItems,
      totalAmount,
    };

    const sale = await Sale.create(saleData);

    // Update product quantities
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } },
      );
    }

    const populatedSale = await Sale.findById(sale._id).populate('items.product', 'name sku');

    res.status(201).json({
      success: true,
      data: populatedSale,
    });
  } catch (error) {
    next(error);
  }
};

// Update sale
export const updateSale = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 422, errors.array()));
    }

    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    ).populate('items.product', 'name sku');

    if (!sale) {
      return next(new AppError('Sale not found', 404));
    }

    res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

// Delete sale
export const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return next(new AppError('Sale not found', 404));
    }

    // Restore product quantities if sale is being deleted
    if (sale.status === 'completed') {
      for (const item of sale.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: item.quantity } },
        );
      }
    }

    await Sale.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Sale deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
