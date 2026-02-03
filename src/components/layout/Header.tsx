'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Header() {
  const t = useTranslations('common');

  return (
    <header className="glass sticky top-0 z-50 border-b border-gray-200/50 dark:border-slate-700/50">
      <div className="w-full px-6 lg:px-12 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('appName')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{t('tagline')}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
