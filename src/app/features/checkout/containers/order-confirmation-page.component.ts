import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

type ConfirmationState = {
  orderId: string;
  orderDate: string;
  paymentStatus: 'Paid' | 'Pending';
  paymentMethod: 'upi' | 'card' | 'cod';
  amountPaid: number;
  subtotal: number;
  discount: number;
  convenienceFee: number;
  items: Array<{ productId: string; name: string; quantity: number; unitPrice: number }>;
  collectionMode: 'home' | 'lab';
  selectedLab: 'center-1' | 'center-2';
  selectedAddress: 'home' | 'office' | 'new';
  contact: { fullName: string; email: string; mobile: string };
  address: { addressLine1: string; city: string; postalCode: string } | null;
  appointment: { date: string; time: string };
};

@Component({
  selector: 'app-order-confirmation-page',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './order-confirmation-page.component.html',
  styleUrl: './order-confirmation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderConfirmationPageComponent {
  private readonly router = inject(Router);

  readonly state = computed(() => (this.router.getCurrentNavigation()?.extras.state ?? history.state) as ConfirmationState);

  readonly safeState = computed<ConfirmationState | null>(() => {
    const s = this.state();
    if (!s || typeof s.orderId !== 'string') return null;
    return s;
  });

  readonly estimatedTotal = computed(() => {
    const s = this.safeState();
    if (!s) return 0;
    return s.subtotal - s.discount + s.convenienceFee;
  });

  paymentMethodLabel(method: 'upi' | 'card' | 'cod'): string {
    if (method === 'upi') return 'UPI';
    if (method === 'card') return 'Card';
    return 'Pay at Visit';
  }

  labLabel(selected: 'center-1' | 'center-2'): string {
    return selected === 'center-1' ? 'CareLab Diagnostics - MVP Colony' : 'CareLab Diagnostics - Madhurawada';
  }

  orderDateLabel(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }
}
