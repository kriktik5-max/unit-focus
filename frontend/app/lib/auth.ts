// Работа с авторизацией: API-запросы, хранение токена.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type User = {
  id: number;
  email: string;
  full_name: string;
  tax_mode: string;
  vat_rate: number;
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

export async function updateSettings(
  taxMode: string,
  vatRate: number
): Promise<User | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/api/v1/auth/me/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tax_mode: taxMode, vat_rate: vatRate }),
  });
  if (!res.ok) return null;
  return res.json();
}


// ============================================================
// Дашборд
// ============================================================

export type DashboardKpi = {
  revenue: number;
  revenue_net: number;
  ebitda: number;
  tax_total: number;
  vat: number;
  income_tax: number;
  net_profit: number;
  orders: number;
  margin_percent: number;
};

export type DailyPoint = {
  date: string;
  revenue: number;
  ebitda: number;
  net_profit: number;
  revenue_wb: number;
  revenue_ozon: number;
  revenue_yandex: number;
  ebitda_wb: number;
  ebitda_ozon: number;
  ebitda_yandex: number;
};

export type DashboardSummary = {
  kpi: DashboardKpi;
  daily: DailyPoint[];
  period_days: number;
  marketplace: string;
  tax_mode: string;
  vat_rate: number;
};

export type ProductRow = {
  product_id: number;
  sku: string;
  name: string;
  marketplace: string;
  revenue: number;
  ebitda: number;
  net_profit: number;
  orders: number;
  margin_percent: number;
};

export type DashboardProducts = {
  products: ProductRow[];
  period_days: number;
};

async function authedFetch<T>(path: string): Promise<T | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    if (res.status === 401) clearToken();
    return null;
  }
  return res.json();
}

export async function fetchDashboardSummary(
  days: number,
  marketplace: string
): Promise<DashboardSummary | null> {
  const url = `/api/v1/dashboard/summary?days=${days}&marketplace=${marketplace}&_t=${Date.now()}`;
  return authedFetch(url);
}

export async function fetchDashboardProducts(
  days: number,
  marketplace: string,
  limit = 20
): Promise<DashboardProducts | null> {
  const url = `/api/v1/dashboard/products?days=${days}&marketplace=${marketplace}&limit=${limit}&_t=${Date.now()}`;
  return authedFetch(url);
}
