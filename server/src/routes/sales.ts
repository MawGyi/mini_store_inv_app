import express from 'express';
import Sale from '../models/Sale';
import Item from '../models/Item';

const router = express.Router();

// Get daily sales summary - must come before root route
router.get('/summary/daily', async (req: express.Request, res: express.Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sales = await Sale.find({
      saleDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('item');
    
    // Filter out sales with missing/deleted items
    const validSales = sales.filter(sale => sale.item && sale.item._id);
    
    const totalSales = validSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const itemsSold = validSales.length;
    
    res.json({
      date: today,
      totalSales,
      itemsSold,
      sales: validSales
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching daily summary' });
  }
});

// Get top selling items - must come before root route
router.get('/top-selling', async (req: express.Request, res: express.Response) => {
  try {
    const sales = await Sale.aggregate([
      {
        $group: {
          _id: '$item',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Populate item details
    const populatedSales = await Item.populate(sales, { path: '_id' });
    
    // Filter out sales with missing/deleted items
    const validSales = populatedSales.filter(sale => sale._id !== null);
    
    res.json(validSales);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching top selling items' });
  }
});

// Get all sales - must come after specific routes
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const sales = await Sale.find().populate('item');
    
    // Filter out sales with missing/deleted items
    const validSales = sales.filter(sale => sale.item && sale.item._id);
    res.json(validSales);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching sales' });
  }
});

// Create new sale
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const { itemId, quantity } = req.body;
    
    // Find the item and check stock
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    if (item.stockQuantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    
    // Create sale
    const sale = new Sale({
      item: itemId,
      quantity,
      totalPrice: item.price * quantity
    });
    
    // Update stock
    item.stockQuantity -= quantity;
    await item.save();
    
    await sale.save();
    res.status(201).json(sale);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating sale' });
  }
});

export default router;
