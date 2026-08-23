import {
  CreditCard,
  FileText,
  Home,
  Receipt,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface AppNavigationItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const primaryNavigation: AppNavigationItem[] = [
  { id: 'home', label: 'Accueil', href: '/dashboard', icon: Home, exact: true },
  { id: 'quotes', label: 'Devis', href: '/dashboard/quotes', icon: FileText },
  { id: 'clients', label: 'Clients', href: '/dashboard/clients', icon: Users },
  { id: 'invoices', label: 'Factures', href: '/dashboard/invoices', icon: Receipt },
];

export const secondaryNavigation: AppNavigationItem[] = [
  { id: 'settings', label: 'Paramètres', href: '/settings/parametres', icon: Settings },
  { id: 'subscription', label: 'Abonnement', href: '/pricing', icon: CreditCard },
];

export function navigationItemIsActive(pathname: string, item: AppNavigationItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
