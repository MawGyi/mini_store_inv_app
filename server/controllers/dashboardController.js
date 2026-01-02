const mockStore = require('../utils/mockStore');

// Get overall business overview
const getOverviewController = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get inventory stats
    const items = mockStore.getAllItems();
    const categories = mockStore.getAllCategories();

    const totalItems = items.length;
    const totalCategories = categories.length;
    const lowStockItems = items.filter(item => item.stockQuantity <= (item.lowStockThreshold || 10)).length;
    const outOfStockItems = items.filter(item => item.stockQuantity === 0).length;

    // Get sales
    const allSales = mockStore.getAllSales();

    // Get today's sales
    const todaySalesData = allSales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= today && saleDate < tomorrow;
    });

    const todaySales = {
      count: todaySalesData.length,
      totalAmount: todaySalesData.reduce((sum, sale) => sum + sale.total_amount, 0)
    };

    // Get this month's sales
    const thisMonthSalesData = allSales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= currentMonthStart && saleDate <= currentMonthEnd;
    });

    const thisMonthSales = {
      count: thisMonthSalesData.length,
      totalAmount: thisMonthSalesData.reduce((sum, sale) => sum + sale.total_amount, 0)
    };

    // Get recent sales (last 5)
    const recentSales = allSales
      .slice(0, 5)
      .map(sale => {
        const populatedItems = sale.items.map(saleItem => {
          const item = mockStore.getItemById(saleItem.item_id);
          return {
            ...saleItem,
            item_id: item ? { name: item.name, itemCode: item.itemCode } : null
          };
        });
        return {
          _id: sale._id,
          invoice_number: sale.invoice_number,
          total_amount: sale.total_amount,
          sale_date: sale.sale_date,
          items: populatedItems
        };
      });

    // Get top selling item today
    const itemSalesToday = {};
    todaySalesData.forEach(sale => {
      sale.items.forEach(saleItem => {
        if (!itemSalesToday[saleItem.item_id]) {
          itemSalesToday[saleItem.item_id] = {
            quantity: 0,
            revenue: 0
          };
        }
        itemSalesToday[saleItem.item_id].quantity += saleItem.quantity;
        itemSalesToday[saleItem.item_id].revenue += saleItem.total_price;
      });
    });

    let topSellingToday = null;
    if (Object.keys(itemSalesToday).length > 0) {
      const topItemId = Object.keys(itemSalesToday).reduce((a, b) => itemSalesToday[a].quantity > itemSalesToday[b].quantity ? a : b);
      const item = mockStore.getItemById(topItemId);
      if (item) {
        topSellingToday = {
          _id: topItemId,
          quantity: itemSalesToday[topItemId].quantity,
          revenue: itemSalesToday[topItemId].revenue,
          item: item
        };
      }
    }

    res.json({
      success: true,
      message: 'Dashboard overview retrieved successfully',
      data: {
        inventory: {
          totalItems,
          totalCategories,
          lowStockItems,
          outOfStockItems
        },
        sales: {
          today: todaySales,
          thisMonth: thisMonthSales
        },
        recentSales,
        topSellingToday
      }
    });

  } catch (error) {
    console.error('Error getting dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard overview',
      error: error.message
    });
  }
};

