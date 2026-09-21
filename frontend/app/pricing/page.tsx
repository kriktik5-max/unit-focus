'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getToken } from '../lib/auth';
import { Header } from '../components/Header';

type Plan = {
  code: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    code: 'trial',
    name: 'Пробный доступ',
    price: 0,
    description: '10 дней полного доступа, чтобы попробовать всё',
    features: [
      'Все 3 маркетплейса (WB, Ozon, Яндекс)',
      'Экспорт в Excel',
      'История расчётов 365 дней',
      '10 дней бесплатно',
    ],
  },
  {
    code: 'pro',
    name: 'Pro',
    price: 990,
    description: 'Для активных селлеров — без ограничений',
    popular: true,
    features: [
      'Всё из пробного +',
      'Неограниченный срок',
      'Приоритетные обновления тарифов',
      'Поддержка в чате',
      'Скидка 20% при годовой оплате',
    ],
  },
  {
    code: 'business',
    name: 'Business',
    price: 2990,
    description: 'Для команд и агентств',
    features: [
      'Всё из Pro +',
      'Доступ к API',
      'До 5 пользователей в команде',
      'Приоритетная поддержка',
      'Индивидуальные настройки',
    ],
  },
];

export default function PricingPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(getToken() !== null);
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Тарифы Юнит-Фокус
            </h1>
            <p className="text-slate-600 text-lg">
              Начните с бесплатного пробного доступа. Оплатите, только если понравится.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.code}
                className={`relative bg-white rounded-2xl shadow-sm p-8 ${
                  plan.popular ? 'ring-2 ring-blue-600 shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    ПОПУЛЯРНЫЙ
                  </div>
                )}

                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-600 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">
                    {plan.price.toLocaleString('ru-RU')} ₽
                  </span>
                  {plan.price > 0 && (
                    <span className="text-slate-500 text-sm"> / месяц</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span className="text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.code === 'trial' && (
                  <Link
                    href={loggedIn ? '/account' : '/register'}
                    className="block text-center w-full py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
                  >
                    {loggedIn ? 'Ваш текущий план' : 'Начать бесплатно'}
                  </Link>
                )}

                {plan.code === 'pro' && (
                  <button
                    disabled
                    className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold opacity-60 cursor-not-allowed"
                    title="Оплата скоро будет доступна"
                  >
                    Оплата скоро
                  </button>
                )}

                {plan.code === 'business' && (
                  <button
                    disabled
                    className="w-full py-3 rounded-lg bg-slate-800 text-white font-semibold opacity-60 cursor-not-allowed"
                    title="Оплата скоро будет доступна"
                  >
                    Оплата скоро
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500 mb-4">
              Оплата через ЮKassa появится в ближайшее время. Пока — оставьте email,
              мы сообщим о запуске.
            </p>
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              ← На главную
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
