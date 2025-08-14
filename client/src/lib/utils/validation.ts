/**
 * Enhanced API Validation Utilities
 * Comprehensive validation for Mini Store Inventory App
 */

/**
 * Validation schemas for different data types
 */
export const validationSchemas = {
  // Item validation
  item: {
    name: {
      required: true,
      minLength: 1,
      maxLength: 200,
      pattern: /^[\u1000-\u109F\u1040-\u1049\w\s\-\.\(\)]+$/,
      message: 'Item name must be valid Myanmar or English text'
    },
    item_code: {
      required: true,
      pattern: /^[A-Z0-9\-_]{3,20}$/,
      message: 'Item code must be 3-20 alphanumeric characters'
    },
    price: {
      required: true,
      type: 'number',
      min: 0,
      max: 999999999,
      message: 'Price must be a positive number less than 1 billion'
    },
    stock_quantity: {
      required: true,
      type: 'integer',
      min: 0,
      max: 999999,
      message: 'Stock quantity must be a non-negative integer'
    },
    low_stock_threshold: {
      required: false,
      type: 'integer',
      min: 0,
      max: 1000,
      message: 'Low stock threshold must be a non-negative integer'
    },
    category_id: {
      required: true,
      pattern: /^[a-f\d]{24}$/i,
      message: 'Category ID must be a valid ObjectId'
    }
  },

  // Category validation
  category: {
    category_name_my: {
      required: true,
      minLength: 1,
      maxLength: 100,
      pattern: /^[\u1000-\u109F\u1040-\u1049\s\-\.]+$/,
      message: 'Myanmar category name must be valid Myanmar text'
    },
    category_name_en: {
      required: false,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-\.]+$/,
      message: 'English category name must be valid English text'
    }
  },

  // Sale validation
  sale: {
    customer_name: {
      required: false,
      maxLength: 100,
      pattern: /^[\u1000-\u109F\u1040-\u1049\w\s\-\.]+$/,
      message: 'Customer name must be valid text'
    },
    customer_phone: {
      required: false,
      pattern: /^(\+95|09)\d{8,10}$/,
      message: 'Phone number must be valid Myanmar format'
    },
    items: {
      required: true,
      type: 'array',
      minLength: 1,
      message: 'At least one item is required'
    },
    total_amount: {
      required: true,
      type: 'number',
      min: 0,
      message: 'Total amount must be positive'
    },
    payment_method: {
      required: true,
      enum: ['cash', 'card', 'mobile', 'credit'],
      message: 'Payment method must be one of: cash, card, mobile, credit'
    }
  },

  // Sale item validation
  saleItem: {
    item_id: {
      required: true,
      pattern: /^[a-f\d]{24}$/i,
      message: 'Item ID must be valid'
    },
    quantity: {
      required: true,
      type: 'integer',
      min: 1,
      max: 1000,
      message: 'Quantity must be between 1 and 1000'
    },
    unit_price: {
      required: true,
      type: 'number',
      min: 0,
      message: 'Unit price must be positive'
    }
  }
};

/**
 * Validation error types
 */
