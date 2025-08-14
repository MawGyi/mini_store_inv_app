const Sale = require('../models/Sale');
const Item = require('../models/Item');

/**
 * Get dashboard overview with aggregate metrics
 * GET /api/dashboard/overview
 */
const getOverview = async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get 7 days ago date
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Aggregate queries in parallel for efficiency
    const [
      todaySales,
      totalItemsInStock,
      lowStockItems,
      recentSalesCount
    ] = await Promise.all([
      // Total sales today in MMK
      Sale.aggregate([
        {
          $match: {
            saleDate: {
              $gte: startOfToday,
              $lt: endOfToday
            }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Total items in stock (sum of all stock_quantity)
      Item.aggregate([
        {
          $group: {
            _id: null,
            totalStock: { $sum: '$stock_quantity' }
          }
        }
      ]),

      // Count of low stock items (using field names from existing model)
      Item.countDocuments({
        $expr: { $lt: ['$stock_quantity', '$low_stock_threshold'] }
      }),

      // Recent sales count (last 7 days)
      Sale.countDocuments({
        saleDate: { $gte: sevenDaysAgo }
      })
    ]);

    // Extract values with defaults
    const todayTotalSales = todaySales.length > 0 ? todaySales[0].totalAmount : 0;
    const todaySalesCount = todaySales.length > 0 ? todaySales[0].count : 0;
    const totalStock = totalItemsInStock.length > 0 ? totalItemsInStock[0].totalStock : 0;

    res.status(200).json({
      success: true,
      message: 'Dashboard overview retrieved successfully',
      data: {
        totalSalesToday: todayTotalSales,
        todaySalesCount: todaySalesCount,
        totalItemsInStock: totalStock,
        lowStockItemsCount: lowStockItems,
        recentSalesCount: recentSalesCount
      }
    });

  } catch (error) {
    console.error('Error getting dashboard overview:', error);
    res.status(500).json({
      error: 'Server error'
    });
  }
};

/**
 * Get dashboard alerts (low stock items and other alerts)
 * GET /api/dashboard/alerts
 */
const getAlerts = async (req, res) => {
  try {
    // Get low stock items with item details
    const lowStockItems = await Item.find({
      $expr: { $lt: ['$stock_quantity', '$low_stock_threshold'] }
    })
      .populate('category_id', 'name')
      .sort({ stock_quantity: 1 }) // Sort by lowest stock first
      .lean();

    // Format alerts array
    const alerts = lowStockItems.map(item => ({
      type: 'low_stock',
      severity: item.stock_quantity === 0 ? 'critical' : 'warning',
      itemId: item._id,
      itemName: {
        en: item.name,
        my: item.name // Assuming single name field for now
      },
      itemCode: item.item_code,
      currentStock: item.stock_quantity,
      threshold: item.low_stock_threshold,
      category: item.category_id?.name || 'Unknown',
      message: item.stock_quantity === 0 
        ? `${item.name} is out of stock`
        : `${item.name} is running low (${item.stock_quantity} left, threshold: ${item.low_stock_threshold})`
    }));

    // TODO: Add other alert types here in the future (e.g., expired imports)
    // Example structure for future alerts:
    // {
    //   type: 'expired_import',
    //   severity: 'warning',
    //   message: 'Import batch XYZ has expired'
    // }

    res.status(200).json({
      success: true,
      message: 'Dashboard alerts retrieved successfully',
      data: {
        alerts,
        summary: {
          total: alerts.length,
          critical: alerts.filter(alert => alert.severity === 'critical').length,
          warning: alerts.filter(alert => alert.severity === 'warning').length
        }
      }
    });

  } catch (error) {
    console.error('Error getting dashboard alerts:', error);
    res.status(500).json({
      error: 'Server error'
    });
  }
};

/**
 * Get sales trends data
 * GET /api/dashboard/sales-trends?period=week/month/year
 */
const getSalesTrends = async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    // Validate period parameter
    const validPeriods = ['week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameter',
        error: 'Period must be one of: week, month, year'
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    let groupByFormat;
    let dateFormat;

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        groupByFormat = {
          year: { $year: '$saleDate' },
          month: { $month: '$saleDate' },
          day: { $dayOfMonth: '$saleDate' }
        };
        dateFormat = '%Y-%m-%d';
        break;
      case 'month':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        groupByFormat = {
          year: { $year: '$saleDate' },
          month: { $month: '$saleDate' },
          day: { $dayOfMonth: '$saleDate' }
        };
        dateFormat = '%Y-%m-%d';
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupByFormat = {
          year: { $year: '$saleDate' },
          month: { $month: '$saleDate' }
        };
        dateFormat = '%Y-%m';
        break;
    }

    // Aggregate sales data
    const salesTrends = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupByFormat,
          totalAmount: { $sum: '$totalAmount' },
          salesCount: { $sum: 1 },
          averageAmount: { $avg: '$totalAmount' }
        }
      },
      {
        $addFields: {
          date: {
            $dateFromParts: period === 'year' ? {
              year: '$_id.year',
              month: '$_id.month',
              day: 1
            } : {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: dateFormat,
              date: '$date'
            }
          },
          totalAmount: { $round: ['$totalAmount', 2] },
          salesCount: 1,
          averageAmount: { $round: ['$averageAmount', 2] }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Calculate summary statistics
    const totalSales = salesTrends.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalTransactions = salesTrends.reduce((sum, item) => sum + item.salesCount, 0);
    const averageDaily = salesTrends.length > 0 ? totalSales / salesTrends.length : 0;

    res.status(200).json({
      success: true,
      message: 'Sales trends retrieved successfully',
      data: {
        period,
        trends: salesTrends,
        summary: {
          totalSales: Math.round(totalSales * 100) / 100,
          totalTransactions,
          averageDailySales: Math.round(averageDaily * 100) / 100,
          dataPoints: salesTrends.length
        }
      }
    });

  } catch (error) {
    console.error('Error getting sales trends:', error);
    res.status(500).json({
      error: 'Server error'
    });
  }
};

module.exports = {
  getOverview,
  getAlerts,
  getSalesTrends
};
