import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Menu, Moon, Sun, X, PanelRightClose, PanelRightOpen, MoreHorizontal } from 'lucide-react';
import { NAV } from '../config/nav';
import { useLocalState } from '../hooks/useLocalState';
import { useDomain } from '../hooks/useDomain';

function ConnectionStatus() {
  const m = useDomain('market');
  const ok = m.isSuccess;
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-400" role="status">
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-up' : 'bg-down'}`} />
      {ok ? 'الخادم متصل' : m.isLoading ? 'جارٍ الاتصال' : 'الخادم غير متاح'}
      {m.dataUpdatedAt > 0 && <span>· آخر استجابة {new Date(m.dataUpdatedAt).toLocaleTimeString('ar-EG')}</span>}
    </span>
  );
}

export default function AppShell() {
  const [theme, setTheme] = useLocalState<'dark' | 'light'>('masr.theme', 'dark');
  const [collapsed, setCollapsed] = useLocalState('masr.sidebar', false);
  const [more, setMore] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-emerald-600/20 text-emerald-400' : 'hover:bg-slate-200/60 dark:hover:bg-ink-700'}`;

  return (
    <div className="flex min-h-screen">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-e border-slate-200 p-3 dark:border-ink-600 dark:bg-ink-950 md:flex ${collapsed ? 'w-16' : 'w-60'}`}>
        <div className="mb-4 flex items-center justify-between">
          {!collapsed && <span className="font-bold text-emerald-400">مصر فاينانس</span>}
          <button onClick={() => setCollapsed(!collapsed)} aria-label="طي القائمة الجانبية">
            {collapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink key={n.path} to={n.path} end={n.path === '/'} className={link} title={n.label}>
              <n.icon size={18} className="shrink-0" />
              {!collapsed && <span>{n.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-ink-600 dark:bg-ink-900/90">
          <span className="font-bold md:hidden">مصر فاينانس</span>
          <ConnectionStatus />
          <div className="ms-auto flex items-center gap-2">
            <NavLink to="/alerts" className="btn-ghost">المفضلة والتنبيهات</NavLink>
            <button className="btn-ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="تبديل الوضع">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-ink-600 dark:bg-ink-950 md:hidden">
        {NAV.filter((n) => n.primary).map((n) => (
          <NavLink key={n.path} to={n.path} end={n.path === '/'} className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
            <n.icon size={20} />
            {n.label}
          </NavLink>
        ))}
        <button onClick={() => setMore(true)} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-slate-400">
          <MoreHorizontal size={20} />
          المزيد
        </button>
      </nav>

      {more && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setMore(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-ink-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold"><Menu size={18} /> كل الأقسام</span>
              <button onClick={() => setMore(false)} aria-label="إغلاق"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NAV.map((n) => (
                <NavLink key={n.path} to={n.path} end={n.path === '/'} onClick={() => setMore(false)} className={link}>
                  <n.icon size={18} />
                  {n.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
