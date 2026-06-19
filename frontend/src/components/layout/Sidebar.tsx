'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  Briefcase,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { BrandMark } from '@/components/ui/BrandMark';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
];

const accountItems = [
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/resume', icon: FileText, label: 'Resume' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

function initials(name?: string, email?: string) {
  const source = name || email || '?';
  return source.charAt(0).toUpperCase();
}

function TopNavLink({ href, icon: Icon, label, onClick }: {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors',
        active
          ? 'bg-blue-50 text-brand-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function AccountMenu() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      toast.success('Logged out');
      router.push('/login');
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(value => !value)}
        className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-left shadow-sm transition-colors hover:bg-slate-50"
        aria-label="Open account menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {initials(user?.name, user?.email)}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[130px] truncate text-xs font-semibold text-slate-900">{user?.name || 'Account'}</span>
          <span className="block max-w-[130px] truncate text-[10px] text-slate-500">{user?.email}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-bold text-slate-950">{user?.name || 'OrbitHire User'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <div className="p-2">
            {accountItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
              >
                <Icon className="h-4 w-4 text-slate-500" />
                {label}
              </Link>
            ))}
          </div>
          <div className="border-t border-slate-100 p-2">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <BrandMark className="h-9 w-9 rounded-lg" />
          <span className="font-display text-lg font-extrabold tracking-tight text-slate-950">OrbitHire</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {navItems.map(item => <TopNavLink key={item.href} {...item} />)}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 sm:flex"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <AccountMenu />
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            aria-label="Close navigation backdrop"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-full max-w-[320px] animate-slide-left flex-col border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
              <div className="flex items-center gap-2.5">
                <BrandMark className="h-9 w-9 rounded-lg" />
                <span className="font-display text-lg font-extrabold text-slate-950">OrbitHire</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1.5 bg-white p-4">
              <p className="px-2 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Main</p>
              {navItems.map(item => (
                <TopNavLink key={item.href} {...item} onClick={() => setMobileOpen(false)} />
              ))}
              <div className="my-3 border-t border-slate-200" />
              <p className="px-2 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Account</p>
              {accountItems.map(item => (
                <TopNavLink key={item.href} {...item} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
