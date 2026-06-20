import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How OrbitHire collects, uses, and protects your personal information.',
};

const EFFECTIVE_DATE = 'June 20, 2025';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top nav bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-5">
            <Shield className="w-3.5 h-3.5" />
            Legal Document
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Effective date: <span className="font-semibold text-slate-700">{EFFECTIVE_DATE}</span></p>
        </div>

        {/* Intro */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-10">
          <p className="text-slate-700 text-sm leading-relaxed">
            OrbitHire (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the OrbitHire web application. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our platform. By using OrbitHire, you agree
            to the collection and use of information in accordance with this policy.
          </p>
        </div>

        <div className="space-y-12 text-slate-700">

          <Section title="1. Information We Collect">
            <Sub heading="a) Account Information">
              When you register, we collect your <strong>name</strong>, <strong>email address</strong>, and <strong>hashed password</strong>.
              We do not store plain-text passwords.
            </Sub>
            <Sub heading="b) Resume Data">
              When you upload a PDF resume, we extract and store structured data including your skills, work experience,
              education, and contact details. The original PDF file is processed server-side and the extracted text is stored
              in our database. Raw PDF files are not permanently retained.
            </Sub>
            <Sub heading="c) Job Application Data">
              We store the jobs you save, apply to, and any application stage updates you make within the platform.
            </Sub>
            <Sub heading="d) Usage Data">
              We collect standard server logs including IP address, browser type, pages visited, and timestamps to operate
              and improve the service. We do not use third-party analytics trackers.
            </Sub>
            <Sub heading="e) Email Communications">
              If you opt in, we send you a daily job digest email at 8 AM. You can unsubscribe at any time from within your
              account settings.
            </Sub>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed pl-1">
              <li>To create and manage your account</li>
              <li>To extract skills from your resume using Google Gemini AI</li>
              <li>To match and score job listings against your profile</li>
              <li>To send you daily job digest emails (with your consent)</li>
              <li>To generate AI-tailored resume versions for specific jobs</li>
              <li>To respond to support requests</li>
              <li>To detect and prevent fraudulent or abusive activity</li>
              <li>To improve and develop new product features</li>
            </ul>
          </Section>

          <Section title="3. AI and Third-Party Processing">
            <p className="text-sm leading-relaxed mb-3">
              OrbitHire uses <strong>Google Gemini API</strong> to process your resume text and job descriptions. When you
              upload a resume or request AI features, relevant text data is sent to Google&apos;s API for processing. This data
              is subject to{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                Google&apos;s Privacy Policy
              </a>.
            </p>
            <p className="text-sm leading-relaxed">
              We use <strong>JSearch API (via RapidAPI)</strong> to fetch job listings. Job search queries are sent to
              this third-party service. We do not share your personal identity with job providers.
            </p>
          </Section>

          <Section title="4. Data Retention">
            <p className="text-sm leading-relaxed">
              We retain your account data and resume profile for as long as your account is active. If you delete your account,
              we will delete your personal data within <strong>30 days</strong>, except where we are required by law to retain
              it for longer. Anonymised, aggregated analytics data may be retained indefinitely.
            </p>
          </Section>

          <Section title="5. Data Security">
            <p className="text-sm leading-relaxed">
              We implement industry-standard security measures including HTTPS/TLS encryption in transit, bcrypt password
              hashing, and JWT-based authentication. Access to our database is restricted and protected. However, no method
              of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="6. Cookies">
            <p className="text-sm leading-relaxed">
              OrbitHire stores a JWT authentication token in your browser&apos;s <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">localStorage</code>.
              We do not use advertising cookies or cross-site tracking cookies.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p className="text-sm leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed pl-1">
              <li><strong>Access</strong> — Request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — Request correction of inaccurate data</li>
              <li><strong>Deletion</strong> — Request deletion of your account and personal data</li>
              <li><strong>Opt-out</strong> — Unsubscribe from email digests at any time</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              To exercise any of these rights, email us at{' '}
              <a href="mailto:privacy@orbithire.com" className="text-blue-600 hover:underline font-medium">
                privacy@orbithire.com
              </a>.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p className="text-sm leading-relaxed">
              OrbitHire is not directed to individuals under the age of 16. We do not knowingly collect personal information
              from children. If we discover we have collected such information, we will delete it promptly.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p className="text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the
              effective date at the top of this page. Continued use of the service after changes constitutes your acceptance
              of the updated policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p className="text-sm leading-relaxed">
              If you have questions or concerns about this Privacy Policy, please contact us:
            </p>
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm space-y-1">
              <p><strong>OrbitHire</strong></p>
              <p>Email: <a href="mailto:privacy@orbithire.com" className="text-blue-600 hover:underline">privacy@orbithire.com</a></p>
            </div>
          </Section>
        </div>

        {/* Footer link */}
        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} OrbitHire. All rights reserved.</p>
          <Link href="/terms-of-service" className="text-blue-600 hover:underline font-medium">
            Terms of Service →
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

function Sub({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1.5">{heading}</h3>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}
