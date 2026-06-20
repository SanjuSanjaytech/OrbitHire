'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  Printer,
  Save,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeApi, jobsApi } from '@/lib/api';

const LOADING_STEPS = [
  'Initializing resume workspace...',
  'Analyzing job requirements & skills...',
  'Comparing candidate history to target job posting...',
  'Extracting relevant technical accomplishments...',
  'Tailoring professional summary statement...',
  'Adapting experience bullet points to match requirements...',
  'Finalizing ATS keywords integration...',
];

export default function TailorResumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const queryClient = useQueryClient();

  const [loadingStep, setLoadingStep] = useState(0);
  const [summary, setSummary] = useState('');
  const [experience, setExperience] = useState<any[]>([]);
  const [skillsText, setSkillsText] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');

  // 1. Fetch Job details
  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: () => jobsApi.get(jobId!).then(r => r.data.data.job),
    enabled: !!jobId,
  });

  // 2. Tailor / Fetch tailored resume mutation
  const tailorMutation = useMutation({
    mutationFn: (id: string) => resumeApi.tailor(id).then(r => r.data.data.tailoredResume),
    onSuccess: (data) => {
      setSummary(data.profile?.summary || '');
      setExperience(data.experience || []);
      setPhone(data.profile?.phone || '');
      setLocation(data.profile?.location || '');
      setLinkedIn(data.profile?.linkedIn || '');
      setGithub(data.profile?.github || '');
      setPortfolio(data.profile?.portfolio || '');
      
      const techNames = (data.skills?.technical || []).map((s: any) => s.name || s);
      setSkillsText(techNames.join(', '));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to tailor resume');
    },
  });

  // Trigger tailor on mount when jobId is ready
  useEffect(() => {
    if (jobId) {
      tailorMutation.mutate(jobId);
    } else {
      toast.error('No Job ID provided');
      router.push('/jobs');
    }
  }, [jobId]);

  // Loading animation step cycle
  useEffect(() => {
    if (!tailorMutation.isPending) return;
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [tailorMutation.isPending]);

  // 3. Update tailored resume mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) =>
      resumeApi.updateTailored(data.id, data.payload),
    onSuccess: () => {
      toast.success('Resume saved successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save resume updates');
    },
  });

  const handleSave = () => {
    if (!tailorMutation.data?._id) return;

    // Convert comma-separated skills back into technical structure
    const updatedTechnical = skillsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(name => {
        // Try to match with existing skill to preserve category/proficiency, else default
        const existing = (tailorMutation.data.skills?.technical || []).find(
          (t: any) => (t.name || '').toLowerCase() === name.toLowerCase()
        );
        return existing || { name, category: 'other', proficiency: 'intermediate' };
      });

    const payload = {
      profile: {
        summary,
        phone,
        location,
        linkedIn,
        github,
        portfolio,
      },
      skills: {
        ...tailorMutation.data.skills,
        technical: updatedTechnical,
      },
      experience,
      education: tailorMutation.data.education || [],
    };

    updateMutation.mutate({ id: tailorMutation.data._id, payload });
  };

  const handlePrint = () => {
    window.print();
  };

  const isPageLoading = isJobLoading || tailorMutation.isPending;

  if (isPageLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-xl animate-pulse" />
          <Loader2 className="w-16 h-16 text-brand-600 animate-spin relative z-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 justify-center">
          <Sparkles className="w-5 h-5 text-brand-500 animate-bounce" />
          OrbitHire AI Tailoring
        </h2>
        <p className="mt-3 text-slate-500 text-sm max-w-sm min-h-[40px]">
          {LOADING_STEPS[loadingStep]}
        </p>
      </div>
    );
  }

  const tailoredResume = tailorMutation.data;

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Print Stylesheet Overrides */}
      <style>{`
        @media print {
          header,
          .no-print,
          button,
          .sidebar,
          nav {
            display: none !important;
          }
          body, html, main, .min-h-screen {
            background: #fff !important;
            color: #000 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
          }
          .max-w-7xl, .p-4, .sm\\:p-6, .lg\\:p-8 {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-resume-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            color: #000 !important;
            width: 100% !important;
          }
          .print-resume-sheet input,
          .print-resume-sheet textarea {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            resize: none !important;
            overflow: hidden !important;
            width: 100% !important;
            color: #000 !important;
          }
        }
      `}</style>

      {/* Toolbar / Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Tailored Resume Workspace
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Resume for {job?.company?.name || 'Target Job'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="btn-secondary h-10 px-4 text-sm gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary h-10 px-4 text-sm gap-2 bg-emerald-600 hover:bg-emerald-700 border-emerald-700"
          >
            <Printer className="w-4 h-4" />
            Print / Download PDF
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Job Specs (no-print) */}
        <section className="lg:col-span-4 space-y-6 no-print">
          <div className="card space-y-4">
            <h2 className="text-md font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4.5 h-4.5 text-slate-500" />
              Job Specifications
            </h2>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{job?.title}</h3>
              <div className="flex items-center gap-1.5 text-slate-600 text-xs mt-1">
                <Building2 className="w-3.5 h-3.5" />
                {job?.company?.name}
              </div>
              {job?.location?.raw && (
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location.raw}
                </div>
              )}
            </div>
            {job?.aiMatch && (
              <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-brand-900 text-xs">
                <div className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  AI Matching Insights: {job.aiMatch.score}% Match Score
                </div>
                <ul className="mt-2 space-y-1 list-disc pl-4 text-brand-800 leading-relaxed">
                  <li><strong>Focus summary on:</strong> {job.aiMatch.actionPlan?.coverLetterAngle}</li>
                  <li><strong>Target Keywords:</strong> {(job.aiMatch.actionPlan?.resumeKeywords || []).slice(0, 4).join(', ')}</li>
                </ul>
              </div>
            )}
            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-semibold text-slate-800 mb-1">Job Description Snippet</h4>
              <div className="text-xs text-slate-600 leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre-wrap p-2 bg-slate-50 border border-slate-200 rounded-lg">
                {job?.description}
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: The Print Sheet Workspace */}
        <section className="lg:col-span-8 print-resume-sheet">
          <div className="border border-slate-200 rounded-2xl bg-white shadow-xl p-8 sm:p-12 print-resume-sheet space-y-8 font-serif text-slate-900 leading-relaxed">
            
            {/* Header / Contact Info */}
            <div className="text-center space-y-2 border-b border-slate-200 pb-5">
              <h2 className="text-3xl font-extrabold tracking-tight font-sans text-slate-900">
                {tailoredResume?.profile?.name}
              </h2>
              
              {/* Contact info grid */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600 font-sans">
                <span>{tailoredResume?.profile?.email}</span>
                {phone && <span className="before:content-['•'] before:mr-4">{phone}</span>}
                {location && <span className="before:content-['•'] before:mr-4">{location}</span>}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-brand-700 font-sans no-print">
                {/* Editable contact details inside a subtle no-print expander */}
                <div className="w-full mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    placeholder="Phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="input h-8 text-[11px]"
                  />
                  <input
                    placeholder="Location"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="input h-8 text-[11px]"
                  />
                  <input
                    placeholder="LinkedIn"
                    value={linkedIn}
                    onChange={e => setLinkedIn(e.target.value)}
                    className="input h-8 text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Professional Summary */}
            <div className="space-y-2">
              <h3 className="text-[13px] font-extrabold font-sans uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1">
                Professional Summary
              </h3>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                className="w-full text-[13px] text-slate-700 leading-relaxed border-none focus:ring-0 focus:outline-none p-0 resize-none min-h-[90px]"
                placeholder="Write summary here..."
              />
            </div>

            {/* Technical Skills */}
            <div className="space-y-2">
              <h3 className="text-[13px] font-extrabold font-sans uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1">
                Skills & Technologies
              </h3>
              <textarea
                value={skillsText}
                onChange={e => setSkillsText(e.target.value)}
                className="w-full text-[13px] text-slate-700 leading-relaxed border-none focus:ring-0 focus:outline-none p-0 resize-none min-h-[50px] font-sans"
                placeholder="List skills (comma separated)..."
              />
            </div>

            {/* Work Experience */}
            <div className="space-y-4">
              <h3 className="text-[13px] font-extrabold font-sans uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1">
                Work Experience
              </h3>
              <div className="space-y-6">
                {experience.map((exp, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start justify-between text-[13px] font-bold text-slate-900 font-sans">
                      <div>
                        {exp.role} <span className="font-normal text-slate-500">at</span> {exp.company}
                      </div>
                      <div className="text-slate-500 text-xs">{exp.duration}</div>
                    </div>
                    <textarea
                      value={exp.description || ''}
                      onChange={e => {
                        const updated = [...experience];
                        updated[index] = { ...exp, description: e.target.value };
                        setExperience(updated);
                      }}
                      className="w-full text-[13px] text-slate-700 leading-relaxed border-none focus:ring-0 focus:outline-none p-0 resize-none min-h-[120px]"
                      placeholder="Describe experience/bullet points..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="space-y-3">
              <h3 className="text-[13px] font-extrabold font-sans uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1">
                Education
              </h3>
              <div className="space-y-3">
                {(tailoredResume?.education || []).map((edu: any, index: number) => (
                  <div key={index} className="flex justify-between text-[13px] text-slate-700">
                    <div>
                      <strong className="text-slate-900 font-sans">{edu.degree} in {edu.field}</strong> · {edu.institution}
                    </div>
                    <div className="text-slate-500 text-xs font-sans">{edu.year}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
