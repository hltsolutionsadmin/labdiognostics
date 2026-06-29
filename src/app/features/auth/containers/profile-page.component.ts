import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthSignalService } from '../data-access/auth-signal.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePageComponent {
  private readonly auth = inject(AuthSignalService);
  readonly user = this.auth.user;

  logout(): void {
    this.auth.logout();
  }
}
