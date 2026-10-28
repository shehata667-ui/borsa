import { describe, expect, it } from 'vitest';
import { certificate, compound, fxConvert, goldValue, realReturnPct } from '../src/features/calculators/math';

describe('goldValue', () => {
  it('يحول سعر عيار 21 إلى عيار 24', () => {
    const r = goldValue({ karat: 24, weightGrams: 1, pricePerGram: 3000, priceKarat: 21 });
    expect(r.total).toBeCloseTo(3428.57, 2);
  });
  it('يضيف المصنعية والرسوم صراحة', () => {
    const r = goldValue({ karat: 21, weightGrams: 10, pricePerGram: 1000, priceKarat: 21, makingPerGram: 100, feesPct: 10 });
    expect(r.metalValue).toBe(10000);
    expect(r.making).toBe(1000);
    expect(r.fees).toBe(1100);
    expect(r.total).toBe(12100);
  });
  it('يرفض عيارًا غير صحيح', () => {
    expect(() => goldValue({ karat: 30, weightGrams: 1, pricePerGram: 1, priceKarat: 21 })).toThrow();
  });
});

describe('fxConvert', () => {
  it('يضرب ويقسم', () => {
    expect(fxConvert(100, 48.5)).toBe(4850);
    expect(fxConvert(4850, 48.5, 'divide')).toBe(100);
  });
  it('يتعامل مع الأعشار', () => {
    expect(fxConvert(0.1, 3)).toBe(0.3);
  });
  it('يرفض سعرًا غير موجب', () => {
    expect(() => fxConvert(1, 0)).toThrow();
  });
});

describe('compound', () => {
  it('بدون عائد يبقى المبلغ كما هو', () => {
    expect(compound({ principal: 1000, annualRatePct: 0, years: 5 }).finalBalance).toBe(1000);
  });
  it('12% شهريًا لسنة', () => {
    expect(compound({ principal: 1000, annualRatePct: 12, years: 1 }).finalBalance).toBeCloseTo(1126.83, 2);
  });
  it('المساهمات تُحسب في إجمالي المدفوع', () => {
    const r = compound({ principal: 0, annualRatePct: 0, years: 1, monthlyContribution: 100 });
    expect(r.totalContributed).toBe(1200);
    expect(r.totalGain).toBe(0);
  });
});

describe('certificate', () => {
  it('عائد بسيط يصرف دوريًا', () => {
    const r = certificate({ amount: 100000, annualRatePct: 20, years: 3, payoutsPerYear: 12 });
    expect(r.payoutPerPeriod).toBeCloseTo(1666.67, 2);
    expect(r.totalInterest).toBe(60000);
    expect(r.finalValue).toBe(160000);
  });
  it('إعادة الاستثمار تعطي عائدًا أكبر', () => {
    const a = certificate({ amount: 1000, annualRatePct: 20, years: 3, payoutsPerYear: 12 });
    const b = certificate({ amount: 1000, annualRatePct: 20, years: 3, payoutsPerYear: 12, reinvest: true });
    expect(b.finalValue).toBeGreaterThan(a.finalValue);
    expect(b.effectiveAnnualPct).toBeCloseTo(21.94, 2);
  });
});

describe('realReturnPct', () => {
  it('يحسب العائد الحقيقي', () => {
    expect(realReturnPct(25, 15)).toBeCloseTo(8.7, 2);
  });
});
