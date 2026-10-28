import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import { NAV } from '../config/nav';
import { Skeleton } from '../components/Notices';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const DomainPage = lazy(() => import('../pages/DomainPage'));
const Calculators = lazy(() => import('../pages/Calculators'));
const Portfolio = lazy(() => import('../pages/Portfolio'));
const Alerts = lazy(() => import('../pages/Alerts'));
const Settings = lazy(() => import('../pages/Settings'));

export default function App() {
  return (
    <Suspense fallback={<div className="p-4"><Skeleton /></div>}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          {NAV.filter((n) => n.domain).map((n) => (
            <Route key={n.path} path={n.path} element={<DomainPage item={n} />} />
          ))}
          <Route path="/calculators" element={<Calculators />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<p className="p-4">الصفحة غير موجودة.</p>} />
        </Route>
      </Routes>
    </Suspense>
  );
}
