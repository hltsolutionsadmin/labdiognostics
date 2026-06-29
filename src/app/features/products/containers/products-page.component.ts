import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductsApiService } from '../data-access/products-api.service';
import { Product } from '../../../shared/types';
import { ProductCardComponent } from '../ui/product-card.component';
import { CartSignalService } from '../../cart/data-access/cart-signal.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [ProductCardComponent, RouterLink],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsPageComponent {
  private readonly api = inject(ProductsApiService);
  private readonly cart = inject(CartSignalService);

  readonly selectedCategory = signal<string>('All');

  private readonly products$ = this.api.getProducts();
  readonly products = toSignal(this.products$, { initialValue: [] as ReadonlyArray<Product> });

  readonly categories = computed(() => {
    const set = new Set<string>(['All']);
    for (const p of this.products()) set.add(p.category);
    return Array.from(set);
  });

  readonly filtered = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'All') return this.products();
    return this.products().filter((p) => p.category === cat);
  });

  onAdd(product: Product): void {
    this.cart.addProduct(product, 1);
  }
}
