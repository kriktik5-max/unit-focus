import { Marketplace, FormData } from './config';

const API = 'http://localhost:8000/api/v1/tariffs';

export async function loadDefaults(
  marketplace: Marketplace,
  base: FormData
): Promise<FormData> {
  const code =
    marketplace === 'wb' ? 'wb_fbo' : marketplace === 'ozon' ? 'ozon_fbo' : 'yandex_fby';
  try {
    const res = await fetch(`${API}/${code}`);
    if (!res.ok) return base;
    const data: Record<string, number> = await res.json();
    // Мержим: базовые значения формы + значения из БД.
    // Налоговые поля и name/quantity/selling_price/cost_price/packaging_cost
    // НЕ перезаписываем — они всегда вводятся пользователем.
    const protectedKeys = new Set([
      'name',
      'selling_price',
      'quantity',
      'cost_price',
      'packaging_cost',
      'volume_liters',
      'tax_mode',
      'vat_rate',
    ]);
    const merged = { ...base };
    for (const [key, value] of Object.entries(data)) {
      if (!protectedKeys.has(key)) {
        merged[key] = value;
      }
    }
    return merged;
  } catch {
    return base;
  }
}