// Get inventory summary
const getInventorySummaryController = async (req, res) => {
  try {
    const items = mockStore.getAllItems();

    // Get inventory value calculations
    const totalCostValue = items.reduce((sum, item) => sum + (item.stockQuantity * item.price), 0);
    const totalRetailValue = totalCostValue; // Assuming price is retail price

    // Get stock status distribution
    const stockStatusMap = { inStock: 0, lowStock: 0, outOfStock: 0 };

    items.forEach(item => {
      if (item.stockQuantity === 0) {
        stockStatusMap.outOfStock++;
      } else if (item.stockQuantity <= (item.lowStockThreshold || 10)) {
        stockStatusMap.lowStock++;
      } else {
        stockStatusMap.inStock++;
      }
    });

    // Get category distribution
    const categoryCount = {};
    items.forEach(item => {
      if (item.category) {
        if (!categoryCount[item.category]) {
          categoryCount[item.category] = 0;
        }
        categoryCount[item.category]++;
      }
    });

    const categoryDistribution = Object.keys(categoryCount).map(catId => {
      const category = mockStore.getCategoryById(catId);
      return {
        _id: catId,
        category_name_my: category ? category.category_name_my : 'Unknown',
        count: categoryCount[catId],
        percentage: (categoryCount[catId] / items.length) * 100
      };
    }).sort((a, b) => b.count - a.count);

    // Get recent inventory changes (last 5)
    // MockStore sorts items by createdAt desc, so we can just take top 5
    const recentChanges = items.slice(0, 5).map(item => ({
      _id: item._id,
      name: item.name,
      itemCode: item.itemCode,
      stockQuantity: item.stockQuantity,
      updatedAt: item.updatedAt
    }));

    res.json({
      success: true,
      message: 'Inventory summary retrieved successfully',
      data: {
        value: {
          totalCostValue,
          totalRetailValue,
          potentialProfit: 0 // Cost price not tracked in simple model
        },
        stockStatus: stockStatusMap,
        categoryDistribution,
        recentChanges
      }
    });

  } catch (error) {
    console.error('Error getting inventory summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving inventory summary',
      error: error.message
    });
  }
};

