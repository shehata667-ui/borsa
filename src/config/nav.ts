import { Home, Landmark, LineChart, Coins, Banknote, PieChart, PiggyBank, Percent, Globe2, Newspaper, Wallet, Bell, Calculator, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Domain } from '../types/data';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  domain?: Domain;
  desc?: string;
  primary?: boolean;
}

export const NAV: NavItem[] = [
  { path: '/', label: 'الرئيسية', icon: Home, primary: true },
  { path: '/egx', label: 'البورصة المصرية', icon: Landmark, domain: 'market', desc: 'مؤشرات EGX30 وEGX70 EWI وEGX100 EWI وEGX33 الشرعي.', primary: true },
  { path: '/stocks', label: 'الأسهم والمؤشرات', icon: LineChart, domain: 'stocks', desc: 'جدول الأسهم المصرية بحثًا وترتيبًا.' },
  { path: '/gold', label: 'الذهب', icon: Coins, domain: 'gold', desc: 'أسعار الذهب المحلية. السعر العالمي لا يمثل السعر المحلي.', primary: true },
  { path: '/fx', label: 'العملات', icon: Banknote, domain: 'fx', desc: 'سعر الدولار والعملات مقابل الجنيه من البنوك والمصادر الرسمية.', primary: true },
  { path: '/funds', label: 'صناديق الاستثمار', icon: PieChart, domain: 'funds', desc: 'قيم الوثائق تُنشر دوريًا وليست أسعارًا لحظية.' },
  { path: '/bank-products', label: 'الشهادات والودائع', icon: PiggyBank, domain: 'bank-products', desc: 'عوائد الشهادات والودائع مع تاريخ التحقق.' },
  { path: '/rates', label: 'الفائدة والبنك المركزي', icon: Percent, domain: 'economy', desc: 'آخر قرار رسمي لأسعار الفائدة وتاريخه.' },
  { path: '/economy', label: 'الاقتصاد المصري', icon: Globe2, domain: 'economy', desc: 'التضخم والاحتياطي وميزان المدفوعات. بيانات دورية.' },
  { path: '/news', label: 'الأخبار', icon: Newspaper, domain: 'news', desc: 'أخبار اقتصادية من مصادر تسمح بإعادة العرض.' },
  { path: '/portfolio', label: 'المحفظة', icon: Wallet },
  { path: '/alerts', label: 'المفضلة والتنبيهات', icon: Bell },
  { path: '/calculators', label: 'الحاسبات', icon: Calculator, primary: true },
  { path: '/settings', label: 'الإعدادات والمصادر', icon: Settings },
];
