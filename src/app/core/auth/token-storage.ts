import { Injectable } from '@angular/core';

export interface StoredTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Chuỗi ISO 8601 y như backend trả. Không chuyển đổi khi lưu. */
  readonly expiresAt: string;
}

const KEY_ACCESS_TOKEN = 'shop.accessToken';
const KEY_REFRESH_TOKEN = 'shop.refreshToken';
const KEY_EXPIRES_AT = 'shop.expiresAt';

const KEY_PROBE = 'shop.__probe__';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly persistent = TokenStorage.probe();
  private readonly memory = new Map<string, string>();

  private static probe(): boolean {
    try {
      localStorage.setItem(KEY_PROBE, '1');
      localStorage.removeItem(KEY_PROBE);
      return true;
    } catch {
      return false;
    }
  }
  private read(key: string): string | null {
    if (!this.persistent) {
      return this.memory.get(key) ?? null;
    }

    try {
      return localStorage.getItem(key);
    } catch {
      return this.memory.get(key) ?? null;
    }
  }

  private write(key: string, value: string): void {
    this.memory.set(key, value);

    if (!this.persistent) {
      return;
    }

    try {
      localStorage.setItem(key, value);
    } catch(err) {
      console.log(err)
    }
  }

  private remove(key: string): void {
    this.memory.delete(key);

    if (!this.persistent) {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch(err) {
      console.log(err)
    }
  }

  get accessToken(): string | null {
    return this.read(KEY_ACCESS_TOKEN);
  }

  get refreshToken(): string | null {
    return this.read(KEY_REFRESH_TOKEN);
  }

  get expiresAt(): Date | null {
    const raw = this.read(KEY_EXPIRES_AT);
    if (raw === null) {
      return null;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  get hasSession(): boolean {
    return this.refreshToken !== null;
  }

  save(tokens: StoredTokens): void {
    this.write(KEY_ACCESS_TOKEN, tokens.accessToken);
    this.write(KEY_REFRESH_TOKEN, tokens.refreshToken);
    this.write(KEY_EXPIRES_AT, tokens.expiresAt);
  }

  clear(): void {
    this.remove(KEY_ACCESS_TOKEN);
    this.remove(KEY_REFRESH_TOKEN);
    this.remove(KEY_EXPIRES_AT);
  }
}
