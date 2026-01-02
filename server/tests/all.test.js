const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index.js');

describe('Inventory Management Backend - All Tests', () => {
  describe('Item Management', () => {
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

      it('should handle validation errors', async () => {
        const invalidItem = { name: 'Test Item' };

        await request(app)
          .post('/api/items')
          .send(invalidItem)
          .expect(400);
      });
    });

    describe('GET /api/items', () => {
      it('should retrieve all items', async () => {
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

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should handle empty inventory', async () => {
        const response = await request(app)
          .get('/api/items')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
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

      it('should return 404 for non-existent item', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        await request(app)
          .get(`/api/items/${nonExistentId}`)
          .expect(404);
      });
    });

    describe('PUT /api/items/:id', () => {
      it('should update an existing item', async () => {
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
      });

      it('should return 404 for non-existent item', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        await request(app)
          .put(`/api/items/${nonExistentId}`)
          .send({ name: 'Updated' })
          .expect(404);
      });
    });

    describe('DELETE /api/items/:id', () => {
      it('should delete an existing item', async () => {
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

        await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(200);

        // Verify item is deleted
        await request(app)
          .get(`/api/items/${itemId}`)
          .expect(404);
      });

      it('should return 404 for non-existent item', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        await request(app)
          .delete(`/api/items/${nonExistentId}`)
          .expect(404);
      });
    });
  });

  describe('Sales APIs', () => {
    it('should return daily sales summary', async () => {
      const response = await request(app)
        .get('/api/sales/summary/daily')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return top selling items', async () => {
      const response = await request(app)
        .get('/api/sales/top-selling')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Health Check API', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message', 'Server is running');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/non-existent')
        .expect(404);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', async () => {
      const validItem = {
        name: 'Zero Item',
        itemCode: 'ZERO001',
        price: 0,
        stockQuantity: 0,
        lowStockThreshold: 0
      };

      const response = await request(app)
        .post('/api/items')
        .send(validItem)
        .expect(201);

      expect(response.body.price).toBe(0);
      expect(response.body.stockQuantity).toBe(0);
    });

    it('should handle special characters', async () => {
      const validItem = {
        name: 'Item with @#$% special chars!',
        itemCode: 'SPECIAL001',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      const response = await request(app)
        .post('/api/items')
        .send(validItem)
        .expect(201);

      expect(response.body.name).toBe('Item with @#$% special chars!');
    });

    it('should trim whitespace', async () => {
      const item = {
        name: '  Test Item  ',
        itemCode: '  CODE001  ',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      const response = await request(app)
        .post('/api/items')
        .send(item)
        .expect(201);

      expect(response.body.name).toBe('Test Item');
      expect(response.body.itemCode).toBe('CODE001');
    });
  });
});
