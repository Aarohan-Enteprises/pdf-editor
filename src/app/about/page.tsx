'use client';

import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';

export default function AboutPage() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')]" />

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-16 lg:py-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            About Us
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            About <span className="text-indigo-600 dark:text-indigo-400">PDF2.in</span>
          </h1>
          <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
            Empowering millions with free, secure, and powerful PDF tools that respect your privacy.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 lg:py-20 bg-white dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Our Mission
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Making PDF Tools Accessible to Everyone
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
                We believe that powerful document tools should be available to everyone, regardless of budget.
                PDF2.in was built to democratize PDF editing by providing professional-grade tools completely free of charge.
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                Whether you&apos;re a student working on assignments, a professional handling contracts, or anyone
                who needs to work with PDFs, our tools are designed to make your life easier without compromising
                on features or security.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { number: '20+', label: 'PDF Tools', icon: '🛠️' },
                { number: '100%', label: 'Free Forever', icon: '💰' },
                { number: '0', label: 'Data Stored', icon: '🔒' },
                { number: '24/7', label: 'Available', icon: '⏰' },
              ].map((stat, i) => (
                <div key={i} className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-6 text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl lg:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stat.number}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-16 lg:py-20 bg-gray-50 dark:bg-slate-800/50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Privacy First
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your Files Stay on Your Device
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">
              Unlike most online PDF tools, we process everything directly in your browser.
              Your sensitive documents never leave your computer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'No Uploads Required',
                description: 'Your files are processed locally using advanced browser technology.',
                color: 'bg-blue-500',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                title: 'No Account Needed',
                description: 'Start using our tools instantly. No registration or sign-up required.',
                color: 'bg-purple-500',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
                title: 'No Tracking',
                description: 'We don&apos;t track your documents or collect any personal data.',
                color: 'bg-green-500',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: '100% Secure',
                description: 'Your data stays private. Always. We can&apos;t see your files even if we wanted to.',
                color: 'bg-emerald-500',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-20 bg-gray-50 dark:bg-slate-800/50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Get In Touch
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                We&apos;d Love to Hear From You
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Have questions, suggestions, or feedback? Our team is here to help.
                Reach out to us and we&apos;ll get back to you as soon as possible.
              </p>
            </div>
            <div>
              <a
                href="mailto:contact@pdf2.in"
                className="flex items-center gap-4 p-6 rounded-2xl bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-indigo-500 transition-colors flex-shrink-0">
                  <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Email us at</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">contact@pdf2.in</div>
                </div>
                <svg className="w-6 h-6 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="py-16 lg:py-20 bg-white dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-950/50 rounded-3xl p-8 lg:p-12 border border-indigo-100 dark:border-slate-700">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-10 h-10 lg:w-12 lg:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-1">Developed By</div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    Aarohan Enterprises
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Nagpur, India
                  </p>
                </div>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Building innovative software solutions that make everyday tasks simpler and more efficient.
                  PDF2.in is crafted with modern web technologies to deliver the best possible user experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
