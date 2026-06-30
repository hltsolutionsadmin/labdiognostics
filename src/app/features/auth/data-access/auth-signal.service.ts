import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, map, switchMap, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { User } from '../../../shared/types';
import { CartSignalService } from '../../cart/data-access/cart-signal.service';

const STORAGE_KEY = 'lab.user.v1';

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

@Injectable({ providedIn: 'root' })
export class AuthSignalService {
  private readonly _user = signal<User | null>(safeParseUser(localStorage.getItem(STORAGE_KEY)));

  readonly user = this._user.asReadonly();
  readonly isAuthed = computed(() => this._user() !== null);

  // Token storage (used by AuthTokenInterceptor)
  private readonly tokenStorageKey = 'lab.auth.tokens.v1';

  private readonly cart = inject(CartSignalService);

  accessToken(): string | null {
    const raw = localStorage.getItem(this.tokenStorageKey);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      const o = parsed as Record<string, unknown>;
      return typeof o['accessToken'] === 'string' ? o['accessToken'] : null;
    } catch {
      return null;
    }
  }

  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  private persistTokens(tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  }): void {
    localStorage.setItem(this.tokenStorageKey, JSON.stringify(tokens));
  }

  private readonly safeLoadUser = (raw: unknown): User => {
    const o = raw as Record<string, unknown>;
    return {
      id: typeof o['id'] === 'string' ? o['id'] : '',
      name: typeof o['name'] === 'string' ? o['name'] : '',
      email: typeof o['email'] === 'string' ? o['email'] : ''
    };
  };

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._user()));
    });
  }

  login(emailOrMobile: string, password: string): Observable<void> {
    const deviceId = 'web-browser';

    const loginPayload = {
      username: emailOrMobile,
      password,
      deviceId
    };

    return this.http
      .post<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
      }>(`${this.apiBaseUrl}/auth/login`, loginPayload)
      .pipe(
        switchMap((tokens) => {
          this.persistTokens(tokens);
          const accessToken = tokens.accessToken;
          const headers = new HttpHeaders({
            Authorization: `Bearer ${accessToken}`
          });

          return this.http.get<unknown>(`${this.apiBaseUrl}/api/users/me`, { headers });
        }),
        tap((me) => {
          const user = this.safeLoadUser(me);
          this._user.set(user);
          // Initialize cart after successful login
          console.debug('[Auth] User logged in, initializing cart');
          this.cart.initializeCart().subscribe();
        }),
        map(() => undefined)
      );
  }

  logout(): void {
    this._user.set(null);
    localStorage.removeItem(this.tokenStorageKey);
    // Clear cart on logout
    console.debug('[Auth] User logged out, clearing cart');
    this.cart.clearCart();
  }
}

