'use client';

import { useState } from 'react';
import { Tax, formatNumber, updateTax } from './api';

export function TaxesTable({
  taxes,
  password,
  onUpdate,
}: {
  taxes: Tax[];
  password: string;
  onUpdate: (t: Tax) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRate, setEditRate] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (t: Tax) => {
    setEditingId(t.id);
    setEditRate(formatNumber(t.rate_percent));
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRate('');
  };

  const save = async (t: Tax) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateTax(password, t.id, Number(editRate));
      onUpdate(updated);
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Код</th>
              <th className="text-left px-4 py-2 font-medium">Название</th>
              <th className="text-right px-4 py-2 font-medium w-32">Ставка, %</th>
              <th className="text-right px-4 py-2 font-medium w-32">Действие</th>
            </tr>
          </thead>
          <tbody>
            {taxes.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs text-slate-700">
                  {t.code}
                </td>
                <td className="px-4 py-2 text-slate-600">{t.name}</td>
                <td className="px-4 py-2 text-right">
                  {editingId === t.id ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-24 rounded border border-blue-400 px-2 py-1 text-right text-slate-900"
                      autoFocus
                    />
                  ) : (
                    <span className="font-mono text-slate-900">
                      {formatNumber(t.rate_percent)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {editingId === t.id ? (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => save(t)}
                        disabled={saving}
                        className="text-green-600 hover:text-green-800 text-xs font-medium"
                      >
                        {saving ? '...' : 'Сохранить'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-slate-400 hover:text-slate-700 text-xs"
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(t)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Изменить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
