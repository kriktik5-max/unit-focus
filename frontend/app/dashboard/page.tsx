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

function formatMoney(v: number): string {
  return v.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽';
}

function formatNumber(v: number): string {
  return v.toLocaleString('ru-RU');
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<DashboardProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [mp, setMp] = useState('all');

  useEffect(() => {
    (async () => {
      const s = await fetchDashboardSummary(days, mp);
      if (!s) {
        router.push('/login');
        return;
      }
      const p = await fetchDashboardProducts(days, mp, 20);
      setSummary(s);
      setProducts(p);
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

          {/* ФИЛЬТРЫ */}
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

          {!loading && summary && products && (
            <>
              {/* KPI КАРТОЧКИ */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard
                  label="Выручка"
                  value={formatMoney(summary.kpi.revenue)}
                  color="blue"
                />
                <KpiCard
                  label="Чистая прибыль"
                  value={formatMoney(summary.kpi.profit)}
                  color="green"
                />
                <KpiCard
                  label="Заказов"
                  value={formatNumber(summary.kpi.orders)}
                  color="purple"
                />
                <KpiCard
                  label="Маржа"
                  value={`${summary.kpi.margin_percent}%`}
                  color="amber"
                />
              </div>

              {/* ГРАФИК */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  Динамика за {days} дней
                </h2>
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
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Выручка"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        name="Прибыль"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-500 text-sm">
                    Нет данных за выбранный период
                  </p>
                )}
              </div>

              {/* ТАБЛИЦА ТОВАРОВ */}
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
                        <th className="text-right px-3 py-2 font-medium">Прибыль</th>
                        <th className="text-right px-3 py-2 font-medium">Маржа</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.products.map((p) => (
                        <tr key={p.product_id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono text-xs text-slate-700">
                            {p.sku}
                          </td>
                          <td className="px-3 py-2 text-slate-800">{p.name}</td>
                          <td className="px-3 py-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {p.marketplace}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {formatNumber(p.orders)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-900">
                            {formatMoney(p.revenue)}
                          </td>
                          <td className="px-3 py-2 text-right text-green-600 font-medium">
                            {formatMoney(p.profit)}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {p.margin_percent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
    </div>
  );
}
