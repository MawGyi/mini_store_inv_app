const express = require('express');
const cors = require('cors');
// const mongoose = require('mongoose'); // Disabled for local demo
require('dotenv').config();
const mockStore = require('./utils/mockStore');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection - Disabled
const connectDB = async () => {
  console.log('Running in local demo mode (No MongoDB connection)');
  return Promise.resolve();
};

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running (Local Demo Mode)' });
});

// Inventory management endpoints - Mock Store CRUD operations

// GET all items
app.get('/api/items', (req, res) => {
  try {
    const items = mockStore.getAllItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single item
app.get('/api/items/:id', (req, res) => {
  try {
    const item = mockStore.getItemById(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new item
app.post('/api/items', (req, res) => {
  try {
    const savedItem = mockStore.createItem(req.body);
    res.status(201).json(savedItem);
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// PUT update item
app.put('/api/items/:id', (req, res) => {
  try {
    const updatedItem = mockStore.updateItem(req.params.id, req.body);
    if (updatedItem) {
      res.json(updatedItem);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// DELETE item
app.delete('/api/items/:id', (req, res) => {
  try {
    const deletedItem = mockStore.deleteItem(req.params.id);
    if (deletedItem) {
      res.json(deletedItem);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sales routes
const salesRoutes = require('./routes/salesRoutes');
app.use('/api/sales', salesRoutes);

// Dashboard routes
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Available endpoints:');
      console.log('  POST /api/sales - Create new sale');
      console.log('  GET /api/sales - Get all sales with pagination');
      console.log('  GET /api/sales/:id - Get single sale details');
      console.log('  GET /api/sales/summary/daily - Get daily sales summary');
      console.log('  GET /api/sales/summary/monthly - Get monthly sales summary');
      console.log('  GET /api/sales/top-selling - Get top selling items report');
      console.log('  GET /api/dashboard/overview - Business overview');
      console.log('  GET /api/dashboard/inventory-summary - Inventory analytics');
      console.log('  GET /api/dashboard/sales-trends - Sales trends');
      console.log('  GET /api/dashboard/category-performance - Category analytics');
      console.log('  GET /api/dashboard/alerts - System alerts');
      console.log('  GET /api/health - Health check');
    });
  });
}

module.exports = app;
