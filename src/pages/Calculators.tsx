import { useState } from 'react';
import { certificate, compound, fxConvert, goldValue, realReturnPct } from '../features/calculators/math';
import { fmtNum } from '../utils/format';
import { Disclaimer } from '../components/Notices';

function Num({ label, value, onChange, step = 'any' }: { label: string; value: string; onChange: (v: string) => void; step?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-400">{label}</span>
      <input className="input num" type="number" inputMode="decimal" step={step} min="0" value={value} onChange={(e) => onChange(e.target.value)} dir="ltr" />
    </label>
  );
}

function Result({ rows, error }: { rows: [string, string][]; error?: string }) {
  if (error) return <p className="mt-3 text-sm text-down" role="alert">{error}</p>;
  return (
    <dl className="mt-3 space-y-1 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between border-b border-slate-200 py-1 dark:border-ink-600"><dt className="text-slate-400">{k}</dt><dd className="num font-semibold">{v}</dd></div>
      ))}
    </dl>
  );
}

const n = (s: string) => (s.trim() === '' ? NaN : Number(s));
function safe<T>(fn: () => T): { ok: true; v: T } | { ok: false; e: string } {
  try { return { ok: true, v: fn() }; } catch (e) { return { ok: false, e: e instanceof Error ? e.message : 'خطأ' }; }
}
const need = (...vals: number[]) => { if (vals.some(Number.isNaN)) throw new Error('أكمل المدخلات'); };

function GoldCalc() {
  const [s, set] = useState({ karat: '21', w: '', price: '', pk: '21', making: '0', fees: '0' });
  const r = safe(() => { const v = { karat: n(s.karat), w: n(s.w), price: n(s.price), pk: n(s.pk), making: n(s.making), fees: n(s.fees) }; need(...Object.values(v)); return goldValue({ karat: v.karat, weightGrams: v.w, pricePerGram: v.price, priceKarat: v.pk, makingPerGram: v.making, feesPct: v.fees }); });
  const u = (k: keyof typeof s) => (v: string) => set({ ...s, [k]: v });
  return (
    <div className="card">
      <h2 className="mb-3 font-semibold">حاسبة الذهب</h2>
      <div className="grid grid-cols-2 gap-3">
        <Num label="العيار" value={s.karat} onChange={u('karat')} />
        <Num label="الوزن (جرام)" value={s.w} onChange={u('w')} />
        <Num label="سعر الجرام (ج.م)" value={s.price} onChange={u('price')} />
        <Num label="عيار السعر المُدخل" value={s.pk} onChange={u('pk')} />
        <Num label="المصنعية لكل جرام (ج.م)" value={s.making} onChange={u('making')} />
        <Num label="الرسوم/الضرائب (٪)" value={s.fees} onChange={u('fees')} />
      </div>
      <p className="mt-2 text-xs text-slate-400">المصنعية والرسوم تبدأ بصفر فقط كقيمة ابتدائية؛ غيّرها إن كانت تنطبق.</p>
      {r.ok ? <Result rows={[['قيمة الذهب', fmtNum(r.v.metalValue)], ['المصنعية', fmtNum(r.v.making)], ['الرسوم', fmtNum(r.v.fees)], ['الإجمالي التقديري', fmtNum(r.v.total)]]} /> : <Result rows={[]} error={r.e} />}
    </div>
  );
}

function FxCalc() {
  const [s, set] = useState({ amount: '', rate: '', dir: 'multiply' as 'multiply' | 'divide', src: '' });
  const r = safe(() => { const a = n(s.amount), rt = n(s.rate); need(a, rt); return fxConvert(a, rt, s.dir); });
  return (
    <div className="card">
      <h2 className="mb-3 font-semibold">حاسبة العملات</h2>
      <div className="grid grid-cols-2 gap-3">
        <Num label="المبلغ" value={s.amount} onChange={(v) => set({ ...s, amount: v })} />
        <Num label="سعر الصرف" value={s.rate} onChange={(v) => set({ ...s, rate: v })} />
        <label className="block text-sm"><span className="mb-1 block text-slate-400">الاتجاه</span>
          <select className="input" value={s.dir} onChange={(e) => set({ ...s, dir: e.target.value as 'multiply' | 'divide' })}>
            <option value="multiply">عملة أجنبية ← جنيه</option><option value="divide">جنيه ← عملة أجنبية</option>
          </select></label>
        <label className="block text-sm"><span className="mb-1 block text-slate-400">مصدر السعر (اختياري)</span>
          <input className="input" value={s.src} onChange={(e) => set({ ...s, src: e.target.value })} /></label>
      </div>
      {r.ok ? <Result rows={[['الناتج', fmtNum(r.v)], ...(s.src ? [['مصدر السعر', s.src] as [string, string]] : [])]} /> : <Result rows={[]} error={r.e} />}
      <p className="mt-2 text-xs text-slate-400">أدخل السعر بنفسك من مصدر تثق به؛ لا يوجد سعر مُفترض.</p>
    </div>
  );
}