export class ValidationError extends Error {
  constructor(
    public field: string,
    public code: string,
    message: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate a single field against its schema
 */
export function validateField(value: any, schema: any, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required check
  if (schema.required && (value === undefined || value === null || value === '')) {
    errors.push(new ValidationError(fieldName, 'REQUIRED', `${fieldName} is required`, value));
    return errors; // Stop validation if required field is missing
  }

  // Skip other validations if field is not provided and not required
  if (!schema.required && (value === undefined || value === null || value === '')) {
    return errors;
  }

  // Type validation
  if (schema.type) {
    if (schema.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
      errors.push(new ValidationError(fieldName, 'INVALID_TYPE', `${fieldName} must be a number`, value));
    } else if (schema.type === 'integer' && (!Number.isInteger(Number(value)))) {
      errors.push(new ValidationError(fieldName, 'INVALID_TYPE', `${fieldName} must be an integer`, value));
    } else if (schema.type === 'array' && !Array.isArray(value)) {
      errors.push(new ValidationError(fieldName, 'INVALID_TYPE', `${fieldName} must be an array`, value));
    }
  }

  // String validations
  if (typeof value === 'string') {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push(new ValidationError(fieldName, 'TOO_SHORT', 
        `${fieldName} must be at least ${schema.minLength} characters`, value));
    }
    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push(new ValidationError(fieldName, 'TOO_LONG', 
        `${fieldName} must be no more than ${schema.maxLength} characters`, value));
    }
    if (schema.pattern && !schema.pattern.test(value)) {
      errors.push(new ValidationError(fieldName, 'INVALID_FORMAT', 
        schema.message || `${fieldName} format is invalid`, value));
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (schema.min !== undefined && value < schema.min) {
      errors.push(new ValidationError(fieldName, 'TOO_SMALL', 
        `${fieldName} must be at least ${schema.min}`, value));
    }
    if (schema.max !== undefined && value > schema.max) {
      errors.push(new ValidationError(fieldName, 'TOO_LARGE', 
        `${fieldName} must be no more than ${schema.max}`, value));
    }
  }

  // Array validations
  if (Array.isArray(value)) {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push(new ValidationError(fieldName, 'TOO_FEW_ITEMS', 
        `${fieldName} must have at least ${schema.minLength} items`, value));
    }
    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push(new ValidationError(fieldName, 'TOO_MANY_ITEMS', 
        `${fieldName} must have no more than ${schema.maxLength} items`, value));
    }
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(new ValidationError(fieldName, 'INVALID_ENUM', 
      `${fieldName} must be one of: ${schema.enum.join(', ')}`, value));
  }

  return errors;
}

/**
 * Validate an entire object against a schema
 */
export function validateObject(data: any, schemaName: keyof typeof validationSchemas): ValidationError[] {
  const schema = validationSchemas[schemaName];
  const errors: ValidationError[] = [];

  // Validate each field in the schema
  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const fieldErrors = validateField(data[fieldName], fieldSchema, fieldName);
    errors.push(...fieldErrors);
  }

  // Additional custom validations
  if (schemaName === 'sale') {
    errors.push(...validateSaleItems(data.items || []));
    errors.push(...validateSaleTotals(data));
  }

  return errors;
}

/**
 * Validate sale items array
 */
function validateSaleItems(items: any[]): ValidationError[] {
  const errors: ValidationError[] = [];

  items.forEach((item, index) => {
    const itemErrors = validateObject(item, 'saleItem');
    itemErrors.forEach(error => {
      error.field = `items[${index}].${error.field}`;
    });
    errors.push(...itemErrors);
  });

  return errors;
}

/**
 * Validate sale totals and calculations
 */
function validateSaleTotals(saleData: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!saleData.items || !Array.isArray(saleData.items)) {
    return errors;
  }

  // Calculate expected total
  const calculatedTotal = saleData.items.reduce((sum: number, item: any) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    return sum + (quantity * unitPrice);
  }, 0);

  const providedTotal = Number(saleData.total_amount) || 0;
  const tolerance = 0.01; // Allow for small rounding differences

  if (Math.abs(calculatedTotal - providedTotal) > tolerance) {
    errors.push(new ValidationError('total_amount', 'CALCULATION_MISMATCH',
      `Total amount ${providedTotal} does not match calculated total ${calculatedTotal}`,
      { calculated: calculatedTotal, provided: providedTotal }
    ));
  }

  return errors;
}

/**
 * Sanitize input data
 */
export function sanitizeData(data: any, schemaName: keyof typeof validationSchemas): any {
  const schema = validationSchemas[schemaName];
  const sanitized: any = {};

  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = data[fieldName];
    
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        // Trim whitespace
        sanitized[fieldName] = value.trim();
        
        // Convert to appropriate type if needed
        if ('type' in fieldSchema && fieldSchema.type === 'number') {
          const num = Number(sanitized[fieldName]);
          if (!isNaN(num)) {
            sanitized[fieldName] = num;
          }
        } else if ('type' in fieldSchema && fieldSchema.type === 'integer') {
          const int = parseInt(sanitized[fieldName], 10);
          if (!isNaN(int)) {
            sanitized[fieldName] = int;
          }
        }
      } else {
        sanitized[fieldName] = value;
      }
    }
  }

  return sanitized;
}

