import { describe, expect, it } from 'vitest';
import { isTargetFund, parseFundList, parseFundPage } from '../server/providers/snduk';

const page = `<h1>صندوق استثمار اسكان للتأمين النقدي ( كل يوم )</h1><div>العربي الإفريقي لإدارة الاستثمارات</div>
<span>‏١٩.٥٤٢٣ ج.م.‏</span><span>+0.0497%</span><span>سعر الوثيقة - اخر تحديث: ٥‏/٨‏/٢٠٢٦، ١٢:٠٠ ص</span>
<p>العائد خلال أسبوع: +0.3703%. العائد خلال شهر: +1.5063%. العائد خلال 3 أشهر: +4.6178%. العائد خلال 6 أشهر: +9.5298%. العائد خلال سنة: +23.0221%. العائد خلال منذ البداية: +95.0018%.</p>
<div>معلومات الشراء التكرار يومي رسوم الاشتراك والبيع بدون رسوم معلومات الاسترداد التكرار يومي رسوم الاشتراك والبيع بدون رسوم</div>
<div>كود الصندوق AIM مدير الأصول العربي الإفريقي لإدارة الاستثمارات مدير الصندوق أحمد رشاد تاريخ الإنشاء ٢٩‏/٤‏/٢٠٢٣ الحد الأدنى للاستثمار 10 وثائق العملة EGP</div>
<a href="https://x.com/a/b.PDF">نشرة</a>`;
const meta = { slug: 'iskan-money-market-fund', name: 'صندوق إسكان', category: 'money_market' };

describe('parseFundPage', () => {
  const q = parseFundPage(page, meta, new Date('2026-10-28T12:00:00Z'));
  it('يستخرج السعر والتاريخ (يوم/شهر/سنة)', () => {
    expect(q.value).toBe(19.5423);
    expect(q.source_timestamp.startsWith('2026-08-04T2') || q.source_timestamp.startsWith('2026-08-05')).toBe(true);
  });
  it('يعلّم صندوقًا يوميًا متأخرًا 84 يومًا بأنه قديم', () => {
    expect(q.data_mode).toBe('STALE');
  });
  it('يستخرج العوائد والحد الأدنى', () => {
    expect(q.fund?.returns?.year).toBe(23.0221);
    expect(q.fund?.returns?.since_inception).toBe(95.0018);
    expect(q.fund?.min_subscription).toBe('10 وثائق');
  });
  it('يفشل بوضوح إذا تغيّر الشكل', () => {
    expect(() => parseFundPage('<p>x</p>', meta)).toThrow();
  });
});

describe('parseFundList', () => {
  it('يستخرج الاسم والتصنيف ويتجاهل صفحة المقارنة', () => {
    const html = `<a href="/eg/funds/compare?lang=ar">مقارنة</a>
      <li><a href="/eg/funds/a-fund?lang=ar">صندوق أ</a> <span>equity</span></li>
      <li><a href="/eg/funds/b-fund?lang=ar">صندوق ب</a> <span>money_market</span></li>`;
    const l = parseFundList(html);
    expect(l.map((x) => x.slug)).toEqual(['a-fund', 'b-fund']);
    expect(l[1].category).toBe('money_market');
  });
});

describe('isTargetFund', () => {
  const f = (slug: string, name: string) => ({ slug, name });
  it('يقبل صناديق البنك الأهلي وبنك مصر', () => {
    expect(isTargetFund(f('nbe-fund-5', 'صندوق استثمار البنك الأهلي المصري الخامس'))).toBe(true);
    expect(isTargetFund(f('national-bank-balanced-fund', 'صندوق استثمار البنك الأهلى الأول المتوازن'))).toBe(true);
    expect(isTargetFund(f('nbe-alhly-hayah-balanced-fund', 'صندوق الأهلي حياة المتوازن'))).toBe(true);
    expect(isTargetFund(f('banque-misr-second-fund', 'صندوق استثمار بنك مصر الثاني'))).toBe(true);
  });
  it('يرفض غيرها', () => {
    expect(isTargetFund(f('snb-global-equity-fund', 'صندوق الأهلي للأسهم العالمية'))).toBe(false);
    expect(isTargetFund(f('misr-equity-fund', 'صندوق مصر إكويتي - سى آي استس مانجمنت للأسهم'))).toBe(false);
    expect(isTargetFund(f('al-barakat-fund', 'صندوق البركات - بنك البركة مصر'))).toBe(false);
  });
});
