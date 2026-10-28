/**
 * سجل مصادر البيانات. لم يُنفَّذ أي adapter فعلي لأنه لم يتم التحقق من مزود مرخص
 * يدعم البورصة المصرية وأسعار الذهب المحلية. عند اختيار مزود:
 *  1) اقرأ ترخيصه وتأكد أنه يسمح بالعرض العام داخل التطبيق.
 *  2) نفّذ دالة fetch تُرجع Quote[] صالحة وفق src/types/data.ts.
 *  3) اجعل adapter_implemented = true.
 */
export interface SourceDef {
  domain: string;
  label: string;
  env_var: string;
  adapter_implemented: boolean;
  note: string;
}

export const SOURCES: SourceDef[] = [
  { domain: 'market', label: 'مؤشرات البورصة المصرية', env_var: 'EGX_DATA_API_KEY', adapter_implemented: false, note: 'يحتاج مزودًا مرخصًا يدعم EGX. لم يتم التحقق.' },
  { domain: 'stocks', label: 'الأسهم المصرية', env_var: 'EGX_DATA_API_KEY', adapter_implemented: false, note: 'يحتاج مزودًا مرخصًا يدعم EGX. لم يتم التحقق.' },
  { domain: 'gold', label: 'أسعار الذهب في مصر', env_var: 'GOLD_DATA_API_KEY', adapter_implemented: false, note: 'يحتاج مصدرًا للسعر المحلي. السعر العالمي لا يمثل السوق المصري.' },
  { domain: 'fx', label: 'أسعار الصرف', env_var: 'FX_DATA_API_KEY', adapter_implemented: false, note: 'يحتاج مصدرًا لأسعار البنوك المصرية أو السعر الرسمي.' },
  { domain: 'funds', label: 'صناديق الاستثمار', env_var: 'FUNDS_DATA_API_KEY', adapter_implemented: false, note: 'قيم الوثائق تُنشر دوريًا من مديري الصناديق.' },
  { domain: 'bank-products', label: 'الشهادات والودائع', env_var: 'BANK_PRODUCTS_DATA_API_KEY', adapter_implemented: false, note: 'يُجمع من صفحات البنوك الرسمية مع تاريخ تحقق.' },
  { domain: 'economy', label: 'المؤشرات الاقتصادية', env_var: 'ECONOMIC_DATA_API_KEY', adapter_implemented: false, note: 'البنك المركزي والجهاز المركزي للتعبئة والإحصاء. بيانات دورية.' },
  { domain: 'news', label: 'الأخبار الاقتصادية', env_var: 'NEWS_API_KEY', adapter_implemented: false, note: 'RSS أو API يسمح بإعادة العرض. عنوان وملخص وروابط فقط.' },
];
