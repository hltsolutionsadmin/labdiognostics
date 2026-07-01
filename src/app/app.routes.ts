import { Routes } from '@angular/router';
import { PackageDetailsPageComponent } from './features/products/containers/package-details-page.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/products/containers/products-page.component').then(
        (m) => m.ProductsPageComponent
      )
  },
  {
    path: 'packages',
    loadComponent: () =>
      import('./features/products/containers/packages-page.component').then(
        (m) => m.PackagesPageComponent
      )
  },
  {
    path: 'packages/:id',
    component: PackageDetailsPageComponent
  },
  {
    path: 'tests',
    loadComponent: () =>
      import('./features/products/containers/tests-page.component').then(
        (m) => m.TestsPageComponent
      )
  },
  {
    path: 'tests/:id',
    loadComponent: () =>
      import('./features/products/containers/test-details-page.component').then(
        (m) => m.TestDetailsPageComponent
      )
  },

  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/containers/products-page.component').then(
        (m) => m.ProductsPageComponent
      )
  },
  {
    path: 'cart',
    loadChildren: () =>
      import('./features/cart/cart.routes').then((m) => m.CART_ROUTES)
  },
  {
    path: 'checkout',
    loadChildren: () =>
      import('./features/checkout/checkout.routes').then((m) => m.CHECKOUT_ROUTES)
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
