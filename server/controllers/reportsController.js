const Sale = require('../models/Sale');
const Item = require('../models/Item');
const Category = require('../models/ProductCategory');

// Generate comprehensive sales report
const generateSalesReportController = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "စတင်ရက်စွဲနှင့် ဆုံးရက်စွဲကို ထည့်သွင်းပေးပါ"
      });
    }

    const salesData = await Sale.find({
      saleDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .populate('items.item', 'name selling_price cost_price category_id')
    .sort({ saleDate: -1 });

    const summary = await Sale.aggregate([
      {
        $match: {
          saleDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: "$totalAmount" },
          totalItems: { $sum: { $size: "$items" } }
        }
      }
    ]);

    const categoryBreakdown = await Sale.aggregate([
      {
        $match: {
          saleDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "items",
          localField: "items.item",
          foreignField: "_id",
          as: "item"
        }
      },
      { $unwind: "$item" },
      {
        $lookup: {
          from: "productcategories",
          localField: "item.category_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category.name",
          totalRevenue: { $sum: "$items.totalPrice" },
          totalQuantity: { $sum: "$items.quantity" },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    const paymentMethodStats = await Sale.aggregate([
      {
        $match: {
          saleDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: "$paymentMethod",
          totalSales: { $sum: "$totalAmount" },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    const report = {
      period: { startDate, endDate },
      summary: summary[0] || {
        totalSales: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        totalItems: 0
      },
      categoryBreakdown,
      paymentMethodStats,
      salesData
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvData = generateSalesCSV(salesData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales-report-${startDate}-to-${endDate}.csv"`);
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "အစီရင်ခံစာကို မဖန်တီးနိုင်ပါ",
      error: error.message
    });
  }
};

// Generate inventory report
const generateInventoryReportController = async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    // Get inventory data without population first
    const inventoryData = await Item.find()
      .sort({ name: 1 });

    const summary = await Item.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$selling_price", "$stock_quantity"] } },
          lowStockItems: {
            $sum: { $cond: [{ $lt: ["$stock_quantity", "$low_stock_threshold"] }, 1, 0] }
          },
          outOfStockItems: {
            $sum: { $cond: [{ $eq: ["$stock_quantity", 0] }, 1, 0] }
          }
        }
      }
    ]);

    const report = {
      generatedAt: new Date(),
      summary: summary[0] || {
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      },
      inventoryData
    };

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      success: false,
      message: "အရေအတွက်စာရင်းကို မဖန်တီးနိုင်ပါ",
      error: error.message
    });
  }
};

// Generate profit/loss report
const generateProfitReportController = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "စတင်ရက်စွဲနှင့် ဆုံးရက်စွဲကို ထည့်သွင်းပေးပါ"
      });
    }

    const salesData = await Sale.find({
      saleDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .populate('items.item', 'name cost_price selling_price');

    let totalRevenue = 0;
    let totalCost = 0;
    const itemProfit = [];

    salesData.forEach(sale => {
      sale.items.forEach(itemData => {
        const item = itemData.item;
        const revenue = itemData.totalPrice;
        const cost = item.cost_price ? item.cost_price * itemData.quantity : 0;
        const profit = revenue - cost;

        totalRevenue += revenue;
        totalCost += cost;

        itemProfit.push({
          item: item.name,
          quantity: itemData.quantity,
          revenue,
          cost,
          profit,
          profitMargin: cost > 0 ? (profit / revenue) * 100 : 0
        });
      });
    });

    const totalProfit = totalRevenue - totalCost;
    const overallProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          overallProfitMargin
        },
        itemProfit,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "အမြတ်အစွန်းစာရင်းကို မဖန်တီးနိုင်ပါ",
      error: error.message
    });
  }
};

// Generate financial report (alias for profit report)
const generateFinancialReportController = async (req, res) => {
  return generateProfitReportController(req, res);
};

