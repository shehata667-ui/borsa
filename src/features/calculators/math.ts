export interface GoldInput {
  karat: number;
  weightGrams: number;
  /** سعر الجرام المُدخل */
  pricePerGram: number;
  /** العيار الذي يخصه السعر المُدخل (مثلًا 21) */
  priceKarat: number;
  makingPerGram?: number;
  feesPct?: number;
}
export interface GoldResult {
  metalValue: number;
  making: number;
  fees: number;
  total: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function goldValue(i: GoldInput): GoldResult {
  if (i.karat <= 0 || i.karat > 24 || i.priceKarat <= 0 || i.priceKarat > 24) throw new Error('عيار غير صحيح');
  if (i.weightGrams < 0 || i.pricePerGram < 0) throw new Error('قيمة سالبة');
  const pricePerGramForKarat = (i.pricePerGram * i.karat) / i.priceKarat;
  const metalValue = pricePerGramForKarat * i.weightGrams;
  const making = (i.makingPerGram ?? 0) * i.weightGrams;
  const fees = ((metalValue + making) * (i.feesPct ?? 0)) / 100;
  return { metalValue: round2(metalValue), making: round2(making), fees: round2(fees), total: round2(metalValue + making + fees) };
}

export function fxConvert(amount: number, rate: number, direction: 'multiply' | 'divide' = 'multiply'): number {
  if (rate <= 0) throw new Error('سعر الصرف يجب أن يكون موجبًا');
  return round2(direction === 'multiply' ? amount * rate : amount / rate);
}

export interface CompoundInput {
  principal: number;
  annualRatePct: number;
  years: number;
  monthlyContribution?: number;
  /** عدد مرات إضافة العائد سنويًا (12 = شهري) */
  compoundsPerYear?: number;
}
export interface CompoundResult {
  finalBalance: number;
  totalContributed: number;
  totalGain: number;
}

/** عائد مركب: يُضاف العائد كل (12/n) شهرًا، وتُضاف المساهمة في نهاية كل شهر. المعدل اسمي سنوي. */
export function compound(i: CompoundInput): CompoundResult {
  if (i.principal < 0 || i.years < 0) throw new Error('قيمة سالبة');
  const months = Math.round(i.years * 12);
  const n = i.compoundsPerYear ?? 12;
  const step = 12 / n;
  const periodRate = i.annualRatePct / 100 / n;
  const contrib = i.monthlyContribution ?? 0;
  let balance = i.principal;
  for (let m = 1; m <= months; m++) {
    if (m % step === 0) balance *= 1 + periodRate;
    balance += contrib;
  }
  const totalContributed = i.principal + contrib * months;
  return { finalBalance: round2(balance), totalContributed: round2(totalContributed), totalGain: round2(balance - totalContributed) };
}

export interface CertificateInput {
  amount: number;
  annualRatePct: number;
  years: number;
  /** عدد مرات صرف العائد سنويًا: 12 شهري، 4 ربع سنوي، 2 نصف سنوي، 1 سنوي */
  payoutsPerYear: number;
  /** هل يُعاد استثمار العائد (تراكمي) أم يُصرف */
  reinvest?: boolean;
}
export interface CertificateResult {
  payoutPerPeriod: number;
  totalInterest: number;
  finalValue: number;
  effectiveAnnualPct: number;
}

/** العائد وفق الشروط المعلنة فقط، بافتراض الاحتفاظ بالشهادة حتى الاستحقاق دون كسر مبكر. */
export function certificate(i: CertificateInput): CertificateResult {
  if (i.amount < 0 || i.years < 0 || i.payoutsPerYear <= 0) throw new Error('مدخلات غير صحيحة');
  const r = i.annualRatePct / 100;
  const periods = Math.round(i.years * i.payoutsPerYear);
  const perPeriod = (i.amount * r) / i.payoutsPerYear;
  const effective = (Math.pow(1 + r / i.payoutsPerYear, i.payoutsPerYear) - 1) * 100;
  if (i.reinvest) {
    const fv = i.amount * Math.pow(1 + r / i.payoutsPerYear, periods);
    return { payoutPerPeriod: round2(perPeriod), totalInterest: round2(fv - i.amount), finalValue: round2(fv), effectiveAnnualPct: round2(effective) };
  }
  const total = perPeriod * periods;
  return { payoutPerPeriod: round2(perPeriod), totalInterest: round2(total), finalValue: round2(i.amount + total), effectiveAnnualPct: round2(r * 100) };
}

/** العائد الحقيقي بعد التضخم: (1+اسمي)/(1+تضخم)-1 */
export function realReturnPct(nominalPct: number, inflationPct: number): number {
  return round2(((1 + nominalPct / 100) / (1 + inflationPct / 100) - 1) * 100);
}
