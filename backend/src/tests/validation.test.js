import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Category from '../models/Category.js';

describe('Validation Tests', () => {
  let token;
  let categoryId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/store_inventory_test';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({});
    await Category.deleteMany({});

    // Create user and get token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        role: 'staff'
      });
    token = userResponse.body.token;

    // Create a test category
    const categoryResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Category',
        description: 'Test category description'
      });
    categoryId = categoryResponse.body.data._id;
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Product Validation', () => {
    it('should validate required fields for product creation', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('should validate price is not negative', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Product',
          price: -10,
          quantity: 100,
          category: categoryId,
          sku: 'TEST001'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some(error => 
        error.msg.includes('cannot be negative')
      )).toBe(true);
    });

    it('should validate quantity is not negative', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Product',
          price: 29.99,
          quantity: -5,
          category: categoryId,
          sku: 'TEST001'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some(error => 
        error.msg.includes('non-negative')
      )).toBe(true);
    });

    it('should validate category ID format', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Product',
          price: 29.99,
          quantity: 100,
          category: 'invalid-id',
          sku: 'TEST001'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some(error => 
        error.msg.includes('Invalid category ID')
      )).toBe(true);
    });

    it('should validate product name length', async () => {
      const longName = 'a'.repeat(101); // Over 100 characters
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: longName,
          price: 29.99,
          quantity: 100,
          category: categoryId,
          sku: 'TEST001'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some(error => 
        error.msg.includes('cannot be more than 100 characters')
      )).toBe(true);
    });

    it('should validate status enum values', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Product',
          price: 29.99,
          quantity: 100,
          category: categoryId,
          sku: 'TEST001',
          status: 'invalid-status'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some(error => 
        error.msg.includes('active, inactive, or discontinued')
      )).toBe(true);
    });

    it('should accept valid product data', async () => {
      const validProduct = {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99,
        quantity: 100,
        category: categoryId,
        sku: 'TEST001',
        status: 'active',
        lowStockThreshold: 10
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validProduct.name);
    });
  });

  describe('Category Validation', () => {
    it('should validate required fields for category creation', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate category name length', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'a', // Too short
          description: 'Test description'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some(error => 
        error.msg.includes('between 2 and 50 characters')
      )).toBe(true);
    });

    it('should validate description length', async () => {
      const longDescription = 'a'.repeat(201); // Over 200 characters
      
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Valid Category',
          description: longDescription
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some(error => 
        error.msg.includes('cannot be more than 200 characters')
      )).toBe(true);
    });

    it('should validate isActive boolean type', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Valid Category',
          description: 'Test description',
          isActive: 'not-boolean'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some(error => 
        error.msg.includes('boolean value')
      )).toBe(true);
    });

    it('should accept valid category data', async () => {
      const validCategory = {
        name: 'Valid Category',
        description: 'Test description',
        isActive: true
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(validCategory)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validCategory.name);
    });
  });

  describe('Auth Validation', () => {
    it('should validate email format in registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'invalid-email',
          password: 'Password123',
          role: 'staff'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some(error => 
        error.msg.includes('valid email')
      )).toBe(true);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test2@example.com',
          password: 'weak',
          role: 'staff'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some(error => 
        error.msg.includes('uppercase') || error.msg.includes('6 characters')
      )).toBe(true);
    });

    it('should validate username format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'a!', // Invalid characters
          email: 'test2@example.com',
          password: 'Password123',
          role: 'staff'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some(error => 
        error.msg.includes('letters and numbers')
      )).toBe(true);
    });

    it('should validate role enum', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test2@example.com',
          password: 'Password123',
          role: 'invalid-role'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.details.some(error => 
        error.msg.includes('admin or staff')
      )).toBe(true);
    });
  });
});
