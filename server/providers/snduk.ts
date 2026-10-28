import type { Quote } from '../../src/types/data';
import { ORIGIN, isTargetFund, parseFundList, parseFundPage } from '../../src/providers/snduk';
import type { FundMeta } from '../../src/providers/snduk';

export { isTargetFund, parseFundList, parseFundPage } from '../../src/providers/snduk';
export type { FundMeta };

const REFRESH_MS = 6 * 60 * 60 * 1000;
const DELAY_MS = 800;

// ---- الجلب المتدرج والتخزين المؤقت ----
const cache = new Map<string, Quote>();
let total = 0;
let running = false;
let lastStart = 0;
let backoffUntil = 0;

const UA = () => `MasrFinanceBot/0.1 (${process.env.SCRAPER_CONTACT ?? 'contact not set'})`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA(), Accept: 'text/html' }, signal: AbortSignal.timeout(15_000) });
  if (res.status === 429 || res.status === 403) {
    backoffUntil = Date.now() + 60 * 60 * 1000; // توقف ساعة عند الرفض
    throw new Error(`HTTP ${res.status}: تم إيقاف الجلب ساعة`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function refreshAll(): Promise<void> {
  running = true;
  lastStart = Date.now();
  try {
    const list = parseFundList(await get(`${ORIGIN}/eg/funds?lang=ar`)).filter(isTargetFund);
    if (list.length === 0) throw new Error('لم تُستخرج صناديق الأهلي ومصر: تغيّر شكل صفحة القائمة أو الأسماء');
    for (const k of cache.keys()) if (!list.some((f) => f.slug === k)) cache.delete(k);
    total = list.length;
    for (const f of list) {
      if (Date.now() < backoffUntil) break;
      try {
        cache.set(f.slug, parseFundPage(await get(`${ORIGIN}/eg/funds/${f.slug}?lang=ar`), f));
      } catch (e) {
        console.warn(`snduk ${f.slug}:`, e instanceof Error ? e.message : e);
      }
      await sleep(DELAY_MS);
    }
  } catch (e) {
    console.warn('snduk refresh failed:', e instanceof Error ? e.message : e);
  } finally {
    running = false;
  }
}

export function getSndukFunds(): { items: Quote[]; loaded: number; total: number; running: boolean } {
  if (!running && Date.now() >= backoffUntil && Date.now() - lastStart > REFRESH_MS) void refreshAll();
  return { items: [...cache.values()], loaded: cache.size, total, running };
}