function CertCalc() {
  const [s, set] = useState({ amount: '', rate: '', years: '', per: '12', reinvest: false, infl: '' });
  const r = safe(() => { const v = { a: n(s.amount), r: n(s.rate), y: n(s.years), p: n(s.per) }; need(...Object.values(v)); return certificate({ amount: v.a, annualRatePct: v.r, years: v.y, payoutsPerYear: v.p, reinvest: s.reinvest }); });
  const infl = n(s.infl);
  return (
    <div className="card">
      <h2 className="mb-3 font-semibold">حاسبة الشهادات والمقارنة بالتضخم</h2>
      <div className="grid grid-cols-2 gap-3">
        <Num label="المبلغ (ج.م)" value={s.amount} onChange={(v) => set({ ...s, amount: v })} />
        <Num label="العائد السنوي الاسمي (٪)" value={s.rate} onChange={(v) => set({ ...s, rate: v })} />
        <Num label="المدة (سنوات)" value={s.years} onChange={(v) => set({ ...s, years: v })} />
        <label className="block text-sm"><span className="mb-1 block text-slate-400">دورية الصرف</span>
          <select className="input" value={s.per} onChange={(e) => set({ ...s, per: e.target.value })}>
            <option value="12">شهري</option><option value="4">ربع سنوي</option><option value="2">نصف سنوي</option><option value="1">سنوي</option>
          </select></label>
        <Num label="التضخم السنوي (٪) اختياري" value={s.infl} onChange={(v) => set({ ...s, infl: v })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.reinvest} onChange={(e) => set({ ...s, reinvest: e.target.checked })} /> إعادة استثمار العائد</label>
      </div>
      {r.ok ? (
        <Result rows={[
          ['العائد لكل دورية', fmtNum(r.v.payoutPerPeriod)], ['إجمالي العائد', fmtNum(r.v.totalInterest)], ['القيمة النهائية', fmtNum(r.v.finalValue)], ['العائد السنوي الفعلي', `${fmtNum(r.v.effectiveAnnualPct)}٪`],
          ...(!Number.isNaN(infl) ? [['العائد الحقيقي بعد التضخم', `${fmtNum(realReturnPct(r.v.effectiveAnnualPct, infl))}٪`] as [string, string]] : []),
        ]} />
      ) : <Result rows={[]} error={r.e} />}
      <p className="mt-2 text-xs text-slate-400">بافتراض الاحتفاظ حتى الاستحقاق دون كسر مبكر وبدون ضرائب أو رسوم.</p>
    </div>
  );
}

function CompoundCalc() {
  const [s, set] = useState({ p: '', r: '', y: '', c: '0' });
  const r = safe(() => { const v = { p: n(s.p), r: n(s.r), y: n(s.y), c: n(s.c) }; need(...Object.values(v)); return compound({ principal: v.p, annualRatePct: v.r, years: v.y, monthlyContribution: v.c }); });
  return (
    <div className="card">
      <h2 className="mb-3 font-semibold">حاسبة العائد المركب</h2>
      <div className="grid grid-cols-2 gap-3">
        <Num label="المبلغ الأساسي" value={s.p} onChange={(v) => set({ ...s, p: v })} />
        <Num label="العائد السنوي الاسمي (٪)" value={s.r} onChange={(v) => set({ ...s, r: v })} />
        <Num label="المدة (سنوات)" value={s.y} onChange={(v) => set({ ...s, y: v })} />
        <Num label="مساهمة شهرية" value={s.c} onChange={(v) => set({ ...s, c: v })} />
      </div>
      {r.ok ? <Result rows={[['الرصيد النهائي', fmtNum(r.v.finalBalance)], ['إجمالي المدفوع', fmtNum(r.v.totalContributed)], ['إجمالي العائد', fmtNum(r.v.totalGain)]]} /> : <Result rows={[]} error={r.e} />}
      <p className="mt-2 text-xs text-slate-400">تركيب شهري، والمساهمة تُضاف آخر كل شهر. النتيجة افتراضية وليست ضمانًا.</p>
    </div>
  );
}

export default function Calculators() {
  return (
    <section>
      <h1 className="mb-4 text-xl font-bold">الحاسبات المالية</h1>
      <div className="grid gap-4 lg:grid-cols-2"><GoldCalc /><FxCalc /><CertCalc /><CompoundCalc /></div>
      <Disclaimer />
    </section>
  );
}
