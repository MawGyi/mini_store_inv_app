import { detectStorageType, getStorageConfig, logConfiguration } from '$lib/server/config'
import { SqliteAdapter } from './sqlite'
import { PostgresAdapter } from './postgres'
import { MockAdapter } from './mock'
import type { StorageAdapter } from './interfaces'

let storageInstance: StorageAdapter | null = null

/**
 * Get the appropriate storage adapter based on environment configuration
 * @returns StorageAdapter instance
 */
export function getStorage(): StorageAdapter {
  if (storageInstance) {
    return storageInstance
  }

  const storageType = detectStorageType()
  const config = getStorageConfig()
  
  try {
    switch (storageType) {
      case 'sqlite':
        storageInstance = new SqliteAdapter(config)
        console.log('🗄️  Initializing SQLite storage')
        break
        
      case 'postgres':
        storageInstance = new PostgresAdapter(config)
        console.log('🐘 Initializing PostgreSQL storage')
        break
        
      case 'mock':
        storageInstance = new MockAdapter()
        console.log('🎭 Initializing Mock storage')
        break
        
      default:
        throw new Error(`Unsupported storage type: ${storageType}`)
    }

    // Initialize the storage
    storageInstance.initialize().catch(error => {
      console.error(`❌ Failed to initialize ${storageType} storage:`, error)
      // Reset to allow retry
      storageInstance = null
    })

    return storageInstance!
  } catch (error) {
    console.error(`❌ Failed to create storage adapter:`, error)
    // Fallback to mock storage
    storageInstance = new MockAdapter()
    console.log('🎭 Falling back to Mock storage due to error')
    return storageInstance!
  }
}

/**
 * Reset the storage instance (useful for testing or config changes)
 */
export function resetStorage(): void {
  if (storageInstance) {
    storageInstance.cleanup().catch(error => {
      console.error('Error during storage cleanup:', error)
    })
  }
  storageInstance = null
  console.log('🔄 Storage instance reset')
}

/**
 * Get the current storage type
 */
export function getCurrentStorageType(): string {
  return detectStorageType()
}

/**
 * Get storage health status
 */
export async function getStorageHealth(): Promise<{
  type: string
  healthy: boolean
  message: string
  details?: any
}> {
  try {
    const storage = getStorage()
    const healthCheck = await storage.healthCheck()
    
    return {
      type: detectStorageType(),
      healthy: healthCheck.status === 'healthy',
      message: healthCheck.message,
      details: healthCheck.details
    }
  } catch (error) {
    return {
      type: detectStorageType(),
      healthy: false,
      message: `Health check failed: ${(error as Error).message}`,
      details: { error: (error as Error).message }
    }
  }
}

/**
 * Create a storage adapter with specific configuration
 * (useful for testing with different configurations)
 */
export function createStorageAdapter(type: string, config?: any): StorageAdapter {
  const mergedConfig = { ...getStorageConfig(), ...config }
  
  switch (type) {
    case 'sqlite':
      return new SqliteAdapter(mergedConfig)
    case 'postgres':
      return new PostgresAdapter(mergedConfig)
    case 'mock':
      return new MockAdapter()
    default:
      throw new Error(`Unsupported storage type: ${type}`)
  }
}

/**
 * Get available storage types
 */
export function getAvailableStorageTypes(): string[] {
  return ['sqlite', 'postgres', 'mock']
}

/**
 * Validate storage configuration
 */
export function validateStorageConfig(type: string, config: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  switch (type) {
    case 'sqlite':
      if (!config.url && !config.path) {
        errors.push('SQLite requires either url or path configuration')
      }
      break
      
    case 'postgres':
      if (!config.url && !config.host) {
        errors.push('PostgreSQL requires either url or host configuration')
      }
      if (config.host && !config.user) {
        errors.push('PostgreSQL with host requires user configuration')
      }
      if (config.host && !config.password) {
        errors.push('PostgreSQL with host requires password configuration')
      }
      break
      
    case 'mock':
      // Mock storage doesn't require specific configuration
      break
      
    default:
      errors.push(`Unknown storage type: ${type}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Log storage configuration for debugging
 */
export function logStorageInfo(): void {
  const storageType = detectStorageType()
  const config = getStorageConfig()
  
  console.log('📋 Storage Configuration:')
  console.log(`   Type: ${storageType}`)
  console.log(`   Config: ${JSON.stringify(config, null, 2)}`)
  
  logConfiguration()
}