import { Component, computed, inject } from '@angular/core';
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
  private readonly cart = inject(CartSignalService);
  private readonly auth = inject(AuthSignalService);

  readonly cartCount = computed(() => this.cart.totalQuantity());

  readonly isAuthed = this.auth.isAuthed;
  readonly user = this.auth.user;
}
