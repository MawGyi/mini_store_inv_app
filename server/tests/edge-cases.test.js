const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index.js');

describe('Edge Cases and Error Handling', () => {
  describe('Database Connection Issues', () => {
    it('should handle malformed ObjectId in GET request', async () => {
      const response = await request(app)
        .get('/api/items/malformed-object-id')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed ObjectId in PUT request', async () => {
      const response = await request(app)
        .put('/api/items/malformed-object-id')
        .send({ name: 'Test' })
        .expect(400); // Server handles this gracefully now

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed ObjectId in DELETE request', async () => {
      const response = await request(app)
        .delete('/api/items/malformed-object-id')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent item creation with duplicate codes', async () => {
      const itemData = {
        name: 'Concurrent Item',
        itemCode: 'CONCURRENT001',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      const promises = Array(3).fill(null).map(() =>
        request(app)
          .post('/api/items')
          .send(itemData)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 201);
      const failed = results.filter(r => r.status === 'fulfilled' && r.value.status === 400);

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(2);
    });

    it('should handle concurrent updates to the same item', async () => {
      const newItem = {
        name: 'Concurrent Update Item',
        itemCode: 'CONCUPDATE001',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      const createResponse = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      const itemId = createResponse.body._id;

      const updates = [
        { price: 11.99 },
        { price: 12.99 },
        { price: 13.99 }
      ];

      const promises = updates.map(update =>
        request(app)
          .put(`/api/items/${itemId}`)
          .send(update)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);

      expect(successful).toHaveLength(3);
    });
  });

  describe('Large Data Handling', () => {
    it('should handle creating many items', async () => {
      const items = Array(50).fill(null).map((_, index) => ({
        name: `Bulk Item ${index}`,
        itemCode: `BULK${String(index).padStart(3, '0')}`,
        price: Math.random() * 100,
        stockQuantity: Math.floor(Math.random() * 1000),
        lowStockThreshold: Math.floor(Math.random() * 50)
      }));

      const promises = items.map(item =>
        request(app)
          .post('/api/items')
          .send(item)
          .expect(201)
      );

      await Promise.all(promises);

      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toHaveLength(50);
    });

    it('should handle pagination-like behavior with large datasets', async () => {
      const items = Array(100).fill(null).map((_, index) => ({
        name: `Large Dataset Item ${index}`,
        itemCode: `LARGE${String(index).padStart(3, '0')}`,
        price: 10 + index,
        stockQuantity: 100 + index,
        lowStockThreshold: 10
      }));

      const promises = items.map(item =>
        request(app)
          .post('/api/items')
          .send(item)
          .expect(201)
      );

      await Promise.all(promises);

      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toHaveLength(100);
      expect(response.body[0]).toHaveProperty('createdAt');
      expect(response.body[99]).toHaveProperty('createdAt');
    });
  });

  describe('Error Response Formats', () => {
    it('should return consistent error format for validation errors', async () => {
      const invalidItem = {
        name: '',
        itemCode: '',
        price: 'invalid',
        stockQuantity: 'invalid',
        lowStockThreshold: 'invalid'
      };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return consistent error format for missing fields', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return consistent error format for server errors', async () => {
      // This might trigger a server error with malformed data
      const response = await request(app)
        .get('/api/items/invalid-mongodb-id-format-that-is-very-long')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Data Integrity', () => {
    it('should not allow duplicate item codes even with different cases', async () => {
      const item1 = {
        name: 'Item 1',
        itemCode: 'TESTCODE',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      const item2 = {
        name: 'Item 2',
        itemCode: 'testcode', // Different case
        price: 15.99,
        stockQuantity: 50,
        lowStockThreshold: 5
      };

      await request(app)
        .post('/api/items')
        .send(item1)
        .expect(201);

      const response = await request(app)
        .post('/api/items')
        .send(item2)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should maintain data types after update', async () => {
      const newItem = {
        name: 'Type Test Item',
        itemCode: 'TYPE001',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      const createResponse = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      const itemId = createResponse.body._id;

      const updateData = {
        price: '25.99', // String instead of number
        stockQuantity: '200' // String instead of number
      };

      const response = await request(app)
        .put(`/api/items/${itemId}`)
        .send(updateData)
        .expect(200);

      expect(typeof response.body.price).toBe('number');
      expect(typeof response.body.stockQuantity).toBe('number');
      expect(response.body.price).toBe(25.99);
      expect(response.body.stockQuantity).toBe(200);
    });
  });
});
