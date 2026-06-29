import { Injectable, computed, effect, signal } from '@angular/core';
import { User } from '../../../shared/types';

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

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._user()));
    });
  }

  login(email: string): void {
    // Placeholder: replace with real auth API (RxJS).
    this._user.set({ id: 'u1', name: 'Guest User', email });
  }

  logout(): void {
    this._user.set(null);
  }
}
