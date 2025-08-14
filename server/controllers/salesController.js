const Sale = require('../models/Sale');
const Item = require('../models/Item');
const mongoose = require('mongoose');

// Create new sale with stock validation and transaction
const createSaleController = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { items, paymentMethod, discount = 0, tax = 0, customerName = '' } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "အရောင်းပစ္စည်းများကို ထည့်သွင်းပေးပါ"
      });
    }

    let totalAmount = 0;
    const processedItems = [];

    // Validate and process each item
    for (const itemData of items) {
      const { item: itemId, quantity, unitPrice } = itemData;
      
      if (!itemId || !quantity || quantity <= 0) {
        throw new Error("အရောင်းပစ္စည်းအချက်အလက်များ မပြည့်စုံပါ");
      }

      const item = await Item.findById(itemId).session(session);
      if (!item) {
        throw new Error(`ပစ္စည်း ID ${itemId} မတွေ့ပါ`);
      }

      if (item.stockQuantity < quantity) {
        throw new Error(`${item.name} အတွက် စတော့မလုံလောက်ပါ (${item.stockQuantity} ကျန်ရှိ)`);
      }

      const itemTotal = quantity * (unitPrice || item.price);
      totalAmount += itemTotal;

      // Deduct stock
      item.stockQuantity -= quantity;
      await item.save({ session });

      processedItems.push({
        item: itemId,
        quantity,
        unitPrice: unitPrice || item.price,
        totalPrice: itemTotal
      });
    }

    // Calculate final amount
    const subtotal = totalAmount;
    const discountAmount = (subtotal * discount) / 100;
    const taxAmount = (subtotal * tax) / 100;
    const finalAmount = subtotal - discountAmount + taxAmount;

    // Generate invoice number
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    const saleCount = await Sale.countDocuments({
      saleDate: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
      }
    });
    const invoiceNumber = `INV-${datePrefix}-${String(saleCount + 1).padStart(4, '0')}`;

    const sale = new Sale({
      invoiceNumber,
      items: processedItems,
      subtotal,
      discount,
      tax,
      totalAmount: finalAmount,
      paymentMethod,
      customerName,
      saleDate: new Date()
    });

    await sale.save({ session });
    await session.commitTransaction();

    // Populate items for response
    await sale.populate('items.item', 'name price');

    res.status(201).json({
      success: true,
      message: "အရောင်း အောင်မြင်ပါသည်",
      data: sale
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Sale creation error:', error);
    
    res.status(400).json({
      success: false,
      message: error.message || "အရောင်း မအောင်မြင်ပါ",
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Get all sales with pagination and filtering
const getAllSalesController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      paymentMethod,
      search
    } = req.query;

    const query = {};
    
    if (startDate && endDate) {
      query.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const sales = await Sale.find(query)
      .populate('items.item', 'name price')
      .sort({ saleDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sale.countDocuments(query);

    res.json({
      success: true,
      data: {
        sales,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalSales: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "အရောင်းစာရင်းများကို မရနိုင်ပါ",
      error: error.message
    });
  }
};

// Get single sale by ID
const getSaleByIdController = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('items.item', 'name selling_price cost_price category_id');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "အရောင်းစာရင်း မတွေ့ပါ"
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "အရောင်းစာရင်းကို မရနိုင်ပါ",
      error: error.message
    });
  }
};

// Get daily sales summary
const getDailySalesSummaryController = async (req, res) => {
  try {
    const { date = new Date() } = req.query;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const summary = await Sale.aggregate([
      {
        $match: {
          saleDate: {
            $gte: targetDate,
            $lt: nextDay
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          transactionCount: { $sum: 1 },
          averageSale: { $avg: "$totalAmount" }
        }
      }
    ]);

    const sales = await Sale.find({
      saleDate: {
        $gte: targetDate,
        $lt: nextDay
      }
    })
    .populate('items.item', 'name')
    .sort({ saleDate: -1 });

    res.json({
      success: true,
      data: {
        date: targetDate,
        summary: summary[0] || { totalSales: 0, transactionCount: 0, averageSale: 0 },
        sales
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "နေ့စဉ်အရောင်းအချက်အလက်များ မရနိုင်ပါ",
      error: error.message
    });
  }
};

// Get monthly sales summary
const getMonthlySalesSummaryController = async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 1);

    const summary = await Sale.aggregate([
      {
        $match: {
          saleDate: {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          transactionCount: { $sum: 1 },
          averageSale: { $avg: "$totalAmount" }
        }
      }
    ]);

    const dailyBreakdown = await Sale.aggregate([
      {
        $match: {
          saleDate: {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
          totalSales: { $sum: "$totalAmount" },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        summary: summary[0] || { totalSales: 0, transactionCount: 0, averageSale: 0 },
        dailyBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "လအရောင်းအချက်အလက်များ မရနိုင်ပါ",
      error: error.message
    });
  }
};

// Get top selling items
const getTopSellingItemsController = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        saleDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Check if there are any sales first
    const salesCount = await Sale.countDocuments(dateFilter);
    if (salesCount === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const topItems = await Sale.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.item",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
          saleCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "item"
        }
      },
      { $unwind: "$item" },
      {
        $lookup: {
          from: "categories",
          localField: "item.category",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          itemId: "$_id",
          name: "$item.name",
          quantitySold: "$totalQuantity",
          totalRevenue: "$totalRevenue",
          saleCount: "$saleCount",
          category: {
            $ifNull: ["$category.name", "Uncategorized"]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: topItems
    });
  } catch (error) {
    console.error('Top selling items error:', error);
    res.status(500).json({
      success: false,
      message: "အရောင်းအကောင်းဆုံးပစ္စည်းများ မရနိုင်ပါ",
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
