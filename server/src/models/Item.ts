import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  itemCode: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true,
  },
  stockQuantity: {
    type: Number,
    required: true,
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
  },
  expiryDate: {
    type: Date,
    default: null,
    validate: {
      validator: function(value: Date) {
        // Allow null or a valid future date
        return value === null || (value instanceof Date && !isNaN(value.getTime()));
      },
      message: 'Expiry date must be a valid date'
    },
    get: (value: Date | null) => value ? value.toISOString().split('T')[0] : null,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Item', itemSchema);
