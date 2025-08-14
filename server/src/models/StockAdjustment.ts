import mongoose from 'mongoose';

const stockAdjustmentSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  adjustmentQty: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    default: 'Manual Restock',
  },
  previousQty: {
    type: Number,
    required: true,
  },
  newQty: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('StockAdjustment', stockAdjustmentSchema);
