import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { OrderHistoryPageComponent } from './containers/order-history-page.component';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./containers/login-page.component').then((m) => m.LoginPageComponent)
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./containers/profile-page.component').then((m) => m.ProfilePageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    component: OrderHistoryPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'addresses',
    loadComponent: () =>
      import('./containers/address-page.component').then((m) => m.AddressPageComponent),
    canActivate: [authGuard]
  }
];
