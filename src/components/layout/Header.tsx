'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toolNavItems } from '@/lib/tools-data';

export function Header() {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const tTools = useTranslations('tools');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    if (isToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isToolsOpen]);

  const categories = [
    { key: 'organize' as const, label: tNav('organize') },
    { key: 'convert' as const, label: tNav('convert') },
    { key: 'edit' as const, label: tNav('edit') },
    { key: 'secure' as const, label: tNav('secure') },
  ];

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
          <img src="/logo.svg" alt="PDF2.in" className="w-10 h-10 rounded-xl" width={40} height={40} />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('appName')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{t('tagline')}</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {/* Tools Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isToolsOpen
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {tNav('tools')}
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Panel */}
            {isToolsOpen && (
              <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-[calc(100vw-2rem)] sm:w-[540px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-4 z-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((cat) => {
                    const items = toolNavItems.filter((item) => item.category === cat.key);
                    return (
                      <div key={cat.key}>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-2">
                          {cat.label}
                        </h4>
                        <div className="space-y-0.5">
                          {items.map((item) => (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => setIsToolsOpen(false)}
                              className="block px-2 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              {tTools(`${item.id}.title`)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                  <Link
                    href="/#tools"
                    onClick={() => setIsToolsOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                  >
                    {tNav('allTools')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>

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
