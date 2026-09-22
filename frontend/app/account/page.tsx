'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MeResponse, fetchMe, logout, updateSettings } from '../lib/auth';

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [taxMode, setTaxMode] = useState('usn_6');
  const [vatRate, setVatRate] = useState(0);
  const [taxSaving, setTaxSaving] = useState(false);
  const [taxSaved, setTaxSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetchMe();
      if (!data) {
        router.push('/login');
        return;
      }
      setMe(data);
      setTaxMode(data.user.tax_mode || 'usn_6');
      setVatRate(data.user.vat_rate || 0);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleSaveTax = async () => {
    setTaxSaving(true);
    setTaxSaved(false);
    const updated = await updateSettings(taxMode, vatRate);
    if (updated && me) {
      setMe({ ...me, user: { ...me.user, tax_mode: updated.tax_mode, vat_rate: updated.vat_rate } });
      setTaxSaved(true);
      setTimeout(() => setTaxSaved(false), 3000);
    }
    setTaxSaving(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-500">Загружаю...</p>
      </main>
    );
  }

  if (!me) return null;

  const isTrial = me.plan.code === 'free' && me.subscription.source === 'trial';
  const daysLeft = me.subscription.days_left ?? 0;
  const isActive = me.subscription.is_active;
  const marketplaces = (me.plan.limits.marketplaces as string[]) || [];

  // Прогресс-бар для пробного доступа: 10 дней — старт, 0 — конец
  const totalDays = 10;
  const daysPercent = isTrial
    ? Math.max(Math.min((daysLeft / totalDays) * 100, 100), 0)
    : 0;

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
              ← На главную
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 mt-2">Личный кабинет</h1>
          </div>
          <div className="flex gap-4 items-center">
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Открыть дашборд →
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Выйти
            </button>
          </div>
        </header>

        {/* Профиль */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Профиль</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Имя</span>
              <span className="font-medium text-slate-900">
                {me.user.full_name || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Email</span>
              <span className="font-medium text-slate-900">{me.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">ID</span>
              <span className="font-mono text-slate-700">#{me.user.id}</span>
            </div>
          </div>
        </section>

        {/* Налоговый режим */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Налоговый режим</h2>
          <p className="text-slate-500 text-sm mb-4">
            Влияет на расчёт чистой прибыли в дашборде
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Режим налогообложения
              </label>
              <select
                value={taxMode}
                onChange={(e) => setTaxMode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="none">Без налога</option>
                <option value="self_employed">Самозанятый (НПД 6%)</option>
                <option value="usn_6">УСН «Доходы» (6%)</option>
                <option value="usn_15">УСН «Доходы − Расходы» (15%)</option>
                <option value="osno">ОСНО (налог на прибыль 25%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ставка НДС
              </label>
              <select
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
                disabled={taxMode === 'self_employed' || taxMode === 'none'}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value={0}>Без НДС (0%)</option>
                {(taxMode === 'usn_6' || taxMode === 'usn_15') && (
                  <>
                    <option value={5}>НДС 5%</option>
                    <option value={7}>НДС 7%</option>
                  </>
                )}
                {taxMode === 'usn_6' || taxMode === 'usn_15' || taxMode === 'osno' ? (
                  <option value={22}>НДС 22%</option>
                ) : null}
                {taxMode === 'osno' && <option value={10}>НДС 10%</option>}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {taxMode === 'self_employed' || taxMode === 'none'
                  ? 'На этом режиме НДС не платится'
                  : taxMode === 'osno'
                  ? 'ОСНО: доступны 0%, 10%, 22%'
                  : 'УСН: доступны 0%, 5%, 7%, 22%'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSaveTax}
              disabled={taxSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium px-6 py-2 rounded-lg transition text-sm"
            >
              {taxSaving ? 'Сохраняю...' : 'Сохранить'}
            </button>
            {taxSaved && (
              <span className="text-sm text-green-600">✓ Сохранено</span>
            )}
          </div>
        </section>

        {/* Статус доступа */}
        <section className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Ваш доступ</h2>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                isTrial
                  ? 'bg-amber-100 text-amber-700'
                  : isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isTrial ? 'Пробный доступ' : me.plan.name}
            </span>
          </div>

          {isTrial && isActive && (
            <>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Осталось дней</span>
                  <span className="font-semibold text-slate-900">
                    {daysLeft} из {totalDays}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      daysLeft <= 3 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${daysPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-slate-500 text-xs">Маркетплейсов доступно</div>
                  <div className="text-xl font-semibold text-slate-900">
                    {marketplaces.length}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-slate-500 text-xs">Экспорт в Excel</div>
                  <div className="text-xl font-semibold text-slate-900">
                    {me.plan.limits.export_excel ? 'Да' : 'Нет'}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Link
                  href="/pricing"
                  className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  Продолжить на Pro — 990 ₽ / мес →
                </Link>
                <p className="text-center text-xs text-slate-500 mt-2">
                  После окончания пробного периода доступ будет закрыт
                </p>
              </div>
            </>
          )}

          {isTrial && !isActive && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-800 mb-2">Пробный период закончился</p>
              <p className="text-sm text-red-700 mb-4">
                Оформите Pro, чтобы продолжить пользоваться всеми функциями.
              </p>
              <Link
                href="/pricing"
                className="block text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Оформить Pro
              </Link>
            </div>
          )}

          {!isTrial && (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Статус</span>
                  <span className="font-medium text-green-600">Активна</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Цена</span>
                  <span className="font-medium text-slate-900">
                    {me.plan.price_monthly} ₽ / мес
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Маркетплейсов</span>
                  <span className="font-medium text-slate-900">
                    {marketplaces.length}
                  </span>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
