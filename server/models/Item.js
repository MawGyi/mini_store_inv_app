import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  item_code: {
    type: String,
    required: [true, 'Item code is required'],
    unique: true,
    trim: true,
    index: true  // Consolidated index definition
  },
  selling_price: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  cost_price: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  stock_quantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative']
  },
  low_stock_threshold: {
    type: Number,
    default: 5,
    min: [0, 'Low stock threshold cannot be negative']
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  expiry_date: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Add compound indexes for efficient searching
itemSchema.index({ name: 'text', item_code: 'text' }); // Text search
itemSchema.index({ category_id: 1 });
itemSchema.index({ stock_quantity: 1 });
itemSchema.index({ low_stock_threshold: 1 });

export default mongoose.model('Item', itemSchema);
