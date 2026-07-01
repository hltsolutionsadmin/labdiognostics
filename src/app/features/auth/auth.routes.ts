import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./containers/login-page.component').then((m) => m.LoginPageComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./containers/registration-page.component').then((m) => m.RegistrationPageComponent)
  },
  {
    path: 'verify-otp',
    loadComponent: () =>
      import('./containers/verify-otp-page.component').then((m) => m.VerifyOtpPageComponent)
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./containers/profile-page.component').then((m) => m.ProfilePageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./containers/order-history-page.component').then((m) => m.OrderHistoryPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'addresses',
    loadComponent: () =>
      import('./containers/address-page.component').then((m) => m.AddressPageComponent),
    canActivate: [authGuard]
  }
];
