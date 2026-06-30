import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';

import { Address, CreateAddressRequest, UpdateAddressRequest } from './models/address.models';
import { AddressApiService } from './address-api.service';

@Injectable({ providedIn: 'root' })
export class AddressSignalService {
  private readonly api = inject(AddressApiService);

  private readonly _addresses = signal<Address[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _isDeleting = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _success = signal<string | null>(null);

  readonly addresses = this._addresses.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly isDeleting = this._isDeleting.asReadonly();
  readonly error = this._error.asReadonly();
  readonly success = this._success.asReadonly();
  readonly hasAddresses = computed(() => this._addresses().length > 0);

  loadAddresses(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .getAddresses()
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (addresses) => this._addresses.set(addresses),
        error: (err: unknown) => this._error.set(this.errorMessage(err, 'We could not load your addresses. Please try again.'))
      });
  }

  createAddress(payload: CreateAddressRequest): Observable<Address> {
    this._isSaving.set(true);
    this._error.set(null);
    this._success.set(null);

    return this.api.createAddress(payload).pipe(
      tap(() => {
        this._success.set('Address created successfully.');
        this.loadAddresses();
      }),
      finalize(() => this._isSaving.set(false))
    );
  }

  updateAddress(addressId: string, payload: UpdateAddressRequest): Observable<Address> {
    this._isSaving.set(true);
    this._error.set(null);
    this._success.set(null);

    return this.api.updateAddress(addressId, payload).pipe(
      tap(() => {
        this._success.set('Address updated successfully.');
        this.loadAddresses();
      }),
      finalize(() => this._isSaving.set(false))
    );
  }

  deleteAddress(addressId: string): void {
    this._isDeleting.set(true);
    this._error.set(null);
    this._success.set(null);

    this.api
      .deleteAddress(addressId)
      .pipe(finalize(() => this._isDeleting.set(false)))
      .subscribe({
        next: () => {
          this._success.set('Address deleted successfully.');
          this.loadAddresses();
        },
        error: (err: unknown) => this._error.set(this.errorMessage(err, 'We could not delete this address. Please try again.'))
      });
  }

  showError(err: unknown, fallback: string): void {
    this._error.set(this.errorMessage(err, fallback));
  }

  clearMessages(): void {
    this._error.set(null);
    this._success.set(null);
  }

  private errorMessage(err: unknown, fallback: string): string {
    if (!(err instanceof HttpErrorResponse)) return fallback;

    const data = err.error;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>;
      if (typeof o['message'] === 'string') return o['message'];
      if (Array.isArray(o['errors'])) {
        const messages = o['errors'].filter((value): value is string => typeof value === 'string');
        if (messages.length > 0) return messages.join(' ');
      }
    }

    return fallback;
  }
}
