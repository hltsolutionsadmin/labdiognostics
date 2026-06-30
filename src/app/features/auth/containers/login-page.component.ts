import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthSignalService } from '../data-access/auth-signal.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly auth = inject(AuthSignalService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly loginMode = signal<'email' | 'otp'>('email');

  readonly form = new FormGroup({
    emailOrMobile: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, this.emailOrMobileValidator]
    }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    remember: new FormControl<boolean>(true, { nonNullable: true })
  });

  private emailOrMobileValidator(control: AbstractControl<string>): ValidationErrors | null {
    const value = control.value.trim();
    if (!value) return null;

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isMobile = /^[0-9]{10}$/.test(value);

    return isEmail || isMobile ? null : { emailOrMobile: true };
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.auth
      .login({
        username: this.form.controls.emailOrMobile.value.trim(),
        password: this.form.controls.password.value
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigateByUrl('/auth/profile');
        },
        error: (err: unknown) => {
          this.isSubmitting.set(false);
          const anyErr = err as any;
          const msg =
            anyErr?.error?.message ??
            anyErr?.error?.error ??
            anyErr?.error?.detail ??
            anyErr?.message ??
            'Login failed. Please check your email or mobile number and password.';

          this.errorMessage.set(
            typeof msg === 'string'
              ? msg
              : 'Login failed. Please check your email or mobile number and password.'
          );
        }
      });
  }
}
