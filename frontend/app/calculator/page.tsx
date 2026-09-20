'use client';

import { useState } from 'react';

type Marketplace = 'wb' | 'ozon' | 'yandex';

type FieldConfig = {
  key: string;
  label: string;
  type?: 'text' | 'number';
  half?: boolean;
};

type SectionConfig = {
  title: string;
  fields: FieldConfig[];
};

type FormData = Record<string, string | number>;

const WB_SECTIONS: SectionConfig[] = [
  {
    title: 'Данные товара',
    fields: [
      { key: 'name', label: 'Название товара', type: 'text' },
      { key: 'selling_price', label: 'Цена продажи, ₽', half: true },
      { key: 'quantity', label: 'Количество, шт', half: true },
      { key: 'cost_price', label: 'Себестоимость, ₽', half: true },
      { key: 'packaging_cost', label: 'Упаковка, ₽', half: true },
    ],
  },
  {
    title: 'Расходы Wildberries',
    fields: [
      { key: 'commission_percent', label: 'Комиссия WB, %', half: true },
      { key: 'logistics_cost', label: 'Логистика, ₽', half: true },
      { key: 'storage_cost', label: 'Хранение, ₽', half: true },
      { key: 'acquiring_percent', label: 'Эквайринг, %', half: true },
      { key: 'ads_cost', label: 'Реклама, ₽', half: true },
      { key: 'return_rate_percent', label: 'Возвраты, %', half: true },
    ],
  },
];

const OZON_SECTIONS: SectionConfig[] = [
  {
    title: 'Данные товара',
    fields: [
      { key: 'name', label: 'Название товара', type: 'text' },
      { key: 'selling_price', label: 'Цена продажи, ₽', half: true },
      { key: 'quantity', label: 'Количество, шт', half: true },
      { key: 'cost_price', label: 'Себестоимость, ₽', half: true },
      { key: 'packaging_cost', label: 'Упаковка, ₽', half: true },
    ],
  },
  {
    title: 'Расходы Ozon',
    fields: [
      { key: 'commission_percent', label: 'Комиссия Ozon, %', half: true },
      { key: 'acquiring_percent', label: 'Эквайринг Ozon Pay, %', half: true },
      { key: 'logistics_base', label: 'Логистика: база, ₽', half: true },
      { key: 'logistics_per_liter', label: 'Надбавка за литр, ₽', half: true },
      { key: 'volume_liters', label: 'Объём, л', half: true },
      { key: 'last_mile_percent', label: 'Последняя миля, %', half: true },
      { key: 'last_mile_max', label: 'Макс. последней мили, ₽', half: true },
      { key: 'storage_cost', label: 'Хранение, ₽', half: true },
      { key: 'ads_cost', label: 'Реклама, ₽', half: true },
      { key: 'return_rate_percent', label: 'Возвраты, %', half: true },
      { key: 'return_utilization_cost', label: 'Утилизация возврата, ₽', half: true },
    ],
  },
];

const YANDEX_SECTIONS: SectionConfig[] = [
  {
    title: 'Данные товара',
    fields: [
      { key: 'name', label: 'Название товара', type: 'text' },
      { key: 'selling_price', label: 'Цена продажи, ₽', half: true },
      { key: 'quantity', label: 'Количество, шт', half: true },
      { key: 'cost_price', label: 'Себестоимость, ₽', half: true },
      { key: 'packaging_cost', label: 'Упаковка, ₽', half: true },
    ],
  },
  {
    title: 'Расходы Яндекс Маркет',
    fields: [
      { key: 'commission_percent', label: 'Комиссия Маркета, %', half: true },
      { key: 'acquiring_percent', label: 'Эквайринг, %', half: true },
      { key: 'logistics_first_liter', label: 'Логистика: 1-й литр, ₽', half: true },
      { key: 'logistics_per_additional_liter', label: 'Логистика: за литр, ₽', half: true },
      { key: 'logistics_max', label: 'Макс. логистики, ₽', half: true },
      { key: 'volume_liters', label: 'Объём, л', half: true },
      { key: 'delivery_percent', label: 'Доставка покупателю, %', half: true },
      { key: 'delivery_max', label: 'Макс. доставки, ₽', half: true },
      { key: 'order_processing', label: 'Обработка заказа, ₽', half: true },
      { key: 'storage_cost', label: 'Хранение, ₽', half: true },
      { key: 'ads_cost', label: 'Реклама, ₽', half: true },
      { key: 'return_rate_percent', label: 'Возвраты, %', half: true },
      { key: 'return_utilization_cost', label: 'Утилизация, ₽', half: true },
    ],
  },
];

