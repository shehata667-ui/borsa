import { AlertTriangle, DatabaseZap } from 'lucide-react';

export function Disclaimer() {
  return (
    <p className="mt-6 text-xs text-slate-400">
      المعلومات المعروضة للتوعية والمقارنة فقط، وليست توصية استثمارية أو ضمانًا لأي عائد.
    </p>
  );
}

export function SourceNotice({ message, envVar }: { message?: string; envVar?: string }) {
  return (
    <div className="card flex items-start gap-3 border-dashed" role="status">
      <DatabaseZap className="mt-0.5 shrink-0 text-amber-400" size={20} />
      <div className="text-sm">
        <p className="font-semibold">لا توجد بيانات لعرضها</p>
        <p className="text-slate-400">{message ?? 'المصدر غير مهيأ.'}</p>
        {envVar && (
          <p className="mt-1 text-xs text-slate-400">
            متغير البيئة المطلوب على الخادم: <code dir="ltr">{envVar}</code>
          </p>
        )}
      </div>
    </div>
  );
}

export function ErrorNotice({ text }: { text: string }) {
  return (
    <div className="card flex items-start gap-3 border-down/50" role="alert">
      <AlertTriangle className="mt-0.5 shrink-0 text-down" size={20} />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function Skeleton() {
  return <div className="card h-28 animate-pulse bg-slate-200/60 dark:bg-ink-700" aria-hidden />;
}
