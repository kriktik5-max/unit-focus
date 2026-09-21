// Работа с авторизацией: API-запросы, хранение токена.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type User = {
  id: number;
  email: string;
  full_name: string;
};

export type Plan = {
  code: string;
  name: string;
  price_monthly: number;
  limits: Record<string, unknown>;
};

export type Subscription = {
  status: string;
  started_at: string;
  expires_at: string | null;
  source: string;
  days_left: number | null;
  is_active: boolean;
};

export type MeResponse = {
  user: User;
  plan: Plan;
  subscription: Subscription;
};

export type AuthResponse = {
  token: string;
  user: User;
};

const TOKEN_KEY = 'uf_token';

export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

export async function register(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Ошибка регистрации');
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Ошибка входа');
  }
  return res.json();
}

export async function fetchMe(): Promise<MeResponse | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
    }
    return null;
  }
  return res.json();
}

export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* игнорируем */
    }
  }
  clearToken();
}
