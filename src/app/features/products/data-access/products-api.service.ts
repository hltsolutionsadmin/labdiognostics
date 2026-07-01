import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs';

import { Product } from '../../../shared/types';
import { environment } from '../../../../environments/environment';

type CatalogPageResponse = {
  content: Array<{ id: string }>;
};

type CatalogVersionResponse = {
  id: string;
};

type ProductsResponse = {
  content: ReadonlyArray<Product>;
};


@Injectable({ providedIn: 'root' })
export class ProductsApiService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly storeId = environment.storeId;

  getProducts(): Observable<ReadonlyArray<Product>> {
    console.debug('[ProductsApiService] getProducts()');
    return this.getProductsForOnlineCatalog();
  }

  private getProductsForOnlineCatalog(): Observable<ReadonlyArray<Product>> {
    console.debug('[ProductsApiService] getProductsForOnlineCatalog() start');
    if (!this.storeId) {
      return throwError(() => new Error('Missing environment.storeId'));
    }

    const baseParams = new HttpParams()
      .set('storeId', this.storeId)
      .set('page', '0')
      .set('size', '10');

    return this.http
      .get<CatalogPageResponse>(`${this.baseUrl}/api/catalogs/page`, { params: baseParams })
      .pipe(tap(() => console.debug('[ProductsApiService] catalogs/page response received')))
      .pipe(
        map((res) => res?.content?.[0]?.id ?? null),
        tap((catalogId) => {
          // Useful when debugging why the chain stops.
          // Remove if you don't want console output.
          console.debug('[ProductsApiService] catalogId:', catalogId);
        }),
        switchMap((catalogId) => {
          if (!catalogId) return of([] as ReadonlyArray<Product>);

          return this.http
            .get<CatalogVersionResponse>(`${this.baseUrl}/api/catalogs/${catalogId}/versions/online`)
            .pipe(
              map((onlineVersion) => onlineVersion?.id ?? null),
              tap((catalogVersionId) => {
                console.debug('[ProductsApiService] catalogVersionId:', catalogVersionId);
              }),
              switchMap((catalogVersionId) => {
                if (!catalogVersionId) return of([] as ReadonlyArray<Product>);

                const params = new HttpParams()
                  .set('catalogVersionId', catalogVersionId)
                  .set('page', '0')
                  .set('size', '10');

                return this.http
                  .get<any>(`${this.baseUrl}/api/products`, { params })
                  .pipe(
                    tap((productsRes) =>
                      console.debug(
                        '[ProductsApiService] /api/products response received, count=',
                        productsRes?.content?.length ?? 0
                      )
                    ),
                    map((productsRes): ReadonlyArray<Product> => {
                      const content = (productsRes?.content ?? []) as Array<any>;

                      // Map backend product shape -> frontend Product model
                      // Backend example:
                      // price: { id: '...', price: 200.0000, currency: null, ... }
                      return content.map((p) => {
                        const mappedPrice = p?.price?.price ?? 0;
                        const mappedOriginalPrice = p?.originalPrice?.price ?? p?.originalPrice ?? undefined;

                        return {
                          ...p,
                          price: mappedPrice,
                          originalPrice: typeof mappedOriginalPrice === 'number' ? mappedOriginalPrice : undefined
                        } as Product;
                      });
                    }),
                    tap((products) => {
                      // Temporary logging (remove after verification)
                      console.table(
                        products.map((p) => ({
                          id: p.id,
                          name: p.name,
                          productType: (p as any).productType,
                          mappedPrice: p.price
                        }))
                      );
                    })
                  );
              })
            );
        }),
        // Keep returning [] so UI doesn't break, but log the error.
        catchError((err) => {
          console.error('[ProductsApiService] getProducts flow failed:', err);
          // Surface details for debugging stuck/empty card states.
          return of([] as ReadonlyArray<Product>);
        })
      );
  }
  getProductById(productId: string): Observable<Product> {
    console.debug('[ProductsApiService] getProductById()', { productId });

    return this.http.get<any>(`${this.baseUrl}/api/products/${productId}`).pipe(
      map((p): Product => {
        // Temporary verification (remove after wiring all UI fields to API)
        console.log('[ProductsApiService] getProductById raw response:', p);

        const mappedPrice = p?.price?.price ?? 0;
        const mappedOriginalPrice =
          typeof p?.originalPrice?.price === 'number' ? p.originalPrice.price : undefined;

        return {
          ...p,
          price: mappedPrice,
          originalPrice: mappedOriginalPrice
        } as Product;
      }),
      tap(() => console.debug('[ProductsApiService] getProductById() response mapped', { productId }))
    );
  }




}

