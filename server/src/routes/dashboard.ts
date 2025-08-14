import express from 'express';
import Item from '../models/Item';
import Sale from '../models/Sale';
import Category from '../models/Category';

const router = express.Router();

// Get dashboard overview
router.get('/overview', async (req: express.Request, res: express.Response) => {
  try {
    const totalItems = await Item.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCategories = await Category.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);

    // Get low stock items
    const lowStockItems = await Item.aggregate([
      {
        $match: {
          stockQuantity: { $lte: 5, $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $limit: 5
      }
    ]);

    // Get out of stock items
    const outOfStockItems = await Item.aggregate([
      {
        $match: {
          stockQuantity: 0
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $limit: 5
      }
    ]);

    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = await Sale.find({
      saleDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('item');
    
    const validTodaySales = todaySales.filter(sale => sale.item && sale.item._id);
    const totalTodaySales = validTodaySales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    
    // Get top selling items
    const topSelling = await Sale.aggregate([
      {
        $group: {
          _id: '$item',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: '_id',
          as: 'item'
        }
      },
      {
        $match: {
          'item': { $ne: [] }
        }
      },
      {
        $unwind: '$item'
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Get recent sales
    const recentSales = await Sale.find()
      .populate('item')
      .sort({ saleDate: -1 })
      .limit(5);
    
    const validRecentSales = recentSales.filter(sale => sale.item && sale.item._id);
    
    res.json({
      success: true,
      data: {
        totalItems,
        totalCategories,
        lowStockItems,
        outOfStockItems,
        todaySales: {
          total: totalTodaySales,
          count: validTodaySales.length
        },
        topSellingItems: topSelling,
        recentSales: validRecentSales
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get inventory summary
router.get('/inventory-summary', async (req: express.Request, res: express.Response) => {
  try {
    const totalItems = await Item.countDocuments();
    const totalValue = await Item.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } }
        }
      }
    ]);
    
    const stockStatus = await Item.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$stockQuantity', 0] },
              'outOfStock',
              {
                $cond: [
                  { $lte: ['$stockQuantity', { $ifNull: ['$lowStockThreshold', 0] }] },
                  'lowStock',
                  'inStock'
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const categoryDistribution = await Item.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalItems,
        totalValue: totalValue[0]?.totalValue || 0,
        stockStatus,
        categoryDistribution
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get sales trends
router.get('/sales-trends', async (req: express.Request, res: express.Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    
    const salesTrend = await Sale.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' },
            day: { $dayOfMonth: '$saleDate' }
          },
          totalSales: { $sum: '$totalPrice' },
          totalItems: { $sum: '$quantity' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      },
      {
        $limit: days
      }
    ]);
    
    res.json({
      success: true,
      data: salesTrend
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get alerts
router.get('/alerts', async (req: express.Request, res: express.Response) => {
  try {
    // Get low stock items using aggregation
    const lowStockItems = await Item.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $lte: ['$stockQuantity', '$lowStockThreshold'] },
              { $gt: ['$stockQuantity', 0] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $limit: 5
      }
    ]);
    
    const outOfStockItems = await Item.find({ stockQuantity: 0 }).populate('category');
    
    const recentHighValueSales = await Sale.find({ totalPrice: { $gte: 10000 } })
      .populate('item')
      .sort({ saleDate: -1 })
      .limit(5);
    
    const validRecentHighValueSales = recentHighValueSales.filter(sale => sale.item && sale.item._id);
    
    res.json({
      success: true,
      data: {
        lowStockItems,
        outOfStockItems,
        recentHighValueSales: validRecentHighValueSales
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