/**
 * API validation middleware
 */
export function createValidationMiddleware(schemaName: keyof typeof validationSchemas) {
  return (req: any, res: any, next: any) => {
    try {
      // Sanitize input data
      const sanitizedData = sanitizeData(req.body, schemaName);
      
      // Validate sanitized data
      const errors = validateObject(sanitizedData, schemaName);
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.map(error => ({
            field: error.field,
            code: error.code,
            message: error.message,
            value: error.value
          }))
        });
      }
      
      // Replace request body with sanitized data
      req.body = sanitizedData;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Validation error',
        message: error instanceof Error ? error.message : 'Unknown validation error'
      });
    }
  };
}

/**
 * Client-side validation utilities
 */
export const clientValidation = {
  /**
   * Validate form data before submission
   */
  validateForm(formData: any, schemaName: keyof typeof validationSchemas): {
    isValid: boolean;
    errors: ValidationError[];
    sanitizedData: any;
  } {
    const sanitizedData = sanitizeData(formData, schemaName);
    const errors = validateObject(sanitizedData, schemaName);
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  },

  /**
   * Real-time field validation
   */
  validateField(value: any, fieldName: string, schemaName: keyof typeof validationSchemas): ValidationError[] {
    const schema = validationSchemas[schemaName];
    if (!schema[fieldName]) {
      return [];
    }
    return validateField(value, schema[fieldName], fieldName);
  },

  /**
   * Get validation rules for a field (for UI display)
   */
  getFieldRules(fieldName: string, schemaName: keyof typeof validationSchemas): any {
    const schema = validationSchemas[schemaName];
    return schema[fieldName] || null;
  }
};

/**
 * Common validation patterns
 */
export const patterns = {
  myanmarText: /^[\u1000-\u109F\u1040-\u1049\s\-\.]+$/,
  englishText: /^[a-zA-Z0-9\s\-\.]+$/,
  mixedText: /^[\u1000-\u109F\u1040-\u1049\w\s\-\.\(\)]+$/,
  myanmarPhone: /^(\+95|09)\d{8,10}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  objectId: /^[a-f\d]{24}$/i,
  itemCode: /^[A-Z0-9\-_]{3,20}$/,
  currency: /^\d+(\.\d{1,2})?$/
};

/**
 * Error message translations
 */
export const errorMessages = {
  en: {
    REQUIRED: 'This field is required',
    INVALID_TYPE: 'Invalid data type',
    TOO_SHORT: 'Too short',
    TOO_LONG: 'Too long',
    TOO_SMALL: 'Value too small',
    TOO_LARGE: 'Value too large',
    INVALID_FORMAT: 'Invalid format',
    INVALID_ENUM: 'Invalid selection',
    CALCULATION_MISMATCH: 'Calculation error'
  },
  my: {
    REQUIRED: 'ဤအကွက်ကို ဖြည့်ရန် လိုအပ်သည်',
    INVALID_TYPE: 'ဒေတာ အမျိုးအစား မမှန်ကန်ပါ',
    TOO_SHORT: 'အရွယ်အစား နည်းလွန်းသည်',
    TOO_LONG: 'အရွယ်အစား ကြီးလွန်းသည်',
    TOO_SMALL: 'တန်ဖိုး နည်းလွန်းသည်',
    TOO_LARGE: 'တန်ဖိုး ကြီးလွန်းသည်',
    INVALID_FORMAT: 'ပုံစံ မမှန်ကန်ပါ',
    INVALID_ENUM: 'ရွေးချယ်မှု မမှန်ကန်ပါ',
    CALCULATION_MISMATCH: 'တွက်ချက်မှု အမှား'
  }
};

export default {
  validationSchemas,
  ValidationError,
  validateField,
  validateObject,
  sanitizeData,
  createValidationMiddleware,
  clientValidation,
  patterns,
  errorMessages
};
