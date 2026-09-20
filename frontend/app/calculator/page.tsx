'use client';

import { useState, useEffect } from 'react';
import {
  Marketplace,
  FormData,
  VAT_RATES_BY_MODE,
  TAX_MODES,
  WB_SECTIONS,
  OZON_SECTIONS,
  YANDEX_SECTIONS,
  INITIAL_WB,
  INITIAL_OZON,
  INITIAL_YANDEX,
  MP_META,
} from './config';
import { Field, Metric, Row } from './components';
import { loadDefaults } from './loadDefaults';

type Result = {
  selling_price?: string;
  effective_price?: string;
  spp_percent?: string;
  revenue: string;
  commission: string;
  acquiring: string;
  logistics: string;
  last_mile?: string;
  delivery?: string;
  order_processing?: string;
  storage: string;
  ads: string;
  cost_price: string;
  packaging: string;
  returns_loss: string;
  vat_output: string;
  vat_deductible: string;
  vat_payable: string;
  income_tax: string;
  total_tax: string;
  profit_per_unit: string;
  margin_percent: string;
  roi_percent: string;
  profit_total: string;
  break_even_price: string;
  max_discount_percent: string;
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
    marketplace === 'wb'
      ? WB_SECTIONS
      : marketplace === 'ozon'
      ? OZON_SECTIONS
      : YANDEX_SECTIONS;
  const form =
    marketplace === 'wb' ? wbForm : marketplace === 'ozon' ? ozonForm : yandexForm;
  const setForm =
    marketplace === 'wb' ? setWbForm : marketplace === 'ozon' ? setOzonForm : setYandexForm;

  const taxMode = String(form.tax_mode ?? 'usn_6');
  const vatRate = Number(form.vat_rate ?? 0);
  const availableVatRates = VAT_RATES_BY_MODE[taxMode] ?? [0];

  // Если текущая ставка НДС недоступна для выбранного режима — сбрасываем на 0
  useEffect(() => {
    if (!availableVatRates.includes(vatRate)) {
      setForm({ ...form, vat_rate: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxMode]);

  // Загружаем дефолтные значения из БД при смене маркетплейса
  useEffect(() => {
    (async () => {
      const base =
        marketplace === 'wb'
          ? INITIAL_WB
          : marketplace === 'ozon'
          ? INITIAL_OZON
          : INITIAL_YANDEX;
      const loaded = await loadDefaults(marketplace, base);
      if (marketplace === 'wb') setWbForm(loaded);
      else if (marketplace === 'ozon') setOzonForm(loaded);
      else setYandexForm(loaded);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketplace]);

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
    setLoading(true);
    setError(null);
    setResult(null);
    const endpoint =
      marketplace === 'wb'
        ? 'wb-fbo'
        : marketplace === 'ozon'
        ? 'ozon-fbo'
        : 'yandex-fby';
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/calculations/${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
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
          <a href="/" className="text-sm text-slate-500 hover:text-slate-800">
            ← На главную
          </a>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">
            Калькулятор юнит-экономики
          </h1>
          <p className="text-slate-600 mt-2">
            Расчёт прибыли, маржи, ROI и точки безубыточности
          </p>
        </header>

        <div className="mb-6 inline-flex flex-wrap rounded-xl bg-white shadow p-1 gap-1">
          {(['wb', 'ozon', 'yandex'] as Marketplace[]).map((mp) => (
            <button
              key={mp}
              onClick={() => switchMp(mp)}
              className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                marketplace === mp
                  ? `${MP_META[mp].color} text-white`
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {MP_META[mp].label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ЛЕВАЯ КОЛОНКА — ФОРМА */}
          <section className="bg-white rounded-2xl shadow p-6 space-y-5">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-semibold text-slate-800 mb-3">
                  {section.title}
                </h2>
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

            {/* НАЛОГИ */}
            <div className="border-t pt-4 space-y-3">
              <h2 className="text-lg font-semibold text-slate-800">Налоги</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Налоговый режим
                </label>
                <select
                  value={taxMode}
                  onChange={(e) => setForm({ ...form, tax_mode: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  {TAX_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ставка НДС
                </label>
                <select
                  value={vatRate}
                  onChange={(e) =>
                    setForm({ ...form, vat_rate: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  {availableVatRates.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate === 0 ? 'Без НДС (0%)' : `${rate}%`}
                    </option>
                  ))}
                </select>

              </div>
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

          {/* ПРАВАЯ КОЛОНКА — РЕЗУЛЬТАТ */}
          <section className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Результат</h2>

            {!result && (
              <p className="text-slate-500 text-sm">
                Заполни форму слева и нажми «Рассчитать»
              </p>
            )}

            {result && (
              <div className="space-y-5">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-sm text-slate-500">Прибыль с единицы</div>
                  <div
                    className={`text-3xl font-bold ${
                      Number(result.profit_per_unit) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {result.profit_per_unit} ₽
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Metric label="Маржа" value={`${result.margin_percent}%`} />
                  <Metric label="ROI" value={`${result.roi_percent}%`} />
                  <Metric label="Приб. всего" value={`${result.profit_total} ₽`} />
                </div>

                {/* ВОДОПАД РАСХОДОВ */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Водопад расходов
                  </h3>
                  <div className="space-y-1 text-sm">
                    {result.effective_price !== undefined && result.selling_price !== undefined &&
                     Number(result.effective_price) !== Number(result.selling_price) && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Цена с СПП (платит покупатель)</span>
                        <span className="text-slate-800">{result.effective_price} ₽</span>
                      </div>
                    )}
                    <Row label="Выручка" value={result.revenue} positive />
                    <Row label="Комиссия" value={result.commission} />
                    <Row label="Эквайринг" value={result.acquiring} />
                    <Row label="Логистика" value={result.logistics} />
                    {result.last_mile !== undefined && (
                      <Row label="Последняя миля" value={result.last_mile} />
                    )}
                    {result.delivery !== undefined && (
                      <Row label="Доставка покупателю" value={result.delivery} />
                    )}
                    {result.order_processing !== undefined && (
                      <Row
                        label="Обработка заказа"
                        value={result.order_processing}
                      />
                    )}
                    <Row label="Хранение" value={result.storage} />
                    <Row label="Реклама" value={result.ads} />
                    <Row label="Себестоимость" value={result.cost_price} />
                    <Row label="Упаковка" value={result.packaging} />
                    <Row label="Возвраты" value={result.returns_loss} />
                  </div>
                </div>

                {/* НАЛОГИ */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Налоги
                  </h3>
                  <div className="space-y-1 text-sm">
                    <Row label="НДС начисленный" value={result.vat_output} />
                    {Number(result.vat_deductible) > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">
                          НДС к вычету (уменьшает)
                        </span>
                        <span className="text-green-600">
                          + {result.vat_deductible} ₽
                        </span>
                      </div>
                    )}
                    <Row label="НДС к уплате" value={result.vat_payable} />
                    <Row label="Налог на прибыль / УСН" value={result.income_tax} />
                    <div className="flex justify-between py-1 border-t pt-2 mt-2">
                      <span className="text-slate-800 font-medium">
                        Всего налогов
                      </span>
                      <span className="font-semibold text-slate-900">
                        {result.total_tax} ₽
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Точка безубыточности</span>
                    <span className="font-semibold">
                      {result.break_even_price} ₽
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Максимальная скидка</span>
                    <span className="font-semibold">
                      {result.max_discount_percent}%
                    </span>
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
