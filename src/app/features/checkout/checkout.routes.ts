import { Routes } from '@angular/router';
import { authGuard } from '../auth/guards/auth.guard';
import { OrderConfirmationPageComponent } from './containers/order-confirmation-page.component';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: 'confirmation',
    canActivate: [authGuard],
    component: OrderConfirmationPageComponent
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./containers/checkout-page.component').then((m) => m.CheckoutPageComponent)
  }
];
