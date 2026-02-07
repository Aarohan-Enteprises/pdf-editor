'use client';

import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('common');
  const tFooter = useTranslations('footer');

  return (
    <footer className="mt-auto bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white">
      <div className="w-full px-6 lg:px-12 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="PDF2.in" className="w-8 h-8 rounded-lg" width={32} height={32} />
            <span className="font-bold">{t('appName')}</span>
            <span className="text-indigo-400 mx-1">|</span>
            <span className="text-sm text-indigo-200">{tFooter('tagline')}</span>
          </div>
          <p className="text-xs text-indigo-300 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {tFooter('privacy')}
          </p>
        </div>
      </div>
    </footer>
  );
}
