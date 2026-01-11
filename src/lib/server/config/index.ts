import { z } from 'zod'

const ConfigSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ENVIRONMENT: z.enum(['local', 'vercel', 'staging']).default('local'),
  
  // Storage Configuration
  STORAGE_TYPE: z.enum(['sqlite', 'postgres', 'mock']).default('sqlite'),
  DATABASE_PATH: z.string().optional(),
  SQLITE_URL: z.string().optional(),
  POSTGRES_URL: z.string().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DATABASE: z.string().optional(),
  
  // API Configuration
  VITE_API_URL: z.string().default('http://localhost:5173'),
  PORT: z.coerce.number().default(5173),
  
  // Feature Flags
  DEMO_MODE: z.coerce.boolean().default(false),
  ENABLE_MOCK_DATA: z.coerce.boolean().default(false),
  
  // Vercel-specific
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
})

export const config = ConfigSchema.parse(process.env)

// Environment detection helpers
export const isLocal = config.ENVIRONMENT === 'local'
export const isVercel = config.ENVIRONMENT === 'vercel'
export const isStaging = config.ENVIRONMENT === 'staging'
export const isDevelopment = config.NODE_ENV === 'development'
export const isProduction = config.NODE_ENV === 'production'
export const isTest = config.NODE_ENV === 'test'

// Storage type detection helpers
export const isSqlite = config.STORAGE_TYPE === 'sqlite'
export const isPostgres = config.STORAGE_TYPE === 'postgres'
export const isMock = config.STORAGE_TYPE === 'mock'

// Auto-detection logic
export function detectStorageType(): 'sqlite' | 'postgres' | 'mock' {
  // Explicit configuration takes precedence
  if (config.STORAGE_TYPE && config.STORAGE_TYPE !== 'sqlite') {
    return config.STORAGE_TYPE
  }
  
  // Vercel environment with PostgreSQL URL
  if (config.VERCEL_URL && config.POSTGRES_URL) {
    return 'postgres'
  }
  
  // Local development with PostgreSQL URL
  if (isDevelopment && config.POSTGRES_URL) {
    return 'postgres'
  }
  
  // Test environment
  if (isTest) {
    return 'mock'
  }
  
  // Default to SQLite for local development
  return 'sqlite'
}

// Storage configuration
export function getStorageConfig() {
  const storageType = detectStorageType()
  
  switch (storageType) {
    case 'sqlite':
      return {
        type: 'sqlite' as const,
        url: config.SQLITE_URL || 'file:sqlite.db',
        path: config.DATABASE_PATH || './sqlite.db',
      }
    
    case 'postgres':
      return {
        type: 'postgres' as const,
        url: config.POSTGRES_URL,
        host: config.POSTGRES_HOST,
        user: config.POSTGRES_USER,
        password: config.POSTGRES_PASSWORD,
        database: config.POSTGRES_DATABASE,
      }
    
    case 'mock':
      return {
        type: 'mock' as const,
        inMemory: true,
      }
    
    default:
      throw new Error(`Unsupported storage type: ${storageType}`)
  }
}

// Configuration validation
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate storage configuration
  const storageType = detectStorageType()
  
  if (storageType === 'postgres' && !config.POSTGRES_URL) {
    errors.push('POSTGRES_URL is required when using PostgreSQL storage')
  }
  
  if (storageType === 'sqlite' && !config.SQLITE_URL && !config.DATABASE_PATH) {
    errors.push('SQLITE_URL or DATABASE_PATH is required when using SQLite storage')
  }
  
  // Validate API configuration
  if (!config.VITE_API_URL) {
    errors.push('VITE_API_URL is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Log configuration for debugging
export function logConfiguration() {
  const storageConfig = getStorageConfig()
  
  console.log('🔧 Application Configuration:')
  console.log(`   Environment: ${config.ENVIRONMENT} (${config.NODE_ENV})`)
  console.log(`   Storage Type: ${storageConfig.type}`)
  console.log(`   API URL: ${config.VITE_API_URL}`)
  console.log(`   Demo Mode: ${config.DEMO_MODE}`)
  
  if (storageConfig.type === 'sqlite') {
    console.log(`   SQLite Path: ${storageConfig.path}`)
  } else if (storageConfig.type === 'postgres') {
    console.log(`   PostgreSQL Host: ${storageConfig.host}`)
    console.log(`   PostgreSQL Database: ${storageConfig.database}`)
  }
}