import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs';

import { environment } from '../../../../environments/environment.local';
import { User } from '../../../shared/types';

const STORAGE_KEY = 'lab.user.v1';
const PENDING_VERIFICATION_KEY = 'lab.pendingVerification.v1';
const DEVICE_ID_KEY = 'lab.deviceId.v1';

function safeParseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const o = parsed as Record<string, unknown>;
    if (typeof o['id'] !== 'string' || typeof o['name'] !== 'string' || typeof o['email'] !== 'string')
      return null;
    return { id: o['id'], name: o['name'], email: o['email'] };
  } catch {
    return null;
  }
}

function safeParsePendingVerification(raw: string | null): { userId: string; email: string } | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const o = parsed as Record<string, unknown>;
    if (typeof o['userId'] !== 'string' || typeof o['email'] !== 'string') return null;
    return { userId: o['userId'], email: o['email'] };
  } catch {
    return null;
  }
}

export type RegistrationPayload = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
};

export type OtpVerifyPayload = { userId: string; otp: string };
export type LoginPayload = { username: string; password: string };

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

@Injectable({ providedIn: 'root' })
export class AuthSignalService {
  private readonly http = inject(HttpClient);

  private buildJsonHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  private getDeviceId(): string {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const generated =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, generated);
    return generated;
  }

  private getLoginUser(response: unknown, username: string): User {
    const record = response && typeof response === 'object' ? (response as Record<string, unknown>) : {};
    const data = record['data'] && typeof record['data'] === 'object' ? (record['data'] as Record<string, unknown>) : null;
    const user = record['user'] && typeof record['user'] === 'object' ? (record['user'] as Record<string, unknown>) : null;
    const dataUser =
      data?.['user'] && typeof data['user'] === 'object' ? (data['user'] as Record<string, unknown>) : null;
    const source = dataUser ?? user ?? data ?? record;

    const firstName = readString(source['firstName']);
    const lastName = readString(source['lastName']);
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    return {
      id: readString(source['id']) ?? readString(source['userId']) ?? username,
      name: readString(source['name']) ?? (fullName || username),
      email: readString(source['email']) ?? username
    };
  }

  private readonly pendingVerification = signal<{ userId: string; email: string } | null>(
    safeParsePendingVerification(localStorage.getItem(PENDING_VERIFICATION_KEY))
  );

  private readonly _user = signal<User | null>(safeParseUser(localStorage.getItem(STORAGE_KEY)));

  readonly user = this._user.asReadonly();
  readonly isAuthed = computed(() => this._user() !== null);

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._user()));
    });
  }

  login(payload: LoginPayload) {
    const body = {
      username: payload.username,
      password: payload.password,
      deviceId: this.getDeviceId()
    };

    return this.http.post<any>(`${environment.apiBaseUrl}/auth/login`, body, {
      headers: this.buildJsonHeaders()
    }).pipe(
      tap((response) => {
        this._user.set(this.getLoginUser(response, payload.username));
      })
    );
  }

  register(payload: RegistrationPayload) {
    return this.http.post<any>(`${environment.apiBaseUrl}/auth/register`, payload, {
      headers: this.buildJsonHeaders()
    });
  }

  pendingVerificationUserId(): string | null {
    return this.pendingVerification()?.userId ?? null;
  }

  setPendingVerification(userId: string, email: string): void {
    const pending = { userId, email };
    this.pendingVerification.set(pending);
    localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(pending));
  }

  clearPendingVerification(): void {
    this.pendingVerification.set(null);
    localStorage.removeItem(PENDING_VERIFICATION_KEY);
  }

  verifyOtp(payload: OtpVerifyPayload) {
    return this.http.post<any>(`${environment.apiBaseUrl}/api/auth/verify-otp`, payload, {
      headers: this.buildJsonHeaders()
    });
  }

  logout(): void {
    this._user.set(null);
  }
}
