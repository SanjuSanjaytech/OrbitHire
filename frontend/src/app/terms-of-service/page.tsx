import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowLeft, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms and conditions governing your use of the OrbitHire platform.',
};

const EFFECTIVE_DATE = 'June 20, 2025';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top nav bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-base text-slate-900 tracking-tight">OrbitHire</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {/* Page header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-5">
            <FileText className="w-3.5 h-3.5" />
            Legal Document
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Terms of Service</h1>
          <p className="text-slate-500 text-sm">Effective date: <span className="font-semibold text-slate-700">{EFFECTIVE_DATE}</span></p>
        </div>

        {/* Intro */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-10">
          <p className="text-slate-700 text-sm leading-relaxed">
            Please read these Terms of Service (&quot;Terms&quot;) carefully before using OrbitHire. By accessing or using
            our platform, you agree to be bound by these Terms. If you do not agree, do not use the service.
          </p>
        </div>

        <div className="space-y-12 text-slate-700">

          <Section title="1. Acceptance of Terms">
            <p className="text-sm leading-relaxed">
              By creating an account or using any part of the OrbitHire platform, you confirm that you are at least
              16 years old and that you have read, understood, and agree to be bound by these Terms and our{' '}
              <Link href="/privacy-policy" className="text-blue-600 hover:underline font-medium">Privacy Policy</Link>.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p className="text-sm leading-relaxed mb-3">
              OrbitHire provides an AI-powered job search and application tracking platform. Core features include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed pl-1">
              <li>Resume upload and AI skill extraction via Google Gemini</li>
              <li>AI-based job matching and scoring</li>
              <li>Daily email job digest</li>
              <li>Application tracking dashboard</li>
              <li>AI resume tailoring for specific job applications</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              We reserve the right to modify, suspend, or discontinue any part of the service at any time without notice.
            </p>
          </Section>

          <Section title="3. Account Registration">
            <p className="text-sm leading-relaxed">
              You must register for an account to use OrbitHire. You agree to provide accurate and complete information
              and to keep your login credentials secure. You are responsible for all activity that occurs under your
              account. Notify us immediately at{' '}
              <a href="mailto:support@orbithire.com" className="text-blue-600 hover:underline font-medium">
                support@orbithire.com
              </a>{' '}
              if you suspect unauthorised access.
            </p>
          </Section>

          <Section title="4. Acceptable Use">
            <p className="text-sm leading-relaxed mb-3">You agree <strong>not</strong> to:</p>
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed pl-1">
              <li>Use the platform for any unlawful purpose</li>
              <li>Upload content that infringes intellectual property rights</li>
              <li>Attempt to reverse-engineer, scrape, or exploit the platform</li>
              <li>Submit false or misleading profile information</li>
              <li>Use automated scripts or bots to access the service</li>
              <li>Interfere with the security or integrity of our systems</li>
              <li>Share your account credentials with third parties</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              Violation of these rules may result in immediate account termination without notice.
            </p>
          </Section>

          <Section title="5. Your Content">
            <p className="text-sm leading-relaxed mb-3">
              You retain ownership of all content you upload to OrbitHire, including your resume. By uploading content,
              you grant OrbitHire a non-exclusive, worldwide, royalty-free licence to use, store, and process that
              content solely for the purpose of providing the service to you.
            </p>
            <p className="text-sm leading-relaxed">
              You warrant that you have the right to upload any content you submit and that it does not violate any
              third-party rights or applicable laws.
            </p>
          </Section>

          <Section title="6. AI-Generated Content">
            <p className="text-sm leading-relaxed">
              OrbitHire uses Google Gemini AI to generate resume tailoring suggestions, skill analyses, job match scores,
              and cover letter angles. This content is provided for informational purposes only. OrbitHire makes no
              guarantees about the accuracy, completeness, or fitness for purpose of AI-generated content. You are
              solely responsible for reviewing and verifying any AI output before using it in a job application.
            </p>
          </Section>

          <Section title="7. Job Listings">
            <p className="text-sm leading-relaxed">
              Job listings displayed on OrbitHire are sourced from third-party APIs (JSearch / RapidAPI). We do not
              verify, endorse, or guarantee the accuracy of any job listing. We are not responsible for any interactions
              you have with employers or third-party job platforms. Always research prospective employers independently.
            </p>
          </Section>

          <Section title="8. Intellectual Property">
            <p className="text-sm leading-relaxed">
              All platform code, design, branding, and non-user content are the intellectual property of OrbitHire and
              are protected under applicable copyright and trademark laws. You may not copy, modify, distribute, or
              create derivative works without our prior written consent.
            </p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p className="text-sm leading-relaxed">
              OrbitHire is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied,
              including but not limited to warranties of merchantability, fitness for a particular purpose, or
              non-infringement. We do not guarantee that the service will be uninterrupted, error-free, or that job
              matches will result in employment.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p className="text-sm leading-relaxed">
              To the maximum extent permitted by law, OrbitHire shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of or inability to use the platform,
              even if we have been advised of the possibility of such damages. Our total liability to you for any
              claims shall not exceed the amount you paid us in the past 12 months (if any).
            </p>
          </Section>

          <Section title="11. Termination">
            <p className="text-sm leading-relaxed">
              You may terminate your account at any time by deleting it from your account settings or by contacting us.
              We may suspend or terminate your account without notice if you violate these Terms. Upon termination, your
              right to use the service ceases immediately. Sections 5, 8, 9, 10, and 12 survive termination.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p className="text-sm leading-relaxed">
              These Terms are governed by the laws of India. Any disputes arising from these Terms shall be subject to
              the exclusive jurisdiction of the courts of Bengaluru, Karnataka, India.
            </p>
          </Section>

          <Section title="13. Changes to These Terms">
            <p className="text-sm leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes by updating the
              effective date and, where appropriate, sending an email notification. Continued use of the platform
              after changes constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="14. Contact">
            <p className="text-sm leading-relaxed">
              For questions about these Terms:
            </p>
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm space-y-1">
              <p><strong>OrbitHire</strong></p>
              <p>Email: <a href="mailto:legal@orbithire.com" className="text-blue-600 hover:underline">legal@orbithire.com</a></p>
            </div>
          </Section>
        </div>

        {/* Footer link */}
        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} OrbitHire. All rights reserved.</p>
          <Link href="/privacy-policy" className="text-blue-600 hover:underline font-medium">
            Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  );
}

/* ─── helper sub-components ─────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
