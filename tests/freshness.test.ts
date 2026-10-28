import { describe, expect, it } from 'vitest';
import { resolveMode } from '../src/utils/freshness';
import type { Quote } from '../src/types/data';

const base: Quote = {
  instrument_id: 'x', instrument_name: 'x', instrument_type: 'index', value: 1,
  source_name: 's', source_timestamp: '2026-01-01T10:00:00Z', data_mode: 'LIVE',
};
const t = (s: number) => Date.parse('2026-01-01T10:00:00Z') + s * 1000;

describe('resolveMode', () => {
  it('يبقي LIVE إذا كانت البيانات حديثة', () => {
    expect(resolveMode(base, t(10)).mode).toBe('LIVE');
  });
  it('يسقط LIVE إلى STALE عند التقادم', () => {
    expect(resolveMode(base, t(600)).mode).toBe('STALE');
  });
  it('لا يعتبر التاريخ غير الصالح حديثًا', () => {
    expect(resolveMode({ ...base, source_timestamp: 'bad' }).mode).toBe('STALE');
  });
  it('يحافظ على DEMO و OFFLINE', () => {
    expect(resolveMode({ ...base, data_mode: 'DEMO' }).mode).toBe('DEMO');
    expect(resolveMode({ ...base, data_mode: 'OFFLINE' }).mode).toBe('OFFLINE');
  });
  it('إغلاق اليوم لا يتحول لحظيًا', () => {
    expect(resolveMode({ ...base, data_mode: 'END_OF_DAY' }, t(10)).mode).toBe('END_OF_DAY');
  });
});
