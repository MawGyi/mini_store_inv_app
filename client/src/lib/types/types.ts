export interface Item {
  _id: string;
  name: string;
  itemCode: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  expiryDate?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  _id: string;
  item: Item;
  quantity: number;
  totalPrice: number;
  saleDate: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}
