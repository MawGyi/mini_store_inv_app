import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
let mockItems = [
  {
    _id: '1',
    name: 'ရန်ကုန်ကော်လာ',
    item_code: 'YGN-COLA-001',
    selling_price: 500,
    cost_price: 350,
    stock_quantity: 25,
    low_stock_threshold: 10,
    category_id: { category_name_my: 'အဖျော်ယမကာ' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'မွန်ဇုံ',
    item_code: 'SNACK-MZ-001',
    selling_price: 800,
    cost_price: 600,
    stock_quantity: 5,
    low_stock_threshold: 10,
    category_id: { category_name_my: 'အစားအစာ' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '3',
    name: 'ဆပ်ပြာ',
    item_code: 'SOAP-001',
    selling_price: 1200,
    cost_price: 900,
    stock_quantity: 0,
    low_stock_threshold: 5,
    category_id: { category_name_my: 'နေ့စဉ်လိုအပ်သော' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '4',
    name: 'တီရန်း',
    item_code: 'TEA-TR-001',
    selling_price: 300,
    cost_price: 200,
    stock_quantity: 50,
    low_stock_threshold: 15,
    category_id: { category_name_my: 'အဖျော်ယမကာ' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '5',
    name: 'ကော်ဖီမစ်',
    item_code: 'COFFEE-MIX-001',
    selling_price: 1500,
    cost_price: 1200,
    stock_quantity: 30,
    low_stock_threshold: 8,
    category_id: { category_name_my: 'အဖျော်ယမကာ' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '6',
    name: 'ပုဆိန်',
    item_code: 'BISCUIT-001',
    selling_price: 600,
    cost_price: 450,
    stock_quantity: 40,
    low_stock_threshold: 12,
    category_id: { category_name_my: 'အစားအစာ' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '7',
    name: 'ရေသန့်',
    item_code: 'WATER-001',
    selling_price: 200,
    cost_price: 120,
    stock_quantity: 8,
    low_stock_threshold: 20,
    category_id: { category_name_my: 'အဖျော်ယမကာ' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '8',
    name: 'သွားတိုက်ဆေး',
    item_code: 'TOOTHPASTE-001',
    selling_price: 2000,
    cost_price: 1500,
    stock_quantity: 15,
    low_stock_threshold: 5,
    category_id: { category_name_my: 'နေ့စဉ်လိုအပ်သော' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '9',
    name: 'ခေါင်းလည်းပူဆေး',
    item_code: 'MEDICINE-001',
    selling_price: 3000,
    cost_price: 2200,
    stock_quantity: 20,
    low_stock_threshold: 6,
    category_id: { category_name_my: 'ဆေးဝါး' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '10',
    name: 'လက်ဖက်ရည်အရွက်',
    item_code: 'TEA-LEAF-001',
    selling_price: 2500,
    cost_price: 1800,
    stock_quantity: 12,
    low_stock_threshold: 5,
    category_id: { category_name_my: 'အစားအစာ' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let mockCategories = [
  { _id: '1', category_name_my: 'အဖျော်ယမကာ', description: 'Beverages' },
  { _id: '2', category_name_my: 'အစားအစာ', description: 'Food items' },
  { _id: '3', category_name_my: 'နေ့စဉ်လိုအပ်သော', description: 'Daily necessities' },
  { _id: '4', category_name_my: 'ဆေးဝါး', description: 'Medicines' }
];

let mockSales = [
  {
    _id: '1',
    invoiceNumber: 'INV-001',
    items: [
      { item: mockItems[0], quantity: 2, price: 500 }
    ],
    totalAmount: 1000,
    createdAt: new Date().toISOString()
  }
];

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Myanmar Grocery Store Inventory API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Dashboard routes
app.get('/api/dashboard/overview', (req, res) => {
  const totalItems = mockItems.length;
  const lowStockItems = mockItems.filter(item => item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0).length;
  const outOfStockItems = mockItems.filter(item => item.stock_quantity === 0).length;
  const todaySales = mockSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const todayTransactions = mockSales.length;

  res.json({
    success: true,
    data: {
      totalItems,
      lowStockItems,
      outOfStockItems,
      todaySales,
      todayTransactions,
      recentSales: mockSales.slice(0, 5)
    }
  });
});

app.get('/api/dashboard/alerts', (req, res) => {
  const alerts = [];
  
  const lowStockItems = mockItems.filter(item => 
    item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0
  );
  
  const outOfStockItems = mockItems.filter(item => item.stock_quantity === 0);
  
  if (lowStockItems.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${lowStockItems.length} ပစ္စည်းများ လက်ကျန်နည်းနေပါသည်`,
      items: lowStockItems
    });
  }
  
  if (outOfStockItems.length > 0) {
    alerts.push({
      type: 'danger',
      message: `${outOfStockItems.length} ပစ္စည်းများ လုံးဝကုန်သွားပါပြီ`,
      items: outOfStockItems
    });
  }

  res.json({
    success: true,
    data: alerts
  });
});

app.get('/api/dashboard/sales-trends', (req, res) => {
  // Generate mock trends data for the last 7 days
  const trends = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trends.push({
      date: date.toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 200000) + 100000,
      count: Math.floor(Math.random() * 20) + 10
    });
  }

  res.json({
    success: true,
    data: trends
  });
});

// Items routes
app.get('/api/items', (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  
  let filteredItems = mockItems;
  
  if (search) {
    filteredItems = mockItems.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.item_code.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const items = filteredItems.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredItems.length / limit),
        totalItems: filteredItems.length,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

app.get('/api/items/:id', (req, res) => {
  const item = mockItems.find(item => item._id === req.params.id);
  
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'ပစ္စည်းမတွေ့ရှိပါ'
    });
  }
  
  res.json({
    success: true,
    data: item
  });
});

app.post('/api/items', (req, res) => {
  const newItem = {
    _id: (mockItems.length + 1).toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockItems.push(newItem);
  
  res.status(201).json({
    success: true,
    data: newItem,
    message: 'ပစ္စည်းအသစ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ'
  });
});

app.put('/api/items/:id', (req, res) => {
  const itemIndex = mockItems.findIndex(item => item._id === req.params.id);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'ပစ္စည်းမတွေ့ရှိပါ'
    });
  }
  
  mockItems[itemIndex] = {
    ...mockItems[itemIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: mockItems[itemIndex],
    message: 'ပစ္စည်း အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ'
  });
});

app.delete('/api/items/:id', (req, res) => {
  const itemIndex = mockItems.findIndex(item => item._id === req.params.id);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'ပစ္စည်းမတွေ့ရှိပါ'
    });
  }
  
  const deletedItem = mockItems.splice(itemIndex, 1)[0];
  
  res.json({
    success: true,
    data: deletedItem,
    message: 'ပစ္စည်း အောင်မြင်စွာ ဖျက်ပြီးပါပြီ'
  });
});

// Categories routes
app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    data: mockCategories
  });
});

// Sales routes
app.get('/api/sales', (req, res) => {
  res.json({
    success: true,
    data: mockSales
  });
});

app.post('/api/sales', (req, res) => {
  const newSale = {
    _id: (mockSales.length + 1).toString(),
    invoiceNumber: `INV-${String(mockSales.length + 1).padStart(3, '0')}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  mockSales.push(newSale);
  
  // Update stock quantities
  if (req.body.items && Array.isArray(req.body.items)) {
    req.body.items.forEach(saleItem => {
      // Handle both direct item reference and nested item object
      const itemId = saleItem.item?._id || saleItem.item_id || saleItem._id;
      
      if (itemId) {
        const item = mockItems.find(item => item && item._id === itemId);
        if (item && typeof saleItem.quantity === 'number') {
          item.stock_quantity = Math.max(0, item.stock_quantity - saleItem.quantity);
        }
      }
    });
  }
  
  res.status(201).json({
    success: true,
    data: newSale,
    message: 'အရောင်း အောင်မြင်စွာ မှတ်တမ်းတင်ပြီးပါပြီ'
  });
});

app.get('/api/sales/top-selling', (req, res) => {
  const { limit = 10 } = req.query;
  
  // Mock top selling items
  const topSelling = mockItems.map(item => ({
    ...item,
    quantitySold: Math.floor(Math.random() * 50) + 10,
    totalRevenue: (Math.floor(Math.random() * 50) + 10) * item.selling_price
  })).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: topSelling
  });
});

// Reports routes  
app.get('/api/reports/inventory', (req, res) => {
  const totalItems = mockItems.length;
  const lowStockItems = mockItems.filter(item => 
    item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0
  ).length;
  const outOfStockItems = mockItems.filter(item => item.stock_quantity === 0).length;
  const totalValue = mockItems.reduce((sum, item) => sum + (item.selling_price * item.stock_quantity), 0);

  res.json({
    success: true,
    data: {
      summary: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalValue
      }
    }
  });
});

// Error handling
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard API available at http://localhost:${PORT}/api/dashboard/overview`);
  console.log(`🏪 Items API available at http://localhost:${PORT}/api/items`);
  console.log(`📋 Categories API available at http://localhost:${PORT}/api/categories`);
});

export default app;
