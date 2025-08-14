import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
  },
});

const saleSchema = new mongoose.Schema({
  items: {
    type: [saleItemSchema],
    required: [true, 'Sale items are required'],
    validate: {
      validator: (items) => items.length > 0,
      message: 'At least one item is required for a sale',
    },
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'digital'],
    required: [true, 'Payment method is required'],
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled', 'refunded'],
    default: 'completed',
  },
  customerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Customer name cannot be more than 100 characters'],
  },
  customerPhone: {
    type: String,
    trim: true,
    maxlength: [20, 'Customer phone cannot be more than 20 characters'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters'],
  },
  saleDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for better query performance
saleSchema.index({ saleDate: -1 });
saleSchema.index({ status: 1 });
saleSchema.index({ paymentMethod: 1 });

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
