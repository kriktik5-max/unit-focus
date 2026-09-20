'use client';

export function Field({
  label,
  value,
  onChange,
  type = 'number',
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-800">{value}</div>
    </div>
  );
}

export function Row({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-slate-600">{label}</span>
      <span className={positive ? 'text-green-600 font-medium' : 'text-slate-800'}>
        {positive ? '+' : '−'} {value} ₽
      </span>
    </div>
  );
}
