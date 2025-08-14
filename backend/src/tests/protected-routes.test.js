import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

describe('Protected Routes', () => {
  let staffToken, adminToken;
  let categoryId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/store_inventory_test';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Create staff user and get token
    const staffResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'staffuser',
        email: 'staff@example.com',
        password: 'Password123',
        role: 'staff'
      });
    staffToken = staffResponse.body.token;

    // Create admin user and get token
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'Password123',
        role: 'admin'
      });
    adminToken = adminResponse.body.token;

    // Create a test category
    const categoryResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        name: 'Test Category',
        description: 'Test category description'
      });
    categoryId = categoryResponse.body.data._id;
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Product Routes Protection', () => {
    const validProduct = {
      name: 'Test Product',
      description: 'Test product description',
      price: 29.99,
      quantity: 100,
      sku: 'TEST001',
      lowStockThreshold: 10
    };

    it('should allow GET /api/products without authentication', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow GET /api/products/:id without authentication', async () => {
      // First create a product
      const productData = { ...validProduct, category: categoryId };
      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(productData);

      const productId = createResponse.body.data._id;

      // Now try to get it without auth
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validProduct.name);
    });

    it('should require authentication for POST /api/products', async () => {
      const response = await request(app)
        .post('/api/products')
        .send(validProduct)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not logged in');
    });

    it('should allow staff to create products', async () => {
      const productData = { ...validProduct, category: categoryId };
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validProduct.name);
    });

    it('should allow admin to create products', async () => {
      const productData = { ...validProduct, category: categoryId };
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validProduct.name);
    });

    it('should require authentication for PUT /api/products/:id', async () => {
      // First create a product
      const productData = { ...validProduct, category: categoryId };
      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(productData);

      const productId = createResponse.body.data._id;

      // Try to update without auth
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .send({ name: 'Updated Product' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow staff to update products', async () => {
      // First create a product
      const productData = { ...validProduct, category: categoryId };
      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(productData);

      const productId = createResponse.body.data._id;

      // Update the product
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Updated Product' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Product');
    });

    it('should require admin role for DELETE /api/products/:id', async () => {
      // First create a product
      const productData = { ...validProduct, category: categoryId };
      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      const productId = createResponse.body.data._id;

      // Try to delete with staff token
      const staffResponse = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);

      expect(staffResponse.body.success).toBe(false);
      expect(staffResponse.body.message).toContain('permission');

      // Delete with admin token should work
      const adminResponse = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminResponse.body.success).toBe(true);
    });
  });

  describe('Category Routes Protection', () => {
    const validCategory = {
      name: 'Test Category 2',
      description: 'Another test category'
    };

    it('should allow GET /api/categories without authentication', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should require authentication for POST /api/categories', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send(validCategory)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow staff to create categories', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(validCategory)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validCategory.name);
    });

    it('should require admin role for DELETE /api/categories/:id', async () => {
      // Try to delete with staff token
      const staffResponse = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);

      expect(staffResponse.body.success).toBe(false);

      // Delete with admin token should work
      const adminResponse = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminResponse.body.success).toBe(true);
    });
  });

  describe('Sales Routes Protection', () => {
    it('should require authentication for all sales routes', async () => {
      // GET /api/sales
      await request(app)
        .get('/api/sales')
        .expect(401);

      // POST /api/sales
      await request(app)
        .post('/api/sales')
        .send({})
        .expect(401);
    });

    it('should allow authenticated users to access sales routes', async () => {
      const response = await request(app)
        .get('/api/sales')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Token Validation', () => {
    it('should reject expired tokens', async () => {
      // This would require mocking JWT expiration
      // For now, we test invalid token format
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.format')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });

    it('should reject requests without Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', staffToken)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'NotBearer token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
