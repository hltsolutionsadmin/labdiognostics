import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';

import { Cart, CartItem, Product } from '../../../shared/types';
import { CartApiService } from './cart-api.service';

@Injectable({ providedIn: 'root' })
export class CartSignalService {
  private readonly cartApi = inject(CartApiService);

  // Cart state - single source of truth
  private readonly _cart = signal<Cart | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly cart = this._cart.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed cart properties
  readonly cartId = computed(() => this._cart()?.id ?? null);
  readonly items = computed(() => this._cart()?.items ?? []);
  readonly totalQuantity = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );
  readonly subtotal = computed(() => this._cart()?.subtotal ?? 0);
  readonly grandTotal = computed(() => this._cart()?.grandTotal ?? 0);
  readonly hasCart = computed(() => this._cart() !== null);
  readonly hasItems = computed(() => this.items().length > 0);

  /**
   * initializeCart
   * Calls GET /api/carts to get or create the active cart for the authenticated user.
   * Stores the returned cart and cartId.
   * Should NOT create duplicate requests.
   */
  initializeCart(): Observable<Cart | null> {
    console.debug('[Cart] initializeCart()');
    
    // If we already have an active cart, don't make a duplicate request
    if (this._cart() && this._cart()?.status === 'ACTIVE') {
      console.debug('[Cart] Cart already initialized, skipping request', {
        cartId: this.cartId()
      });
      return of(this._cart()!);
    }

    this._loading.set(true);
    this._error.set(null);

    return this.cartApi.getActiveCart().pipe(
      tap((cart) => {
        console.debug('[Cart] initializeCart() - Cart received', {
          cartId: cart.id,
          totalItems: cart.items.length,
          grandTotal: cart.grandTotal
        });
        this._cart.set(cart);
        this._loading.set(false);
      }),
      catchError((err) => {
        console.error('[Cart] initializeCart() - Error', err);
        this._error.set('Failed to load cart');
        this._loading.set(false);
        return of(null);
      })
    );
  }

  /**
   * refreshCart
   * Optionally refresh the cart using GET /api/carts/{cartId}
   * to synchronize with backend.
   */
  refreshCart(): Observable<Cart | null> {
    const currentCartId = this.cartId();
    if (!currentCartId) {
      console.warn('[Cart] refreshCart() - No cartId available, initializing instead');
      return this.initializeCart();
    }

    console.debug('[Cart] refreshCart()', { cartId: currentCartId });
    this._loading.set(true);
    this._error.set(null);

    return this.cartApi.getCartById(currentCartId).pipe(
      tap((cart) => {
        console.debug('[Cart] refreshCart() - Cart refreshed', {
          cartId: cart.id,
          totalItems: cart.items.length,
          grandTotal: cart.grandTotal
        });
        this._cart.set(cart);
        this._loading.set(false);
      }),
      catchError((err) => {
        console.error('[Cart] refreshCart() - Error', err);
        this._error.set('Failed to refresh cart');
        this._loading.set(false);
        return of(null);
      })
    );
  }

  /**
   * addProduct
   * Reads cartId from the stored cart.
   * POST to /api/carts/{cartId}/items.
   * Receives updated cart from backend.
   * Replaces the existing cart signal.
   * NO additional GET request is made because the Add Item API already returns the updated cart.
   */
  addProduct(productId: string, quantity = 1): Observable<Cart | null> {
    const currentCartId = this.cartId();
    if (!currentCartId) {
      console.error('[Cart] addProduct() - No cartId available');
      this._error.set('Cart not initialized');
      return of(null);
    }

    if (quantity <= 0) {
      console.warn('[Cart] addProduct() - Invalid quantity', { quantity });
      return of(null);
    }

    console.debug('[Cart] addProduct()', { cartId: currentCartId, productId, quantity });
    this._loading.set(true);
    this._error.set(null);

    return this.cartApi.addItem(currentCartId, productId, quantity).pipe(
      tap((updatedCart) => {
        console.debug('[Cart] addProduct() - Cart updated', {
          cartId: updatedCart.id,
          itemsCount: updatedCart.items.length,
          grandTotal: updatedCart.grandTotal
        });
        this._cart.set(updatedCart);
        this._loading.set(false);
      }),
      catchError((err) => {
        console.error('[Cart] addProduct() - Error', err);
        this._error.set('Failed to add item to cart');
        this._loading.set(false);
        return of(null);
      })
    );
  }

  /**
   * Legacy method for backward compatibility with existing components.
   * This will be deprecated once all components are updated to use addProduct with productId.
   */
  addProductFromProduct(product: Product, quantity = 1): Observable<Cart | null> {
    return this.addProduct(product.id, quantity);
  }

  /**
   * setQuantity
   * Updates the quantity of an item in the cart.
   * This requires a backend API call to update the item quantity.
   * For now, this is a placeholder - the backend API for updating quantity needs to be implemented.
   */
  setQuantity(productId: string, quantity: number): void {
    // TODO: Implement backend API call to update quantity
    // For now, this is a no-op as the backend doesn't have a dedicated update quantity endpoint
    console.warn('[Cart] setQuantity() - Not yet implemented with backend API', {
      productId,
      quantity
    });
  }

  /**
   * remove
   * Removes an item from the cart.
   * This requires a backend API call to remove the item.
   * For now, this is a placeholder - the backend API for removing items needs to be implemented.
   */
  remove(productId: string): void {
    // TODO: Implement backend API call to remove item
    // For now, this is a no-op as the backend doesn't have a dedicated remove item endpoint
    console.warn('[Cart] remove() - Not yet implemented with backend API', { productId });
  }

  /**
   * clearCart
   * Clears the current cart state after successful checkout.
   * The cart becomes COMPLETED on the backend, so we clear our local state.
   */
  clearCart(): void {
    console.debug('[Cart] clearCart()');
    this._cart.set(null);
    this._error.set(null);
  }
}
