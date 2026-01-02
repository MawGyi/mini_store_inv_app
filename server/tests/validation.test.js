const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index.js');

describe('Validation Tests', () => {
  describe('Item Schema Validation', () => {
    it('should reject negative price values', async () => {
      const invalidItem = {
        name: 'Test Item',
        itemCode: 'NEG001',
        price: -10.99,
        stockQuantity: 100,
        lowStockThreshold: 10
      };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);

      expect(response.body.error).toContain('price');
    });

    it('should reject negative stock quantity', async () => {
      const invalidItem = {
        name: 'Test Item',
        itemCode: 'NEG002',
        price: 10.99,
        stockQuantity: -50,
        lowStockThreshold: 10
      };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);

      expect(response.body.error).toContain('stockQuantity');
    });

    it('should reject negative low stock threshold', async () => {
      const invalidItem = {
        name: 'Test Item',
        itemCode: 'NEG003',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: -5
      };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);

      expect(response.body.error).toContain('lowStockThreshold');
    });

    it('should accept valid expiry date format', async () => {
      const validItem = {
        name: 'Test Item',
        itemCode: 'DATE001',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10,
        expiryDate: '2025-12-31'
      };

      const response = await request(app)
        .post('/api/items')
        .send(validItem)
        .expect(201);

      expect(response.body.expiryDate).toBe('2025-12-31T00:00:00.000Z');
    });

    it('should accept null expiry date', async () => {
      const validItem = {
        name: 'Test Item',
        itemCode: 'NULL001',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10,
        expiryDate: null
      };

      const response = await request(app)
        .post('/api/items')
        .send(validItem)
        .expect(201);

      expect(response.body.expiryDate).toBeNull();
    });

    it('should reject invalid date format', async () => {
      const invalidItem = {
        name: 'Test Item',
        itemCode: 'DATE002',
        price: 10.99,
        stockQuantity: 100,
        lowStockThreshold: 10,
        expiryDate: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should trim whitespace from name and itemCode', async () => {
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

    it('should handle empty string validation', async () => {
      const invalidItem = {
        name: '',
        itemCode: '',
        price: 10.99,
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

  describe('Edge Cases', () => {
    it('should handle zero values for price and stock', async () => {
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
      expect(response.body.lowStockThreshold).toBe(0);
    });

    it('should handle very large numbers', async () => {
      const validItem = {
        name: 'Large Item',
        itemCode: 'LARGE001',
        price: 999999.99,
        stockQuantity: 999999,
        lowStockThreshold: 999999
      };

      const response = await request(app)
        .post('/api/items')
        .send(validItem)
        .expect(201);

      expect(response.body.price).toBe(999999.99);
      expect(response.body.stockQuantity).toBe(999999);
    });

    it('should handle special characters in name', async () => {
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
  });

  describe('Update Validation', () => {
    it('should maintain required fields during update', async () => {
      const newItem = {
        name: 'Update Test',
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

      const response = await request(app)
        .put(`/api/items/${itemId}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle type validation during update', async () => {
      const newItem = {
        name: 'Type Test',
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

      const response = await request(app)
        .put(`/api/items/${itemId}`)
        .send({ price: 'invalid-price' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
