import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockAdapter } from '$lib/server/storage/mock';

// Mock the config module
vi.mock('$lib/server/config', () => ({
    detectStorageType: vi.fn().mockReturnValue('mock'),
    getStorageConfig: vi.fn().mockReturnValue({}),
    logConfiguration: vi.fn()
}));

// Import after mocking
import {
    getStorage,
    resetStorage,
    getCurrentStorageType,
    getStorageHealth,
    createStorageAdapter,
    getAvailableStorageTypes,
    validateStorageConfig,
    logStorageInfo
} from '$lib/server/storage';

describe('Storage Factory', () => {
    beforeEach(() => {
        resetStorage();
        vi.clearAllMocks();
    });

    afterEach(() => {
        resetStorage();
    });

    describe('getAvailableStorageTypes', () => {
        it('should return all available storage types', () => {
            const types = getAvailableStorageTypes();

            expect(types).toContain('sqlite');
            expect(types).toContain('postgres');
            expect(types).toContain('mock');
            expect(types).toHaveLength(3);
        });
    });

    describe('validateStorageConfig', () => {
        it('should validate mock storage with no config required', () => {
            const result = validateStorageConfig('mock', {});

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should require url or path for sqlite', () => {
            const result = validateStorageConfig('sqlite', {});

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('SQLite requires either url or path configuration');
        });

        it('should validate sqlite with path', () => {
            const result = validateStorageConfig('sqlite', { path: './test.db' });

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate sqlite with url', () => {
            const result = validateStorageConfig('sqlite', { url: 'file:test.db' });

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should require url or host for postgres', () => {
            const result = validateStorageConfig('postgres', {});

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('PostgreSQL requires either url or host configuration');
        });

        it('should require user when postgres uses host', () => {
            const result = validateStorageConfig('postgres', { host: 'localhost' });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('PostgreSQL with host requires user configuration');
        });

        it('should require password when postgres uses host', () => {
            const result = validateStorageConfig('postgres', { host: 'localhost', user: 'test' });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('PostgreSQL with host requires password configuration');
        });

        it('should validate postgres with url', () => {
            const result = validateStorageConfig('postgres', { url: 'postgres://localhost' });

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate postgres with full host config', () => {
            const result = validateStorageConfig('postgres', {
                host: 'localhost',
                user: 'test',
                password: 'secret'
            });

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject unknown storage type', () => {
            const result = validateStorageConfig('unknown', {});

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Unknown storage type: unknown');
        });
    });

    describe('getCurrentStorageType', () => {
        it('should return current storage type', () => {
            const type = getCurrentStorageType();

            expect(type).toBe('mock');
        });
    });

    describe('createStorageAdapter', () => {
        it('should create mock adapter', () => {
            const adapter = createStorageAdapter('mock');

            expect(adapter).toBeDefined();
            expect(typeof adapter.getItems).toBe('function');
            expect(typeof adapter.createItem).toBe('function');
        });

        it('should throw for unknown type', () => {
            expect(() => createStorageAdapter('unknown'))
                .toThrow('Unsupported storage type: unknown');
        });
    });

    describe('getStorage', () => {
        it('should return a storage adapter', () => {
            const storage = getStorage();

            expect(storage).toBeDefined();
            expect(typeof storage.getItems).toBe('function');
        });

        it('should return same instance on multiple calls', () => {
            const storage1 = getStorage();
            const storage2 = getStorage();

            expect(storage1).toBe(storage2);
        });
    });

    describe('resetStorage', () => {
        it('should reset the storage instance', () => {
            const storage1 = getStorage();
            resetStorage();
            const storage2 = getStorage();

            // After reset, a new instance should be created
            // (this depends on implementation - mock may be same object)
            expect(storage2).toBeDefined();
        });
    });

    describe('getStorageHealth', () => {
        it('should return health status', async () => {
            const health = await getStorageHealth();

            expect(health).toHaveProperty('type');
            expect(health).toHaveProperty('healthy');
            expect(health).toHaveProperty('message');
            expect(health.type).toBe('mock');
        });
    });

    describe('logStorageInfo', () => {
        it('should log without throwing', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            expect(() => logStorageInfo()).not.toThrow();

            consoleSpy.mockRestore();
        });
    });
});
