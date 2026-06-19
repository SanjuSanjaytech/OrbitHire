'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeApi } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function ResumePage() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: resume, isLoading } = useQuery({
    queryKey: ['resume-profile'],
    queryFn: () => resumeApi.getProfile().then(r => r.data.data.resume),
    retry: false,
  });

  const resumeUploadMutation = useMutation({
    mutationFn: (file: File) => resumeApi.upload(file),
    onMutate: () => {
      setUploadProgress(10);
      const interval = setInterval(() => setUploadProgress(p => Math.min(p + 6, 88)), 700);
      return { interval };
    },
    onSuccess: (_, __, context: any) => {
      clearInterval(context?.interval);
      setUploadProgress(100);
      queryClient.invalidateQueries({ queryKey: ['resume-profile'] });
      toast.success('Resume uploaded and parsed');
      setTimeout(() => setUploadProgress(0), 900);
    },
    onError: (err: any, _, context: any) => {
      clearInterval(context?.interval);
      setUploadProgress(0);
      toast.error(err.response?.data?.message || 'Resume upload failed');
    },
  });

  const onResumeDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) resumeUploadMutation.mutate(accepted[0]);
  }, [resumeUploadMutation]);

  const resumeDropzone = useDropzone({
    onDrop: onResumeDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: resumeUploadMutation.isPending,
  });

  const technicalSkills = resume?.skills?.technical || [];
  const softSkills = resume?.skills?.soft || [];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-700">Career profile</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Resume</h1>
          <p className="mt-1 text-sm text-slate-500">Upload, parse, and maintain the resume used for AI job matching.</p>
        </div>
        <Link href="/jobs" className="btn-primary self-start gap-2 text-sm">
          Match Jobs
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Resume Upload</h2>
            <p className="text-sm text-slate-500">Use a PDF resume. AI parsing runs immediately after upload.</p>
          </div>
          {resume && <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">Parsed</span>}
        </div>

        <div
          {...resumeDropzone.getRootProps()}
          className={cn(
            'cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all',
            resumeDropzone.isDragActive ? 'border-brand-500 bg-blue-50' : 'border-slate-300 hover:border-brand-400 hover:bg-blue-50/50',
            resumeUploadMutation.isPending && 'pointer-events-none opacity-70',
          )}
        >
          <input {...resumeDropzone.getInputProps()} />
          <FileText className="mx-auto mb-3 h-10 w-10 text-brand-600" />
          <p className="font-semibold text-slate-900">{resume ? 'Update your resume' : 'Upload your resume'}</p>
          <p className="mt-1 text-sm text-slate-500">PDF only, max 10MB</p>
        </div>

        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs text-slate-500">
              <span>{uploadProgress < 90 ? 'Extracting and analyzing...' : uploadProgress === 100 ? 'Complete' : 'Finalizing...'}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}
      </section>

      {isLoading ? (
        <div className="h-40 rounded-xl shimmer" />
      ) : resume ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <section className="card">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-900">Parsed Resume Profile</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoTile label="Resume file" value={resume.originalFileName} />
              <InfoTile label="Extracted" value={formatDate(resume.extractionMeta?.extractedAt)} />
              <InfoTile label="Technical skills" value={technicalSkills.length} />
              <InfoTile label="Experience entries" value={resume.experience?.length ?? 0} />
            </div>

            {resume.profile?.summary && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{resume.profile.summary}</p>
              </div>
            )}

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-slate-900">Technical Skills</p>
              <div className="flex flex-wrap gap-2">
                {technicalSkills.length > 0 ? technicalSkills.slice(0, 28).map((skill: any, index: number) => (
                  <span key={`${skill.name || skill}-${index}`} className="badge border-blue-200 bg-blue-50 text-brand-700">
                    {skill.name || skill}
                  </span>
                )) : (
                  <p className="text-sm text-slate-500">No technical skills detected yet.</p>
                )}
              </div>
            </div>

            {softSkills.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold text-slate-900">Soft Skills</p>
                <div className="flex flex-wrap gap-2">
                  {softSkills.slice(0, 18).map((skill: any, index: number) => (
                    <span key={`${skill.name || skill}-${index}`} className="badge border-slate-200 bg-slate-50 text-slate-700">
                      {skill.name || skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                AI matching ready
              </div>
              <p className="mt-2 text-sm">Your resume can now be used to score jobs, find gaps, and generate apply guidance.</p>
            </div>
            <Link href="/jobs" className="btn-primary w-full gap-2">
              <Briefcase className="h-4 w-4" />
              Run AI Job Match
            </Link>
          </aside>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">No resume uploaded yet</p>
              <p className="mt-1 text-sm">You can still browse jobs, but upload a resume to unlock AI match scores and tailored suggestions.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
