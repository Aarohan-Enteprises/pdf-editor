'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';

const tools = [
  {
    id: 'merge',
    href: '/merge',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'split',
    href: '/split',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    color: 'bg-orange-500',
    lightBg: 'bg-orange-50 dark:bg-orange-950/30',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'jpgToPdf',
    href: '/jpg-to-pdf',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-green-500',
    lightBg: 'bg-green-50 dark:bg-green-950/30',
    textColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'pdfToJpg',
    href: '/pdf-to-jpg',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'bg-purple-500',
    lightBg: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'rotate',
    href: '/rotate',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    color: 'bg-cyan-500',
    lightBg: 'bg-cyan-50 dark:bg-cyan-950/30',
    textColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'watermark',
    href: '/watermark',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-pink-500',
    lightBg: 'bg-pink-50 dark:bg-pink-950/30',
    textColor: 'text-pink-600 dark:text-pink-400',
  },
];

function ToolCard({ tool }: { tool: typeof tools[0] }) {
  const t = useTranslations('tools');

  return (
    <Link href={tool.href} className="group">
      <div className="card card-hover p-6 h-full">
        <div className={`w-16 h-16 rounded-2xl ${tool.lightBg} ${tool.textColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          {tool.icon}
        </div>
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
          {t(`${tool.id}.title`)}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t(`${tool.id}.description`)}
        </p>
      </div>
    </Link>
  );
}

function TrustBadge({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const tHero = useTranslations('hero');
  const tTrust = useTranslations('trust');

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg-subtle" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="relative w-full px-6 lg:px-12 py-12 lg:py-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {tHero('title')}
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300">
              {tHero('subtitle')}
            </p>
          </div>

          {/* Trust Badges */}
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            <TrustBadge
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              title={tTrust('secure.title')}
              description={tTrust('secure.description')}
            />
            <TrustBadge
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title={tTrust('free.title')}
              description={tTrust('free.description')}
            />
            <TrustBadge
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title={tTrust('fast.title')}
              description={tTrust('fast.description')}
            />
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-12 lg:py-16 bg-gray-50 dark:bg-slate-900/50">
        <div className="w-full px-6 lg:px-12">
          <div className="text-center mb-10">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Choose a Tool
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Select the PDF tool you need
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
