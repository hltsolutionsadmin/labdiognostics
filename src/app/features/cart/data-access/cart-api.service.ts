import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Cart } from '../../../shared/types';
import { environment } from '../../../../environments/environment';

type AddItemRequest = {
  productId: string;
  quantity: number;
};

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * GET /api/carts
   * Returns the current ACTIVE cart for the authenticated user.
   * If no ACTIVE cart exists, the backend automatically creates one and returns it.
   */
  getActiveCart(): Observable<Cart> {
    console.debug('[CartApiService] getActiveCart()');
    return this.http.get<Cart>(`${this.baseUrl}/api/carts`);
  }

  /**
   * GET /api/carts/{cartId}
   * Returns the latest details of a specific cart.
   */
  getCartById(cartId: string): Observable<Cart> {
    console.debug('[CartApiService] getCartById()', { cartId });
    return this.http.get<Cart>(`${this.baseUrl}/api/carts/${cartId}`);
  }

  /**
   * POST /api/carts/{cartId}/items
   * Adds an item to the cart.
   * Returns the COMPLETE UPDATED CART (including items, totals, etc.)
   */
  addItem(cartId: string, productId: string, quantity: number): Observable<Cart> {
    console.debug('[CartApiService] addItem()', { cartId, productId, quantity });
    const body: AddItemRequest = { productId, quantity };
    return this.http.post<Cart>(`${this.baseUrl}/api/carts/${cartId}/items`, body);
  }
}
