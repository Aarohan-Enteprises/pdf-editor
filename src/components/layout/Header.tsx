'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback, useRef } from 'react';

export function Header() {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setIsScrolled(currentScrollY > 10);

    if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    lastScrollY.current = currentScrollY;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <header
      className={`glass sticky top-0 z-50 border-b transition-all duration-300 ${
        isScrolled
          ? 'border-gray-200/70 dark:border-slate-700/70 shadow-soft'
          : 'border-gray-200/50 dark:border-slate-700/50'
      } ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-12 py-3 flex items-center justify-between">
        {/* Logo */}
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

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <Link
            href="/about"
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            {tNav('about')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
