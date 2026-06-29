import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductsApiService } from '../data-access/products-api.service';
import { Product } from '../../../shared/types';
import { ProductCardComponent } from '../ui/product-card.component';
import { CartSignalService } from '../../cart/data-access/cart-signal.service';

@Component({
  selector: 'app-packages-page',
  standalone: true,
  imports: [RouterLink, ProductCardComponent],
  templateUrl: './packages-page.component.html',
  styleUrl: './packages-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackagesPageComponent {
  private readonly api = inject(ProductsApiService);
  private readonly cart = inject(CartSignalService);
  private readonly router = inject(Router);

  readonly selectedCategory = signal<string>('All');
  readonly sortBy = signal<'popularity' | 'price_low' | 'price_high'>('popularity');

  private readonly products$ = this.api.getProducts();
  readonly products = toSignal(this.products$, { initialValue: [] as ReadonlyArray<Product> });

  readonly categories = computed(() => {
    const map = new Map<string, number>();
    for (const p of this.products()) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    const items = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return ['All', ...items.map(([name]) => name)];
  });

  readonly filtered = computed(() => {
    const cat = this.selectedCategory();
    let list = this.products();
    if (cat !== 'All') list = list.filter((p) => p.category === cat);

    const sort = this.sortBy();
    if (sort === 'price_low') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price_high') list = [...list].sort((a, b) => b.price - a.price);

    return list;
  });

  readonly countLabel = computed(() => {
    const count = this.filtered().length;
    const start = count > 0 ? 1 : 0;
    const end = count;
    return `Showing ${start} - ${end} of ${count} packages`;
  });

  categoryCount(cat: string): number {
    if (cat === 'All') return this.products().length;
    return this.products().filter((p) => p.category === cat).length;
  }

  onAdd(product: Product): void {
    this.cart.addProduct(product, 1);
  }

  onView(product: Product): void {
    if (product.category !== 'Packages') return;
    void this.router.navigate(['/packages', product.id]);
  }
}
