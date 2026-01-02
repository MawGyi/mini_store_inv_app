const mockStore = require('../utils/mockStore');

// Create new sale
const createSaleController = async (req, res) => {
  try {
    const { items, payment_method, customer_name } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and cannot be empty'
      });
    }

    if (!payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Validate items and check stock
    const validatedItems = [];
    let calculatedTotal = 0;

    for (const itemData of items) {
      const { item_id, quantity, unit_price } = itemData;

      // Check if item exists
      const item = mockStore.getItemById(item_id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Item not found: ${item_id}`
        });
      }

      // Check stock availability
      if (item.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Available: ${item.stockQuantity}, Requested: ${quantity}`
        });
      }

      const total_price = quantity * unit_price;
      calculatedTotal += total_price;

      validatedItems.push({
        item_id,
        quantity,
        unit_price,
        total_price
      });

      // Update item stock
      mockStore.updateItem(item_id, {
        stockQuantity: item.stockQuantity - quantity
      });
    }

    // Create sale
    const sale = mockStore.createSale({
      items: validatedItems,
      total_amount: calculatedTotal,
      payment_method,
      customer_name: customer_name || undefined
    });

    // Populate item details manually for response
    const populatedSale = { ...sale };
    populatedSale.items = populatedSale.items.map(saleItem => {
      const item = mockStore.getItemById(saleItem.item_id);
      const category = item ? mockStore.getCategoryById(item.category) : null;
      return {
        ...saleItem,
        item_id: item ? {
          ...item,
          category: category
        } : null
      };
    });

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: populatedSale
    });

  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sale',
      error: error.message
    });
  }
};

// Get all sales with pagination and filtering
const getAllSalesController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      start_date,
      end_date,
      payment_method
    } = req.query;

    const filters = {};
    if (start_date) filters.startDate = start_date;
    if (end_date) filters.endDate = end_date;
    // Payment method filter not implemented in mockStore yet, but could be added easily

    let sales = mockStore.getAllSales(filters);

    if (payment_method) {
      sales = sales.filter(s => s.payment_method === payment_method);
    }

    const total = sales.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const paginatedSales = sales.slice(skip, skip + limitNum);

    // Populate item details
    const populatedSales = paginatedSales.map(sale => {
      const populatedSale = { ...sale };
      populatedSale.items = populatedSale.items.map(saleItem => {
        const item = mockStore.getItemById(saleItem.item_id);
        const category = item ? mockStore.getCategoryById(item.category) : null;
        return {
          ...saleItem,
          item_id: item ? {
            ...item,
            category: category
          } : null
        };
      });
      return populatedSale;
    });

    res.json({
      success: true,
      message: 'Sales retrieved successfully',
      data: {
        sales: populatedSales,
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving sales',
      error: error.message
    });
  }
};

// Get single sale by ID
const getSaleByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = mockStore.getSaleById(id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Populate item details
    const populatedSale = { ...sale };
    populatedSale.items = populatedSale.items.map(saleItem => {
      const item = mockStore.getItemById(saleItem.item_id);
      const category = item ? mockStore.getCategoryById(item.category) : null;
      return {
        ...saleItem,
        item_id: item ? {
          ...item,
          category: category
        } : null
      };
    });

    res.json({
      success: true,
      message: 'Sale retrieved successfully',
      data: populatedSale
    });

  } catch (error) {
    console.error('Error retrieving sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving sale',
      error: error.message
    });
  }
};

// Get daily sales summary
const getDailySalesSummaryController = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const filters = {};
    if (start_date) filters.startDate = start_date;
    if (end_date) filters.endDate = end_date;

    const sales = mockStore.getAllSales(filters);

    // Group by date
    const summaryMap = {};
    sales.forEach(sale => {
      const dateKey = new Date(sale.sale_date).toISOString().split('T')[0];
      if (!summaryMap[dateKey]) {
        summaryMap[dateKey] = {
          date: new Date(dateKey),
          total_sales: 0,
          transaction_count: 0
        };
      }
      summaryMap[dateKey].total_sales += sale.total_amount;
      summaryMap[dateKey].transaction_count += 1;
    });

    const summary = Object.values(summaryMap).map(item => ({
      ...item,
      average_sale: parseFloat((item.total_sales / item.transaction_count).toFixed(2))
    })).sort((a, b) => b.date - a.date);

    res.json({
      success: true,
      message: 'Daily sales summary retrieved successfully',
      data: summary
    });

  } catch (error) {
    console.error('Error retrieving daily sales summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving daily sales summary',
      error: error.message
    });
  }
};

// Get monthly sales summary
const getMonthlySalesSummaryController = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const filters = {};
    if (start_date) filters.startDate = start_date;
    if (end_date) filters.endDate = end_date;

    const sales = mockStore.getAllSales(filters);

    // Group by month
    const summaryMap = {};
    sales.forEach(sale => {
      const date = new Date(sale.sale_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

      if (!summaryMap[monthKey]) {
        summaryMap[monthKey] = {
          month: new Date(monthKey),
          total_sales: 0,
          transaction_count: 0
        };
      }
      summaryMap[monthKey].total_sales += sale.total_amount;
      summaryMap[monthKey].transaction_count += 1;
    });

    const summary = Object.values(summaryMap).map(item => ({
      ...item,
      average_sale: parseFloat((item.total_sales / item.transaction_count).toFixed(2))
    })).sort((a, b) => b.month - a.month);

    res.json({
      success: true,
      message: 'Monthly sales summary retrieved successfully',
      data: summary
    });

  } catch (error) {
    console.error('Error retrieving monthly sales summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving monthly sales summary',
      error: error.message
    });
  }
};

// Get top selling items
const getTopSellingItemsController = async (req, res) => {
  try {
    const { limit = 10, start_date, end_date } = req.query;
    const filters = {};
    if (start_date) filters.startDate = start_date;
    if (end_date) filters.endDate = end_date;

    const sales = mockStore.getAllSales(filters);

    const itemStats = {};

    sales.forEach(sale => {
      sale.items.forEach(saleItem => {
        if (!itemStats[saleItem.item_id]) {
          itemStats[saleItem.item_id] = {
            item_id: saleItem.item_id,
            total_quantity_sold: 0,
            total_revenue: 0
          };
        }
        itemStats[saleItem.item_id].total_quantity_sold += saleItem.quantity;
        itemStats[saleItem.item_id].total_revenue += saleItem.total_price;
      });
    });

    const topSelling = Object.values(itemStats)
      .map(stat => {
        const item = mockStore.getItemById(stat.item_id);
        const category = item ? mockStore.getCategoryById(item.category) : null;
        return {
          ...stat,
          item_details: item ? {
            _id: item._id,
            name: item.name,
            item_code: item.itemCode,
            category: category ? {
              _id: category._id,
              category_name_my: category.category_name_my
            } : null
          } : null
        };
      })
      .filter(item => item.item_details) // Remove items that might have been deleted
      .sort((a, b) => b.total_quantity_sold - a.total_quantity_sold)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      message: 'Top selling items retrieved successfully',
      data: topSelling
    });

  } catch (error) {
    console.error('Error retrieving top selling items:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving top selling items',
      error: error.message
    });
  }
};

module.exports = {
  createSaleController,
  getAllSalesController,
  getSaleByIdController,
  getDailySalesSummaryController,
  getMonthlySalesSummaryController,
  getTopSellingItemsController
};
