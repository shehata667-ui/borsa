import { Link } from 'react-router-dom';
import { useDomain } from '../hooks/useDomain';
import { QuoteCard } from '../components/QuoteCard';
import { Disclaimer, Skeleton } from '../components/Notices';
import type { Quote } from '../types/data';
import { useLocalState } from '../hooks/useLocalState';
import type { Favorite } from '../components/QuoteCard';

/** instrument_id المتوقعة من adapters الخادم. وثّقها كل adapter جديد. */
const KEY_CARDS: { id: string; label: string; domain: 'market' | 'gold' | 'fx' | 'economy'; to: string }[] = [
  { id: 'EGX30', label: 'مؤشر EGX30', domain: 'market', to: '/egx' },
  { id: 'EGX70EWI', label: 'مؤشر EGX70 EWI', domain: 'market', to: '/egx' },
  { id: 'EGX100EWI', label: 'مؤشر EGX100 EWI', domain: 'market', to: '/egx' },
  { id: 'GOLD_21', label: 'الذهب عيار 21', domain: 'gold', to: '/gold' },
  { id: 'USDEGP', label: 'الدولار مقابل الجنيه', domain: 'fx', to: '/fx' },
  { id: 'CBE_OVERNIGHT_DEPOSIT', label: 'سعر الإيداع لليلة واحدة (البنك المركزي)', domain: 'economy', to: '/rates' },
];

function Placeholder({ label, to, reason }: { label: string; to: string; reason: string }) {
  return (
    <article className="card">
      <h3 className="font-semibold">{label}</h3>
      <p className="mt-2 text-lg text-slate-400">غير متاح</p>
      <p className="mt-1 text-xs text-slate-400">{reason}</p>
      <Link to={to} className="mt-2 inline-block text-xs text-emerald-400 hover:underline">التفاصيل</Link>
    </article>
  );
}

export default function Dashboard() {
  const market = useDomain('market');
  const gold = useDomain('gold');
  const fx = useDomain('fx');
  const economy = useDomain('economy');
  const news = useDomain('news');
  const by = { market, gold, fx, economy };
  const [favs] = useLocalState<Favorite[]>('masr.favorites', []);
  const anyLoading = [market, gold, fx, economy].some((q) => q.isLoading);

  const find = (domain: keyof typeof by, id: string): Quote | undefined => by[domain].data?.items.find((i) => i.instrument_id === id);

  return (
    <section>
      <h1 className="text-xl font-bold">نظرة عامة على السوق المصري</h1>
      <p className="mb-4 mt-1 text-sm text-slate-400">لا تُعرض أي قيمة بدون مصدر وتوقيت. غياب المصدر يظهر كـ «غير متاح».</p>

      {anyLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Skeleton /><Skeleton /><Skeleton /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KEY_CARDS.map((c) => {
            const q = find(c.domain, c.id);
            if (q) return <QuoteCard key={c.id} q={q} />;
            const st = by[c.domain];
            const reason = st.isError ? 'تعذر الاتصال بالخادم.' : st.data?.configured ? 'المصدر لا يوفر هذا العنصر حاليًا.' : 'المصدر غير مهيأ.';
            return <Placeholder key={c.id} label={c.label} to={c.to} reason={reason} />;
          })}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-semibold">آخر الأخبار</h2>
          {news.data?.news?.length ? (
            <ul className="space-y-2 text-sm">
              {news.data.news.slice(0, 5).map((n) => (
                <li key={n.id}><a className="hover:underline" href={n.url} target="_blank" rel="noopener noreferrer">{n.title}</a><span className="text-xs text-slate-400"> — {n.source_name}</span></li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">لا توجد أخبار: مصدر الأخبار غير مهيأ بعد. <Link to="/settings" className="text-emerald-400">المصادر</Link></p>
          )}
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold">المفضلة</h2>
          {favs.length ? (
            <ul className="space-y-1 text-sm">{favs.map((f) => <li key={f.id}>{f.name}</li>)}</ul>
          ) : (
            <p className="text-sm text-slate-400">لم تضف شيئًا بعد. استخدم أيقونة النجمة على أي بطاقة سعر.</p>
          )}
        </div>
      </div>
      <Disclaimer />
    </section>
  );
}
