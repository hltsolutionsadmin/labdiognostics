import { Injectable, signal } from '@angular/core';

import { CheckoutResponse } from './orders-api.service';

export type CheckoutSuccessState = CheckoutResponse & {
  checkoutTimestamp: string;
};

@Injectable({ providedIn: 'root' })
export class CheckoutStateService {
  private readonly _success = signal<CheckoutSuccessState | null>(null);

  readonly success = this._success.asReadonly();

  setSuccess(response: CheckoutResponse, checkoutTimestamp = new Date().toISOString()): CheckoutSuccessState {
    const state: CheckoutSuccessState = {
      ...response,
      checkoutTimestamp
    };
    this._success.set(state);
    return state;
  }

  clear(): void {
    this._success.set(null);
  }
}
