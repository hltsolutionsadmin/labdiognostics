import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthSignalService } from '../data-access/auth-signal.service';

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationPageComponent {
  private readonly auth = inject(AuthSignalService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    firstName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    mobile: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern('^[0-9]{10}$')]
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)]
    })
  });

  private buildFirstError(): string | null {
    const controls = this.form.controls;

    const firstName = controls.firstName;
    if (firstName.touched && firstName.invalid) {
      if (firstName.hasError('required')) return 'First name is required.';
    }

    const lastName = controls.lastName;
    if (lastName.touched && lastName.invalid) {
      if (lastName.hasError('required')) return 'Last name is required.';
    }

    const email = controls.email;
    if (email.touched && email.invalid) {
      if (email.hasError('required')) return 'Email is required.';
      if (email.hasError('email')) return 'Please enter a valid email address.';
    }

    const mobile = controls.mobile;
    if (mobile.touched && mobile.invalid) {
      if (mobile.hasError('required')) return 'Contact number is required.';
      if (mobile.hasError('pattern')) return 'Contact number must be exactly 10 digits.';
    }

    const password = controls.password;
    if (password.touched && password.invalid) {
      if (password.hasError('required')) return 'Password is required.';
      if (password.hasError('minlength')) return 'Password must be at least 8 characters.';
    }

    return null;
  }

  private getRegistrationUserId(response: unknown): string | null {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const readString = (value: unknown): string | null =>
      typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

    if (!response || typeof response !== 'object') return null;

    const record = response as Record<string, unknown>;
    const data = record['data'];
    const user = record['user'];
    const dataRecord = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    const userRecord = user && typeof user === 'object' ? (user as Record<string, unknown>) : null;
    const dataUser = dataRecord?.['user'];
    const dataUserRecord =
      dataUser && typeof dataUser === 'object' ? (dataUser as Record<string, unknown>) : null;

    const prioritized = [
      readString(record['userId']),
      readString(dataRecord?.['userId']),
      readString(userRecord?.['userId']),
      readString(dataUserRecord?.['userId']),
      readString(dataUserRecord?.['id']),
      readString(userRecord?.['id']),
      readString(dataRecord?.['id']),
      readString(record['id']),
      readString(data)
    ].filter((value): value is string => value !== null);

    const nestedUuidCandidates: string[] = [];
    const collectUuidStrings = (value: unknown): void => {
      if (typeof value === 'string' && uuidPattern.test(value.trim())) {
        nestedUuidCandidates.push(value.trim());
        return;
      }

      if (!value || typeof value !== 'object') return;
      for (const nested of Object.values(value as Record<string, unknown>)) {
        collectUuidStrings(nested);
      }
    };

    collectUuidStrings(response);

    return (
      prioritized.find((candidate) => uuidPattern.test(candidate)) ??
      nestedUuidCandidates[0] ??
      prioritized[0] ??
      null
    );
  }

  submit(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const first = this.buildFirstError();
      if (first) this.errorMessage.set(first);
      return;
    }

    const payload = {
      firstName: this.form.controls.firstName.value,
      lastName: this.form.controls.lastName.value,
      email: this.form.controls.email.value,
      mobile: this.form.controls.mobile.value,
      password: this.form.controls.password.value
    };

    this.isSubmitting.set(true);
    this.auth.register(payload).subscribe({
      next: (res: unknown) => {
        console.log('[Auth] POST /auth/register response', res);
        // Backend is expected to return a userId for OTP verification.
        const userId = this.getRegistrationUserId(res);
        const email: string = this.form.controls.email.value;

        if (userId) {
          this.auth.setPendingVerification(userId, email);
          this.successMessage.set('Registration successful. Please verify your email with OTP.');
          this.isSubmitting.set(false);
          this.router.navigateByUrl('/auth/verify-otp');
          return;
        }

        // Backend automatically sends OTP after successful registration.
        this.isSubmitting.set(false);
        this.errorMessage.set(
          'Registration succeeded, but no verification userId was returned. Please register again.'
        );
      },

      error: (err: unknown) => {
        this.isSubmitting.set(false);

        const anyErr = err as any;
        const msg =
          anyErr?.error?.message ??
          anyErr?.error?.error ??
          anyErr?.error?.detail ??
          anyErr?.error?.details ??
          anyErr?.message ??
          'Registration failed. Please try again.';

        this.errorMessage.set(
          typeof msg === 'string' ? msg : 'Registration failed. Please try again.'
        );
      }
    });
  }
}
