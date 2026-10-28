import type { Quote } from '../../src/types/data';
import { ISAGHA_URL, parseIsagha } from '../../src/providers/isagha';

export { parseIsagha, pageTimeToIso } from '../../src/providers/isagha';

const TTL_MS = 5 * 60 * 1000;
let cache: { at: number; items: Quote[] } | null = null;

export async function fetchIsaghaGold(): Promise<Quote[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.items;
  const res = await fetch(ISAGHA_URL, {
    headers: { 'User-Agent': `MasrFinanceBot/0.1 (${process.env.SCRAPER_CONTACT ?? 'contact not set'})`, Accept: 'text/html' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const items = parseIsagha(await res.text());
  cache = { at: Date.now(), items };
  return items;
}
