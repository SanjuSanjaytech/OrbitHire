'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { resumeApi } from '@/lib/api';
import { PageSpinner } from '@/components/ui/Spinner';
import {
  Upload, CheckCircle, FileText, Code, Wrench,
  Database, Cloud, Award, RefreshCw,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const categoryIcons: Record<string, React.ReactNode> = {
  language:  <Code className="w-3.5 h-3.5" />,
  framework: <Wrench className="w-3.5 h-3.5" />,
  database:  <Database className="w-3.5 h-3.5" />,
  cloud:     <Cloud className="w-3.5 h-3.5" />,
  tool:      <Wrench className="w-3.5 h-3.5" />,
  other:     <Code className="w-3.5 h-3.5" />,
};

const categoryColors: Record<string, string> = {
  language:  'bg-blue-500/15 text-blue-300 border-blue-500/30',
  framework: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  database:  'bg-orange-500/15 text-orange-300 border-orange-500/30',
  cloud:     'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  tool:      'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  other:     'bg-gray-500/15 text-gray-300 border-gray-500/30',
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['resume-profile'],
    queryFn: () => resumeApi.getProfile().then(r => r.data.data.resume),
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => resumeApi.upload(file),
    onMutate: () => {
      setUploadProgress(10);
      const interval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 5, 85));
      }, 800);
      return { interval };
    },
    onSuccess: (_, __, context: any) => {
      clearInterval(context?.interval);
      setUploadProgress(100);
      queryClient.invalidateQueries({ queryKey: ['resume-profile'] });
      toast.success('Resume uploaded and parsed successfully!');
      setTimeout(() => setUploadProgress(0), 1000);
    },
    onError: (err: any, _, context: any) => {
      clearInterval(context?.interval);
      setUploadProgress(0);
      toast.error(err.response?.data?.message || 'Upload failed');
    },
  });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) uploadMutation.mutate(accepted[0]);
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploadMutation.isPending,
  });

  if (isLoading) return <PageSpinner />;

  const resume = profileData;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Resume & Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Upload your PDF resume to extract skills and profile automatically</p>
      </div>

      {/* Upload Zone */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-brand-400" />
          <h2 className="font-semibold text-gray-200">
            {resume ? 'Update Resume' : 'Upload Resume'}
          </h2>
          {resume && <span className="badge bg-emerald-500/15 text-emerald-300 border-emerald-500/30">v{resume.version}</span>}
        </div>

        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200',
            isDragActive
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-surface-border hover:border-brand-500/50 hover:bg-brand-500/5',
            uploadMutation.isPending && 'pointer-events-none opacity-70'
          )}
        >
          <input {...getInputProps()} />
          <Upload className={cn('w-10 h-10 mx-auto mb-3', isDragActive ? 'text-brand-400' : 'text-gray-600')} />
          <p className="text-gray-300 font-medium">
            {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF resume'}
          </p>
          <p className="text-gray-500 text-sm mt-1">or click to browse · PDF only · Max 10MB</p>
        </div>

        {/* Progress bar */}
        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{uploadProgress < 90 ? 'Extracting & analyzing...' : uploadProgress === 100 ? 'Complete!' : 'Finalizing...'}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Profile Info */}
      {resume && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Card */}
            <div className="card">
              <h2 className="font-semibold text-gray-200 mb-4">Profile</h2>
              <div className="space-y-3">
                {[
                  { label: 'Name',       value: resume.profile?.name },
                  { label: 'Email',      value: resume.profile?.email },
                  { label: 'Phone',      value: resume.profile?.phone },
                  { label: 'Location',   value: resume.profile?.location },
                  { label: 'Current Role', value: resume.profile?.currentRole },
                  { label: 'Experience', value: resume.profile?.totalExperience },
                ].map(({ label, value }) => value && (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-200 font-medium text-right max-w-xs truncate">{value}</span>
                  </div>
                ))}
              </div>
              {resume.profile?.summary && (
                <div className="mt-4 pt-4 border-t border-surface-border">
                  <p className="text-xs text-gray-500 mb-1.5">Summary</p>
                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">{resume.profile.summary}</p>
                </div>
              )}
            </div>

            {/* Extraction Meta */}
            <div className="card">
              <h2 className="font-semibold text-gray-200 mb-4">Extraction Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Extracted at</span>
                  <span className="text-gray-200">{formatDate(resume.extractionMeta?.extractedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">AI Model</span>
                  <span className="text-gray-200 font-mono text-xs">{resume.extractionMeta?.model || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Confidence</span>
                  <span className="text-emerald-400 font-medium">
                    {resume.extractionMeta?.confidence
                      ? `${(resume.extractionMeta.confidence * 100).toFixed(0)}%` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Technical Skills</span>
                  <span className="text-gray-200">{resume.skills?.technical?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Experiences</span>
                  <span className="text-gray-200">{resume.experience?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">File</span>
                  <span className="text-gray-200 truncate max-w-xs text-right text-xs">{resume.originalFileName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-200">
                Technical Skills
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  ({resume.skills?.technical?.length ?? 0} extracted)
                </span>
              </h2>
            </div>

            {resume.skills?.technical?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resume.skills.technical.map((skill: any, i: number) => (
                  <span
                    key={i}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border',
                      categoryColors[skill.category] || categoryColors.other
                    )}
                  >
                    {categoryIcons[skill.category] || categoryIcons.other}
                    {skill.name}
                    {skill.proficiency && skill.proficiency !== 'intermediate' && (
                      <span className="opacity-60">· {skill.proficiency}</span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No skills extracted yet</p>
            )}

            {/* Soft Skills */}
            {resume.skills?.soft?.length > 0 && (
              <div className="mt-5 pt-5 border-t border-surface-border">
                <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Soft Skills</p>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.soft.map((skill: string, i: number) => (
                    <span key={i} className="badge bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {resume.skills?.certifications?.length > 0 && (
              <div className="mt-5 pt-5 border-t border-surface-border">
                <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.certifications.map((cert: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 badge bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs">
                      <Award className="w-3 h-3" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Experience */}
          {resume.experience?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-200 mb-5">Work Experience</h2>
              <div className="space-y-5">
                {resume.experience.map((exp: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-1 flex-shrink-0" />
                      {i < resume.experience.length - 1 && (
                        <div className="w-px flex-1 bg-surface-border mt-1" />
                      )}
                    </div>
                    <div className="pb-5">
                      <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <span className="font-medium text-gray-200">{exp.role}</span>
                        {exp.current && <span className="badge bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs">Current</span>}
                      </div>
                      <p className="text-sm text-brand-400">{exp.company}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{exp.duration}</p>
                      {exp.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {exp.technologies.map((tech: string, j: number) => (
                            <span key={j} className="text-xs px-2 py-0.5 rounded bg-surface-border text-gray-400">{tech}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
