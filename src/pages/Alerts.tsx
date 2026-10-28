import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useLocalState } from '../hooks/useLocalState';
import { useDomain } from '../hooks/useDomain';
import type { Favorite } from '../components/QuoteCard';
import type { Quote } from '../types/data';
import { resolveMode } from '../utils/freshness';

interface Rule { id: string; instrumentId: string; kind: 'above' | 'below' | 'pct'; threshold: number }
const KIND: Record<Rule['kind'], string> = { above: 'أعلى من', below: 'أقل من', pct: 'تغير بالنسبة (±٪) أكبر من' };

export default function Alerts() {
  const [favs, setFavs] = useLocalState<Favorite[]>('masr.favorites', []);
  const [rules, setRules] = useLocalState<Rule[]>('masr.alerts', []);
  const [f, setF] = useState({ id: '', kind: 'above' as Rule['kind'], v: '' });
  const domains = [useDomain('market'), useDomain('stocks'), useDomain('gold'), useDomain('fx')];
  const quotes: Quote[] = domains.flatMap((d) => d.data?.items ?? []);

  const status = (r: Rule): string => {
    const q = quotes.find((x) => x.instrument_id === r.instrumentId);
    if (!q) return 'لا يوجد سعر حالي';
    const { mode } = resolveMode(q);
    if (mode === 'STALE' || mode === 'OFFLINE') return 'السعر قديم؛ لم يُقيَّم';
    const hit = r.kind === 'above' ? q.value > r.threshold : r.kind === 'below' ? q.value < r.threshold : q.percentage_change !== undefined && Math.abs(q.percentage_change) > r.threshold;
    return hit ? 'تحقق الشرط الآن' : 'لم يتحقق';
  };

  const add = () => {
    const v = Number(f.v);
    if (!f.id.trim() || !(v >= 0) || f.v === '') return;
    setRules([...rules, { id: crypto.randomUUID(), instrumentId: f.id.trim(), kind: f.kind, threshold: v }]);
    setF({ ...f, v: '' });
  };

  return (
    <section>
      <h1 className="text-xl font-bold">المفضلة والتنبيهات</h1>
      <div className="card mt-3 border-amber-500/40 text-sm">
        التنبيهات محلية: تُقيَّم فقط أثناء فتح هذه الصفحة وبناءً على آخر بيانات حديثة من الخادم. لا توجد إشعارات خارج التطبيق ولا خادم يعمل في الخلفية، ولن يصلك تنبيه والتطبيق مغلق.
      </div>

      <h2 className="mb-2 mt-6 font-semibold">المفضلة</h2>
      {favs.length === 0 ? <p className="text-sm text-slate-400">لا توجد عناصر. أضفها بنجمة البطاقة عند توفر بيانات.</p> : (
        <ul className="space-y-2">{favs.map((x) => (
          <li key={x.id} className="card flex items-center justify-between py-2"><span>{x.name} <span className="text-xs text-slate-400" dir="ltr">{x.id}</span></span>
            <button aria-label={`إزالة ${x.name}`} onClick={() => setFavs(favs.filter((y) => y.id !== x.id))}><Trash2 size={16} className="text-down" /></button></li>
        ))}</ul>
      )}

      <h2 className="mb-2 mt-6 font-semibold">قواعد التنبيه</h2>
      <div className="card grid gap-3 md:grid-cols-4">
        <select className="input" value={f.id} onChange={(e) => setF({ ...f, id: e.target.value })}>
          <option value="">اختر من المفضلة</option>{favs.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Rule['kind'] })}>{Object.entries(KIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <input className="input" type="number" step="any" min="0" placeholder="القيمة" value={f.v} onChange={(e) => setF({ ...f, v: e.target.value })} />
        <button className="btn" onClick={add}>إضافة تنبيه</button>
      </div>
      <ul className="mt-3 space-y-2">
        {rules.map((r) => (
          <li key={r.id} className="card flex items-center justify-between py-2 text-sm">
            <span>{favs.find((x) => x.id === r.instrumentId)?.name ?? r.instrumentId} — {KIND[r.kind]} {r.threshold}</span>
            <span className="flex items-center gap-3"><span className="text-xs text-slate-400">{status(r)}</span>
              <button aria-label="حذف التنبيه" onClick={() => setRules(rules.filter((x) => x.id !== r.id))}><Trash2 size={16} className="text-down" /></button></span>
          </li>
        ))}
        {rules.length === 0 && <p className="text-sm text-slate-400">لا توجد قواعد.</p>}
      </ul>
    </section>
  );
}
