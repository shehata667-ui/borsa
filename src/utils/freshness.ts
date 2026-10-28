import type { DataMode, Quote } from '../types/data';

/** أقصى عمر مقبول (بالثواني) للبيانات اللحظية حسب نوع الأصل. قيم افتراضية قابلة للتعديل حسب سياسة كل مصدر. */
export const MAX_AGE_SECONDS: Record<Quote['instrument_type'], number> = {
  index: 60,
  stock: 60,
  gold: 15 * 60,
  fx: 15 * 60,
  fund: 3 * 24 * 3600,
  rate: 90 * 24 * 3600,
  indicator: 90 * 24 * 3600,
};

export interface Resolved {
  mode: DataMode;
  ageSeconds: number | null;
}

/**
 * يحدد الحالة المعروضة فعليًا. المصدر قد يدّعي LIVE لكن إذا كان توقيته قديمًا
 * تُسقَط الحالة إلى STALE فورًا. لا تُرفع الحالة أبدًا لأعلى مما أعلنه المصدر.
 */
export function resolveMode(q: Quote, now: number = Date.now()): Resolved {
  if (q.data_mode === 'OFFLINE' || q.data_mode === 'DEMO') return { mode: q.data_mode, ageSeconds: null };
  const ts = Date.parse(q.source_timestamp);
  if (Number.isNaN(ts)) return { mode: 'STALE', ageSeconds: null };
  const age = Math.max(0, Math.round((now - ts) / 1000));
  const limit = MAX_AGE_SECONDS[q.instrument_type];
  if ((q.data_mode === 'LIVE' || q.data_mode === 'DELAYED') && age > limit + (q.delay_seconds ?? 0)) {
    return { mode: 'STALE', ageSeconds: age };
  }
  return { mode: q.data_mode, ageSeconds: age };
}

export const MODE_LABEL_AR: Record<DataMode, string> = {
  LIVE: 'لحظي',
  DELAYED: 'متأخر',
  PERIODIC: 'دوري',
  END_OF_DAY: 'إغلاق اليوم',
  STALE: 'قديم',
  OFFLINE: 'غير متصل',
  DEMO: 'تجريبي',
};
