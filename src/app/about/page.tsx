'use client';

import { PageLayout } from '@/components/layout/PageLayout';

export default function AboutPage() {
  return (
    <PageLayout>
      {/* Hero Section with Team Photo */}
      <section className="relative overflow-hidden">
        <img
          src="/about-team.jpg"
          alt="Our team"
          className="absolute inset-0 w-full h-full object-cover"
          width={1280}
          height={720}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 via-indigo-900/80 to-indigo-900/60" />

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-20 lg:py-28">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-indigo-200 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            About Us
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            About <span className="text-indigo-300">PDF2.in</span>
          </h1>
          <p className="text-lg lg:text-xl text-indigo-100 max-w-2xl">
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
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
                Whether you&apos;re a student working on assignments, a professional handling contracts, or anyone
                who needs to work with PDFs, our tools are designed to make your life easier without compromising
                on features or security.
              </p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { number: '20+', label: 'PDF Tools' },
                  { number: '100%', label: 'Free Forever' },
                  { number: '0', label: 'Data Stored' },
                  { number: '24/7', label: 'Available' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xl lg:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stat.number}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img
                src="/about-mission.svg"
                alt="PDF tools and technology"
                className="w-full max-w-md lg:max-w-lg drop-shadow-xl"
                width={500}
                height={500}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-16 lg:py-20 bg-gray-50 dark:bg-slate-800/50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="flex items-center justify-center order-2 lg:order-1">
              <img
                src="/about-privacy.svg"
                alt="Data security and privacy"
                className="w-full max-w-sm lg:max-w-md drop-shadow-xl"
                width={450}
                height={320}
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Privacy First
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Your Files Stay on Your Device
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                Unlike most online PDF tools, we process everything directly in your browser.
                Your sensitive documents never leave your computer.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'No Uploads Required', description: 'Files processed locally in your browser.', color: 'text-blue-600 dark:text-blue-400' },
                  { title: 'No Account Needed', description: 'No registration or sign-up required.', color: 'text-purple-600 dark:text-purple-400' },
                  { title: 'No Tracking', description: 'Zero personal data collection.', color: 'text-green-600 dark:text-green-400' },
                  { title: '100% Secure', description: 'We can&apos;t see your files even if we wanted to.', color: 'text-emerald-600 dark:text-emerald-400' },
                ].map((feature, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                    <h3 className={`font-semibold text-sm mb-1 ${feature.color}`}>{feature.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
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
