'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import {
  Briefcase,
  CalendarDays,
  Camera,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobsApi, profileApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { PageSpinner } from '@/components/ui/Spinner';

type ProfileForm = {
  name: string;
  phone: string;
  location: string;
  headline: string;
  bio: string;
};

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function getAvatarUrl(path?: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
}

function initials(name?: string) {
  return (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'U';
}

function StatTile({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
          <Icon className="h-4 w-4 text-brand-600" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { token, setAuth } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    phone: '',
    location: '',
    headline: '',
    bio: '',
  });

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get().then(r => r.data.data.user),
  });

  const { data: statsData } = useQuery({
    queryKey: ['job-stats'],
    queryFn: () => jobsApi.stats().then(r => r.data.data),
  });

  useEffect(() => {
    if (!profileData) return;
    setForm({
      name: profileData.name || '',
      phone: profileData.phone || '',
      location: profileData.location || '',
      headline: profileData.headline || '',
      bio: profileData.bio || '',
    });
  }, [profileData]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('');
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const updateProfileMutation = useMutation({
    mutationFn: () => profileApi.update(form),
    onSuccess: res => {
      const updated = res.data.data.user;
      if (token) setAuth(updated, token);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
      toast.success('Profile updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Could not update profile'),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: res => {
      const updated = res.data.data.user;
      if (token) setAuth(updated, token);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatarFile(null);
      toast.success('Profile picture updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Avatar upload failed'),
  });

  const removeAvatarMutation = useMutation({
    mutationFn: () => profileApi.removeAvatar(),
    onSuccess: res => {
      const updated = res.data.data.user;
      if (token) setAuth(updated, token);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatarFile(null);
      toast.success('Profile picture removed');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Could not remove avatar'),
  });

  const onAvatarDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setAvatarFile(accepted[0]);
  }, []);

  const avatarDropzone = useDropzone({
    onDrop: onAvatarDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    disabled: avatarMutation.isPending,
  });

  const validationError = useMemo(() => {
    if (form.name.trim().length < 2) return 'Full name must be at least 2 characters.';
    if (form.phone && !/^[+()\-\s\d]{7,20}$/.test(form.phone)) return 'Enter a valid phone number.';
    if (form.headline.length > 140) return 'Headline must be 140 characters or less.';
    if (form.bio.length > 1000) return 'Bio must be 1000 characters or less.';
    return '';
  }, [form]);

  const saveProfile = () => {
    if (validationError) {
      toast.error(validationError);
      return;
    }
    updateProfileMutation.mutate();
  };

  if (profileLoading) return <PageSpinner />;

  const user = profileData;
  const avatarSrc = avatarPreview || getAvatarUrl(user?.avatarUrl);
  const stats = statsData?.summary || {};

  return (
    <div className="space-y-6 pb-10">
      <div>
        <p className="text-sm font-semibold text-brand-700">Account</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your job-seeker identity and recruiter-facing details.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="h-28 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400" />
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-card">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={user?.name || 'Profile'} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-brand-700">{initials(user?.name)}</span>
                  )}
                </div>
                <label
                  {...avatarDropzone.getRootProps()}
                  className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg hover:bg-brand-700"
                  title="Upload profile picture"
                >
                  <input {...avatarDropzone.getInputProps()} />
                  <Camera className="h-4 w-4" />
                </label>
              </div>

              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-3 w-3" />
                    Active
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{user?.headline || 'Add a professional headline'}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user?.email}</span>
                  {user?.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.location}</span>}
                  {user?.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{user.phone}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {avatarFile && (
                <button onClick={() => avatarMutation.mutate(avatarFile)} disabled={avatarMutation.isPending} className="btn-secondary h-10 text-xs">
                  {avatarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Save Photo
                </button>
              )}
              {(user?.avatarUrl || avatarFile) && (
                <button onClick={() => avatarFile ? setAvatarFile(null) : removeAvatarMutation.mutate()} disabled={removeAvatarMutation.isPending} className="btn-secondary h-10 text-xs text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  Remove Photo
                </button>
              )}
              <button onClick={() => setEditing(v => !v)} className="btn-primary h-10 text-xs">
                <UserRound className="h-4 w-4" />
                {editing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Saved jobs" value={stats.saved ?? 0} icon={Briefcase} />
        <StatTile label="Applied jobs" value={stats.applied ?? 0} icon={CheckCircle2} />
        <StatTile label="Top matches" value={stats.highMatch ?? 0} icon={ShieldCheck} />
        <StatTile label="Member since" value={user?.createdAt ? new Date(user.createdAt).getFullYear() : '-'} icon={CalendarDays} />
      </div>

      <section className="card">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
            <p className="text-sm text-slate-500">Keep the details employers and recruiters see up to date.</p>
          </div>
          {editing && (
            <button onClick={saveProfile} disabled={updateProfileMutation.isPending} className="btn-primary h-10 text-xs">
              {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label>
            <span className="label">Full name</span>
            <input className="input" disabled={!editing} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            <span className="label">Email address</span>
            <input className="input bg-slate-50 text-slate-500" disabled value={user?.email || ''} />
          </label>
          <label>
            <span className="label">Phone number</span>
            <input className="input" disabled={!editing} placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label>
            <span className="label">Location</span>
            <input className="input" disabled={!editing} placeholder="Bengaluru, India" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </label>
          <label className="md:col-span-2">
            <span className="label">Professional title / headline</span>
            <input className="input" disabled={!editing} placeholder="Full Stack Developer | MERN | Node.js" value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} />
            <p className="mt-1 text-xs text-slate-500">{form.headline.length}/140</p>
          </label>
          <label className="md:col-span-2">
            <span className="label">About me</span>
            <textarea className="input min-h-[140px] resize-none" disabled={!editing} placeholder="Write a short professional summary for recruiters." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            <p className="mt-1 text-xs text-slate-500">{form.bio.length}/1000</p>
          </label>
        </div>
      </section>
    </div>
  );
}
