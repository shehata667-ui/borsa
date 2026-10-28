import { useSources } from '../hooks/useDomain';
import { ErrorNotice, Skeleton } from '../components/Notices';

export default function Settings() {
  const { data, isLoading, isError } = useSources();
  return (
    <section>
      <h1 className="text-xl font-bold">الإعدادات ومصادر البيانات</h1>
      <p className="mb-4 mt-1 text-sm text-slate-400">حالة كل مصدر على الخادم. المفاتيح تُضبط في متغيرات بيئة الخادم فقط.</p>
      {isLoading && <Skeleton />}
      {isError && <ErrorNotice text="تعذر الاتصال بالخادم." />}
      {data && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-slate-400"><tr><th className="p-2 text-start">المصدر</th><th className="p-2 text-start">المفتاح</th><th className="p-2 text-start">المفتاح مضبوط</th><th className="p-2 text-start">Adapter</th><th className="p-2 text-start">ملاحظة</th></tr></thead>
            <tbody>
              {data.sources.map((s) => (
                <tr key={s.domain} className="border-t border-slate-200 dark:border-ink-600">
                  <td className="p-2">{s.label}</td>
                  <td className="p-2" dir="ltr">{s.env_var}</td>
                  <td className="p-2">{s.configured ? 'نعم' : 'لا'}</td>
                  <td className="p-2">{s.adapter_implemented ? 'منفذ' : 'غير منفذ'}</td>
                  <td className="p-2 text-xs text-slate-400">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="card mt-4 text-sm">
        <h2 className="font-semibold">الخصوصية</h2>
        <p className="mt-1 text-slate-400">المحفظة والمفضلة والتنبيهات تُحفظ في متصفحك فقط (localStorage) ولا تُرسل لأي خادم. لا يوجد تسجيل دخول ولا ربط بحسابات بنكية أو وساطة. لا يوجد تشفير للبيانات المحلية.</p>
      </div>
    </section>
  );
}
