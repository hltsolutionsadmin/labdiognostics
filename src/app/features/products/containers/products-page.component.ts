import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductsApiService } from '../data-access/products-api.service';
import { tap } from 'rxjs';
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
  private readonly _instanceId = crypto.randomUUID();
  private _cdTick = 0;
  private readonly api = inject(ProductsApiService);
  private readonly cart = inject(CartSignalService);

  readonly selectedCategory = signal<string>('All');

  private readonly products$ = this.api.getProducts();

  private readonly _productsDebug$ = this.products$.pipe(
    tap((arr) => {
      console.debug('[ProductsPageComponent] products$ next', {
        instanceId: this._instanceId,
        len: arr.length,
        time: new Date().toISOString(),
        firstId: arr[0]?.id
      });
    }),
    tap({
      complete: () =>
        console.debug('[ProductsPageComponent] products$ complete', {
          instanceId: this._instanceId,
          time: new Date().toISOString()
        })
    })
  );

  readonly products = toSignal(this._productsDebug$, { initialValue: [] as ReadonlyArray<Product> });

  readonly categories = computed(() => {
    const set = new Set<string>(['All']);
    for (const p of this.products()) set.add(p.category);
    return Array.from(set);
  });

  readonly filtered = computed(() => {
    console.debug('[ProductsPageComponent] filtered() recompute', {
      instanceId: this._instanceId,
      selectedCategory: this.selectedCategory(),
      time: new Date().toISOString(),
      len: this.products().length
    });
    const cat = this.selectedCategory();
    if (cat === 'All') return this.products();
    return this.products().filter((p) => p.category === cat);
  });

  onAdd(product: Product): void {
    this.cart.addProductFromProduct(product, 1).subscribe();
  }
}
