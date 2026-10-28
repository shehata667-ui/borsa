import type { Quote } from '../types/data';

/**
 * أسعار وثائق الصناديق من صفحات منصة SNDUK العامة (snduk.com/eg).
 * - قرار المشروع: الاستخدام بدون إذن كتابي منهم؛ شروطهم لم تُقرأ بنصها. مفعّل فقط بـ SNDUK_ENABLED=true.
 * - قيمة الوثيقة ليست سعرًا لحظيًا. التاريخ المعروض هو تاريخ آخر سعر عندهم.
 * - العوائد (أسبوع/شهر/...) كما تعرضها SNDUK، ومنهجية حسابها غير معروفة لنا.
 * - المحلل مبني على نص صفحة صندوق واحد (إسكان) ولم يُختبر على الصفحات الحية.
 */
export const ORIGIN = 'https://snduk.com';
const SOURCE = 'SNDUK';
const SLUG_RX = /^[A-Za-z0-9%&_.-]+$/;

const CATEGORY_AR: Record<string, string> = {
  money_market: 'سوق النقد',
  fixed_income: 'دخل ثابت',
  equity: 'أسهم',
  balanced: 'متوازن',
  capital_preservation: 'حماية رأس المال',
  index: 'مؤشر',
  etfs: 'صناديق المؤشرات',
};

export interface FundMeta { slug: string; name: string; category?: string }

const toLatin = (s: string) =>
  s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/٫/g, '.').replace(/٬/g, '');
const strip = (html: string) =>
  toLatin(
    html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|[\u200e\u200f\u061c]/g, ' ')
      .replace(/\s+/g, ' '),
  );
const sign = (s: string) => Number(s.replace('−', '-').replace('+', ''));

function cairoOffsetMs(at: Date): number {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(at);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return Math.round((Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - at.getTime()) / 60000) * 60000;
}
function cairoLocalToIso(y: number, mo: number, d: number, h: number, mi: number): string {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  return new Date(guess - cairoOffsetMs(new Date(guess))).toISOString();
}

/**
 * نقتصر على صناديق البنك الأهلي المصري وبنك مصر فقط (قرار المشروع).
 * المطابقة بالاسم لأن الصفحة لا تعرض بنك الإصدار بصيغة ثابتة. تُستبعد صناديق slug يبدأ بـ snb-
 * (الأهلي السعودي حسب الاسم/الرابط) وصناديق «مصر إكويتي» و«مصر المستقبل» لعدم التأكد من تبعيتها لبنك مصر.
 */
export function isTargetFund(f: FundMeta): boolean {
  return !f.slug.startsWith('snb-') && /البنك الأهل[يى]|الأهل[يى] حياة|بنك مصر/.test(f.name);
}

export function parseFundList(html: string): FundMeta[] {
  const rx = /<a[^>]+href="[^"]*\/eg\/funds\/([^"?#/]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  const hits = [...html.matchAll(rx)];
  const out: FundMeta[] = [];
  const seen = new Set<string>();
  hits.forEach((m, i) => {
    const slug = m[1];
    if (slug === 'compare' || !SLUG_RX.test(slug) || seen.has(slug)) return;
    const name = strip(m[2]).trim();
    if (!name) return;
    const tail = html.slice((m.index ?? 0) + m[0].length, hits[i + 1]?.index ?? undefined).slice(0, 600);
    const cat = /\b(money_market|fixed_income|equity|balanced|capital_preservation|index|etfs)\b/.exec(strip(tail))?.[1];
    seen.add(slug);
    out.push({ slug, name, category: cat });
  });
  return out;
}

export function parseFundPage(html: string, meta: FundMeta, now: Date = new Date()): Quote {
  const text = strip(html);
  const nav = /([\d.]+)\s*ج\.م\.?\s*([+\-−]?[\d.]+)\s*%\s*سعر الوثيقة\s*-\s*اخر تحديث\s*:\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})\s*،?\s*(\d{1,2}):(\d{2})\s*(ص|م)/.exec(text);
  if (!nav) throw new Error('تغيّر شكل صفحة الصندوق: لم يُعثر على سعر الوثيقة وتاريخه');
  const value = Number(nav[1]);
  if (!(value > 0)) throw new Error('سعر وثيقة غير صالح');
  let hh = Number(nav[6]) % 12;
  if (nav[8] === 'م') hh += 12;
  // التنسيق يوم/شهر/سنة (مؤكد من تاريخ بدء الصندوق 29/4/2023)
  const sourceTs = cairoLocalToIso(Number(nav[5]), Number(nav[4]), Number(nav[3]), hh, Number(nav[7]));

  const get = (rx: RegExp) => rx.exec(text)?.[1]?.trim();
  const frequency = get(/معلومات الشراء\s+التكرار\s+(\S+)/);
  const ret = (label: string) => {
    const m = new RegExp(`العائد خلال ${label}:\\s*([+\\-−]?[\\d.]+)\\s*%`).exec(text);
    return m ? sign(m[1]) : undefined;
  };
  const returns: Record<string, number> = {};
  for (const [k, label] of [['week', 'أسبوع'], ['month', 'شهر'], ['m3', '3 أشهر'], ['m6', '6 أشهر'], ['year', 'سنة'], ['since_inception', 'منذ البداية']] as const) {
    const v = ret(label);
    if (v !== undefined) returns[k] = v;
  }
  const fees = [...text.matchAll(/رسوم الاشتراك والبيع\s+(.{1,40}?)\s+(?=معلومات الاسترداد|جهات الاكتتاب|كود الصندوق)/g)].map((m) => m[1].trim());
  const pdf = /href="([^"]+\.pdf)"/i.exec(html)?.[1];

  // الحالة: لا ندّعي حداثة. يومي: أكثر من 7 أيام = قديم. غير ذلك: أكثر من 21 يومًا = قديم.
  const ageDays = (now.getTime() - Date.parse(sourceTs)) / 86_400_000;
  const limit = frequency === 'يومي' ? 7 : 21;

  return {
    instrument_id: `FUND_${meta.slug}`,
    instrument_name: meta.name,
    instrument_type: 'fund',
    value,
    currency: 'EGP',
    unit: 'وثيقة',
    source_name: SOURCE,
    source_timestamp: sourceTs,
    received_at: now.toISOString(),
    data_mode: ageDays > limit ? 'STALE' : 'PERIODIC',
    fund: {
      page_url: `${ORIGIN}/eg/funds/${meta.slug}?lang=ar`,
      manager: get(/مدير الأصول\s+(.+?)\s+مدير الصندوق/),
      category: meta.category,
      category_ar: meta.category ? CATEGORY_AR[meta.category] : undefined,
      min_subscription: get(/الحد الأدنى للاستثمار\s+(.+?)\s+العملة/),
      frequency,
      subscription_fee: fees[0],
      redemption_fee: fees[1],
      last_change_pct: sign(nav[2]),
      returns: Object.keys(returns).length ? returns : undefined,
      prospectus_url: pdf,
    },
  };
}

