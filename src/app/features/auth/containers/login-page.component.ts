import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthSignalService } from '../data-access/auth-signal.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly auth = inject(AuthSignalService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly loginMode = signal<'email' | 'otp'>('email');

  readonly form = new FormGroup({
    emailOrMobile: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    remember: new FormControl<boolean>(true, { nonNullable: true })
  });

  submit(): void {
    if (this.form.controls.emailOrMobile.invalid || this.form.controls.password.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const emailOrMobile = this.form.controls.emailOrMobile.value;
    const password = this.form.controls.password.value;

    this.isSubmitting.set(true);

    this.auth.login(emailOrMobile, password).subscribe({
      next: () => {
        this.router.navigateByUrl('/');
        this.isSubmitting.set(false);
      },
      error: (err: unknown) => {
        console.error('Login failed', err);
        this.isSubmitting.set(false);
      },
      complete: () => {
        // no-op (subscribe is handled in next/error)
      }
    });
  }
}
