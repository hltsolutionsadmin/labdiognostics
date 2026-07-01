import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';
import { catchError, of } from 'rxjs';
import { ProductsApiService } from '../data-access/products-api.service';


@Component({
  selector: 'app-test-details-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './test-details-page.component.html',
  styleUrl: './test-details-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class TestDetailsPageComponent {
  private readonly api = inject(ProductsApiService);
  private readonly route = inject(ActivatedRoute);


  private readonly id$ = this.route.paramMap.pipe(map((m) => m.get('id') ?? ''));

  readonly product = toSignal(
    this.id$.pipe(
      switchMap((id) => this.api.getProductById(id))
    ),
    {
      initialValue: null
    }
  );

  readonly descriptionText = computed(() => {
    const d = this.product()?.description;
    return d ?? 'Description not available';
  });

  readonly priceCurrency = 'INR';
}

