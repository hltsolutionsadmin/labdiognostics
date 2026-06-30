import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartSignalService } from '../data-access/cart-signal.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartPageComponent {
  private readonly cart = inject(CartSignalService);

  readonly items = this.cart.items;
  readonly subtotal = this.cart.subtotal;
  readonly totalQty = this.cart.totalQuantity;
  readonly grandTotal = this.cart.grandTotal;

  readonly hasItems = computed(() => this.items().length > 0);

  readonly discount = computed(() => 0);
  readonly convenienceFee = computed(() => (this.hasItems() ? 49 : 0));
  readonly estimatedTotal = computed(
    () => this.grandTotal() > 0 ? this.grandTotal() : this.subtotal() - this.discount() + this.convenienceFee()
  );

  inc(productId: string, currentQty: number): void {
    this.cart.setQuantity(productId, currentQty + 1);
  }

  dec(productId: string, currentQty: number): void {
    this.cart.setQuantity(productId, currentQty - 1);
  }

  remove(productId: string): void {
    this.cart.remove(productId);
  }
}