const INITIAL_WB: FormData = {
  name: 'Футболка хлопок',
  selling_price: 1000, quantity: 10,
  cost_price: 300, packaging_cost: 20,
  commission_percent: 20, logistics_cost: 80, storage_cost: 10,
  acquiring_percent: 0, ads_cost: 50, return_rate_percent: 0,
  tax_mode: 'usn_6',
};

const INITIAL_OZON: FormData = {
  name: 'Футболка хлопок',
  selling_price: 1000, quantity: 10,
  cost_price: 300, packaging_cost: 20,
  commission_percent: 15,
  logistics_base: 46.77, logistics_per_liter: 10.17, volume_liters: 1,
  last_mile_percent: 5.5, last_mile_max: 500,
  acquiring_percent: 2.2, storage_cost: 0, ads_cost: 50,
  return_rate_percent: 0, return_utilization_cost: 0,
  tax_mode: 'usn_6',
};

const INITIAL_YANDEX: FormData = {
  name: 'Футболка хлопок',
  selling_price: 1000, quantity: 10,
  cost_price: 300, packaging_cost: 20,
  commission_percent: 20,
  logistics_first_liter: 80, logistics_per_additional_liter: 9,
  logistics_max: 5500, volume_liters: 1,
  delivery_percent: 5, delivery_max: 1000,
  order_processing: 25,
  storage_cost: 0, acquiring_percent: 0, ads_cost: 50,
  return_rate_percent: 0, return_utilization_cost: 0,
  tax_mode: 'usn_6',
};

type Result = {
  revenue: string; commission: string; acquiring: string; logistics: string;
  last_mile?: string; delivery?: string; order_processing?: string;
  storage: string; ads: string;
  cost_price: string; packaging: string; returns_loss: string; tax: string;
  profit_per_unit: string; margin_percent: string; roi_percent: string;
  profit_total: string; break_even_price: string; max_discount_percent: string;
};

const MP_META: Record<Marketplace, { label: string; color: string; colorHover: string }> = {
  wb: { label: 'Wildberries FBO', color: 'bg-purple-600', colorHover: 'hover:bg-purple-700' },
  ozon: { label: 'Ozon FBO', color: 'bg-blue-600', colorHover: 'hover:bg-blue-700' },
  yandex: { label: 'Яндекс Маркет FBY', color: 'bg-yellow-500', colorHover: 'hover:bg-yellow-600' },
};

