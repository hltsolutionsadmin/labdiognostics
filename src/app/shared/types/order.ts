import { CartItem } from './cart';

export interface Order {
  id: string;
  userId: string;
  items: ReadonlyArray<CartItem>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'failed';
  createdAtIso: string;
}
