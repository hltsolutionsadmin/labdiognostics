import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Product } from '../../../shared/types';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getProducts(): Observable<ReadonlyArray<Product>> {
    // Placeholder: replace with real endpoint (RxJS for async API).
    // Example: return this.http.get<ReadonlyArray<Product>>(`${this.baseUrl}/api/products`);
    void this.http;
    void this.baseUrl;
    return of(MOCK_PRODUCTS).pipe(delay(200));
  }
}

const MOCK_PRODUCTS: ReadonlyArray<Product> = [
  {
    id: 'p1',
    name: 'Full Body Checkup',
    description: 'Includes 80+ Tests',
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=60',
    price: 1499,
    originalPrice: 2500,
    category: 'Packages',
    rating: 4.8,
    ratingCount: 1200,
    badges: ['40% OFF']
  },
  {
    id: 'p2',
    name: 'Diabetes Profile',
    description: 'Includes 28 Tests',
    imageUrl: 'https://images.unsplash.com/photo-1582719478185-2d6f18b1a217?auto=format&fit=crop&w=900&q=60',
    price: 699,
    originalPrice: 1200,
    category: 'Packages',
    rating: 4.6,
    ratingCount: 860,
    badges: ['42% OFF']
  },
  {
    id: 'p3',
    name: 'Liver Function Test',
    description: 'Includes 22 Tests',
    imageUrl: 'https://images.unsplash.com/photo-1582719478171-2c6d1b6d8b0b?auto=format&fit=crop&w=900&q=60',
    price: 599,
    originalPrice: 1000,
    category: 'Packages',
    rating: 4.5,
    ratingCount: 620,
    badges: ['40% OFF']
  },
  {
    id: 'p4',
    name: 'Thyroid Profile',
    description: 'Includes 13 Tests',
    imageUrl: 'https://images.unsplash.com/photo-1582719478144-1d5b3a6a1d8a?auto=format&fit=crop&w=900&q=60',
    price: 499,
    originalPrice: 800,
    category: 'Packages',
    rating: 4.4,
    ratingCount: 410,
    badges: ['38% OFF']
  }
];