export default function Calculator() {
  const [marketplace, setMarketplace] = useState<Marketplace>('wb');
  const [wbForm, setWbForm] = useState<FormData>(INITIAL_WB);
  const [ozonForm, setOzonForm] = useState<FormData>(INITIAL_OZON);
  const [yandexForm, setYandexForm] = useState<FormData>(INITIAL_YANDEX);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sections =
    marketplace === 'wb' ? WB_SECTIONS : marketplace === 'ozon' ? OZON_SECTIONS : YANDEX_SECTIONS;
  const form =
    marketplace === 'wb' ? wbForm : marketplace === 'ozon' ? ozonForm : yandexForm;
  const setForm =
    marketplace === 'wb' ? setWbForm : marketplace === 'ozon' ? setOzonForm : setYandexForm;

  const update = (key: string, value: string) => {
    const isText = key === 'name';
    setForm({ ...form, [key]: isText ? value : value === '' ? 0 : Number(value) });
  };

  const switchMp = (mp: Marketplace) => {
    setMarketplace(mp);
    setResult(null);
    setError(null);
  };

  const calculate = async () => {
    setLoading(true); setError(null); setResult(null);
    const endpoint =
      marketplace === 'wb' ? 'wb-fbo' : marketplace === 'ozon' ? 'ozon-fbo' : 'yandex-fby';
    try {
      const res = await fetch(`http://localhost:8000/api/v1/calculations/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Ошибка расчёта: ' + res.status);
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const meta = MP_META[marketplace];

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-800">← На главную</a>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Калькулятор юнит-экономики</h1>
          <p className="text-slate-600 mt-2">Расчёт прибыли, маржи, ROI и точки безубыточности</p>
        </header>

        <div className="mb-6 inline-flex flex-wrap rounded-xl bg-white shadow p-1 gap-1">
          {(['wb', 'ozon', 'yandex'] as Marketplace[]).map((mp) => (
            <button
              key={mp}
              onClick={() => switchMp(mp)}
              className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                marketplace === mp ? `${MP_META[mp].color} text-white` : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {MP_META[mp].label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl shadow p-6 space-y-5">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-semibold text-slate-800 mb-3">{section.title}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {section.fields.map((f) => (
                    <div key={f.key} className={f.half ? '' : 'col-span-2'}>
                      <Field
                        label={f.label}
                        value={form[f.key]}
                        onChange={(v) => update(f.key, v)}
                        type={f.type}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Налоговый режим</label>
              <select
                value={String(form.tax_mode)}
                onChange={(e) => setForm({ ...form, tax_mode: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="none">Без налога</option>
                <option value="self_employed">Самозанятый (6%)</option>
                <option value="usn_6">УСН «Доходы» (6%)</option>
                <option value="usn_15">УСН «Доходы − Расходы» (15%)</option>
                <option value="osno">ОСНО (20%)</option>
              </select>
            </div>

            <button
              onClick={calculate}
              disabled={loading}
              className={`w-full text-white font-semibold py-3 rounded-lg transition ${meta.color} ${meta.colorHover} disabled:bg-slate-400`}
            >
              {loading ? 'Считаем…' : 'Рассчитать'}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Результат</h2>

            {!result && (
              <p className="text-slate-500 text-sm">Заполни форму слева и нажми «Рассчитать»</p>
            )}

            {result && (
              <div className="space-y-5">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-sm text-slate-500">Прибыль с единицы</div>
                  <div className={`text-3xl font-bold ${Number(result.profit_per_unit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {result.profit_per_unit} ₽
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Metric label="Маржа" value={`${result.margin_percent}%`} />
                  <Metric label="ROI" value={`${result.roi_percent}%`} />
                  <Metric label="Приб. всего" value={`${result.profit_total} ₽`} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Водопад расходов</h3>
                  <div className="space-y-1 text-sm">
                    <Row label="Выручка" value={result.revenue} positive />
                    <Row label="Комиссия" value={result.commission} />
                    <Row label="Эквайринг" value={result.acquiring} />
                    <Row label="Логистика" value={result.logistics} />
                    {result.last_mile !== undefined && <Row label="Последняя миля" value={result.last_mile} />}
                    {result.delivery !== undefined && <Row label="Доставка покупателю" value={result.delivery} />}
                    {result.order_processing !== undefined && <Row label="Обработка заказа" value={result.order_processing} />}
                    <Row label="Хранение" value={result.storage} />
                    <Row label="Реклама" value={result.ads} />
                    <Row label="Себестоимость" value={result.cost_price} />
                    <Row label="Упаковка" value={result.packaging} />
                    <Row label="Возвраты" value={result.returns_loss} />
                    <Row label="Налог" value={result.tax} />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Точка безубыточности</span>
                    <span className="font-semibold">{result.break_even_price} ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Максимальная скидка</span>
                    <span className="font-semibold">{result.max_discount_percent}%</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = 'number' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function Row({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-slate-600">{label}</span>
      <span className={positive ? 'text-green-600 font-medium' : 'text-slate-800'}>
        {positive ? '+' : '−'} {value} ₽
      </span>
    </div>
  );
}

