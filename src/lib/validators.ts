import { z } from 'zod'

export const ItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  itemCode: z.string().min(1, 'Item code is required').max(50, 'Item code must be less than 50 characters'),
  price: z.number().positive('Price must be a positive number'),
  stockQuantity: z.number().int('Stock quantity must be an integer').min(0, 'Stock quantity cannot be negative'),
  lowStockThreshold: z.number().int('Low stock threshold must be an integer').min(0, 'Low stock threshold cannot be negative').default(10),
  category: z.string().nullable().optional(),
  expiryDate: z.date().nullable().optional()
})

export const ItemUpdateSchema = ItemSchema.partial()

export const SaleItemInputSchema = z.object({
  itemId: z.number().int('Item ID must be an integer').positive('Item ID must be positive'),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be at least 1'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  totalPrice: z.number().nonnegative('Total price cannot be negative')
})

export const SaleSchema = z.object({
  items: z.array(SaleItemInputSchema).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['cash', 'credit', 'mobile_payment'], {
    errorMap: () => ({ message: 'Payment method must be cash, credit, or mobile_payment' })
  }),
  customerName: z.string().max(255, 'Customer name must be less than 255 characters').nullable().optional(),
  saleDate: z.string().datetime().optional()
})

export type ItemInput = z.infer<typeof ItemSchema>
export type ItemUpdateInput = z.infer<typeof ItemUpdateSchema>
export type SaleInput = z.infer<typeof SaleSchema>
export type SaleItemInput = z.infer<typeof SaleItemInputSchema>

export function formatZodError(error: z.ZodError): { field: string; message: string }[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))
}
