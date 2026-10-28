import type { Quote } from '../types/data';

/**
 * جلب أسعار الذهب المعلنة من صفحة آي صاغة العامة.
 * - هذه أسعار تاجر (شراء/بيع)، وليست سعرًا مرجعيًا للسوق.
 * - الصفحة تعرض الساعة فقط بلا تاريخ، لذلك نستنتج التاريخ ونعلّم البيانات DELAYED، وتسقط إلى STALE تلقائيًا بالواجهة.
 * - مفعّل فقط عند ISAGHA_SCRAPE_ENABLED=true، وبدون إذن كتابي منهم يكون الاستخدام على مسؤوليتك.
 * - محلل HTML مبني على نص الصفحة وقت الكتابة ولم يُختبر على الصفحة الحية؛ إن تغيّرت الصفحة يُرجع خطأ بدل أرقام خاطئة.
 */
export const ISAGHA_URL = 'https://market.isagha.com/';
const SOURCE = 'آي صاغة (سعر تاجر معلن)';

const num = (s: string) => Number(s.replace(/,/g, ''));
const sign = (s: string) => Number(s.replace('−', '-').replace('+', ''));

function cairoParts(d: Date) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(d);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { y: g('year'), mo: g('month'), d: g('day'), h: g('hour'), mi: g('minute'), s: g('second') };
}

export function pageTimeToIso(hour: number, minute: number, meridiem: string, now: Date): string {
  let h = hour % 12;
  if (meridiem === 'م') h += 12;
  const c = cairoParts(now);
  const offsetMs = Math.round((Date.UTC(c.y, c.mo - 1, c.d, c.h, c.mi, c.s) - now.getTime()) / 60000) * 60000;
  let ts = Date.UTC(c.y, c.mo - 1, c.d, h, minute) - offsetMs;
  if (ts > now.getTime() + 60_000) ts -= 86_400_000;
  return new Date(ts).toISOString();
}

export function parseIsagha(html: string, now: Date = new Date()): Quote[] {
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

  const t = /أسعار الساعة\s*(\d{1,2}):(\d{2})\s*(ص|م)/.exec(text);
  if (!t) throw new Error('تغيّر شكل الصفحة: لم يُعثر على وقت التحديث');
  const sourceTs = pageTimeToIso(Number(t[1]), Number(t[2]), t[3], now);

  const rows: { id: string; label: string; unit: string; buy: number; sell: number; pct: number }[] = [];
  const seen = new Set<string>();
  const rx = /عيار\s*(24|21|18)\s+([\d.,]+)\s+([\d.,]+)\s+([+\-−]?[\d.]+)\s*%/g;
  for (const m of text.matchAll(rx)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    rows.push({ id: `GOLD_${m[1]}`, label: `الذهب عيار ${m[1]}`, unit: 'جرام', buy: num(m[2]), sell: num(m[3]), pct: sign(m[4]) });
  }
  const p = /جنيه ذهب\s+([\d.,]+)\s+([\d.,]+)\s+([+\-−]?[\d.]+)\s*%/.exec(text);
  if (p) rows.push({ id: 'GOLD_POUND', label: 'الجنيه الذهب', unit: 'جنيه ذهب', buy: num(p[1]), sell: num(p[2]), pct: sign(p[3]) });
  if (rows.length === 0) throw new Error('تغيّر شكل الصفحة: لم تُستخرج أسعار');

  const base = { instrument_type: 'gold' as const, currency: 'EGP', source_name: SOURCE, source_timestamp: sourceTs, received_at: now.toISOString(), data_mode: 'DELAYED' as const };
  return rows.flatMap((r) => {
    if (!(r.buy > 0 && r.sell > 0 && r.sell >= r.buy)) return [];
    return [
      { ...base, instrument_id: r.id, instrument_name: `${r.label} (بيع التاجر للمستهلك)`, unit: r.unit, value: r.sell, percentage_change: r.pct },
      { ...base, instrument_id: `${r.id}_BUY`, instrument_name: `${r.label} (شراء التاجر من العميل)`, unit: r.unit, value: r.buy },
    ];
  });
}

