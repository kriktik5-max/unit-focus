'use client';

import { useState } from 'react';

type Result = {
  revenue: string;
  commission: string;
  acquiring: string;
  logistics: string;
  storage: string;
  ads: string;
  cost_price: string;
  packaging: string;
  returns_loss: string;
  tax: string;
  profit_per_unit: string;
  margin_percent: string;
  roi_percent: string;
  profit_total: string;
  break_even_price: string;
  max_discount_percent: string;
};

const initialForm = {
  name: 'Футболка хлопок',
  selling_price: 1000,
  quantity: 10,
  cost_price: 300,
  packaging_cost: 20,
  commission_percent: 20,
  logistics_cost: 80,
  storage_cost: 10,
  acquiring_percent: 0,
  ads_cost: 50,
  return_rate_percent: 0,
  tax_mode: 'usn_6',
};

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value === '' ? 0 : Number(value) }));
  };

  const calculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/v1/calculations/wb-fbo', {
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

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">UnitCalc — юнит-экономика WB</h1>
          <p className="text-slate-600 mt-2">Расчёт чистой прибыли и точки безубыточности для Wildberries FBO</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl shadow p-6 space-y-5">
            <h2 className="text-lg font-semibold text-slate-800">Данные товара</h2>

            <Field label="Название товара" value={form.name} onChange={(v) => setForm(f => ({...f, name: v}))} type="text" />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Цена продажи, ₽" value={form.selling_price} onChange={(v) => update('selling_price', v)} />
              <Field label="Количество, шт" value={form.quantity} onChange={(v) => update('quantity', v)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Себестоимость, ₽" value={form.cost_price} onChange={(v) => update('cost_price', v)} />
              <Field label="Упаковка, ₽" value={form.packaging_cost} onChange={(v) => update('packaging_cost', v)} />
            </div>

            <h2 className="text-lg font-semibold text-slate-800 pt-2">Расходы Wildberries</h2>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Комиссия WB, %" value={form.commission_percent} onChange={(v) => update('commission_percent', v)} />
              <Field label="Логистика, ₽" value={form.logistics_cost} onChange={(v) => update('logistics_cost', v)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Хранение, ₽" value={form.storage_cost} onChange={(v) => update('storage_cost', v)} />
              <Field label="Эквайринг, %" value={form.acquiring_percent} onChange={(v) => update('acquiring_percent', v)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Реклама, ₽" value={form.ads_cost} onChange={(v) => update('ads_cost', v)} />
              <Field label="Возвраты, %" value={form.return_rate_percent} onChange={(v) => update('return_rate_percent', v)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Налоговый режим</label>
              <select
                value={form.tax_mode}
                onChange={(e) => setForm(f => ({...f, tax_mode: e.target.value}))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
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
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition"
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
                    <Row label="Комиссия WB" value={result.commission} />
                    <Row label="Эквайринг" value={result.acquiring} />
                    <Row label="Логистика" value={result.logistics} />
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