'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getToken } from '../lib/auth';

export function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLoggedIn(getToken() !== null);
    setMounted(true);

    // Слушаем изменения localStorage (например, после логина)
    const onStorage = () => setLoggedIn(getToken() !== null);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <header className="border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            UF
          </div>
          <span className="font-bold text-lg">Юнит-Фокус</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
          <a href="#features" className="hover:text-slate-900">Возможности</a>
          <a href="#marketplaces" className="hover:text-slate-900">Маркетплейсы</a>
          <a href="#how" className="hover:text-slate-900">Как работает</a>
        </nav>

        <div className="flex items-center gap-3">
          {mounted && loggedIn ? (
            <>
              <Link
                href="/account"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Личный кабинет
              </Link>
              <Link
                href="/calculator"
                className="bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Калькулятор
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
