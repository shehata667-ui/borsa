import type { DataMode } from '../types/data';
import { MODE_LABEL_AR } from '../utils/freshness';

const STYLE: Record<DataMode, string> = {
  LIVE: 'bg-up-soft text-up',
  DELAYED: 'bg-amber-900/40 text-amber-300',
  PERIODIC: 'bg-sky-900/40 text-sky-300',
  END_OF_DAY: 'bg-slate-700/50 text-slate-300',
  STALE: 'bg-orange-900/40 text-orange-300',
  OFFLINE: 'bg-down-soft text-down',
  DEMO: 'bg-purple-900/40 text-purple-300',
};

export function StatusBadge({ mode }: { mode: DataMode }) {
  return <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STYLE[mode]}`}>{MODE_LABEL_AR[mode]}</span>;
}
