export type Tariff = {
  id: number;
  marketplace: string;
  key: string;
  value: string;
  description: string;
  updated_at: string;
};

export type Tax = {
  id: number;
  code: string;
  name: string;
  rate_percent: string;
  is_active: boolean;
};

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin`;

export const MP_LABELS: Record<string, string> = {
  wb_fbo: 'Wildberries FBO',
  ozon_fbo: 'Ozon FBO',
  yandex_fby: 'Яндекс Маркет FBY',
};

/** Форматирует значение: 2.2000 → 2.2, 50.0000 → 50 */
export function formatNumber(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(n)) return String(value);
  return String(n);
}

/** Логин: получает токен сессии по паролю. */
export async function login(password: string): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Ошибка ${res.status}`);
  }
  const data: { token: string } = await res.json();
  return data.token;
}

/** Логаут: убивает сессию на сервере. Ошибки игнорируем — токен всё равно локально удалим. */
export async function logout(token: string): Promise<void> {
  try {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      headers: { 'X-Admin-Token': token },
    });
  } catch {
    /* ignore */
  }
}

async function req<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Ошибка ${res.status}`);
  }
  return res.json();
}

export async function getTariffs(token: string): Promise<Tariff[]> {
  return req('/tariffs', token);
}

export async function updateTariff(
  token: string,
  id: number,
  value: number,
  description?: string
): Promise<Tariff> {
  const body: { value: number; description?: string } = { value };
  if (description !== undefined) body.description = description;
  return req(`/tariffs/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function getTaxes(token: string): Promise<Tax[]> {
  return req('/taxes', token);
}

export async function updateTax(
  token: string,
  id: number,
  rate_percent: number,
  name?: string
): Promise<Tax> {
  const body: { rate_percent: number; name?: string } = { rate_percent };
  if (name !== undefined) body.name = name;
  return req(`/taxes/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
