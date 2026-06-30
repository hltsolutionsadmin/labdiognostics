import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../../shared/types';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent implements OnChanges {
  private readonly _instanceId = crypto.randomUUID();

  @Input({ required: true }) product!: Product;
  @Output() addToCart = new EventEmitter<Product>();
  @Output() view = new EventEmitter<Product>();

  constructor() {
    console.debug('[ProductCardComponent] ctor', {
      instanceId: this._instanceId,
      time: new Date().toISOString()
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const p: Product | undefined = changes['product']?.currentValue;

    console.debug('[ProductCardComponent] ngOnChanges', {
      instanceId: this._instanceId,
      time: new Date().toISOString(),
      productId: p?.id,
      productName: p?.name
    });
  }

  ngOnDestroy(): void {
    console.debug('[ProductCardComponent] ngOnDestroy', {
      instanceId: this._instanceId,
      time: new Date().toISOString()
    });
  }
}

