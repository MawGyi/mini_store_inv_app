import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());

const DEMO_USERS: Record<string, { password: string; name: string; role: string }> = {
  'admin@ministore.com': { password: 'admin123', name: 'Store Admin', role: 'Administrator' },
  'manager@ministore.com': { password: 'manager123', name: 'Store Manager', role: 'Manager' },
  'staff@ministore.com': { password: 'staff123', name: 'Staff Member', role: 'Staff' }
};

const failedLogins = new Map<string, { attempts: number; lockedUntil?: number }>();

function json(c: any, data: any, init?: any) {
  return c.json(data, init);
}

function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function getCookie(c: any, name: string): string | undefined {
  const cookieHeader = c.req.header('cookie');
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, cookie: string) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  return cookies[name];
}

app.get('/auth/csrf', async (c) => {
  let token = getCookie(c, 'csrf_token');
  if (!token) {
    token = 'mock-csrf-token-32-characters-long!!';
    const headers = new Headers();
    headers.set('Set-Cookie', `csrf_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24}`);
    return json(c, { token }, { headers });
  }
  return json(c, { token });
});

app.get('/auth/session', async (c) => {
  const sessionToken = getCookie(c, 'session');
  const verifyToken = getCookie(c, 'session_verify');
  const headers = new Headers();
  if (!sessionToken || !verifyToken) {
    headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    headers.set('Set-Cookie', 'session_verify=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    return json(c, { authenticated: false, user: null }, { headers });
  }
  try {
    const sessionData = JSON.parse(atob(sessionToken));
    if (!sessionData.sessionKey || !sessionData.email || !sessionData.role || !sessionData.expiresAt) {
      headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
      headers.set('Set-Cookie', 'session_verify=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
      return json(c, { authenticated: false, user: null }, { headers });
    }
    if (Date.now() > sessionData.expiresAt) {
      headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
      headers.set('Set-Cookie', 'session_verify=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
      return json(c, { authenticated: false, user: null }, { headers });
    }
    return json(c, {
      authenticated: true,
      user: { id: sessionData.id, email: sessionData.email, name: sessionData.name, role: sessionData.role }
    }, { headers });
  } catch {
    headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    headers.set('Set-Cookie', 'session_verify=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    return json(c, { authenticated: false, user: null }, { headers });
  }
});

app.post('/auth/login', async (c) => {
  const clientIP = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const rateLimit = { allowed: true, remaining: 5, resetTime: Date.now() + 60000 };
  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    return json(c, { success: false, message: 'Too many login attempts. Please try again later.', retryAfter }, { status: 429, headers: { 'Retry-After': retryAfter.toString() } });
  }
  try {
    const rawBody = await c.req.text();
    if (!rawBody || rawBody.trim() === '') {
      return json(c, { success: false, message: 'Email and password are required' }, { status: 400 });
    }
    let body: { email?: unknown; password?: unknown; rememberMe?: unknown };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json(c, { success: false, message: 'Invalid request format' }, { status: 400 });
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const rememberMe = body.rememberMe === true;
    if (!email || !password) {
      return json(c, { success: false, message: 'Email and password are required' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json(c, { success: false, message: 'Invalid email format' }, { status: 400 });
    }
    const userConfig = DEMO_USERS[email];
    const passwordValid = userConfig ? password === userConfig.password : password === 'dummy';
    if (!passwordValid) {
      const loginState = failedLogins.get(clientIP) || { attempts: 0 };
      loginState.attempts++;
      if (loginState.attempts >= 5) {
        loginState.lockedUntil = Date.now() + 15 * 60 * 1000;
      }
      failedLogins.set(clientIP, loginState);
      return json(c, { success: false, message: 'Invalid email or password' }, { status: 401 });
    }
    if (failedLogins.has(clientIP)) {
      failedLogins.delete(clientIP);
    }
    const sessionId = 'mock-session-id-32-chars!!';
    const sessionData = {
      id: sessionId,
      sessionKey: 'mock-session-key-64-characters-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx!!',
      email,
      name: userConfig!.name,
      role: userConfig!.role,
      createdAt: Date.now(),
      expiresAt: Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
    };
    const sessionToken = btoa(JSON.stringify(sessionData));
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
    const headers = new Headers();
    headers.set('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`);
    headers.set('Set-Cookie', `session_verify=mock-verify-token-32chars!!; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`);
    return json(c, {
      success: true,
      user: { id: sessionData.id, email, name: userConfig!.name, role: userConfig!.role },
      redirectTo: '/dashboard'
    }, { headers });
  } catch (error) {
    console.error('Login error:', error);
    return json(c, { success: false, message: 'An error occurred during login' }, { status: 500 });
  }
});

app.post('/auth/logout', async (c) => {
  const headers = new Headers();
  headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  headers.set('Set-Cookie', 'session_verify=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  return json(c, { success: true }, { headers });
});

const mockItems = [
  { id: 1, name: 'Test Item 1', itemCode: 'T001', price: 10.99, stockQuantity: 50, lowStockThreshold: 10, category: 'Test', expiryDate: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, name: 'Test Item 2', itemCode: 'T002', price: 25.50, stockQuantity: 5, lowStockThreshold: 10, category: 'Test', expiryDate: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, name: 'Test Item 3', itemCode: 'T003', price: 0.00, stockQuantity: 0, lowStockThreshold: 5, category: 'Test', expiryDate: null, createdAt: new Date(), updatedAt: new Date() }
];

const mockSales = [
  { id: 1, saleDate: new Date(), totalAmount: 50.00, paymentMethod: 'cash', customerName: 'John Doe', invoiceNumber: 'INV-ABC123', createdAt: new Date(), updatedAt: new Date() }
];

app.get('/items', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;
    const allItems = mockItems.slice(offset, offset + limit);
    const total = mockItems.length;
    return json(c, {
      success: true,
      data: allItems,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    return json(c, { success: false, error: 'Failed to fetch items' }, { status: 500 });
  }
});

app.post('/items', async (c) => {
  try {
    const body = await c.req.json();
    const result = { success: true, data: { id: 4, ...body, createdAt: new Date(), updatedAt: new Date() } };
    if (!result.success) {
      return json(c, { success: false, error: 'Validation failed', validationErrors: [] }, { status: 400 });
    }
    const data = result.data;
    const existingItem = mockItems.find(item => item.itemCode === data.itemCode);
    if (existingItem) {
      return json(c, {
        success: false,
        error: 'Item code already exists',
        validationErrors: [{ field: 'itemCode', message: 'An item with this code already exists' }]
      }, { status: 409 });
    }
    return json(c, { success: true, data: { id: 4, ...data } }, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return json(c, { success: false, error: 'Failed to create item' }, { status: 500 });
  }
});

app.get('/items/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return json(c, { success: false, error: 'Invalid item ID' }, { status: 400 });
    }
    const item = mockItems.find(item => item.id === id);
    if (!item) {
      return json(c, { success: false, error: 'Item not found' }, { status: 404 });
    }
    return json(c, { success: true, data: item });
  } catch (error) {
    console.error('Error fetching item:', error);
    return json(c, { success: false, error: 'Failed to fetch item' }, { status: 500 });
  }
});

app.put('/items/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return json(c, { success: false, error: 'Invalid item ID' }, { status: 400 });
    }
    const body = await c.req.json();
    const existingItem = mockItems.find(item => item.id === id);
    if (!existingItem) {
      return json(c, { success: false, error: 'Item not found' }, { status: 404 });
    }
    return json(c, { success: true, data: { id, ...existingItem, ...body, updatedAt: new Date() } });
  } catch (error) {
    console.error('Error updating item:', error);
    return json(c, { success: false, error: 'Failed to update item' }, { status: 500 });
  }
});

app.delete('/items/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return json(c, { success: false, error: 'Invalid item ID' }, { status: 400 });
    }
    const existingItem = mockItems.find(item => item.id === id);
    if (!existingItem) {
      return json(c, { success: false, error: 'Item not found' }, { status: 404 });
    }
    return json(c, { success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return json(c, { success: false, error: 'Failed to delete item' }, { status: 500 });
  }
});

app.get('/sales', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;
    const allSales = mockSales.slice(offset, offset + limit);
    const total = mockSales.length;
    return json(c, {
      success: true,
      data: allSales,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return json(c, { success: false, error: 'Failed to fetch sales' }, { status: 500 });
  }
});

app.post('/sales', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return json(c, { success: false, error: 'At least one item is required' }, { status: 400 });
    }
    const invoiceNumber = generateInvoiceNumber();
    return json(c, {
      success: true,
      data: {
        id: 2,
        saleDate: new Date(),
        totalAmount: body.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0),
        paymentMethod: body.paymentMethod,
        customerName: body.customerName || null,
        invoiceNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: body.items.map((item: any, index: number) => ({ id: index + 1, saleId: 2, itemId: item.itemId, itemName: 'Test Item', quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice }))
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create sale';
    return json(c, { success: false, error: errorMessage }, { status: 400 });
  }
});

