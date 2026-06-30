import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthSignalService } from '../data-access/auth-signal.service';

@Component({
  selector: 'app-verify-otp-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-otp-page.component.html',
  styleUrl: './verify-otp-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyOtpPageComponent {
  private readonly auth = inject(AuthSignalService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    otp: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern('^[0-9]{4,8}$')]
    })
  });

  constructor() {
    // Do not call sendOtp() automatically. OTP is expected to be sent
    // by the backend after successful registration.
  }





  submit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please enter the OTP.');
      return;
    }

    const userId = this.auth.pendingVerificationUserId();
    if (!userId) {
      this.errorMessage.set('Missing verification context. Please register again.');
      return;
    }

    // Use the exact OTP entered by the user.
    const otp = this.form.controls.otp.value.trim();

    // Extra guard: ensure otp is non-empty string.
    if (!otp) {
      this.errorMessage.set('Please enter the OTP.');
      return;
    }

    this.isSubmitting.set(true);
    this.auth.verifyOtp({ userId, otp }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Email verified successfully.');
        this.auth.clearPendingVerification();
        this.router.navigateByUrl('/auth/login');
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        console.error('[Auth] OTP verification failed', {
          request: { userId, otp },
          error: err
        });
        const anyErr = err as any;
        const msg =
          anyErr?.error?.message ??
          anyErr?.error?.error ??
          anyErr?.error?.detail ??
          anyErr?.message ??
          'OTP verification failed. Please try again.';
        this.errorMessage.set(
          typeof msg === 'string' ? msg : 'OTP verification failed. Please try again.'
        );
      }
    });
  }


  // OTP sending is handled automatically by backend after registration.
}



