import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export type CheckoutShippingMethod = 'STANDARD' | 'EXPRESS' | 'HOME_COLLECTION' | 'VISIT_LAB';
export type CheckoutPaymentMethod = 'COD' | 'ONLINE' | 'RAZORPAY';

export type CheckoutRequest = {
  cartId: string;
  shippingAddressId: string;
  billingAddressId: string;
  shippingMethod: CheckoutShippingMethod;
  paymentMethod: CheckoutPaymentMethod;
  paymentMethodId: string | null;
  couponCode: string | null;
  notes: string | null;
  deviceFingerprint: string | null;
  ipAddress: string | null;
};

export type CheckoutResponse = {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  paymentRedirectUrl: string | null;
  crossSellProductIds: ReadonlyArray<string>;
  fraudFlagged: boolean;
  razorpayOrderId: string | null;
  razorpayKeyId: string | null;
};

export type OrderItem = {
  orderId: string;
  id?: string;
  packageName?: string;
  testName?: string;
  orderDate: string;
  totalAmount: number;
  orderStatus: string;
};

export type OrdersResponse = {
  content: ReadonlyArray<OrderItem>;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
};

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  checkout(request: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.baseUrl}/api/orders/checkout`, request);
  }

  getMyOrders(page: number = 0, size: number = 10): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(`${this.baseUrl}/api/orders/me?page=${page}&size=${size}`);
  }
}
