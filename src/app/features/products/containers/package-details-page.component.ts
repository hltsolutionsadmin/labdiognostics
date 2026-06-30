import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
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

  private readonly products$ = this.api.getProducts();
  readonly products = toSignal(this.products$, { initialValue: [] as ReadonlyArray<Product> });

  readonly product = computed<Product | null>(() => {
    const id = this.id();
    if (!id) return null;
    return this.products().find((p) => p.id === id) ?? null;
  });

  readonly isPackage = computed(() => {
    const p = this.product();
    return !!p && p.category === 'Packages';
  });

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

  readonly includedCountLabel = computed(() => {
    const p = this.product();
    if (!p) return '';
    const m = /includes\s+(\d+)/i.exec(p.description);
    if (!m) return p.description;
    return `Includes ${m[1]}+ Tests`;
  });

  readonly testGroups = signal<ReadonlyArray<TestGroup>>([
    {
      name: 'Complete Blood Count (CBC)',
      countLabel: '16 Tests',
      items: ['Hemoglobin', 'RBC', 'WBC', 'Platelet Count', 'Hematocrit']
    },
    {
      name: 'Diabetes Profile',
      countLabel: '5 Tests',
      items: ['Fasting Blood Sugar', 'HbA1c', 'PP Blood Sugar']
    },
    {
      name: 'Lipid Profile',
      countLabel: '8 Tests',
      items: ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides']
    },
    {
      name: 'Liver Function Test',
      countLabel: '11 Tests',
      items: ['SGOT', 'SGPT', 'Bilirubin Total', 'Alkaline Phosphatase']
    },
    {
      name: 'Kidney Function Test',
      countLabel: '7 Tests',
      items: ['Creatinine', 'Urea', 'Uric Acid']
    },
    {
      name: 'Thyroid Profile',
      countLabel: '3 Tests',
      items: ['T3', 'T4', 'TSH']
    }
  ]);

  readonly openGroup = signal<string>(this.testGroups()[0]?.name ?? '');

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

  toggleGroup(name: string): void {
    this.openGroup.set(this.openGroup() === name ? '' : name);
  }

  toggleFaq(q: string): void {
    this.openFaq.set(this.openFaq() === q ? '' : q);
  }

  onAddToCart(): void {
    const p = this.product();
    if (!p) return;
    if (p.category !== 'Packages') return;
    this.cart.addProductFromProduct(p, 1).subscribe();
  }

  onBookNow(): void {
    const p = this.product();
    if (!p) return;
    if (p.category !== 'Packages') return;
    this.cart.addProductFromProduct(p, 1).subscribe();
    void this.router.navigate(['/cart']);
  }
}
