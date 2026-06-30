import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartSignalService } from '../../cart/data-access/cart-signal.service';
import { MockPaymentGatewayService } from '../data-access/mock-payment-gateway.service';
import { Router } from '@angular/router';
import { map, of } from 'rxjs';

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
  private readonly payment = inject(MockPaymentGatewayService);
  private readonly router = inject(Router);

  readonly items = this.cart.items;
  readonly subtotal = this.cart.subtotal;
  readonly totalQty = this.cart.totalQuantity;
  readonly grandTotal = this.cart.grandTotal;
  readonly isSubmitting = signal(false);
  readonly step = signal<0 | 1 | 2 | 3>(0);
  readonly showAddAddress = signal(false);
  readonly collectionMode = signal<'home' | 'lab'>('home');
  readonly selectedLab = signal<'center-1' | 'center-2'>('center-1');
  readonly selectedAddress = signal<'home' | 'office' | 'new'>('home');

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
    paymentToken: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    acceptTerms: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.requiredTrue] })
  });

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
    this.selectedAddress.set('new');
    this.showAddAddress.set(true);
  }

  cancelAddAddress(): void {
    this.showAddAddress.set(false);
    if (this.collectionMode() === 'home') this.selectedAddress.set('home');
  }

  private isAddressStepValid(): boolean {
    if (this.collectionMode() === 'home' && this.selectedAddress() !== 'new') {
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
    if (this.form.controls.paymentMethod.value === 'cod') return true;
    return !this.form.controls.paymentToken.invalid;
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
      if (this.collectionMode() === 'home' && this.selectedAddress() === 'new') {
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
      if (this.form.controls.paymentMethod.value !== 'cod') touch(['paymentToken']);
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
    if (this.step() !== 3) return;
    if (!this.isAddressStepValid() || !this.isAppointmentStepValid() || !this.isPaymentStepValid()) return;
    if (this.form.controls.acceptTerms.invalid) {
      this.form.controls.acceptTerms.markAsTouched();
      return;
    }
    this.isSubmitting.set(true);

    const now = new Date();
    const orderId = `CLD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(
      Math.floor(1000 + Math.random() * 9000)
    )}`;

    const orderState = {
      orderId,
      orderDate: now.toISOString(),
      paymentStatus: this.form.controls.paymentMethod.value === 'cod' ? 'Pending' : 'Paid',
      paymentMethod: this.form.controls.paymentMethod.value,
      amountPaid: this.estimatedTotal(),
      subtotal: this.subtotal(),
      discount: this.discount(),
      convenienceFee: this.convenienceFee(),
      items: this.items().map((i) => ({ ...i })),
      collectionMode: this.collectionMode(),
      selectedLab: this.selectedLab(),
      selectedAddress: this.selectedAddress(),
      contact: {
        fullName: this.form.controls.fullName.value,
        email: this.form.controls.email.value,
        mobile: this.form.controls.mobile.value
      },
      address:
        this.collectionMode() === 'home'
          ? {
              addressLine1: this.form.controls.addressLine1.value,
              city: this.form.controls.city.value,
              postalCode: this.form.controls.postalCode.value
            }
          : null,
      appointment: {
        date: this.form.controls.appointmentDate.value,
        time: this.form.controls.appointmentTime.value
      }
    };

    const charge$ =
      this.form.controls.paymentMethod.value === 'cod'
        ? of(null)
        : this.payment
            .charge(this.form.controls.paymentToken.value, this.estimatedTotal())
            .pipe(map(() => null));

    charge$.subscribe({
      next: () => {
        this.cart.clearCart();
        this.isSubmitting.set(false);
        this.router.navigate(['/checkout/confirmation'], { state: orderState });
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
