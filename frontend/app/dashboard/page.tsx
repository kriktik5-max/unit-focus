'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DashboardProducts,
  DashboardSummary,
  fetchDashboardProducts,
  fetchDashboardSummary,
} from '../lib/auth';
import { Header } from '../components/Header';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const PERIODS = [
  { days: 7, label: '7 дней' },
  { days: 30, label: '30 дней' },
  { days: 90, label: '90 дней' },
];

const MP_FILTERS = [
  { code: 'all', label: 'Все маркетплейсы' },
  { code: 'wb', label: 'Wildberries' },
  { code: 'ozon', label: 'Ozon' },
  { code: 'yandex', label: 'Яндекс Маркет' },
];

function formatMoney(v: number | undefined | null): string {
  if (typeof v !== 'number' || !isFinite(v)) return '0 ₽';
  return v.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽';
}

function formatNumber(v: number | undefined | null): string {
  if (typeof v !== 'number' || !isFinite(v)) return '0';
  return v.toLocaleString('ru-RU');
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<DashboardProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [mp, setMp] = useState('all');
  const [breakdown, setBreakdown] = useState<'none' | 'profit' | 'revenue' | 'margin'>('none');

  useEffect(() => {
    if (mp !== 'all') setBreakdown('none');
  }, [mp]);

  useEffect(() => {
    (async () => {
      try {
        const s = await fetchDashboardSummary(days, mp);
        if (!s) {
          router.push('/login');
          return;
        }
        setSummary(s);
      } catch (e) {
        console.error('summary error:', e);
        setLoading(false);
        return;
      }
      try {
        const p = await fetchDashboardProducts(days, mp, 20);
        setProducts(p);
      } catch (e) {
        console.error('products error:', e);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, mp]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Дашборд</h1>
              <p className="text-slate-500 text-sm mt-1">
                Управленческая отчётность по маркетплейсам
              </p>
            </div>
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
              ← На главную
            </Link>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            <div className="bg-white rounded-xl shadow-sm p-1 inline-flex">
              {PERIODS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setDays(p.days)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    days === p.days
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-1 inline-flex">
              {MP_FILTERS.map((f) => (
                <button
                  key={f.code}
                  onClick={() => setMp(f.code)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    mp === f.code
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="text-slate-500">Загружаю...</p>}

          {!loading && summary && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                <KpiCard
                  label="Выручка"
                  value={formatMoney(summary.kpi.revenue)}
                  color="blue"
                  subtitle={summary.vat_rate > 0 ? `без НДС: ${formatMoney(summary.kpi.revenue_net)}` : undefined}
                  formula={
                    summary.vat_rate > 0 ? (
                      <div className="space-y-2">
                        <div className="font-semibold text-white">Выручка за период</div>
                        <div>Σ всех продаж с НДС = <b>{formatMoney(summary.kpi.revenue)}</b></div>
                        <div className="border-t border-slate-700 pt-2">
                          <div className="text-slate-400">Без НДС (для расчёта маржинальности):</div>
                          <div>{formatMoney(summary.kpi.revenue)} / (1 + {summary.vat_rate}/100) =</div>
                          <div className="text-blue-300 font-semibold">{formatMoney(summary.kpi.revenue_net)}</div>
                        </div>
                      </div>
                    ) : (
                      <div>Σ всех продаж = <b>{formatMoney(summary.kpi.revenue)}</b></div>
                    )
                  }
                />

                <KpiCard
                  label="EBITDA"
                  value={formatMoney(summary.kpi.ebitda)}
                  color="purple"
                  formula={
                    <div className="space-y-2">
                      <div className="font-semibold text-white">Прибыль до налогов</div>
                      <div className="text-slate-400">Выручка − все расходы МП − себестоимость</div>
                      <div className="border-t border-slate-700 pt-2">
                        <div>Результат: <b className="text-purple-300">{formatMoney(summary.kpi.ebitda)}</b></div>
                      </div>
                      <div className="text-slate-400 text-[11px]">НДС и налог по режиму здесь НЕ вычтены</div>
                    </div>
                  }
                />

                <KpiCard
                  label={vatLabel(summary.vat_rate)}
                  value={formatMoney(summary.kpi.vat)}
                  color="rose"
                  formula={vatFormula(summary.vat_rate, summary.kpi.revenue, summary.kpi.vat)}
                />

                <KpiCard
                  label={taxLabel(summary.tax_mode)}
                  value={formatMoney(summary.kpi.income_tax)}
                  color="slate"
                  formula={taxFormula(summary.tax_mode, summary.kpi.revenue_net, summary.kpi.ebitda, summary.kpi.income_tax)}
                />

                <KpiCard
                  label="Чистая прибыль"
                  value={formatMoney(summary.kpi.net_profit)}
                  color="green"
                  subtitle={
                    summary.vat_rate === 10 || summary.vat_rate === 22
                      ? 'без учёта НДС к уплате'
                      : undefined
                  }
                  formula={
                    <div className="space-y-3">
                      <div className="font-semibold text-white">Формула</div>
                      <div>Чистая прибыль = EBITDA − НДС к уплате − Налог по режиму</div>
                      <div className="border-t border-slate-700 pt-2">
                        <div>{formatMoney(summary.kpi.ebitda)} − {formatMoney(vatPayable(summary.vat_rate, summary.kpi.vat))} − {formatMoney(summary.kpi.income_tax)}</div>
                        <div className="text-green-300 font-semibold">= {formatMoney(summary.kpi.net_profit)}</div>
                      </div>
                      {(summary.vat_rate === 10 || summary.vat_rate === 22) && (
                        <div className="border-t border-slate-700 pt-3">
                          <div className="font-semibold text-white mb-2">Примечание</div>
                          <div className="text-slate-300">
                            НДС к уплате принят равным нулю. Фактическая сумма НДС
                            к уплате определяется как разница между исходящим и входящим
                            НДС и, как правило, принимает положительное значение.
                          </div>
                          <div className="text-slate-300 mt-2">
                            Следствие: фактическая чистая прибыль ниже расчётной величины.
                          </div>
                        </div>
                      )}
                    </div>
                  }
                />

                <KpiCard
                  label="Чистая маржинальность"
                  value={`${summary.kpi.margin_percent}%`}
                  color="amber"
                  formula={
                    <div className="space-y-2">
                      <div className="font-semibold text-white">Формула</div>
                      <div>Чистая прибыль / Выручка без НДС × 100%</div>
                      <div className="border-t border-slate-700 pt-2">
                        <div>{formatMoney(summary.kpi.net_profit)} / {formatMoney(summary.kpi.revenue_net)} × 100%</div>
                        <div className="text-amber-300 font-semibold">= {summary.kpi.margin_percent}%</div>
                      </div>
                    </div>
                  }
                />
              </div><div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Динамика за {days} дней
                  </h2>
                  {mp === 'all' && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setBreakdown(breakdown === 'revenue' ? 'none' : 'revenue')}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                          breakdown === 'revenue'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {breakdown === 'revenue' ? '✓ ' : ''}Выручка по МП
                      </button>
                      <button
                        onClick={() => setBreakdown(breakdown === 'profit' ? 'none' : 'profit')}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                          breakdown === 'profit'
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {breakdown === 'profit' ? '✓ ' : ''}EBITDA по МП
                      </button>
                    </div>
                  )}
                </div>
                {summary.daily.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={summary.daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickFormatter={(d) => d.slice(5)}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${Math.round(v / 1000)}к` : v
                        }
                      />
                      <Tooltip
                        formatter={(value) =>
                          typeof value === 'number' ? formatMoney(value) : String(value)
                        }
                        labelFormatter={(l) => `Дата: ${l}`}
                      />
                      <Legend />
                      {breakdown !== 'revenue' && (
                        <Line type="monotone" dataKey="revenue" name="Выручка" stroke="#2563eb" strokeWidth={2} dot={false} />
                      )}
                      {breakdown !== 'profit' && (
                        <Line type="monotone" dataKey="net_profit" name="Чистая прибыль" stroke="#16a34a" strokeWidth={2} dot={false} />
                      )}
                      {breakdown === 'revenue' && (
                        <>
                          <Line type="monotone" dataKey="revenue_wb" name="Выручка WB" stroke="#7c3aed" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="revenue_ozon" name="Выручка Ozon" stroke="#0284c7" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="revenue_yandex" name="Выручка Яндекс" stroke="#eab308" strokeWidth={2} dot={false} />
                        </>
                      )}
                      {breakdown === 'profit' && (
                        <>
                          <Line type="monotone" dataKey="ebitda_wb" name="EBITDA WB" stroke="#7c3aed" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="ebitda_ozon" name="EBITDA Ozon" stroke="#0284c7" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="ebitda_yandex" name="EBITDA Яндекс" stroke="#eab308" strokeWidth={2} dot={false} />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-500 text-sm">Нет данных за выбранный период</p>
                )}
              </div>

              {products && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">
                    Товары (топ-{products.products.length})
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">SKU</th>
                          <th className="text-left px-3 py-2 font-medium">Название</th>
                          <th className="text-left px-3 py-2 font-medium">МП</th>
                          <th className="text-right px-3 py-2 font-medium">Заказы</th>
                          <th className="text-right px-3 py-2 font-medium">Выручка</th>
                          <th className="text-right px-3 py-2 font-medium">EBITDA</th>
                          <th className="text-right px-3 py-2 font-medium">Чистая прибыль</th>
                          <th className="text-right px-3 py-2 font-medium">Чистая маржинальность</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.products.map((p) => (
                          <tr key={p.product_id} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-mono text-xs text-slate-700">{p.sku}</td>
                            <td className="px-3 py-2 text-slate-800">{p.name}</td>
                            <td className="px-3 py-2">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {p.marketplace}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700">{formatNumber(p.orders)}</td>
                            <td className="px-3 py-2 text-right font-medium text-slate-900">{formatMoney(p.revenue)}</td>
                            <td className="px-3 py-2 text-right text-purple-600 font-medium">{formatMoney(p.ebitda)}</td>
                            <td className="px-3 py-2 text-right text-green-600 font-medium">{formatMoney(p.net_profit)}</td>
                            <td className="px-3 py-2 text-right text-slate-700">{p.margin_percent}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function vatLabel(rate: number): string {
  if (rate === 0) return 'НДС (не платится)';
  return `НДС ${rate}% (исходящий)`;
}

function taxLabel(mode: string): string {
  const labels: Record<string, string> = {
    none: 'Налог (не платится)',
    self_employed: 'НПД 6%',
    usn_6: 'УСН 6%',
    usn_15: 'УСН 15%',
    osno: 'Налог на прибыль 25%',
  };
  return labels[mode] || 'Налог';
}

function vatFormula(rate: number, revenue: number, vat: number): React.ReactNode {
  if (rate === 0) {
    return <div>На данном режиме НДС не уплачивается</div>;
  }
  return (
    <div className="space-y-3">
      <div className="font-semibold text-white">Исходящий НДС</div>
      <div>Выручка × {rate} / (100 + {rate})</div>
      <div className="border-t border-slate-700 pt-2">
        <div>{formatMoney(revenue)} × {rate}/{100 + rate}</div>
        <div className="text-rose-300 font-semibold">= {formatMoney(vat)}</div>
      </div>
      {rate === 10 || rate === 22 ? (
        <div className="border-t border-slate-700 pt-3">
          <div className="font-semibold text-white mb-2">Примечание</div>
          <div className="text-slate-300">
            Показана сумма налога, предъявленная покупателю в составе цены реализации.
          </div>
          <div className="text-slate-300 mt-2">
            Сумма НДС к уплате определяется как разница между исходящим и входящим НДС.
            Сумма входящего НДС в расчёте не учитывается в связи с отсутствием данных.
          </div>
          <div className="text-slate-300 mt-2">
            НДС к уплате в расчёте чистой прибыли не участвует.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function taxFormula(mode: string, revenueNet: number, ebitda: number, tax: number): React.ReactNode {
  const titles: Record<string, string> = {
    none: 'Налог не платится',
    self_employed: 'НПД 6%',
    usn_6: 'УСН 6%',
    usn_15: 'УСН 15%',
    osno: 'Налог на прибыль 25%',
  };

  if (mode === 'none') return <div>На этом режиме налог не платится</div>;

  if (mode === 'self_employed' || mode === 'usn_6') {
    return (
      <div className="space-y-2">
        <div className="font-semibold text-white">{titles[mode]}</div>
        <div>6% × Выручка без НДС</div>
        <div className="border-t border-slate-700 pt-2">
          <div>0.06 × {formatMoney(revenueNet)}</div>
          <div className="text-slate-200 font-semibold">= {formatMoney(tax)}</div>
        </div>
      </div>
    );
  }
  if (mode === 'usn_15') {
    return (
      <div className="space-y-2">
        <div className="font-semibold text-white">{titles[mode]}</div>
        <div>15% × EBITDA (если EBITDA &gt; 0)</div>
        <div className="border-t border-slate-700 pt-2">
          <div>0.15 × {formatMoney(ebitda)}</div>
          <div className="text-slate-200 font-semibold">= {formatMoney(tax)}</div>
        </div>
      </div>
    );
  }
  if (mode === 'osno') {
    return (
      <div className="space-y-2">
        <div className="font-semibold text-white">{titles[mode]}</div>
        <div>25% × EBITDA (если EBITDA &gt; 0)</div>
        <div className="border-t border-slate-700 pt-2">
          <div>0.25 × {formatMoney(ebitda)}</div>
          <div className="text-slate-200 font-semibold">= {formatMoney(tax)}</div>
        </div>
      </div>
    );
  }
  return <div>Налог</div>;
}

function KpiCard({
  label,
  value,
  color,
  subtitle,
  formula,
}: {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'slate';
  subtitle?: string;
  formula?: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    slate: 'text-slate-700',
  };
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 relative flex flex-col">
      {/* Заголовок фиксированной высоты + значок справа */}
      <div className="flex items-start justify-between gap-2 mb-2 min-h-[2.75rem]">
        <div className="text-sm text-slate-600 leading-snug">{label}</div>
        {formula && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-slate-400 text-slate-500 hover:border-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center text-[11px] font-bold transition-colors"
            aria-label="Формула расчёта"
          >
            i
          </button>
        )}
      </div>

      {/* Значение */}
      <div className={`text-2xl font-bold leading-tight ${colors[color]}`}>{value}</div>

      {/* Подпись фиксированной высоты */}
      <div className="min-h-[1.25rem] mt-1">
        {subtitle && (
          <div className="text-xs text-slate-500 leading-tight">{subtitle}</div>
        )}
      </div>

      {/* Тултип */}
      {formula && open && (
        <div className="absolute z-50 top-full right-0 mt-2 w-80 max-w-[90vw] bg-slate-900 text-white text-xs rounded-xl shadow-2xl p-4 leading-relaxed">
          {formula}
        </div>
      )}
    </div>
  );
}

function vatPayable(rate: number, vat: number): number {
  if (rate === 0) return 0;
  if (rate === 10 || rate === 22) return 0;
  return vat;
}

