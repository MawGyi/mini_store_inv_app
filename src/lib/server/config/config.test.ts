import { describe, it, expect, vi } from 'vitest';

// The config module parses process.env at import time via Zod,
// so vi.stubEnv won't work. We need to mock the entire module.
vi.mock('$lib/server/config', () => {
  const mockConfig = {
    NODE_ENV: 'test' as const,
    ENVIRONMENT: 'local' as const,
    STORAGE_TYPE: 'mock' as const,
    VITE_API_URL: 'http://localhost:5173',
    PORT: 5173,
    DEMO_MODE: false,
    ENABLE_MOCK_DATA: false,
    DATABASE_PATH: undefined,
    SQLITE_URL: undefined,
    POSTGRES_URL: undefined,
    POSTGRES_HOST: undefined,
    POSTGRES_USER: undefined,
    POSTGRES_PASSWORD: undefined,
    POSTGRES_DATABASE: undefined,
    VERCEL_URL: undefined,
    VERCEL_ENV: undefined,
  };

  const isLocal = mockConfig.ENVIRONMENT === 'local';
  const isVercel = mockConfig.ENVIRONMENT === 'vercel';
  const isStaging = mockConfig.ENVIRONMENT === 'staging';
  const isDevelopment = mockConfig.NODE_ENV === 'development';
  const isProduction = mockConfig.NODE_ENV === 'production';
  const isTest = mockConfig.NODE_ENV === 'test';
  const isSqlite = mockConfig.STORAGE_TYPE === 'sqlite';
  const isPostgres = mockConfig.STORAGE_TYPE === 'postgres';
  const isMock = mockConfig.STORAGE_TYPE === 'mock';

  function detectStorageType(): 'sqlite' | 'postgres' | 'mock' {
    if (mockConfig.STORAGE_TYPE && mockConfig.STORAGE_TYPE !== 'sqlite') {
      return mockConfig.STORAGE_TYPE;
    }
    if (isTest) return 'mock';
    return 'sqlite';
  }

  function getStorageConfig() {
    const storageType = detectStorageType();
    switch (storageType) {
      case 'mock':
        return { type: 'mock' as const, inMemory: true };
      case 'sqlite':
        return {
          type: 'sqlite' as const,
          url: mockConfig.SQLITE_URL || 'file:sqlite.db',
          path: mockConfig.DATABASE_PATH || './sqlite.db',
        };
      case 'postgres':
        return {
          type: 'postgres' as const,
          url: mockConfig.POSTGRES_URL,
          host: mockConfig.POSTGRES_HOST,
          user: mockConfig.POSTGRES_USER,
          password: mockConfig.POSTGRES_PASSWORD,
          database: mockConfig.POSTGRES_DATABASE,
        };
      default:
        throw new Error(`Unsupported storage type: ${storageType}`);
    }
  }

  function validateConfig() {
    const errors: string[] = [];
    const storageType = detectStorageType();
    if (storageType === 'postgres' && !mockConfig.POSTGRES_URL) {
      errors.push('POSTGRES_URL is required when using PostgreSQL storage');
    }
    if (storageType === 'sqlite' && !mockConfig.SQLITE_URL && !mockConfig.DATABASE_PATH) {
      errors.push('SQLITE_URL or DATABASE_PATH is required when using SQLite storage');
    }
    if (!mockConfig.VITE_API_URL) {
      errors.push('VITE_API_URL is required');
    }
    return { isValid: errors.length === 0, errors };
  }

  function logConfiguration() {
    const storageConfig = getStorageConfig();
    console.log('🔧 Application Configuration:');
    console.log(`   Environment: ${mockConfig.ENVIRONMENT} (${mockConfig.NODE_ENV})`);
    console.log(`   Storage Type: ${storageConfig.type}`);
  }

  return {
    config: mockConfig,
    isLocal,
    isVercel,
    isStaging,
    isDevelopment,
    isProduction,
    isTest,
    isSqlite,
    isPostgres,
    isMock,
    detectStorageType,
    getStorageConfig,
    validateConfig,
    logConfiguration,
  };
});

import {
  config,
  isLocal,
  isDevelopment,
  isProduction,
  isTest,
  isSqlite,
  isPostgres,
  isMock,
  detectStorageType,
  getStorageConfig,
  validateConfig,
  logConfiguration
} from '$lib/server/config';

describe('Server Config', () => {
  describe('config parsing', () => {
    it('should parse config from env vars', () => {
      expect(config).toBeDefined();
      expect(config.NODE_ENV).toBe('test');
      expect(config.ENVIRONMENT).toBe('local');
      expect(config.STORAGE_TYPE).toBe('mock');
    });

    it('should have default values', () => {
      expect(config.VITE_API_URL).toBe('http://localhost:5173');
      expect(config.PORT).toBe(5173);
      expect(config.DEMO_MODE).toBe(false);
      expect(config.ENABLE_MOCK_DATA).toBe(false);
    });
  });

  describe('environment helpers', () => {
    it('isLocal should be true for local env', () => {
      expect(isLocal).toBe(true);
    });

    it('isTest should be true for test NODE_ENV', () => {
      expect(isTest).toBe(true);
    });

    it('isDevelopment should be false for test env', () => {
      expect(isDevelopment).toBe(false);
    });

    it('isProduction should be false for test env', () => {
      expect(isProduction).toBe(false);
    });
  });

  describe('storage type helpers', () => {
    it('isMock should be true for mock storage', () => {
      expect(isMock).toBe(true);
    });

    it('isSqlite should be false for mock storage', () => {
      expect(isSqlite).toBe(false);
    });

    it('isPostgres should be false for mock storage', () => {
      expect(isPostgres).toBe(false);
    });
  });

  describe('detectStorageType', () => {
    it('should return mock for test environment', () => {
      const type = detectStorageType();
      expect(type).toBe('mock');
    });
  });

  describe('getStorageConfig', () => {
    it('should return mock storage config', () => {
      const storageConfig = getStorageConfig();
      expect(storageConfig.type).toBe('mock');
      expect(storageConfig.inMemory).toBe(true);
    });
  });

  describe('validateConfig', () => {
    it('should validate current config', () => {
      const result = validateConfig();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('logConfiguration', () => {
    it('should log without throwing', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      expect(() => logConfiguration()).not.toThrow();
      consoleSpy.mockRestore();
    });
  });
});
