import { describe, it, expect } from 'vitest';
import type {
  Item,
  Sale,
  SaleItem,
  Category,
  CreateItemData,
  UpdateItemData,
  CreateSaleData,
  CreateSaleItemData,
  GetItemsParams,
  GetSalesParams,
  ItemResult,
  SaleResult,
  SaleWithItems,
  DashboardStats,
  HealthCheckResult,
  StorageOperationResult
} from '$lib/server/storage/types';

import type {
  StorageAdapter,
  StorageConfig,
  StorageMetrics,
  StorageEvent,
  StorageFactory,
  Migration,
  MigrationRunner
} from '$lib/server/storage/interfaces';

describe('Storage Types', () => {
  describe('CreateItemData', () => {
    it('should accept valid create data', () => {
      const data: CreateItemData = {
        name: 'Test',
        itemCode: 'T001',
        price: 10,
        stockQuantity: 50,
        lowStockThreshold: 5
      };
      expect(data.name).toBe('Test');
    });

    it('should accept optional fields', () => {
      const data: CreateItemData = {
        name: 'Test',
        itemCode: 'T001',
        price: 10,
        stockQuantity: 50,
        lowStockThreshold: 5,
        category: 'Electronics',
        expiryDate: new Date()
      };
      expect(data.category).toBe('Electronics');
    });
  });

  describe('UpdateItemData', () => {
    it('should accept partial updates', () => {
      const data: UpdateItemData = { name: 'Updated' };
      expect(data.name).toBe('Updated');
      expect(data.price).toBeUndefined();
    });

    it('should accept empty update', () => {
      const data: UpdateItemData = {};
      expect(Object.keys(data)).toHaveLength(0);
    });
  });

  describe('CreateSaleData', () => {
    it('should accept valid sale data', () => {
      const data: CreateSaleData = {
        saleDate: new Date(),
        totalAmount: 100,
        paymentMethod: 'cash',
        items: [{ itemId: 1, quantity: 2, unitPrice: 50, totalPrice: 100 }]
      };
      expect(data.totalAmount).toBe(100);
      expect(data.items).toHaveLength(1);
    });

    it('should accept optional fields', () => {
      const data: CreateSaleData = {
        saleDate: new Date(),
        totalAmount: 50,
        paymentMethod: 'credit',
        customerName: 'John',
        invoiceNumber: 'INV-001'
      };
      expect(data.customerName).toBe('John');
    });
  });

  describe('GetItemsParams', () => {
    it('should accept sort params', () => {
      const params: GetItemsParams = {
        page: 1,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'desc'
      };
      expect(params.sortBy).toBe('price');
    });

    it('should accept search and category', () => {
      const params: GetItemsParams = {
        search: 'water',
        category: 'Beverages'
      };
      expect(params.search).toBe('water');
    });
  });

  describe('GetSalesParams', () => {
    it('should accept date filters', () => {
      const params: GetSalesParams = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        paymentMethod: 'cash'
      };
      expect(params.paymentMethod).toBe('cash');
    });
  });

  describe('ItemResult / SaleResult', () => {
    it('should have pagination info', () => {
      const result: ItemResult = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      };
      expect(result.pagination.page).toBe(1);
    });

    it('should accept sale result', () => {
      const result: SaleResult = {
        data: [],
        pagination: { page: 2, limit: 20, total: 50, totalPages: 3 }
      };
      expect(result.pagination.total).toBe(50);
    });
  });

  describe('HealthCheckResult', () => {
    it('should have valid status values', () => {
      const results: HealthCheckResult['status'][] = ['healthy', 'unhealthy', 'degraded'];
      results.forEach(status => {
        const result: HealthCheckResult = { status, message: 'OK', timestamp: new Date() };
        expect(result.status).toBe(status);
      });
    });
  });

  describe('StorageOperationResult', () => {
    it('should represent success', () => {
      const result: StorageOperationResult<Item> = {
        success: true,
        data: {
          id: 1, name: 'Test', itemCode: 'T', price: 10, stockQuantity: 5,
          lowStockThreshold: 2, category: null, expiryDate: null,
          createdAt: new Date(), updatedAt: new Date()
        }
      };
      expect(result.success).toBe(true);
    });

    it('should represent failure', () => {
      const result: StorageOperationResult = {
        success: false,
        error: 'Not found'
      };
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });
  });

  describe('DashboardStats', () => {
    it('should have all stat fields', () => {
      const stats: DashboardStats = {
        totalItems: 100,
        lowStockItems: 5,
        outOfStockItems: 2,
        totalSales: 50,
        todaySales: 3,
        weeklySales: 15,
        monthlySales: 50,
        topSellingItems: [],
        recentSales: [],
        salesByCategory: []
      };
      expect(stats.totalItems).toBe(100);
    });
  });

  describe('StorageConfig', () => {
    it('should accept sqlite config', () => {
      const config: StorageConfig = { type: 'sqlite', path: './test.db' };
      expect(config.type).toBe('sqlite');
    });

    it('should accept postgres config', () => {
      const config: StorageConfig = {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        user: 'test',
        password: 'secret',
        database: 'testdb'
      };
      expect(config.port).toBe(5432);
    });

    it('should accept mock config', () => {
      const config: StorageConfig = { type: 'mock', inMemory: true };
      expect(config.inMemory).toBe(true);
    });

    it('should accept connection pool settings', () => {
      const config: StorageConfig = {
        type: 'postgres',
        url: 'postgres://localhost',
        poolSize: 10,
        connectionTimeout: 5000,
        idleTimeout: 30000
      };
      expect(config.poolSize).toBe(10);
    });
  });

  describe('StorageMetrics', () => {
    it('should have connection pool and performance data', () => {
      const metrics: StorageMetrics = {
        connectionPool: { active: 5, idle: 3, total: 10, waiting: 0 },
        performance: { averageQueryTime: 12.5, slowQueries: 2, totalQueries: 1000, errorRate: 0.01 },
        data: { totalItems: 100, totalSales: 50, totalCategories: 8, databaseSize: 1024000 },
        timestamp: new Date()
      };
      expect(metrics.connectionPool.total).toBe(10);
      expect(metrics.performance.errorRate).toBe(0.01);
    });
  });

  describe('StorageEvent', () => {
    it('should have all event types', () => {
      const types: StorageEvent['type'][] = ['created', 'updated', 'deleted', 'error'];
      const entities: StorageEvent['entity'][] = ['item', 'sale', 'category'];
      types.forEach(type => {
        entities.forEach(entity => {
          const event: StorageEvent = { type, entity, entityId: 1, timestamp: new Date() };
          expect(event.type).toBe(type);
          expect(event.entity).toBe(entity);
        });
      });
    });
  });

  describe('Migration', () => {
    it('should have required fields', () => {
      const migration: Migration = {
        version: '1.0.0',
        name: 'initial',
        up: async () => {},
        down: async () => {}
      };
      expect(migration.version).toBe('1.0.0');
    });

    it('should accept optional description', () => {
      const migration: Migration = {
        version: '1.0.0',
        name: 'add-index',
        up: async () => {},
        down: async () => {},
        description: 'Add index for performance'
      };
      expect(migration.description).toBe('Add index for performance');
    });
  });
});
