import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useLocalState } from '../hooks/useLocalState';
import { fmtNum, fmtPct } from '../utils/format';
import { Disclaimer } from '../components/Notices';

interface Holding {
  id: string;
  name: string;
  type: string;
  qty: number;
  avgPrice: number;
  date: string;
  currency: string;
  fees: number;
  /** سعر حالي أدخله المستخدم يدويًا مع تاريخه. لا يوجد سعر آلي. */
  manualPrice?: number;
  manualPriceDate?: string;
}

const TYPES = ['سهم', 'ذهب', 'عملة', 'صندوق', 'شهادة/وديعة', 'أخرى'];

export default function Portfolio() {
  const [items, setItems] = useLocalState<Holding[]>('masr.portfolio', []);
  const [f, setF] = useState({ name: '', type: TYPES[0], qty: '', avg: '', date: '', currency: 'EGP', fees: '0' });
  const [err, setErr] = useState('');

  const add = () => {
    const qty = Number(f.qty), avg = Number(f.avg), fees = Number(f.fees);
    if (!f.name.trim() || !(qty > 0) || !(avg >= 0) || !(fees >= 0)) return setErr('أدخل اسمًا وكمية موجبة وسعر شراء صحيحًا.');
    setErr('');
    setItems([...items, { id: crypto.randomUUID(), name: f.name.trim(), type: f.type, qty, avgPrice: avg, date: f.date, currency: f.currency.trim() || 'EGP', fees }]);
    setF({ ...f, name: '', qty: '', avg: '' });
  };
  const setPrice = (id: string, v: string) =>
    setItems(items.map((h) => (h.id === id ? { ...h, manualPrice: v === '' ? undefined : Number(v), manualPriceDate: v === '' ? undefined : new Date().toISOString().slice(0, 10) } : h)));

  const cost = (h: Holding) => h.qty * h.avgPrice + h.fees;
  const totalsByCur = items.reduce<Record<string, number>>((a, h) => ({ ...a, [h.currency]: (a[h.currency] ?? 0) + cost(h) }), {});

  return (
    <section>
      <h1 className="text-xl font-bold">المحفظة الشخصية</h1>
      <p className="mb-4 mt-1 text-sm text-slate-400">تُحفظ على جهازك فقط. التطبيق غير مرتبط بأي بنك أو شركة وساطة. القيمة الحالية تعتمد على سعر تدخله أنت يدويًا.</p>

      <div className="card grid grid-cols-2 gap-3 md:grid-cols-4">
        <input className="input" placeholder="اسم الأصل" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <input className="input" type="number" min="0" step="any" placeholder="الكمية" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} />
        <input className="input" type="number" min="0" step="any" placeholder="متوسط سعر الشراء" value={f.avg} onChange={(e) => setF({ ...f, avg: e.target.value })} />
        <input className="input" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        <input className="input" placeholder="العملة" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} />
        <input className="input" type="number" min="0" step="any" placeholder="الرسوم" value={f.fees} onChange={(e) => setF({ ...f, fees: e.target.value })} />
        <button className="btn" onClick={add}>إضافة</button>
        {err && <p className="col-span-full text-sm text-down" role="alert">{err}</p>}
      </div>

      {items.length === 0 ? <p className="mt-4 text-sm text-slate-400">لا توجد أصول بعد.</p> : (
        <>
          <div className="card mt-4 overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="text-slate-400"><tr><th className="p-2 text-start">الأصل</th><th className="p-2 text-start">الكمية</th><th className="p-2 text-start">إجمالي التكلفة</th><th className="p-2 text-start">السعر الحالي (يدوي)</th><th className="p-2 text-start">الربح/الخسارة غير المحققة</th><th /></tr></thead>
              <tbody>
                {items.map((h) => {
                  const pnl = h.manualPrice !== undefined ? h.manualPrice * h.qty - cost(h) : undefined;
                  return (
                    <tr key={h.id} className="border-t border-slate-200 dark:border-ink-600">
                      <td className="p-2">{h.name}<span className="block text-xs text-slate-400">{h.type}{h.date ? ` · ${h.date}` : ''}</span></td>
                      <td className="num p-2">{fmtNum(h.qty)}</td>
                      <td className="num p-2">{fmtNum(cost(h))} {h.currency}</td>
                      <td className="p-2">
                        <input className="input num w-28" type="number" min="0" step="any" defaultValue={h.manualPrice ?? ''} onBlur={(e) => setPrice(h.id, e.target.value)} aria-label={`السعر الحالي لـ ${h.name}`} />
                        {h.manualPriceDate && <span className="block text-xs text-slate-400">أُدخل في {h.manualPriceDate}</span>}
                      </td>
                      <td className={`num p-2 ${pnl === undefined ? 'text-slate-400' : pnl >= 0 ? 'text-up' : 'text-down'}`} dir="ltr">
                        {pnl === undefined ? 'غير متاح' : `${fmtNum(pnl)} (${fmtPct((pnl / cost(h)) * 100)})`}
                      </td>
                      <td className="p-2"><button aria-label={`حذف ${h.name}`} onClick={() => setItems(items.filter((x) => x.id !== h.id))}><Trash2 size={16} className="text-down" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="card mt-4 text-sm">
            <h2 className="mb-1 font-semibold">إجمالي التكلفة حسب العملة</h2>
            {Object.entries(totalsByCur).map(([c, v]) => <p key={c} className="num">{fmtNum(v)} {c}</p>)}
            <p className="mt-2 text-xs text-slate-400">لا يُجمع بين عملات مختلفة. توزيع الأصول وأداء المحفظة عبر الزمن يحتاجان أسعارًا تاريخية موثقة ولم يُنفذا بعد.</p>
          </div>
        </>
      )}
      <Disclaimer />
    </section>
  );
}
