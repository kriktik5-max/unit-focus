'use client';

import { useState } from 'react';
import { Tariff, MP_LABELS, formatNumber, updateTariff } from './api';

export function TariffsTable({
  tariffs,
  token,
  onUpdate,
}: {
  tariffs: Tariff[];
  token: string;
  onUpdate: (t: Tariff) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMp, setFilterMp] = useState<string>('all');

  const filtered =
    filterMp === 'all' ? tariffs : tariffs.filter((t) => t.marketplace === filterMp);

  const grouped = filtered.reduce<Record<string, Tariff[]>>((acc, t) => {
    if (!acc[t.marketplace]) acc[t.marketplace] = [];
    acc[t.marketplace].push(t);
    return acc;
  }, {});

  const startEdit = (t: Tariff) => {
    setEditingId(t.id);
    setEditValue(formatNumber(t.value));
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setError(null);
  };

  const save = async (t: Tariff) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateTariff(token, t.id, Number(editValue));
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
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Фильтр:</label>
        <select
          value={filterMp}
          onChange={(e) => setFilterMp(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        >
          <option value="all">Все маркетплейсы</option>
          <option value="wb_fbo">Wildberries FBO</option>
          <option value="ozon_fbo">Ozon FBO</option>
          <option value="yandex_fby">Яндекс Маркет FBY</option>
        </select>
        <span className="text-sm text-slate-500">
          Всего: {filtered.length}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}

      {Object.entries(grouped).map(([mp, list]) => (
        <div key={mp} className="mb-6">
          <h3 className="font-semibold text-slate-800 mb-2">
            {MP_LABELS[mp] ?? mp}
          </h3>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Ключ</th>
                  <th className="text-left px-4 py-2 font-medium">Описание</th>
                  <th className="text-right px-4 py-2 font-medium w-32">Значение</th>
                  <th className="text-right px-4 py-2 font-medium w-32">Действие</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs text-slate-700">
                      {t.key}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{t.description}</td>
                    <td className="px-4 py-2 text-right">
                      {editingId === t.id ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-24 rounded border border-blue-400 px-2 py-1 text-right text-slate-900"
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono text-slate-900">
                          {formatNumber(t.value)}
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
      ))}
    </div>
  );
}
