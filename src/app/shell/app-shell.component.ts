import { Component, computed, effect, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartSignalService } from '../features/cart/data-access/cart-signal.service';
import { AuthSignalService } from '../features/auth/data-access/auth-signal.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent {
  private readonly router = inject(Router);
  private readonly cart = inject(CartSignalService);
  private readonly auth = inject(AuthSignalService);

  readonly cartCount = computed(() => this.cart.totalQuantity());

  readonly isAuthed = this.auth.isAuthed;
  readonly user = this.auth.user;

  constructor() {
    console.debug('[Router] AppShellComponent ctor');

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        console.debug('[Router] NavigationEnd', {
          url: e.urlAfterRedirects,
          id: e.id,
          time: new Date().toISOString()
        });
      });

    // Initialize cart when user is authenticated
    effect(() => {
      if (this.auth.isAuthed()) {
        console.debug('[AppShell] User authenticated, initializing cart');
        this.cart.initializeCart().subscribe();
      } else {
        console.debug('[AppShell] User not authenticated, clearing cart');
        this.cart.clearCart();
      }
    });
  }
}
