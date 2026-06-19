'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CalendarDays,
  Clock,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, profileApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { PageSpinner } from '@/components/ui/Spinner';

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, setAuth, clearAuth } = useAuthStore();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    schedulerEnabled: true,
    timezone: 'Asia/Kolkata',
  });

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get().then(r => r.data.data.user),
  });

  useEffect(() => {
    if (!profileData?.preferences) return;
    setPreferences({
      emailNotifications: profileData.preferences.emailNotifications ?? true,
      schedulerEnabled: profileData.preferences.schedulerEnabled ?? true,
      timezone: profileData.preferences.timezone || 'Asia/Kolkata',
    });
  }, [profileData]);

  const passwordMutation = useMutation({
    mutationFn: () => profileApi.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    }),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Could not change password'),
  });

  const preferencesMutation = useMutation({
    mutationFn: () => profileApi.update({ preferences }),
    onSuccess: res => {
      const updated = res.data.data.user;
      if (token) setAuth(updated, token);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Settings saved');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Could not save settings'),
  });

  const changePassword = () => {
    if (!passwordForm.currentPassword) return toast.error('Current password is required');
    if (passwordForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match');
    passwordMutation.mutate();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      toast.success('Logged out');
      router.push('/login');
    }
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6 pb-10">
      <div>
        <p className="text-sm font-semibold text-brand-700">Account</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage security, notifications, and digest preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-900">Notifications & Digest</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <span>
                  <span className="flex items-center gap-2 font-semibold text-slate-900"><Mail className="h-4 w-4 text-slate-500" /> Email notifications</span>
                  <span className="mt-1 block text-sm text-slate-500">Receive account alerts and job digest emails.</span>
                </span>
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  checked={preferences.emailNotifications}
                  onChange={e => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                />
              </label>

              <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <span>
                  <span className="flex items-center gap-2 font-semibold text-slate-900"><Clock className="h-4 w-4 text-slate-500" /> Daily job digest</span>
                  <span className="mt-1 block text-sm text-slate-500">Run saved searches every morning at 8:00 AM IST.</span>
                </span>
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  checked={preferences.schedulerEnabled}
                  onChange={e => setPreferences({ ...preferences, schedulerEnabled: e.target.checked })}
                />
              </label>

              <label>
                <span className="label">Timezone</span>
                <select
                  className="input"
                  value={preferences.timezone}
                  onChange={e => setPreferences({ ...preferences, timezone: e.target.value })}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </label>

              <button onClick={() => preferencesMutation.mutate()} disabled={preferencesMutation.isPending} className="btn-primary gap-2">
                {preferencesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Settings
              </button>
            </div>
          </section>

          <section className="card">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input className="input" type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              <input className="input" type="password" placeholder="New password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              <input className="input" type="password" placeholder="Confirm new password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
            </div>
            <button onClick={changePassword} disabled={passwordMutation.isPending} className="btn-secondary mt-4 gap-2">
              {passwordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Update Password
            </button>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-900">Account Activity</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="flex items-center gap-2 font-semibold text-slate-900"><CalendarDays className="h-4 w-4 text-slate-500" /> Account created</p>
                <p className="mt-1 text-slate-500">{profileData?.createdAt ? formatDate(profileData.createdAt) : 'Not available'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="flex items-center gap-2 font-semibold text-slate-900"><Clock className="h-4 w-4 text-slate-500" /> Last login</p>
                <p className="mt-1 text-slate-500">{profileData?.lastLogin ? formatDate(profileData.lastLogin) : 'Not available'}</p>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Session</h2>
            <p className="mb-4 text-sm text-slate-500">Sign out from this browser session.</p>
            <button onClick={logout} className="btn-secondary w-full text-red-600 hover:text-red-700">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
