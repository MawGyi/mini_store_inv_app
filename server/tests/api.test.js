const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index.js');

describe('Item Management APIs', () => {
  describe('POST /api/items', () => {
    it('should create a new item successfully', async () => {
      const newItem = {
        name: 'Test Item',
        itemCode: 'TEST001',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10,
        expiryDate: '2025-12-31'
      };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body.itemCode).toBe(newItem.itemCode);
      expect(response.body.price).toBe(newItem.price);
      expect(response.body.stockQuantity).toBe(newItem.stockQuantity);
    });

    it('should handle validation errors for missing required fields', async () => {
      const invalidItem = {
        name: 'Test Item'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle duplicate item code', async () => {
      const item = {
        name: 'Test Item 1',
        itemCode: 'DUPLICATE001',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      // Create first item
      await request(app)
        .post('/api/items')
        .send(item)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/items')
        .send({ ...item, name: 'Test Item 2' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid price values', async () => {
      const invalidItem = {
        name: 'Test Item',
        itemCode: 'TEST002',
        price: -10,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/items', () => {
    it('should retrieve all items successfully', async () => {
      // Create test items
      const items = [
        {
          name: 'Item 1',
          itemCode: 'CODE001',
          price: 10.99,
          stockQuantity: 100,
          lowStockThreshold: 10
        },
        {
          name: 'Item 2',
          itemCode: 'CODE002',
          price: 15.99,
          stockQuantity: 50,
          lowStockThreshold: 5
        }
      ];

      for (const item of items) {
        await request(app).post('/api/items').send(item);
      }

      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('itemCode');
    });

    it('should return empty array when no items exist', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should retrieve a single item by ID', async () => {
      const newItem = {
        name: 'Single Item',
        itemCode: 'SINGLE001',
        price: 20.99,
        stockQuantity: 75,
        lowStockThreshold: 15
      };

      const createResponse = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      const itemId = createResponse.body._id;

      const response = await request(app)
        .get(`/api/items/${itemId}`)
        .expect(200);

      expect(response.body.name).toBe(newItem.name);
      expect(response.body.itemCode).toBe(newItem.itemCode);
    });

    it('should return 404 for non-existent item ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/items/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should handle invalid ID format', async () => {
      const response = await request(app)
        .get('/api/items/invalid-id')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update an existing item successfully', async () => {
      const newItem = {
        name: 'Original Item',
        itemCode: 'UPDATE001',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      const createResponse = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      const itemId = createResponse.body._id;
      const updatedData = {
        name: 'Updated Item',
        price: 15.99,
        stockQuantity: 150
      };

      const response = await request(app)
        .put(`/api/items/${itemId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.name).toBe(updatedData.name);
      expect(response.body.price).toBe(updatedData.price);
      expect(response.body.stockQuantity).toBe(updatedData.stockQuantity);
      expect(response.body.itemCode).toBe(newItem.itemCode); // Should remain unchanged
    });

    it('should handle partial updates', async () => {
      const newItem = {
        name: 'Partial Update Item',
        itemCode: 'PARTIAL001',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      const createResponse = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      const itemId = createResponse.body._id;
      const partialUpdate = { price: 25.99 };

      const response = await request(app)
        .put(`/api/items/${itemId}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.price).toBe(25.99);
      expect(response.body.name).toBe(newItem.name); // Should remain unchanged
    });

    it('should return 404 for non-existent item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/items/${nonExistentId}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should handle validation errors during update', async () => {
      const newItem = {
        name: 'Validation Test',
        itemCode: 'VALID001',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      const createResponse = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      const itemId = createResponse.body._id;

      const response = await request(app)
        .put(`/api/items/${itemId}`)
        .send({ price: -5 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an existing item successfully', async () => {
      const newItem = {
        name: 'Delete Test Item',
        itemCode: 'DELETE001',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      const createResponse = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      const itemId = createResponse.body._id;

      const deleteResponse = await request(app)
        .delete(`/api/items/${itemId}`)
        .expect(200);

      expect(deleteResponse.body._id).toBe(itemId);

      // Verify item is deleted
      await request(app)
        .get(`/api/items/${itemId}`)
        .expect(404);
    });

    it('should return 404 for non-existent item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/items/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should handle invalid ID format', async () => {
      const response = await request(app)
        .delete('/api/items/invalid-id')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});

describe('Sales APIs', () => {
  describe('GET /api/sales/summary/daily', () => {
    it('should return daily sales summary', async () => {
      // Create test items for sales data
      const items = [
        {
          name: 'Sales Item 1',
          itemCode: 'SALES001',
          price: 10.99,
          stockQuantity: 100,
          lowStockThreshold: 10
        },
        {
          name: 'Sales Item 2',
          itemCode: 'SALES002',
          price: 15.99,
          stockQuantity: 50,
          lowStockThreshold: 5
        }
      ];

      for (const item of items) {
        await request(app).post('/api/items').send(item);
      }

      const response = await request(app)
        .get('/api/sales/summary/daily')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/sales/top-selling', () => {
    it('should return top selling items', async () => {
      // Create test items
      const items = [
        {
          name: 'Top Item 1',
          itemCode: 'TOP001',
          price: 20.99,
          stockQuantity: 200,
          lowStockThreshold: 20
        },
        {
          name: 'Top Item 2',
          itemCode: 'TOP002',
          price: 25.99,
          stockQuantity: 150,
          lowStockThreshold: 15
        }
      ];

      for (const item of items) {
        await request(app).post('/api/items').send(item);
      }

      const response = await request(app)
        .get('/api/sales/top-selling')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      // We haven't created any sales, so data should be empty
      expect(response.body.data).toHaveLength(0);
    });
  });
});

describe('Health Check API', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message', 'Server is running');
    });
  });
});

describe('Error Handling', () => {
  it('should handle 404 for non-existent endpoints', async () => {
    const response = await request(app)
      .get('/api/non-existent')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Endpoint not found');
  });
});
