'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Briefcase, FileText, User,
  BarChart3, LogOut, Zap, Menu, X, ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/* ─── nav items ─────────────────────────────────────────────────────────── */
const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',       accent: '#6366f1' },
  { href: '/jobs',      icon: Briefcase,       label: 'Jobs',            accent: '#10b981' },
  { href: '/profile',   icon: User,            label: 'Resume & Profile', accent: '#f59e0b' },
  { href: '/reports',   icon: BarChart3,       label: 'Reports',          accent: '#38bdf8' },
];

/* ─── magnetic nav item ─────────────────────────────────────────────────── */
function NavItem({
  href, icon: Icon, label, accent, active, onClick,
}: {
  href: string; icon: any; label: string; accent: string;
  active: boolean; onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const ref = useRef<HTMLAnchorElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    // ripple origin
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
      setTimeout(() => setRipple(null), 600);
    }
    onClick?.();
  };

  return (
    <Link
      ref={ref}
      href={href}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
        'transition-all duration-300 overflow-hidden select-none',
        'group',
        active
          ? 'text-white'
          : 'text-ink-muted hover:text-ink-primary',
      )}
    >
      {/* active background fill */}
      <div
        className="absolute inset-0 rounded-xl transition-all duration-300"
        style={{
          background: active
            ? `linear-gradient(135deg, ${accent}22 0%, ${accent}10 100%)`
            : hovered
            ? 'rgba(255,255,255,0.04)'
            : 'transparent',
          border: active ? `1px solid ${accent}35` : '1px solid transparent',
        }}
      />

      {/* active left glow bar */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all duration-500"
        style={{
          width: active ? 3 : 0,
          height: active ? '60%' : '0%',
          background: accent,
          boxShadow: active ? `0 0 8px ${accent}` : 'none',
        }}
      />

      {/* ripple */}
      {ripple && (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ping"
          style={{
            left: ripple.x - 16,
            top: ripple.y - 16,
            width: 32,
            height: 32,
            background: `${accent}30`,
            animationDuration: '0.6s',
            animationIterationCount: 1,
          }}
        />
      )}

      {/* icon */}
      <div
        className="relative z-10 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
        style={{
          background: active
            ? `${accent}20`
            : hovered
            ? `${accent}10`
            : 'transparent',
          border: active
            ? `1px solid ${accent}30`
            : '1px solid transparent',
        }}
      >
        <Icon
          className="w-4 h-4 transition-all duration-300"
          style={{
            color: active ? accent : hovered ? accent : undefined,
            filter: active ? `drop-shadow(0 0 6px ${accent}80)` : 'none',
          }}
        />
      </div>

      {/* label */}
      <span className="relative z-10 flex-1 font-medium transition-all duration-200">
        {label}
      </span>

      {/* active dot + chevron */}
      <div className="relative z-10 flex items-center gap-1.5">
        {active && (
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
          />
        )}
        <ChevronRight
          className="w-3.5 h-3.5 transition-all duration-300"
          style={{
            color: active ? accent : 'transparent',
            opacity: active || hovered ? 1 : 0,
            transform: hovered && !active ? 'translateX(2px)' : 'none',
          }}
        />
      </div>
    </Link>
  );
}

/* ─── user avatar with initials ─────────────────────────────────────────── */
function UserAvatar({ name }: { name?: string }) {
  const initial = name?.charAt(0).toUpperCase() ?? '?';
  return (
    <div className="relative w-9 h-9 flex-shrink-0">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-sm font-extrabold text-white font-display border border-brand-500/30">
        {initial}
      </div>
      {/* online dot */}
      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--color-card,#0f0f1a)]" />
    </div>
  );
}

