import { describe, expect, it } from 'vitest';
import { pageTimeToIso, parseIsagha } from '../server/providers/isagha';

const html = `<h2>سعر جرام الذهب والفضة اليوم</h2><span>أسعار الساعة 4:51 م</span>
<table><tr><td>عيار 24</td><td>7194.25</td><td>7251.5</td><td>+0.2%</td></tr>
<tr><td>عيار 21</td><td>6295</td><td>6345</td><td>+0.2%</td></tr>
<tr><td>عيار 18</td><td>5395.75</td><td>5438.5</td><td>+0.2%</td></tr>
<tr><td>جنيه ذهب</td><td>50360</td><td>50760</td><td>+0.2%</td></tr>
<tr><td>عيار 999</td><td>98</td><td>101</td><td>+1.3%</td></tr></table>`;
const now = new Date('2026-10-28T14:00:00Z');

describe('parseIsagha', () => {
  const q = parseIsagha(html, now);
  it('يستخرج بيع وشراء كل عيار والجنيه', () => {
    expect(q.find((x) => x.instrument_id === 'GOLD_21')?.value).toBe(6345);
    expect(q.find((x) => x.instrument_id === 'GOLD_21_BUY')?.value).toBe(6295);
    expect(q.find((x) => x.instrument_id === 'GOLD_POUND')?.value).toBe(50760);
  });
  it('لا يخلط الفضة بالذهب', () => {
    expect(q.some((x) => x.value === 101)).toBe(false);
  });
  it('يعلّم البيانات DELAYED لا LIVE', () => {
    expect(q.every((x) => x.data_mode === 'DELAYED')).toBe(true);
  });
  it('يفشل بوضوح إذا تغيّر الشكل', () => {
    expect(() => parseIsagha('<p>x</p>', now)).toThrow();
  });
});

describe('pageTimeToIso', () => {
  it('لا يعطي وقتًا مستقبليًا', () => {
    expect(Date.parse(pageTimeToIso(11, 59, 'م', now))).toBeLessThanOrEqual(now.getTime() + 60_000);
  });
});
