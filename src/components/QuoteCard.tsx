import { Star } from 'lucide-react';
import type { Quote } from '../types/data';
import { resolveMode } from '../utils/freshness';
import { fmtAge, fmtNum, fmtPct, fmtTime } from '../utils/format';
import { StatusBadge } from './StatusBadge';
import { useLocalState } from '../hooks/useLocalState';

export interface Favorite {
  id: string;
  name: string;
}

export function QuoteCard({ q }: { q: Quote }) {
  const { mode, ageSeconds } = resolveMode(q);
  const [favs, setFavs] = useLocalState<Favorite[]>('masr.favorites', []);
  const isFav = favs.some((f) => f.id === q.instrument_id);
  const toggle = () =>
    setFavs(isFav ? favs.filter((f) => f.id !== q.instrument_id) : [...favs, { id: q.instrument_id, name: q.instrument_name }]);
  const dir = q.percentage_change ?? q.absolute_change;
  const color = dir === undefined || dir === 0 ? '' : dir > 0 ? 'text-up' : 'text-down';

  return (
    <article className="card">
      <header className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{q.instrument_name}</h3>
        <button onClick={toggle} aria-pressed={isFav} aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}>
          <Star size={18} className={isFav ? 'fill-gold text-gold' : 'text-slate-400'} />
        </button>
      </header>
      <p className="num mt-2 text-2xl font-bold">
        {fmtNum(q.value)} <span className="text-sm font-normal text-slate-400">{q.currency ?? q.unit ?? ''}</span>
      </p>
      {(q.absolute_change !== undefined || q.percentage_change !== undefined) && (
        <p className={`num mt-1 text-sm ${color}`} dir="ltr">
          {q.absolute_change !== undefined && <span>{fmtNum(q.absolute_change)} </span>}
          {q.percentage_change !== undefined && <span>({fmtPct(q.percentage_change)})</span>}
        </p>
      )}
      <footer className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
        <StatusBadge mode={mode} />
        <span>{q.source_name}</span>
        <span>{fmtTime(q.source_timestamp)}</span>
        {ageSeconds !== null && <span>({fmtAge(ageSeconds)})</span>}
      </footer>
    </article>
  );
}
