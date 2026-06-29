import { Injectable, computed, effect, signal } from '@angular/core';
import { CartItem, Product } from '../../../shared/types';

const STORAGE_KEY = 'lab.cart.v1';

function safeParseCartItems(raw: string | null): ReadonlyArray<CartItem> {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x: unknown): CartItem | null => {
        if (!x || typeof x !== 'object') return null;
        const o = x as Record<string, unknown>;
        if (
          typeof o['productId'] !== 'string' ||
          typeof o['name'] !== 'string' ||
          typeof o['imageUrl'] !== 'string' ||
          typeof o['unitPrice'] !== 'number' ||
          typeof o['quantity'] !== 'number'
        ) {
          return null;
        }
        return {
          productId: o['productId'],
          name: o['name'],
          imageUrl: o['imageUrl'],
          unitPrice: o['unitPrice'],
          quantity: o['quantity']
        };
      })
      .filter((x): x is CartItem => x !== null);
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class CartSignalService {
  private readonly _items = signal<ReadonlyArray<CartItem>>(
    safeParseCartItems(localStorage.getItem(STORAGE_KEY))
  );

  readonly items = this._items.asReadonly();

  readonly totalQuantity = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this._items().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items()));
    });
  }

  addProduct(product: Product, quantity = 1): void {
    if (quantity <= 0) return;

    const current = this._items();
    const existing = current.find((x) => x.productId === product.id);
    if (!existing) {
      this._items.set([
        ...current,
        {
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          unitPrice: product.price,
          quantity
        }
      ]);
      return;
    }

    this._items.set(
      current.map((x) =>
        x.productId === product.id ? { ...x, quantity: x.quantity + quantity } : x
      )
    );
  }

  setQuantity(productId: string, quantity: number): void {
    const q = Math.max(0, Math.floor(quantity));
    if (q === 0) {
      this.remove(productId);
      return;
    }
    this._items.set(
      this._items().map((x) => (x.productId === productId ? { ...x, quantity: q } : x))
    );
  }

  remove(productId: string): void {
    this._items.set(this._items().filter((x) => x.productId !== productId));
  }

  clear(): void {
    this._items.set([]);
  }
}
