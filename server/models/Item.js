const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  itemCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  expiryDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save and check for case-insensitive itemCode uniqueness
itemSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();

  if (this.isModified('itemCode')) {
    const existingItem = await this.constructor.findOne({
      itemCode: { $regex: new RegExp(`^${this.itemCode}$`, 'i') },
      _id: { $ne: this._id }
    });

    if (existingItem) {
      const error = new Error('Item code must be unique (case-insensitive)');
      return next(error);
    }
  }

  next();
});

module.exports = mongoose.model('Item', itemSchema);