// Get sales trends
const getSalesTrendsController = async (req, res) => {
  try {
    const { period = '7days' } = req.query;
    const today = new Date();

    let startDate;

    switch (period) {
      case '7days':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const allSales = mockStore.getAllSales({ startDate });

    // Daily trend
    const dailyTrendMap = {};
    allSales.forEach(sale => {
      const dateKey = new Date(sale.sale_date).toISOString().split('T')[0];
      if (!dailyTrendMap[dateKey]) {
        dailyTrendMap[dateKey] = {
          _id: {
            year: new Date(dateKey).getFullYear(),
            month: new Date(dateKey).getMonth() + 1,
            day: new Date(dateKey).getDate()
          },
          salesCount: 0,
          totalAmount: 0,
          date: new Date(dateKey)
        };
      }
      dailyTrendMap[dateKey].salesCount++;
      dailyTrendMap[dateKey].totalAmount += sale.total_amount;
    });

    const dailyTrend = Object.values(dailyTrendMap).sort((a, b) => a.date - b.date);

    // Weekly trend (last 4 weeks)
    const fourWeeksAgo = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
    const weeklySales = mockStore.getAllSales({ startDate: fourWeeksAgo });

    const weeklyTrendMap = {};
    weeklySales.forEach(sale => {
      const date = new Date(sale.sale_date);
      // Simple week number calculation
      const onejan = new Date(date.getFullYear(), 0, 1);
      const week = Math.ceil((((date.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
      const key = `${date.getFullYear()}-${week}`;

      if (!weeklyTrendMap[key]) {
        weeklyTrendMap[key] = {
          _id: { year: date.getFullYear(), week: week },
          salesCount: 0,
          totalAmount: 0
        };
      }
      weeklyTrendMap[key].salesCount++;
      weeklyTrendMap[key].totalAmount += sale.total_amount;
    });

    const weeklyTrend = Object.values(weeklyTrendMap).sort((a, b) => {
      if (a._id.year !== b._id.year) return a._id.year - b._id.year;
      return a._id.week - b._id.week;
    });

    // Best day of week
    const dayOfWeekMap = {};
    allSales.forEach(sale => {
      const day = new Date(sale.sale_date).getDay() + 1; // MongoDB uses 1-7 for Sun-Sat
      if (!dayOfWeekMap[day]) {
        dayOfWeekMap[day] = { _id: day, salesCount: 0, totalAmount: 0 };
      }
      dayOfWeekMap[day].salesCount++;
      dayOfWeekMap[day].totalAmount += sale.total_amount;
    });

    const bestDayOfWeekList = Object.values(dayOfWeekMap).sort((a, b) => b.totalAmount - a.totalAmount);
    const bestDayOfWeek = bestDayOfWeekList.length > 0 ? bestDayOfWeekList[0] : null;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    res.json({
      success: true,
      message: 'Sales trends retrieved successfully',
      data: {
        dailyTrend,
        weeklyTrend,
        bestDayOfWeek: bestDayOfWeek ? dayNames[bestDayOfWeek._id - 1] : 'N/A'
      }
    });

  } catch (error) {
    console.error('Error getting sales trends:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving sales trends',
      error: error.message
    });
  }
};

// Get category performance
const getCategoryPerformanceController = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const filters = {};
    if (start_date) filters.startDate = start_date;
    if (end_date) filters.endDate = end_date;

    const sales = mockStore.getAllSales(filters);
    const categoryStats = {};

    sales.forEach(sale => {
      sale.items.forEach(saleItem => {
        const item = mockStore.getItemById(saleItem.item_id);
        if (item && item.category) {
          if (!categoryStats[item.category]) {
            categoryStats[item.category] = {
              _id: item.category,
              totalQuantitySold: 0,
              totalRevenue: 0,
              itemCount: 0,
              totalUnitPrice: 0
            };
          }
          categoryStats[item.category].totalQuantitySold += saleItem.quantity;
          categoryStats[item.category].totalRevenue += saleItem.total_price;
          categoryStats[item.category].itemCount++;
          categoryStats[item.category].totalUnitPrice += saleItem.unit_price;
        }
      });
    });

    const categoryPerformance = Object.values(categoryStats).map(stat => {
      const category = mockStore.getCategoryById(stat._id);
      return {
        _id: stat._id,
        category_name_my: category ? category.category_name_my : 'Unknown',
        totalQuantitySold: stat.totalQuantitySold,
        totalRevenue: stat.totalRevenue,
        itemCount: stat.itemCount,
        averagePrice: stat.totalUnitPrice / stat.itemCount
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({
      success: true,
      message: 'Category performance retrieved successfully',
      data: categoryPerformance
    });

  } catch (error) {
    console.error('Error getting category performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving category performance',
      error: error.message
    });
  }
};

// Get system alerts
const getAlertsController = async (req, res) => {
  try {
    const items = mockStore.getAllItems();
    const sales = mockStore.getAllSales();

    // Low stock alerts
    const lowStockAlerts = items
      .filter(item => item.stockQuantity > 0 && item.stockQuantity <= (item.lowStockThreshold || 10))
      .map(item => ({
        _id: item._id,
        name: item.name,
        itemCode: item.itemCode,
        current_stock: item.stockQuantity,
        threshold: item.lowStockThreshold || 10,
        urgency: item.stockQuantity <= 2 ? 'critical' :
          (item.stockQuantity <= (item.lowStockThreshold || 10) / 2 ? 'high' : 'medium')
      }))
      .sort((a, b) => a.current_stock - b.current_stock);

    // Out of stock alerts
    const outOfStockAlerts = items
      .filter(item => item.stockQuantity === 0)
      .map(item => ({
        _id: item._id,
        name: item.name,
        itemCode: item.itemCode,
        updatedAt: item.updatedAt,
        urgency: 'critical'
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Recent high-value sales alerts
    const recentHighValueSales = sales
      .filter(sale => sale.total_amount >= 20000)
      .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
      .slice(0, 5)
      .map(sale => ({
        type: 'high_value_sale',
        amount: sale.total_amount,
        invoice_number: sale.invoice_number,
        customer_name: sale.customer_name,
        timestamp: sale.sale_date
      }));

    // Slow moving items (items not sold in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const soldItemIds = new Set();
    sales.forEach(sale => {
      if (new Date(sale.sale_date) >= thirtyDaysAgo) {
        sale.items.forEach(item => soldItemIds.add(item.item_id));
      }
    });

    const slowMovingItems = items
      .filter(item => item.stockQuantity > 0 && !soldItemIds.has(item._id))
      .map(item => ({
        _id: item._id,
        name: item.name,
        itemCode: item.itemCode,
        stockQuantity: item.stockQuantity,
        lastSold: item.updatedAt // Approximation
      }))
      .slice(0, 10);

    res.json({
      success: true,
      message: 'Alerts retrieved successfully',
      data: {
        lowStockAlerts,
        outOfStockAlerts,
        recentSalesAlerts: recentHighValueSales,
        slowMovingItems
      }
    });

  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving alerts',
      error: error.message
    });
  }
};

module.exports = {
  getOverviewController,
  getInventorySummaryController,
  getSalesTrendsController,
  getCategoryPerformanceController,
  getAlertsController
};