// Generate customer report
const generateCustomerReportController = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const customerStats = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$customerName",
          totalPurchases: { $sum: "$totalAmount" },
          transactionCount: { $sum: 1 },
          averageTransaction: { $avg: "$totalAmount" },
          lastPurchase: { $max: "$saleDate" }
        }
      },
      { $sort: { totalPurchases: -1 } },
      { $limit: 100 }
    ]);

    const summary = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalCustomers: { $addToSet: "$customerName" },
          totalTransactions: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }
        }
      },
      {
        $project: {
          totalCustomers: { $size: "$totalCustomers" },
          totalTransactions: 1,
          totalRevenue: 1,
          averageRevenuePerCustomer: {
            $divide: ["$totalRevenue", { $size: "$totalCustomers" }]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: startDate && endDate ? { startDate, endDate } : null,
        summary: summary[0] || {
          totalCustomers: 0,
          totalTransactions: 0,
          totalRevenue: 0,
          averageRevenuePerCustomer: 0
        },
        customerStats,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "ဖောက်သည်အစီရင်ခံစာကို မဖန်တီးနိုင်ပါ",
      error: error.message
    });
  }
};

// Generate product report
const generateProductReportController = async (req, res) => {
  try {
    const productStats = await Sale.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "items",
          localField: "items.item",
          foreignField: "_id",
          as: "item"
        }
      },
      { $unwind: "$item" },
      {
        $group: {
          _id: "$item._id",
          productName: { $first: "$item.name" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
          averagePrice: { $avg: "$items.unitPrice" },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    const inventoryData = await Item.find()
      .populate('category_id', 'name')
      .select('name stock_quantity selling_price category_id');

    res.json({
      success: true,
      data: {
        productStats,
        inventoryData,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "ပစ္စည်းအစီရင်ခံစာကို မဖန်တီးနိုင်ပါ",
      error: error.message
    });
  }
};

// Export report controller
const exportReportController = async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'pdf' } = req.query;

    // For now, return a simple response indicating export is not yet implemented
    res.json({
      success: false,
      message: "Export အင်္ဂါရပ်ကို မကြာမီ ထည့်သွင်းပေးမည်",
      data: {
        type,
        format,
        message: "Export functionality will be implemented soon"
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Export လုပ်ဆောင်မှုမှာ အမှားရှိနေပါသည်",
      error: error.message
    });
  }
};

// Helper function to generate CSV for sales
function generateSalesCSV(salesData) {
  const headers = [
    'Date',
    'Invoice Number',
    'Customer Name',
    'Item Name',
    'Quantity',
    'Unit Price',
    'Total Price',
    'Payment Method',
    'Subtotal',
    'Discount',
    'Tax',
    'Total Amount'
  ];

  const rows = [];
  salesData.forEach(sale => {
    sale.items.forEach(item => {
      rows.push([
        sale.saleDate.toISOString().split('T')[0],
        sale.invoiceNumber,
        sale.customerName || '',
        item.item.name,
        item.quantity,
        item.unitPrice,
        item.totalPrice,
        sale.paymentMethod,
        sale.subtotal,
        sale.discount,
        sale.tax,
        sale.totalAmount
      ]);
    });
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

// Helper function to generate CSV for inventory
function generateInventoryCSV(inventoryData) {
  const headers = [
    'Item Name',
    'Category',
    'Stock Quantity',
    'Selling Price',
    'Cost Price',
    'Total Value',
    'Expiry Date',
    'Status'
  ];

  const rows = inventoryData.map(item => [
    item.name,
    item.category_id?.name || '',
    item.stock_quantity,
    item.selling_price,
    item.cost_price || 0,
    item.selling_price * item.stock_quantity,
    item.expiry_date ? item.expiry_date.toISOString().split('T')[0] : '',
    item.stock_quantity === 0 ? 'Out of Stock' : 
      item.stock_quantity < item.low_stock_threshold ? 'Low Stock' : 'In Stock'
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

module.exports = {
  generateSalesReportController,
  generateInventoryReportController,
  generateProfitReportController,
  generateFinancialReportController,
  generateCustomerReportController,
  generateProductReportController,
  exportReportController
};
