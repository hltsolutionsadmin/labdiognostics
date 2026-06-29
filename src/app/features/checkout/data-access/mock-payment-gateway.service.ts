import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MockPaymentGatewayService {
  charge(token: string, amount: number): Observable<{ paymentId: string }> {
    if (!token.startsWith('tok_')) {
      return throwError(() => new Error('Invalid payment token')).pipe(delay(250));
    }
    if (amount <= 0) {
      return throwError(() => new Error('Invalid amount')).pipe(delay(250));
    }
    return of({ paymentId: `pay_${Date.now()}` }).pipe(delay(450));
  }
}
