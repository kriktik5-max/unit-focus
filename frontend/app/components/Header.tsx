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

    const onStorage = () => setLoggedIn(getToken() !== null);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <header className="bg-navy">
      <div className="max-w-6xl mx-auto px-6 h-[76px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-7 h-7 border border-gold text-gold flex items-center justify-center font-mono text-[11px]">
            UF
          </div>
          <span className="font-medium text-[15px] text-white tracking-wide">Юнит-Фокус</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[13.5px] text-white/55">
          <a href="#features" className="hover:text-white transition">Возможности</a>
          <a href="#marketplaces" className="hover:text-white transition">Маркетплейсы</a>
          <a href="#how" className="hover:text-white transition">Как работает</a>
          <Link href="/pricing" className="hover:text-white transition">Тарифы</Link>
        </nav>

        <div className="flex items-center gap-3">
          {mounted && loggedIn ? (
            <>
              <Link href="/dashboard" className="text-[13.5px] font-medium text-white/70 hover:text-white transition">
                Дашборд
              </Link>
              <Link href="/account" className="text-[13.5px] font-medium text-white/70 hover:text-white transition">
                Личный кабинет
              </Link>
              <Link
                href="/calculator"
                className="bg-gold text-navy text-[13.5px] font-semibold px-5 py-2.5 hover:brightness-110 transition"
              >
                Калькулятор
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[13.5px] font-medium text-white/70 hover:text-white transition">
                Войти
              </Link>
              <Link
                href="/register"
                className="bg-gold text-navy text-[13.5px] font-semibold px-5 py-2.5 hover:brightness-110 transition"
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
