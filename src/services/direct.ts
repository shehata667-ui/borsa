import { Capacitor, CapacitorHttp } from '@capacitor/core';
import type { Domain, DomainResponse, Quote, SourcesResponse } from '../types/data';
import { ISAGHA_URL, parseIsagha } from '../providers/isagha';
import { ORIGIN, isTargetFund, parseFundList, parseFundPage } from '../providers/snduk';

/** الوضع المباشر: داخل تطبيق Android فقط، بلا خادم. المتصفح يحجب هذه الطلبات (CORS). */
export const isNative = () => Capacitor.isNativePlatform();

const GOLD_TTL = 5 * 60 * 1000;
const FUNDS_TTL = 6 * 60 * 60 * 1000;
const BACKOFF = 60 * 60 * 1000;
const DELAY_MS = 800;

interface Cached { at: number; items: Quote[] }
const load = (k: string): Cached | null => {
  try { const r = localStorage.getItem(k); return r ? (JSON.parse(r) as Cached) : null; } catch { return null; }
};
const save = (k: string, v: Cached) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ممتلئ */ } };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function httpGet(url: string): Promise<string> {
  const r = await CapacitorHttp.get({ url, headers: { Accept: 'text/html' }, responseType: 'text', connectTimeout: 10_000, readTimeout: 15_000 });
  if (r.status === 403 || r.status === 429) {
    try { localStorage.setItem('masr.backoff', String(Date.now() + BACKOFF)); } catch { /* تجاهل */ }
    throw new Error(`HTTP ${r.status}: تم إيقاف الجلب ساعة`);
  }
  if (r.status < 200 || r.status >= 300) throw new Error(`HTTP ${r.status}`);
  return typeof r.data === 'string' ? r.data : String(r.data);
}
const backedOff = () => Number(localStorage.getItem('masr.backoff') ?? 0) > Date.now();

async function gold(): Promise<DomainResponse> {
  const key = 'masr.direct.gold';
  const c = load(key);
  if (c && Date.now() - c.at < GOLD_TTL) return resp('gold', c.items, 'أسعار تاجر معلنة من آي صاغة، تُجلب مباشرة من هاتفك. ليست سعرًا مرجعيًا للسوق.');
  try {
    if (backedOff()) throw new Error('الجلب متوقف مؤقتًا بعد رفض من الموقع');
    const items = parseIsagha(await httpGet(ISAGHA_URL));
    save(key, { at: Date.now(), items });
    return resp('gold', items, 'أسعار تاجر معلنة من آي صاغة، تُجلب مباشرة من هاتفك. ليست سعرًا مرجعيًا للسوق.');
  } catch (e) {
    const why = e instanceof Error ? e.message : 'خطأ';
    return resp('gold', c?.items ?? [], `تعذر التحديث (${why}).${c ? ' المعروض آخر ما حُفظ على هاتفك.' : ''}`);
  }
}

async function funds(): Promise<DomainResponse> {
  const key = 'masr.direct.funds';
  const c = load(key);
  const note = 'قيم الوثائق كما تنشرها SNDUK وتُجلب مباشرة من هاتفك. العوائد من حساب المنصة.';
  if (c && Date.now() - c.at < FUNDS_TTL) return resp('funds', c.items, note);
  try {
    if (backedOff()) throw new Error('الجلب متوقف مؤقتًا بعد رفض من الموقع');
    const list = parseFundList(await httpGet(`${ORIGIN}/eg/funds?lang=ar`)).filter(isTargetFund);
    if (list.length === 0) throw new Error('لم تُستخرج صناديق الأهلي ومصر');
    const items: Quote[] = [];
    for (const f of list) {
      if (backedOff()) break;
      try { items.push(parseFundPage(await httpGet(`${ORIGIN}/eg/funds/${f.slug}?lang=ar`), f)); } catch { /* نتخطى صندوقًا واحدًا */ }
      await sleep(DELAY_MS);
    }
    if (items.length === 0) throw new Error('لم تُقرأ أي صفحة صندوق');
    save(key, { at: Date.now(), items });
    return resp('funds', items, note);
  } catch (e) {
    const why = e instanceof Error ? e.message : 'خطأ';
    return resp('funds', c?.items ?? [], `تعذر التحديث (${why}).${c ? ' المعروض آخر ما حُفظ على هاتفك.' : ''}`);
  }
}

const resp = (domain: string, items: Quote[], message: string): DomainResponse => ({ domain, configured: true, message, items });

export async function fetchDomainDirect(domain: Domain): Promise<DomainResponse> {
  if (domain === 'gold') return gold();
  if (domain === 'funds') return funds();
  return { domain, configured: false, message: 'لا يوجد مصدر مفعّل لهذا القسم في وضع التطبيق المباشر.', items: [] };
}

export function directSources(): SourcesResponse {
  const row = (domain: string, label: string, on: boolean, note: string) => ({ domain, label, env_var: '—', configured: on, adapter_implemented: on, note });
  return {
    sources: [
      row('market', 'مؤشرات البورصة المصرية', false, 'لا مصدر.'),
      row('stocks', 'الأسهم المصرية', false, 'لا مصدر.'),
      row('gold', 'أسعار الذهب (آي صاغة)', true, 'مباشر من الهاتف، بدون إذن كتابي منهم. أسعار تاجر متأخرة.'),
      row('fx', 'أسعار الصرف', false, 'لا مصدر.'),
      row('funds', 'الصناديق (SNDUK: الأهلي ومصر)', true, 'مباشر من الهاتف، بدون إذن كتابي منهم. بيانات دورية.'),
      row('bank-products', 'الشهادات والودائع', false, 'لا مصدر.'),
      row('economy', 'المؤشرات الاقتصادية', false, 'لا مصدر.'),
      row('news', 'الأخبار', false, 'لا مصدر.'),
    ],
  };
}
