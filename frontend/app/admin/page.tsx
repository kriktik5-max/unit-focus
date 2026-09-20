'use client';

import { useEffect, useState } from 'react';
import { Tariff, Tax, getTariffs, getTaxes, login, logout } from './api';
import { TariffsTable } from './TariffsTable';
import { TaxesTable } from './TaxesTable';

type Tab = 'tariffs' | 'taxes';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [tab, setTab] = useState<Tab>('tariffs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('uf_admin_token');
      if (saved) setToken(saved);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, x] = await Promise.all([getTariffs(token), getTaxes(token)]);
      setTariffs(t);
      setTaxes(x);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
      // Если токен невалиден — выкидываем на форму логина
      sessionStorage.removeItem('uf_admin_token');
      setToken('');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;
    setLoading(true);
    setError(null);
    try {
      const newToken = await login(passwordInput);
      sessionStorage.setItem('uf_admin_token', newToken);
      setToken(newToken);
      setPasswordInput('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout(token);
    sessionStorage.removeItem('uf_admin_token');
    setToken('');
    setTariffs([]);
    setTaxes([]);
  };

  const updateTariffLocal = (updated: Tariff) => {
    setTariffs(tariffs.map((t) => (t.id === updated.id ? updated : t)));
  };

  const updateTaxLocal = (updated: Tax) => {
    setTaxes(taxes.map((t) => (t.id === updated.id ? updated : t)));
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Админка Юнит-Фокус
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Введите пароль администратора
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Пароль"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none"
              autoFocus
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Проверяю...' : 'Войти'}
            </button>
          </form>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mt-4">
              {error}
            </div>
          )}
          <a
            href="/"
            className="block text-center text-sm text-slate-500 hover:text-slate-800 mt-6"
          >
            ← На главную
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <a href="/" className="text-sm text-slate-500 hover:text-slate-800">
              ← На главную
            </a>
            <h1 className="text-3xl font-bold text-slate-900 mt-2">
              Админка Юнит-Фокус
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Выйти
          </button>
        </header>

        <div className="mb-6 inline-flex rounded-xl bg-white shadow p-1 gap-1">
          <button
            onClick={() => setTab('tariffs')}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition ${
              tab === 'tariffs'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Значения по умолчанию ({tariffs.length})
          </button>
          <button
            onClick={() => setTab('taxes')}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition ${
              tab === 'taxes'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Налоговые ставки ({taxes.length})
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
            {error}
          </div>
        )}

        {loading && <p className="text-slate-500">Загружаю...</p>}

        {!loading && tab === 'tariffs' && (
          <TariffsTable
            tariffs={tariffs}
            token={token}
            onUpdate={updateTariffLocal}
          />
        )}

        {!loading && tab === 'taxes' && (
          <TaxesTable taxes={taxes} token={token} onUpdate={updateTaxLocal} />
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          💡 <strong>Как это работает:</strong> изменения сразу сохраняются в
          базу данных. Калькулятор подгружает эти значения из БД.
        </div>
      </div>
    </main>
  );
}
