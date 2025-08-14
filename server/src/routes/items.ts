import express from 'express';
import Item from '../models/Item';
import StockAdjustment from '../models/StockAdjustment';

const router = express.Router();

// Get all items
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching items' });
  }
});

// Search items - must come before /:id route
router.get('/search/:query', async (req: express.Request, res: express.Response) => {
  try {
    const query = req.params.query;
    const items = await Item.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { itemCode: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: 'Error searching items' });
  }
});

// Get low stock items - must come before /:id route
router.get('/status/low-stock', async (req: express.Request, res: express.Response) => {
  try {
    const items = await Item.find({
      $expr: {
        $lte: ['$stockQuantity', '$lowStockThreshold']
      }
    });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching low stock items' });
  }
});

// Create new item
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating item' });
  }
});

// Get single item - must come after specific routes
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching item' });
  }
});

// Update item
router.put('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating item' });
  }
});

// Delete item
router.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting item' });
  }
});

// Adjust stock quantity
router.post('/:id/adjust-stock', async (req: express.Request, res: express.Response) => {
  try {
    const { adjustmentQty, reason = 'Manual Restock' } = req.body;
    
    // Validate adjustment quantity
    if (!adjustmentQty || adjustmentQty <= 0) {
      return res.status(400).json({ message: 'Adjustment quantity must be a positive number' });
    }

    // Find the item
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const previousQty = item.stockQuantity;
    const newQty = previousQty + adjustmentQty;

    // Update item stock quantity
    item.stockQuantity = newQty;
    item.updatedAt = new Date();
    await item.save();

    // Log the stock adjustment
    const stockAdjustment = new StockAdjustment({
      itemId: item._id,
      adjustmentQty,
      reason,
      previousQty,
      newQty,
    });
    await stockAdjustment.save();

    res.json({
      item,
      adjustment: stockAdjustment,
      message: 'Stock adjusted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error adjusting stock' });
  }
});

export default router;