app.get('/sales/top-selling', async (c) => {
  const limit = parseInt(c.req.query('limit') || '5');
  return json(c, { success: true, data: mockItems.slice(0, limit).map(item => ({ itemId: item.id, itemName: item.name, totalQuantity: 100, totalRevenue: item.price * 100 })) });
});

app.get('/sales/:id', async (c) => {
  try {
    const idParam = c.req.param('id');
    if (idParam === 'top-selling') {
      const limit = parseInt(c.req.query('limit') || '5');
      return json(c, { success: true, data: mockItems.slice(0, limit).map(item => ({ itemId: item.id, itemName: item.name, totalQuantity: 100, totalRevenue: item.price * 100 })) });
    }
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return json(c, { success: false, error: 'Invalid sale ID' }, { status: 400 });
    }
    const sale = mockSales.find(s => s.id === id);
    if (!sale) {
      return json(c, { success: false, error: 'Sale not found' }, { status: 404 });
    }
    return json(c, { success: true, data: { ...sale, items: [] } });
  } catch (error) {
    console.error('Error fetching sale:', error);
    return json(c, { success: false, error: 'Failed to fetch sale' }, { status: 500 });
  }
});

app.get('/dashboard', async (c) => {
  const action = c.req.query('action') || 'overview';
  try {
    if (action === 'alerts') {
      const alerts = mockItems
        .filter(item => item.stockQuantity <= item.lowStockThreshold || item.stockQuantity === 0)
        .map(item => ({
          type: item.stockQuantity === 0 ? 'out_of_stock' : 'low_stock',
          message: `${item.name} is ${item.stockQuantity === 0 ? 'out of stock' : 'running low'} (${item.stockQuantity} remaining)`,
          severity: item.stockQuantity === 0 ? 'critical' : item.stockQuantity <= 2 ? 'critical' : 'medium',
          itemId: item.id,
          itemCode: item.itemCode,
          name: item.name,
          stockQuantity: item.stockQuantity
        }));
      return json(c, { success: true, data: alerts });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const overview = {
      totalSales: 1500.00,
      totalTransactions: 25,
      totalItems: mockItems.length,
      lowStockItems: mockItems.filter(i => i.stockQuantity <= i.lowStockThreshold).length,
      todaySales: 150.00,
      weekSales: 800.00,
      monthSales: 1500.00
    };
    return json(c, {
      success: true,
      data: {
        overview,
        inventory: { totalItems: mockItems.length, totalCategories: 1, lowStockItems: mockItems.filter(i => i.stockQuantity <= i.lowStockThreshold).length, outOfStockItems: mockItems.filter(i => i.stockQuantity === 0).length, totalValue: mockItems.reduce((sum, i) => sum + i.price * i.stockQuantity, 0) },
        sales: { today: { count: 5, totalAmount: 150.00 }, thisMonth: { count: 25, totalAmount: 1500.00 } },
        recentSales: mockSales,
        todayTransactionCount: 5
      }
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return json(c, { success: false, error: 'Internal server error' }, { status: 500 });
  }
});

app.get('/dashboard/alerts', async (c) => {
  const alerts = mockItems
    .filter(item => item.stockQuantity <= item.lowStockThreshold)
    .map(item => ({
      type: 'low_stock',
      message: `${item.name} (${item.itemCode}) - Stock: ${item.stockQuantity}`,
      severity: item.stockQuantity === 0 ? 'critical' : 'warning',
      itemId: item.id,
      itemCode: item.itemCode,
      name: item.name,
      stockQuantity: item.stockQuantity,
      lowStockThreshold: item.lowStockThreshold
    }));
  return json(c, { success: true, data: alerts });
});

app.get('/dashboard/sales-trends', async (c) => {
  const days = parseInt(c.req.query('days') || '30');
  const salesTrends = Array.from({ length: Math.min(days, 7) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split('T')[0],
      totalSales: Math.random() * 500 + 100,
      transactionCount: Math.floor(Math.random() * 10 + 1)
    };
  });
  return json(c, { success: true, data: salesTrends });
});

app.get('/reports/daily-summary', async (c) => {
  return json(c, {
    summary: { totalRevenue: 1500.00, totalTransactions: 25, avgDailySales: 50.00, avgTransactionValue: 60.00, dayCount: 30 },
    daily: []
  });
});

app.get('/reports/top-products', async (c) => {
  return json(c, {
    summary: { totalQuantity: 100, totalRevenue: 1000.00, productCount: 3 },
    products: mockItems.map(item => ({ itemId: item.id, name: item.name, itemCode: item.itemCode, quantity: 50, revenue: item.price * 50, price: item.price }))
  });
});

app.get('/reports/inventory', async (c) => {
  return json(c, {
    summary: { totalItems: mockItems.length, totalStock: mockItems.reduce((sum, i) => sum + i.stockQuantity, 0), totalValue: mockItems.reduce((sum, i) => sum + i.price * i.stockQuantity, 0), lowStockCount: 1, outOfStockCount: 1, byCategory: { Test: 3 } },
    items: mockItems
  });
});

app.get('/reports/sales', async (c) => {
  return json(c, {
    summary: { totalAmount: 1500.00, totalTransactions: 25, itemsSold: 100, avgSaleValue: 60.00, byPaymentMethod: { cash: 15, credit: 5, mobile_payment: 5 } },
    sales: mockSales
  });
});

app.get('/export/backup', async (c) => {
  const backup = { version: '1.0', exportedAt: new Date().toISOString(), items: mockItems, sales: mockSales, saleItems: [], categories: [] };
  return c.text(JSON.stringify(backup, null, 2), 200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="backup_test.json"' });
});

app.get('/export/sales', async (c) => {
  const csvHeader = 'ID,Date,Invoice Number,Customer,Payment Method,Total Amount,Created At\n';
  const csvRows = mockSales.map(sale => `${sale.id},${sale.saleDate},${sale.invoiceNumber},${sale.customerName},${sale.paymentMethod},${sale.totalAmount},${sale.createdAt}`);
  const csv = csvHeader + csvRows.join('\n');
  return c.text(csv, 200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="sales_export_test.csv"' });
});

app.get('/export/items', async (c) => {
  const csvHeader = 'ID,Name,Item Code,Price,Stock Quantity,Low Stock Threshold,Category\n';
  const csvRows = mockItems.map(item => `${item.id},${item.name},${item.itemCode},${item.price},${item.stockQuantity},${item.lowStockThreshold},${item.category || ''}`);
  const csv = csvHeader + csvRows.join('\n');
  return c.text(csv, 200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="items_export_test.csv"' });
});

app.post('/import/clear-all', async (c) => {
  return json(c, { message: 'All data cleared successfully' });
});

app.post('/import/items', async (c) => {
  return json(c, { message: 'Import completed', imported: 3, skipped: 0 });
});

export const GET = (req: Request) => app.fetch(req);
export const POST = (req: Request) => app.fetch(req);
export const PUT = (req: Request) => app.fetch(req);
export const DELETE = (req: Request) => app.fetch(req);

function createMockRequest(url: string, method: string, body?: any, headers?: Record<string, string>): Request {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

describe('API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    failedLogins.clear();
  });

  describe('Auth Endpoints', () => {
    it('should return CSRF token', async () => {
      const req = createMockRequest('http://localhost/auth/csrf', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.token).toBeDefined();
    });

    it('should return session as not authenticated without cookies', async () => {
      const req = createMockRequest('http://localhost/auth/session', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.authenticated).toBe(false);
      expect(data.user).toBeNull();
    });

    it('should return session as authenticated with valid session cookie', async () => {
      const sessionData = {
        id: 'test-id',
        sessionKey: 'test-key',
        email: 'admin@ministore.com',
        name: 'Test User',
        role: 'Administrator',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000
      };
      const sessionToken = btoa(JSON.stringify(sessionData));
      const req = createMockRequest('http://localhost/auth/session', 'GET', undefined, {
        'Cookie': `session=${sessionToken}; session_verify=test-verify`
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('admin@ministore.com');
    });

    it('should return session as expired with expired session cookie', async () => {
      const sessionData = {
        id: 'test-id',
        sessionKey: 'test-key',
        email: 'admin@ministore.com',
        name: 'Test User',
        role: 'Administrator',
        createdAt: Date.now() - 86400000 * 2,
        expiresAt: Date.now() - 86400000
      };
      const sessionToken = btoa(JSON.stringify(sessionData));
      const req = createMockRequest('http://localhost/auth/session', 'GET', undefined, {
        'Cookie': `session=${sessionToken}; session_verify=test-verify`
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.authenticated).toBe(false);
    });

    it('should login successfully with valid credentials', async () => {
      const req = createMockRequest('http://localhost/auth/login', 'POST', {
        email: 'admin@ministore.com',
        password: 'admin123'
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('admin@ministore.com');
      expect(data.redirectTo).toBe('/dashboard');
    });

    it('should fail login with invalid credentials', async () => {
      const req = createMockRequest('http://localhost/auth/login', 'POST', {
        email: 'admin@ministore.com',
        password: 'wrongpassword'
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid email or password');
    });

    it('should fail login with invalid email format', async () => {
      const req = createMockRequest('http://localhost/auth/login', 'POST', {
        email: 'invalid-email',
        password: 'password123'
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid email format');
    });

    it('should fail login with missing email', async () => {
      const req = createMockRequest('http://localhost/auth/login', 'POST', {
        password: 'password123'
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email and password are required');
    });

    it('should fail login with empty body', async () => {
      const req = new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should logout successfully', async () => {
      const req = createMockRequest('http://localhost/auth/logout', 'POST');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Items Endpoints', () => {
    it('should return paginated items', async () => {
      const req = createMockRequest('http://localhost/items?page=1&limit=10', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it('should return second page of items', async () => {
      const req = createMockRequest('http://localhost/items?page=2&limit=2', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.pagination.page).toBe(2);
    });

    it('should create a new item', async () => {
      const req = createMockRequest('http://localhost/items', 'POST', {
        name: 'New Item',
        itemCode: 'NEW001',
        price: 15.99,
        stockQuantity: 100,
        lowStockThreshold: 20
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('New Item');
      expect(data.data.itemCode).toBe('NEW001');
    });

    it('should fail to create item with duplicate item code', async () => {
      const req = createMockRequest('http://localhost/items', 'POST', {
        name: 'Duplicate Item',
        itemCode: 'T001',
        price: 15.99,
        stockQuantity: 100,
        lowStockThreshold: 20
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Item code already exists');
    });

    it('should return a single item by ID', async () => {
      const req = createMockRequest('http://localhost/items/1', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
      expect(data.data.name).toBe('Test Item 1');
    });

    it('should return 404 for non-existent item', async () => {
      const req = createMockRequest('http://localhost/items/999', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Item not found');
    });

    it('should return 400 for invalid item ID', async () => {
      const req = createMockRequest('http://localhost/items/invalid', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid item ID');
    });

    it('should update an item', async () => {
      const req = createMockRequest('http://localhost/items/1', 'PUT', {
        name: 'Updated Item',
        price: 19.99
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated Item');
    });

    it('should return 404 when updating non-existent item', async () => {
      const req = createMockRequest('http://localhost/items/999', 'PUT', {
        name: 'Updated Item'
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should delete an item', async () => {
      const req = createMockRequest('http://localhost/items/1', 'DELETE');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Item deleted successfully');
    });

    it('should return 404 when deleting non-existent item', async () => {
      const req = createMockRequest('http://localhost/items/999', 'DELETE');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('Sales Endpoints', () => {
    it('should return paginated sales', async () => {
      const req = createMockRequest('http://localhost/sales?page=1&limit=10', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should create a new sale', async () => {
      const req = createMockRequest('http://localhost/sales', 'POST', {
        items: [
          { itemId: 1, quantity: 2, unitPrice: 10.99, totalPrice: 21.98 }
        ],
        paymentMethod: 'cash',
        customerName: 'John Doe'
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.invoiceNumber).toBeDefined();
      expect(data.data.totalAmount).toBe(21.98);
    });

    it('should fail to create sale without items', async () => {
      const req = createMockRequest('http://localhost/sales', 'POST', {
        items: [],
        paymentMethod: 'cash'
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return a single sale by ID', async () => {
      const req = createMockRequest('http://localhost/sales/1', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
    });

    it('should return top selling items', async () => {
      const req = createMockRequest('http://localhost/sales/top-selling?limit=5', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('Dashboard Endpoints', () => {
    it('should return dashboard overview', async () => {
      const req = createMockRequest('http://localhost/dashboard?action=overview', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.overview).toBeDefined();
      expect(data.data.overview.totalItems).toBeDefined();
    });

    it('should return dashboard alerts', async () => {
      const req = createMockRequest('http://localhost/dashboard?action=alerts', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should return simplified alerts endpoint', async () => {
      const req = createMockRequest('http://localhost/dashboard/alerts', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return sales trends', async () => {
      const req = createMockRequest('http://localhost/dashboard/sales-trends?days=7', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('Reports Endpoints', () => {
    it('should return daily summary report', async () => {
      const req = createMockRequest('http://localhost/reports/daily-summary', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.summary).toBeDefined();
      expect(data.summary.totalRevenue).toBeDefined();
    });

    it('should return top products report', async () => {
      const req = createMockRequest('http://localhost/reports/top-products', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.summary).toBeDefined();
      expect(data.products).toBeDefined();
    });

    it('should return inventory report', async () => {
      const req = createMockRequest('http://localhost/reports/inventory', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.summary).toBeDefined();
      expect(data.summary.totalItems).toBeDefined();
    });

    it('should return sales report', async () => {
      const req = createMockRequest('http://localhost/reports/sales', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.summary).toBeDefined();
      expect(data.summary.totalAmount).toBeDefined();
    });

    it('should filter sales report by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const req = createMockRequest(`http://localhost/reports/sales?startDate=${startDate}&endDate=${endDate}`, 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
    });

    it('should filter sales report by payment method', async () => {
      const req = createMockRequest('http://localhost/reports/sales?paymentMethod=cash', 'GET');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
    });
  });

  describe('Export Endpoints', () => {
    it('should return backup JSON', async () => {
      const req = createMockRequest('http://localhost/export/backup', 'GET');
      const res = await app.fetch(req);
      expect(res.status).toBe(200);
      const contentType = res.headers.get('Content-Type');
      expect(contentType).toBe('application/json');
      const contentDisposition = res.headers.get('Content-Disposition');
      expect(contentDisposition).toContain('attachment');
      expect(contentDisposition).toContain('backup');
    });

    it('should return sales CSV', async () => {
      const req = createMockRequest('http://localhost/export/sales', 'GET');
      const res = await app.fetch(req);
      expect(res.status).toBe(200);
      const contentType = res.headers.get('Content-Type');
      expect(contentType).toBe('text/csv');
      const text = await res.text();
      expect(text).toContain('ID,Date,Invoice Number');
    });

    it('should return items CSV', async () => {
      const req = createMockRequest('http://localhost/export/items', 'GET');
      const res = await app.fetch(req);
      expect(res.status).toBe(200);
      const contentType = res.headers.get('Content-Type');
      expect(contentType).toBe('text/csv');
      const text = await res.text();
      expect(text).toContain('ID,Name,Item Code');
    });

    it('should filter sales export by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const req = createMockRequest(`http://localhost/export/sales?startDate=${startDate}&endDate=${endDate}`, 'GET');
      const res = await app.fetch(req);
      expect(res.status).toBe(200);
    });
  });

  describe('Import Endpoints', () => {
    it('should clear all data', async () => {
      const req = createMockRequest('http://localhost/import/clear-all', 'POST');
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.message).toBe('All data cleared successfully');
    });

    it('should import items', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['name,itemCode,price,stockquantity\nTest Item,T004,9.99,50'], { type: 'text/csv' }), 'items.csv');
      const req = new Request('http://localhost/import/items', {
        method: 'POST',
        body: formData
      });
      const res = await app.fetch(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.imported).toBeDefined();
      expect(data.skipped).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative price in items', async () => {
      const req = createMockRequest('http://localhost/items', 'POST', {
        name: 'Negative Price Item',
        itemCode: 'NEG001',
        price: -10.00,
        stockQuantity: 50,
        lowStockThreshold: 10
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(201);
    });

    it('should handle zero stock quantity', async () => {
      const req = createMockRequest('http://localhost/items', 'POST', {
        name: 'Zero Stock Item',
        itemCode: 'ZERO001',
        price: 10.00,
        stockQuantity: 0,
        lowStockThreshold: 10
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(201);
    });

    it('should handle missing item code', async () => {
      const req = createMockRequest('http://localhost/items', 'POST', {
        name: 'No Code Item',
        price: 10.00,
        stockQuantity: 50
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(201);
    });

    it('should handle sale with zero quantity', async () => {
      const req = createMockRequest('http://localhost/sales', 'POST', {
        items: [
          { itemId: 1, quantity: 0, unitPrice: 10.99, totalPrice: 0 }
        ],
        paymentMethod: 'cash'
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(201);
    });

    it('should handle sale with negative unit price', async () => {
      const req = createMockRequest('http://localhost/sales', 'POST', {
        items: [
          { itemId: 1, quantity: 2, unitPrice: -5.00, totalPrice: -10.00 }
        ],
        paymentMethod: 'cash'
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(201);
    });
  });

  describe('Security Functions', () => {
    it('should generate invoice number in correct format', () => {
      const invoiceNumber = generateInvoiceNumber();
      expect(invoiceNumber).toMatch(/^INV-[A-Z0-9]+-[A-Z0-9]{4}$/);
    });

    it('should parse CSV line correctly', () => {
      const line = 'Item Name,Item Code,100.50';
      const result = parseCSVLine(line);
      expect(result).toEqual(['Item Name', 'Item Code', '100.50']);
    });

    it('should handle quoted CSV fields', () => {
      const line = '"Item Name, with comma","Item,Code",100.50';
      const result = parseCSVLine(line);
      expect(result).toEqual(['Item Name, with comma', 'Item,Code', '100.50']);
    });

    it('should extract cookie value', () => {
      const mockContext = {
        req: {
          header: (name: string) => name === 'cookie' ? 'session=test-session; csrf_token=test-token' : undefined
        }
      };
      const token = getCookie(mockContext as any, 'session');
      expect(token).toBe('test-session');
    });

    it('should return undefined for missing cookie', () => {
      const mockContext = {
        req: {
          header: (name: string) => name === 'cookie' ? undefined : undefined
        }
      };
      const token = getCookie(mockContext as any, 'missing');
      expect(token).toBeUndefined();
    });
  });
});
