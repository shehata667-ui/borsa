import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { NavItem } from '../config/nav';
import { useDomain } from '../hooks/useDomain';
import { QuoteCard } from '../components/QuoteCard';
import { Disclaimer, ErrorNotice, Skeleton, SourceNotice } from '../components/Notices';
import { StatusBadge } from '../components/StatusBadge';
import { resolveMode } from '../utils/freshness';
import { fmtAge, fmtNum, fmtPct, fmtTime } from '../utils/format';
import type { Quote } from '../types/data';

type SortKey = 'instrument_name' | 'value' | 'percentage_change';

function StocksTable({ items }: { items: Quote[] }) {
  const [q, setQ] = useState('');
  const [key, setKey] = useState<SortKey>('instrument_name');
  const [asc, setAsc] = useState(true);
  const rows = useMemo(() => {
    const f = items.filter((i) => `${i.instrument_name} ${i.symbol ?? ''}`.toLowerCase().includes(q.toLowerCase()));
    return [...f].sort((a, b) => {
      let c: number;
      if (key === 'instrument_name') {
        c = a.instrument_name.localeCompare(b.instrument_name, 'ar');
      } else {
        const av = a[key] ?? -Infinity;
        const bv = b[key] ?? -Infinity;
        c = av === bv ? 0 : av < bv ? -1 : 1;
      }
      return asc ? c : -c;
    });
  }, [items, q, key, asc]);
  const th = (k: SortKey, label: string) => (
    <th className="p-2 text-start">
      <button onClick={() => (key === k ? setAsc(!asc) : (setKey(k), setAsc(true)))}>{label}{key === k ? (asc ? ' ▲' : ' ▼') : ''}</button>
    </th>
  );
  return (
    <div>
      <input className="input mb-3 max-w-xs" placeholder="ابحث بالاسم أو الرمز" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr>{th('instrument_name', 'السهم')}<th className="p-2 text-start">الرمز</th>{th('value', 'السعر')}{th('percentage_change', 'التغير')}<th className="p-2 text-start">الحالة</th><th className="p-2 text-start">التوقيت</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.instrument_id} className="border-t border-slate-200 dark:border-ink-600">
                <td className="p-2">{r.instrument_name}</td>
                <td className="p-2" dir="ltr">{r.symbol ?? '—'}</td>
                <td className="num p-2">{fmtNum(r.value)}</td>
                <td className={`num p-2 ${(r.percentage_change ?? 0) > 0 ? 'text-up' : (r.percentage_change ?? 0) < 0 ? 'text-down' : ''}`} dir="ltr">{r.percentage_change === undefined ? '—' : fmtPct(r.percentage_change)}</td>
                <td className="p-2"><StatusBadge mode={resolveMode(r).mode} /></td>
                <td className="p-2 text-xs text-slate-400">{fmtTime(r.source_timestamp)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-slate-400">لا نتائج مطابقة.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FundsTable({ items }: { items: Quote[] }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const cats = useMemo(() => [...new Set(items.map((i) => i.fund?.category_ar).filter((c): c is string => !!c))], [items]);
  const rows = items.filter(
    (i) => (!cat || i.fund?.category_ar === cat) && `${i.instrument_name} ${i.fund?.manager ?? ''}`.toLowerCase().includes(q.toLowerCase()),
  );
  const pct = (v?: number) => (v === undefined ? '—' : fmtPct(v));
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="ابحث باسم الصندوق أو المدير" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[12rem]" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="نوع الصندوق">
          <option value="">كل الأنواع</option>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="p-2 text-start">الصندوق</th><th className="p-2 text-start">النوع</th>
              <th className="p-2 text-start">قيمة الوثيقة</th><th className="p-2 text-start">تاريخ السعر</th><th className="p-2 text-start">الحالة</th>
              <th className="p-2 text-start">شهر</th><th className="p-2 text-start">3 أشهر</th><th className="p-2 text-start">6 أشهر</th><th className="p-2 text-start">سنة</th>
              <th className="p-2 text-start">الحد الأدنى</th><th className="p-2 text-start">المصدر</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const { mode, ageSeconds } = resolveMode(r);
              return (
                <tr key={r.instrument_id} className="border-t border-slate-200 dark:border-ink-600">
                  <td className="p-2">{r.instrument_name}<span className="block text-xs text-slate-400">{r.fund?.manager}</span></td>
                  <td className="p-2">{r.fund?.category_ar ?? '—'}</td>
                  <td className="num p-2">{fmtNum(r.value)} {r.currency}</td>
                  <td className="p-2 text-xs text-slate-400">{fmtTime(r.source_timestamp)}{ageSeconds !== null && <span className="block">{fmtAge(ageSeconds)}</span>}</td>
                  <td className="p-2"><StatusBadge mode={mode} /></td>
                  <td className="num p-2" dir="ltr">{pct(r.fund?.returns?.month)}</td>
                  <td className="num p-2" dir="ltr">{pct(r.fund?.returns?.m3)}</td>
                  <td className="num p-2" dir="ltr">{pct(r.fund?.returns?.m6)}</td>
                  <td className="num p-2" dir="ltr">{pct(r.fund?.returns?.year)}</td>
                  <td className="p-2">{r.fund?.min_subscription ?? '—'}</td>
                  <td className="p-2">{r.fund && <a className="text-emerald-400 hover:underline" href={r.fund.page_url} target="_blank" rel="noopener noreferrer">{r.source_name}</a>}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={11} className="p-4 text-center text-slate-400">لا نتائج مطابقة.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        قيمة الوثيقة تُنشر دوريًا وليست سعرًا لحظيًا. العوائد المعروضة كما تحسبها المنصة المصدر ومنهجيتها غير معروفة لنا، وهي عوائد تاريخية لا تعني عائدًا متوقعًا. صندوق ظهر «قديم» لم يُحدَّث سعره منذ فترة أطول من المعتاد لدورية تقييمه.
      </p>
    </div>
  );
}

export default function DomainPage({ item }: { item: NavItem }) {
  const { data, isLoading, isError } = useDomain(item.domain!);
  const items = (data?.items ?? []).filter((i) => (item.path === '/rates' ? i.instrument_type === 'rate' : item.path === '/economy' ? i.instrument_type !== 'rate' : true));

  return (
    <section>
      <h1 className="text-xl font-bold">{item.label}</h1>
      {item.desc && <p className="mb-4 mt-1 text-sm text-slate-400">{item.desc}</p>}
      {isLoading && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Skeleton /><Skeleton /><Skeleton /></div>}
      {isError && <ErrorNotice text="تعذر الاتصال بالخادم. تأكد من تشغيل npm run dev:server. لا تُعرض أرقام قديمة أو تقديرية." />}
      {data && items.length === 0 && !data.news?.length && <SourceNotice message={data.message} envVar={data.env_var} />}
      {data?.message && items.length > 0 && <p className="mb-3 text-sm text-slate-400">{data.message}</p>}
      {item.domain === 'stocks' && items.length > 0 && <StocksTable items={items} />}
      {item.domain === 'funds' && items.length > 0 && <FundsTable items={items} />}
      {item.domain !== 'stocks' && item.domain !== 'funds' && items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((q) => <QuoteCard key={q.instrument_id} q={q} />)}</div>
      )}
      {data?.news && data.news.length > 0 && (
        <ul className="space-y-3">
          {data.news.map((n) => (
            <li key={n.id} className="card">
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between gap-2 font-semibold hover:underline">
                {n.title}<ExternalLink size={16} className="mt-1 shrink-0" />
              </a>
              {n.summary && <p className="mt-1 text-sm text-slate-400">{n.summary}</p>}
              <p className="mt-2 text-xs text-slate-400">{n.source_name} · {fmtTime(n.published_at)}{n.category ? ` · ${n.category}` : ''}</p>
            </li>
          ))}
        </ul>
      )}
      <Disclaimer />
    </section>
  );
}
