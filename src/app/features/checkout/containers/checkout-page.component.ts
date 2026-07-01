import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartSignalService } from '../../cart/data-access/cart-signal.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AddressApiService } from '../../auth/data-access/address-api.service';
import { Address } from '../../auth/data-access/models/address.models';
import {
  CheckoutPaymentMethod,
  CheckoutRequest,
  CheckoutShippingMethod,
  OrdersApiService
} from '../data-access/orders-api.service';
import { CheckoutStateService } from '../data-access/checkout-state.service';

type LabOption = {
  key: 'center-1' | 'center-2';
  id: string;
  title: string;
  line: string;
  hours: string;
};

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutPageComponent {
  private readonly cart = inject(CartSignalService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly checkoutState = inject(CheckoutStateService);
  private readonly router = inject(Router);
  private readonly addressApi = inject(AddressApiService);

  readonly items = this.cart.items;
  readonly subtotal = this.cart.subtotal;
  readonly totalQty = this.cart.totalQuantity;
  readonly grandTotal = this.cart.grandTotal;
  readonly isSubmitting = signal(false);
  readonly step = signal<0 | 1 | 2 | 3>(0);
  readonly showAddAddress = signal(false);
  readonly collectionMode = signal<'home' | 'lab'>('home');
  readonly selectedLab = signal<'center-1' | 'center-2'>('center-1');
  readonly addresses = signal<Address[]>([]);
  readonly selectedAddressId = signal<string>('');

  readonly labOptions: ReadonlyArray<LabOption> = [
    {
      key: 'center-1',
      id: 'lab_center_1',
      title: 'CareLab Diagnostics - MVP Colony',
      line: 'MVP Colony, Visakhapatnam',
      hours: '7:00 AM - 7:00 PM'
    },
    {
      key: 'center-2',
      id: 'lab_center_2',
      title: 'CareLab Diagnostics - Madhurawada',
      line: 'IT SEZ, Madhurawada, Visakhapatnam',
      hours: '7:00 AM - 7:00 PM'
    }
  ];

  readonly selectedAddressOption = computed(() =>
    this.addresses().find(a => a.id === this.selectedAddressId()) ?? null
  );

  readonly selectedLabOption = computed(() => this.labOptions.find((l) => l.key === this.selectedLab()) ?? null);

  readonly calendarMonthLabel = 'May 2025';
  readonly calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);
  readonly selectedDay = signal<number | null>(29);

  readonly timeSlots: ReadonlyArray<{ label: string; value: string }> = [
    { label: '6:00 AM - 7:00 AM', value: '06:00' },
    { label: '7:00 AM - 8:00 AM', value: '07:00' },
    { label: '8:00 AM - 9:00 AM', value: '08:00' },
    { label: '9:00 AM - 10:00 AM', value: '09:00' },
    { label: '10:00 AM - 11:00 AM', value: '10:00' },
    { label: '11:00 AM - 12:00 PM', value: '11:00' },
    { label: '12:00 PM - 1:00 PM', value: '12:00' },
    { label: '2:00 PM - 3:00 PM', value: '14:00' },
    { label: '3:00 PM - 4:00 PM', value: '15:00' },
    { label: '4:00 PM - 5:00 PM', value: '16:00' },
    { label: '5:00 PM - 6:00 PM', value: '17:00' },
    { label: '6:00 PM - 7:00 PM', value: '18:00' }
  ];

  readonly discount = computed(() => 0);
  readonly convenienceFee = computed(() => (this.totalQty() > 0 ? 49 : 0));
  readonly estimatedTotal = computed(
    () => this.grandTotal() > 0 ? this.grandTotal() : this.subtotal() - this.discount() + this.convenienceFee()
  );

  readonly form = new FormGroup({
    fullName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    mobile: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9]{10}$/)]
    }),
    addressLine1: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    postalCode: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9]{6}$/)]
    }),
    appointmentDate: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    appointmentTime: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    paymentMethod: new FormControl<'upi' | 'card' | 'cod'>('upi', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    paymentToken: new FormControl<string>('', { nonNullable: true }),
    acceptTerms: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.requiredTrue] })
  });
  
  constructor() {
    this.loadAddresses();
  }

  private loadAddresses(): void {
    this.addressApi.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);

        const defaultAddress =
          addresses.find(a => a.isDefault) ?? addresses[0];

        if (defaultAddress) {
          this.selectedAddressId.set(defaultAddress.id);
        }
      },
      error: err => {
        console.error('Failed to load addresses', err);
      }
    });
  }
  selectDay(day: number): void {
    this.selectedDay.set(day);
    const iso = `2025-05-${String(day).padStart(2, '0')}`;
    this.form.controls.appointmentDate.setValue(iso);
    this.form.controls.appointmentDate.markAsDirty();
  }

  selectTime(slot: { label: string; value: string }): void {
    this.form.controls.appointmentTime.setValue(slot.value);
    this.form.controls.appointmentTime.markAsDirty();
  }

  openAddAddress(): void {
    this.selectedAddressId.set('');
    this.showAddAddress.set(true);
  }

  cancelAddAddress(): void {
    this.showAddAddress.set(false);

    const defaultAddress =
        this.addresses().find(a => a.isDefault) ??
        this.addresses()[0];

    if (defaultAddress) {
        this.selectedAddressId.set(defaultAddress.id);
    }
  }

  private isAddressStepValid(): boolean {
    if (this.collectionMode() === 'home' && this.selectedAddressId()) {
      return true;
    }
    if (this.collectionMode() === 'lab') {
      return !(
        this.form.controls.fullName.invalid ||
        this.form.controls.email.invalid ||
        this.form.controls.mobile.invalid
      );
    }
    return !(
      this.form.controls.fullName.invalid ||
      this.form.controls.email.invalid ||
      this.form.controls.mobile.invalid ||
      this.form.controls.addressLine1.invalid ||
      this.form.controls.city.invalid ||
      this.form.controls.postalCode.invalid
    );
  }

  private isAppointmentStepValid(): boolean {
    return !(this.form.controls.appointmentDate.invalid || this.form.controls.appointmentTime.invalid);
  }

  private isPaymentStepValid(): boolean {
    if (this.form.controls.paymentMethod.invalid) return false;
    return true;
  }

  back(): void {
    const s = this.step();
    if (s === 0) return;
    this.step.set((s - 1) as 0 | 1 | 2 | 3);
  }

  next(): void {
    const s = this.step();

    const touch = (keys: Array<keyof typeof this.form.controls>) => {
      for (const k of keys) this.form.controls[k].markAsTouched();
    };

    if (s === 0) {
      if (this.collectionMode() === 'lab') {
        touch(['fullName', 'email', 'mobile']);
      }
      if (this.collectionMode() === 'home' && this.selectedAddressId()) {
        touch(['fullName', 'email', 'mobile', 'addressLine1', 'city', 'postalCode']);
      }
      if (!this.isAddressStepValid()) return;
      this.step.set(1);
      return;
    }

    if (s === 1) {
      touch(['appointmentDate', 'appointmentTime']);
      if (!this.isAppointmentStepValid()) return;
      this.step.set(2);
      return;
    }

    if (s === 2) {
      touch(['paymentMethod']);
      if (!this.isPaymentStepValid()) return;
      this.step.set(3);
      return;
    }
  }

  goTo(target: 0 | 1 | 2 | 3): void {
    const current = this.step();
    if (target === current) return;

    if (target < current) {
      this.step.set(target);
      return;
    }

    if (target >= 1 && !this.isAddressStepValid()) {
      this.step.set(0);
      this.next();
      return;
    }

    if (target >= 2 && !this.isAppointmentStepValid()) {
      this.step.set(1);
      this.next();
      return;
    }

    if (target >= 3 && !this.isPaymentStepValid()) {
      this.step.set(2);
      this.next();
      return;
    }

    this.step.set(target);
  }

  submit(): void {
    if (this.isSubmitting()) return;
    if (this.step() !== 3) return;
    if (!this.isAddressStepValid() || !this.isAppointmentStepValid() || !this.isPaymentStepValid()) return;
    if (this.form.controls.acceptTerms.invalid) {
      this.form.controls.acceptTerms.markAsTouched();
      return;
    }

    const request = this.buildCheckoutRequest();
    if (!request) return;

    this.setCheckoutError(null);
    this.isSubmitting.set(true);

    this.ordersApi.checkout(request).pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: (response) => {
        const successState = this.checkoutState.setSuccess(response);
        this.cart.clearCart();
        void this.router.navigate(['/checkout/confirmation'], { state: successState });
      },
      error: (error: unknown) => {
        this.setCheckoutError(this.errorMessage(error));
      }
    });
  }

  private buildCheckoutRequest(): CheckoutRequest | null {
    const cartId = this.cart.cartId();
    if (!cartId) {
      this.setCheckoutError('Your cart is not ready. Please refresh the cart and try again.');
      return null;
    }

    const shippingAddressId = this.selectedShippingAddressId();
    if (!shippingAddressId) {
      this.setCheckoutError('Please select a saved address before placing the order.');
      return null;
    }

    const payment = this.mapPaymentMethod();

    return {
      cartId,
      shippingAddressId,
      billingAddressId: shippingAddressId,
      shippingMethod: this.mapShippingMethod(),
      paymentMethod: payment.method,
      paymentMethodId: payment.paymentMethodId,
      couponCode: null,
      notes: null,
      deviceFingerprint: null,
      ipAddress: null
    };
  }

  private selectedShippingAddressId(): string | null {
    if (this.collectionMode() === 'lab') {
      return null;
    }

    return this.selectedAddressOption()?.id ?? null;
  }

  private mapShippingMethod(): CheckoutShippingMethod {
    return this.collectionMode() === 'home' ? 'HOME_COLLECTION' : 'VISIT_LAB';
  }

  private mapPaymentMethod(): { method: CheckoutPaymentMethod; paymentMethodId: string | null } {
    const paymentMethod = this.form.controls.paymentMethod.value;
    if (paymentMethod === 'cod') return { method: 'COD', paymentMethodId: null };

    const paymentMethodId = this.form.controls.paymentToken.value.trim() || null;
    return { method: 'ONLINE', paymentMethodId };
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as unknown;
      if (body && typeof body === 'object') {
        const record = body as Record<string, unknown>;
        if (typeof record['message'] === 'string') return record['message'];
        if (typeof record['error'] === 'string') return record['error'];
      }
      if (typeof body === 'string') return body;
    }

    if (error instanceof Error && error.message) return error.message;
    return 'Checkout failed. Please try again.';
  }

  private setCheckoutError(message: string | null): void {
    const current = this.form.errors ?? {};
    const { checkout: _checkout, ...rest } = current;
    this.form.setErrors(message ? { ...rest, checkout: message } : Object.keys(rest).length ? rest : null);
  }
}
