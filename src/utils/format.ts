const nf = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 });
export const fmtNum = (n: number) => nf.format(n);
export const fmtPct = (n: number) => `${n > 0 ? '+' : ''}${nf.format(n)}٪`;
export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'غير معروف' : d.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
};
export function fmtAge(sec: number | null): string {
  if (sec === null) return '';
  if (sec < 90) return `منذ ${sec} ثانية`;
  if (sec < 5400) return `منذ ${Math.round(sec / 60)} دقيقة`;
  if (sec < 172800) return `منذ ${Math.round(sec / 3600)} ساعة`;
  return `منذ ${Math.round(sec / 86400)} يوم`;
}
