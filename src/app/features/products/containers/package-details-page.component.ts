import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';
import { ProductsApiService } from '../data-access/products-api.service';
import { CartSignalService } from '../../cart/data-access/cart-signal.service';
import { Product } from '../../../shared/types';

type Faq = { q: string; a: string };
type TestGroup = { name: string; countLabel: string; items: ReadonlyArray<string> };

@Component({
  selector: 'app-package-details-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './package-details-page.component.html',
  styleUrl: './package-details-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackageDetailsPageComponent {
  private readonly api = inject(ProductsApiService);
  private readonly cart = inject(CartSignalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly id$ = this.route.paramMap.pipe(map((m) => m.get('id') ?? ''));
  readonly id = toSignal(this.id$, { initialValue: '' });
  readonly isPackage = computed(() => !!this.product());

  readonly product = toSignal(
    this.id$.pipe(
      switchMap(id => this.api.getProductById(id))
    ),
    {
      initialValue: null
    }
  );

  readonly heroSubtext = computed(() => {
    const p = this.product();
    if (!p) return '';

    return (p as any).shortDescription ?? p.description ?? '';
  });

  readonly packageOverviewText = computed(() => {
    const p = this.product();
    if (!p) return '';

    // Prefer description; fallback if missing.
    const desc = (p as any).description ?? (p as any).shortDescription ?? '';
    return desc || 'No description available.';
  });

  // Used by template highlights; only show what exists in API fields.
  readonly highlights = computed(() => {
    const p = this.product();
    if (!p) return [] as ReadonlyArray<string>;

    // Keep this defensive: backend may not provide these exact fields.
    const attrs: string[] = [];

    const possible = [
      { key: 'testCountLabel', fallback: '' },
      { key: 'reportsEtaLabel', fallback: '' },
      { key: 'labName', fallback: '' }
    ];

    for (const item of possible) {
      const v = (p as any)[item.key];
      if (typeof v === 'string' && v.trim()) attrs.push(v.trim());
    }

    // If we can't derive from API, return empty so hardcoded/demo highlights don't show.
    return attrs;
  });

  // Expose to template.
  // Must be pure (no side-effects) so the accordion always reflects the API response.
  readonly testGroups = computed((): ReadonlyArray<TestGroup> => {
    const p = this.product();
    if (!p) return [];

    const anyP = p as any;
    const bundleItems: ReadonlyArray<any> = anyP?.bundle?.items ?? [];

    const testNames: string[] = [];
    for (const it of bundleItems as ReadonlyArray<any>) {
      const n = it?.product?.name ?? it?.name ?? it?.testName;
      if (typeof n === 'string' && n.trim()) testNames.push(n.trim());
    }

    const uniqueNames = Array.from(new Set(testNames));

    if (!uniqueNames.length) {
      return [
        {
          name: 'No Tests',
          countLabel: '0 Tests',
          items: ['No test information available.']
        }
      ];
    }

    return [
      {
        name: 'Included Tests',
        countLabel: `${uniqueNames.length} Tests`,
        items: uniqueNames
      }
    ];
  });


  readonly openGroup = signal<string>('');

  readonly faqs = signal<ReadonlyArray<Faq>>([
    {
      q: 'Is fasting required for this package?',
      a: 'Some parameters may require fasting. If fasting is needed, we recommend 8–12 hours (water is allowed).'
    },
    {
      q: 'How will I get my reports?',
      a: 'Reports will be shared via SMS/Email and also available in your reports section once generated.'
    },
    {
      q: 'Can I reschedule my appointment?',
      a: 'Yes. You can reschedule based on available slots. If you need help, please contact support.'
    },
    {
      q: 'Are these tests suitable for seniors?',
      a: 'Yes, this package is commonly selected for routine screening across adult age groups.'
    }
  ]);

  readonly openFaq = signal<string>(this.faqs()[0]?.q ?? '');

  readonly includedCountLabel = computed(() => {
    const p = this.product();
    if (!p) return '';

    // Derive count from real API response: bundle.items[].
    const anyP = p as any;
    const count = Array.isArray(anyP?.bundle?.items) ? anyP.bundle.items.length : 0;
    if (count > 0) return `Includes ${count}+ Tests`;

    // Fallback to description parsing if backend embeds it.
    const description = (p as any).description ?? '';
    const match = /includes\s+(\d+)/i.exec(description);
    if (match) {
      return `Includes ${match[1]}+ Tests`;
    }

    // If we have no count, leave blank.
    return '';
  });

  readonly testCountLabelSuffix = computed(() => {
    const p = this.product();
    if (!p) return '';

    const anyP = p as any;
    const count = Array.isArray(anyP?.bundle?.items) ? anyP.bundle.items.length : 0;
    return count > 0 ? ` (${count})` : ' (0+)';
  });


  toggleGroup(name: string): void {
    this.openGroup.set(this.openGroup() === name ? '' : name);
  }

  toggleFaq(q: string): void {
    this.openFaq.set(this.openFaq() === q ? '' : q);
  }

  onAddToCart(): void {
    const p = this.product();
    if (!p) return;
    
    this.cart.addProductFromProduct(p, 1).subscribe();
  }

  onBookNow(): void {
    const p = this.product();
    if (!p) return;
    
    this.cart.addProductFromProduct(p, 1).subscribe();
    void this.router.navigate(['/cart']);
  }

  readonly discountPercent = computed(() => {
    const p = this.product();
    if (!p?.originalPrice || p.originalPrice <= p.price) return 0;
    return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  });

  readonly youSave = computed(() => {
    const p = this.product();
    if (!p?.originalPrice) return 0;
    return Math.max(0, p.originalPrice - p.price);
  });

  // Template already depends on the accordion toggles.
}


