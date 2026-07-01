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
  private readonly api = inject(ProductsApiService);
  private readonly cart = inject(CartSignalService);

  readonly selectedCategory = signal<string>('All');

  private readonly products$ = this.api.getProducts();

  private readonly _packagesDebug$ = this.products$.pipe(
    tap((arr) => {
      console.debug('[ProductsPageComponent] packages debug source next', {
        instanceId: this._instanceId,
        len: arr.length,
        time: new Date().toISOString(),
        firstId: arr[0]?.id
      });
    }),
    tap({
      complete: () =>
        console.debug('[ProductsPageComponent] packages debug source complete', {
          instanceId: this._instanceId,
          time: new Date().toISOString()
        })
    })
  );

  readonly packages = toSignal(this._packagesDebug$, { initialValue: [] as ReadonlyArray<Product> });

  // Home page separate tests section.
  // This codebase doesn't have a dedicated Tests API service, so we reuse the same source.
  // We still ensure packages and tests are not merged into a single list.
  readonly tests = computed(() => this.packages().filter((p) => !this.isPackage(p)));


  private readonly isPackage = (p: Product): boolean => {
    const anyP = p as any;
    // Backend may return either `productType: 'BUNDLE'`, `packageType`, or `type`.
    const type = anyP.productType ?? anyP.packageType ?? anyP.type;
    return type === 'BUNDLE' || type === 'PACKAGE';
  };


  readonly categories = computed(() => {
    const set = new Set<string>(['All']);
    for (const p of this.packages()) {
      if (!this.isPackage(p)) continue;
      set.add(p.category);
    }
    return Array.from(set);
  });

  readonly filtered = computed(() => {
    const cat = this.selectedCategory();
    const onlyPackages = this.packages().filter((p) => this.isPackage(p));
    if (cat === 'All') return onlyPackages;
    return onlyPackages.filter((p) => p.category === cat);
  });



  onAdd(product: Product): void {
    this.cart.addProductFromProduct(product, 1).subscribe();
  }

}