/* ─── inner nav content (shared desktop + mobile) ───────────────────────── */
function NavContent({
  onClose,
  mounted,
}: {
  onClose?: () => void;
  mounted: boolean;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await authApi.logout(); } finally {
      clearAuth();
      toast.success('Logged out');
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]',
          'transition-all duration-500',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3',
        )}
      >
        {/* orbit ring around logo */}
        <div className="relative w-9 h-9 flex-shrink-0">
          {/* spinning orbit */}
          <div
            className="absolute inset-[-4px] rounded-full border border-dashed border-brand-500/30 animate-spin"
            style={{ animationDuration: '12s' }}
          />
          {/* logo core */}
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center glow-brand relative z-10">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {/* orbit dot */}
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-brand-400 animate-spin"
            style={{
              animationDuration: '12s',
              top: -2,
              left: '50%',
              marginLeft: -3,
              transformOrigin: '3px calc(50% + 6px)',
              boxShadow: '0 0 6px #818cf8',
            }}
          />
        </div>

        <div>
          <span className="font-display text-[15px] font-extrabold text-ink-primary tracking-tight">
            OrbitHire
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <Sparkles className="w-2.5 h-2.5 text-brand-400" />
            <span className="text-[9px] font-bold text-brand-400 tracking-[0.2em] uppercase">
              AI Powered
            </span>
          </div>
        </div>

        {/* close button (mobile only) */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Section label ─────────────────────────────────────────────── */}
      <div
        className={cn(
          'px-5 pt-5 pb-2 transition-all duration-500 delay-100',
          mounted ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.2em]">
          Navigation
        </span>
      </div>

      {/* ── Nav items ─────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, icon, label, accent }, i) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <div
              key={href}
              className={cn(
                'transition-all duration-500',
                mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4',
              )}
              style={{ transitionDelay: `${150 + i * 60}ms` }}
            >
              <NavItem
                href={href}
                icon={icon}
                label={label}
                accent={accent}
                active={active}
                onClick={onClose}
              />
            </div>
          );
        })}
      </nav>

      {/* ── Upgrade nudge ─────────────────────────────────────────────── */}
      <div
        className={cn(
          'mx-3 mb-3 p-3.5 rounded-xl border border-brand-500/20 bg-brand-600/8 relative overflow-hidden',
          'transition-all duration-500 delay-[450ms]',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        )}
      >
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-brand-600/20 blur-xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-[11px] font-bold text-brand-300">Daily Digest Active</span>
        </div>
        <p className="text-[10px] text-ink-muted leading-relaxed">
          Jobs scraped every morning at <span className="text-ink-secondary font-semibold">8 AM</span>. Your inbox is covered.
        </p>
      </div>

      {/* ── User footer ───────────────────────────────────────────────── */}
      <div
        className={cn(
          'border-t border-white/[0.06] px-3 py-3 space-y-1',
          'transition-all duration-500 delay-500',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        )}
      >
        {/* user row */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.03] transition-colors group">
          <UserAvatar name={user?.name} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-ink-primary truncate leading-tight">
              {user?.name}
            </p>
            <p className="text-[10px] text-ink-muted truncate mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* logout */}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium',
            'text-ink-muted hover:text-red-400 transition-all duration-200',
            'hover:bg-red-500/8 border border-transparent hover:border-red-500/15',
            'group',
          )}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 group-hover:bg-red-500/15 transition-colors border border-white/5 group-hover:border-red-500/20">
            <LogOut className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN SIDEBAR EXPORT
───────────────────────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [drawerReady, setDrawerReady] = useState(false);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // animate drawer in
  const openMobile = () => {
    setMobileOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setDrawerReady(true));
    });
  };
  const closeMobile = () => {
    setDrawerReady(false);
    setTimeout(() => setMobileOpen(false), 320);
  };

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col w-[220px] min-h-screen fixed left-0 top-0 z-30',
          'bg-card border-r border-white/[0.06]',
          'transition-all duration-700',
          mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4',
        )}
      >
        {/* subtle side glow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-2/3 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, transparent, #6366f130, transparent)' }}
        />
        <NavContent mounted={mounted} />
      </aside>

      {/* ── Mobile hamburger ─────────────────────────────────────────── */}
      <button
        onClick={openMobile}
        className={cn(
          'lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl',
          'bg-card border border-white/[0.08]',
          'text-ink-muted hover:text-ink-primary',
          'transition-all duration-200 hover:border-white/[0.15]',
          'shadow-lg shadow-black/20',
        )}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* backdrop */}
          <div
            className="absolute inset-0 transition-all duration-300"
            style={{
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              opacity: drawerReady ? 1 : 0,
            }}
            onClick={closeMobile}
          />

          {/* drawer panel */}
          <aside
            className="relative w-full max-w-[260px] flex flex-col bg-card border-r border-white/[0.06] shadow-2xl"
            style={{
              transform: drawerReady ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.32s cubic-bezier(0.34,1.2,0.64,1)',
            }}
          >
            <NavContent mounted={drawerReady} onClose={closeMobile} />
          </aside>
        </div>
      )}
    </>
  );
}