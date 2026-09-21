'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MeResponse, fetchMe, logout } from '../lib/auth';

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await fetchMe();
      if (!data) {
        router.push('/login');
        return;
      }
      setMe(data);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
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
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Выйти
          </button>
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
