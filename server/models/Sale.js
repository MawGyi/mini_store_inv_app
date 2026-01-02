const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Item ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unit_price: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price must be positive']
  },
  total_price: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price must be positive']
  }
});

const saleSchema = new mongoose.Schema({
  sale_date: {
    type: Date,
    default: Date.now,
    required: [true, 'Sale date is required']
  },
  items: [saleItemSchema],
  total_amount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount must be positive']
  },
  payment_method: {
    type: String,
    enum: {
      values: ['cash', 'credit', 'mobile_payment'],
      message: 'Payment method must be cash, credit, or mobile_payment'
    },
    required: [true, 'Payment method is required']
  },
  customer_name: {
    type: String,
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  invoice_number: {
    type: String,
    unique: true,
    required: [true, 'Invoice number is required']
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Generate unique invoice number
async function generateInvoiceNumber() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  
  // Find the last invoice for today
  const lastSale = await mongoose.model('Sale').findOne({
    invoice_number: { $regex: `^INV-${dateStr}-` }
  }).sort({ invoice_number: -1 });

  let sequence = 1;
  if (lastSale) {
    const lastSequence = parseInt(lastSale.invoice_number.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `INV-${dateStr}-${sequence.toString().padStart(3, '0')}`;
}

// Pre-save middleware
saleSchema.pre('save', async function(next) {
  // Generate invoice number if not provided
  if (!this.invoice_number) {
    this.invoice_number = await generateInvoiceNumber();
  }

  // Calculate total amount from items
  this.total_amount = this.items.reduce((sum, item) => sum + item.total_price, 0);

  // Validate that total amount matches items total
  const calculatedTotal = this.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  if (Math.abs(this.total_amount - calculatedTotal) > 0.01) {
    throw new Error('Total amount does not match sum of items');
  }

  next();
});

// Indexes for performance
saleSchema.index({ invoice_number: 1 });
saleSchema.index({ sale_date: 1 });
saleSchema.index({ payment_method: 1 });
saleSchema.index({ 'items.item_id': 1 });
saleSchema.index({ created_at: -1 });

module.exports = mongoose.model('Sale', saleSchema);
