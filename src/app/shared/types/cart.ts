export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  items: ReadonlyArray<CartItem>;
  subtotal: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
}
