import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CheckoutStateService, CheckoutSuccessState } from '../data-access/checkout-state.service';

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
  private readonly checkoutState = inject(CheckoutStateService);

  readonly state = computed(() => {
    const stored = this.checkoutState.success();
    if (stored) return stored;
    return (this.router.getCurrentNavigation()?.extras.state ?? history.state) as CheckoutSuccessState;
  });

  readonly safeState = computed<CheckoutSuccessState | null>(() => {
    const s = this.state();
    if (!s || typeof s.orderId !== 'string') return null;
    return s;
  });

  orderDateLabel(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }
}
