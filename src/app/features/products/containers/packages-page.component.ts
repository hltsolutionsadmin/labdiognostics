import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { toSignal } from '@angular/core/rxjs-interop';
import { ProductsApiService } from '../data-access/products-api.service';
import { Product } from '../../../shared/types';
import { ProductCardComponent } from '../ui/product-card.component';
import { CartSignalService } from '../../cart/data-access/cart-signal.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-packages-page',
  standalone: true,
  imports: [RouterLink, ProductCardComponent],
  templateUrl: './packages-page.component.html',
  styleUrl: './packages-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackagesPageComponent {
  private readonly _instanceId = crypto.randomUUID();

  private readonly api = inject(ProductsApiService);
  private readonly cart = inject(CartSignalService);
  private readonly router = inject(Router);

  readonly selectedCategory = signal<string>('All');
  readonly sortBy = signal<'popularity' | 'price_low' | 'price_high'>('popularity');

  private readonly products$ = this.api.getProducts();
  private readonly _productsDebug$ = this.products$.pipe(
    tap((arr) => {
      console.debug('[PackagesPageComponent] products$ next', {
        instanceId: this._instanceId,
        len: arr.length,
        time: new Date().toISOString(),
        firstId: arr[0]?.id
      });
    }),
    tap({
      complete: () =>
        console.debug('[PackagesPageComponent] products$ complete', {
          instanceId: this._instanceId,
          time: new Date().toISOString()
        })
    })
  );

  readonly products = toSignal(this._productsDebug$, {
    initialValue: [] as ReadonlyArray<Product>
  });

  readonly categories = computed(() => {
    console.debug('[PackagesPageComponent] categories() recompute', {
      instanceId: this._instanceId,
      time: new Date().toISOString(),
      productsLen: this.products().length
    });

    const map = new Map<string, number>();
    for (const p of this.products()) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    const items = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return ['All', ...items.map(([name]) => name)];
  });

  readonly filtered = computed(() => {
    const products = this.products();

    // Backend returns a mixed list (Tests + Bundles). Packages page must show ONLY bundles.
    const bundleProducts = products.filter((p: any) => p.productType === 'BUNDLE');



    const cat = this.selectedCategory();
    let list = bundleProducts;
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
    this.cart.addProductFromProduct(product, 1).subscribe();
  }

  onView(product: Product): void {
    console.log('[PackagesPageComponent] onView clicked product:', product);
    if (!product?.id) {
      console.warn('[PackagesPageComponent] onView: product.id is missing');
      return;
    }
    void this.router.navigate(['/packages', product.id]);
  }



}

