'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { useState, useEffect, useRef } from 'react';
import { getFeaturedTemplates } from '@/lib/workflow-templates';
import { WorkflowCard } from '@/components/workflow/WorkflowCard';

const tools = [
  {
    id: 'merge',
    href: '/merge',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    category: 'organize',
  },
  {
    id: 'split',
    href: '/split',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    gradient: 'from-orange-500 to-orange-600',
    lightBg: 'bg-orange-50 dark:bg-orange-950/30',
    textColor: 'text-orange-600 dark:text-orange-400',
    category: 'organize',
  },
  {
    id: 'rotate',
    href: '/rotate',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    gradient: 'from-cyan-500 to-cyan-600',
    lightBg: 'bg-cyan-50 dark:bg-cyan-950/30',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    category: 'organize',
  },
  {
    id: 'deletePages',
    href: '/delete-pages',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    gradient: 'from-red-500 to-red-600',
    lightBg: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-600 dark:text-red-400',
    category: 'organize',
  },
  {
    id: 'reversePages',
    href: '/reverse-pages',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    gradient: 'from-amber-500 to-amber-600',
    lightBg: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    category: 'organize',
  },
  {
    id: 'duplicatePages',
    href: '/duplicate-pages',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-lime-500 to-lime-600',
    lightBg: 'bg-lime-50 dark:bg-lime-950/30',
    textColor: 'text-lime-600 dark:text-lime-400',
    category: 'organize',
  },
  {
    id: 'insertBlank',
    href: '/insert-blank',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    gradient: 'from-slate-500 to-slate-600',
    lightBg: 'bg-slate-50 dark:bg-slate-950/30',
    textColor: 'text-slate-600 dark:text-slate-400',
    category: 'organize',
  },
  {
    id: 'organizePdf',
    href: '/organize-pdf',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ),
    gradient: 'from-cyan-500 to-cyan-600',
    lightBg: 'bg-cyan-50 dark:bg-cyan-950/30',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    category: 'organize',
  },
  {
    id: 'jpgToPdf',
    href: '/jpg-to-pdf',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-green-500 to-green-600',
    lightBg: 'bg-green-50 dark:bg-green-950/30',
    textColor: 'text-green-600 dark:text-green-400',
    category: 'convert',
  },
  {
    id: 'pdfToJpg',
    href: '/pdf-to-jpg',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    gradient: 'from-purple-500 to-purple-600',
    lightBg: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    category: 'convert',
  },
  {
    id: 'extractText',
    href: '/extract-text',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    gradient: 'from-sky-500 to-sky-600',
    lightBg: 'bg-sky-50 dark:bg-sky-950/30',
    textColor: 'text-sky-600 dark:text-sky-400',
    category: 'convert',
  },
  {
    id: 'watermark',
    href: '/watermark',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-pink-500 to-pink-600',
    lightBg: 'bg-pink-50 dark:bg-pink-950/30',
    textColor: 'text-pink-600 dark:text-pink-400',
    category: 'edit',
  },
  {
    id: 'pageNumbers',
    href: '/page-numbers',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    ),
    gradient: 'from-indigo-500 to-indigo-600',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    category: 'edit',
  },
  {
    id: 'signPdf',
    href: '/sign-pdf',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    gradient: 'from-rose-500 to-rose-600',
    lightBg: 'bg-rose-50 dark:bg-rose-950/30',
    textColor: 'text-rose-600 dark:text-rose-400',
    category: 'edit',
  },
  {
    id: 'editMetadata',
    href: '/edit-metadata',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-violet-500 to-violet-600',
    lightBg: 'bg-violet-50 dark:bg-violet-950/30',
    textColor: 'text-violet-600 dark:text-violet-400',
    category: 'edit',
  },
  {
    id: 'redact',
    href: '/redact',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        <rect x="8" y="7" width="8" height="3" fill="currentColor" opacity="0.5" />
      </svg>
    ),
    gradient: 'from-gray-600 to-gray-700',
    lightBg: 'bg-gray-50 dark:bg-gray-950/30',
    textColor: 'text-gray-600 dark:text-gray-400',
    category: 'edit',
  },
  {
    id: 'compress',
    href: '/compress',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-emerald-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    category: 'edit',
  },
  {
    id: 'flattenPdf',
    href: '/flatten-pdf',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    gradient: 'from-teal-500 to-teal-600',
    lightBg: 'bg-teal-50 dark:bg-teal-950/30',
    textColor: 'text-teal-600 dark:text-teal-400',
    category: 'edit',
  },
  {
    id: 'lockPdf',
    href: '/lock-pdf',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-emerald-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    category: 'secure',
  },
  {
    id: 'unlockPdf',
    href: '/unlock-pdf',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-yellow-500 to-yellow-600',
    lightBg: 'bg-yellow-50 dark:bg-yellow-950/30',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    category: 'secure',
  },
  {
    id: 'docxToPdf',
    href: '/docx-to-pdf',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-red-500 to-red-600',
    lightBg: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-600 dark:text-red-400',
    category: 'convert',
  },
  {
    id: 'pdfToDocx',
    href: '/pdf-to-docx',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    category: 'convert',
  },
];

const upcomingTools = [
  {
    id: 'pdfToPptx',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    gradient: 'from-orange-500 to-orange-600',
    lightBg: 'bg-orange-50 dark:bg-orange-950/30',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'pptxToPdf',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    gradient: 'from-amber-500 to-amber-600',
    lightBg: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'excelToPdf',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-green-600 to-green-700',
    lightBg: 'bg-green-50 dark:bg-green-950/30',
    textColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'htmlToPdf',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    gradient: 'from-purple-500 to-purple-600',
    lightBg: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
];

// Custom hook for staggered animation
function useStaggeredAnimation(itemCount: number, delay: number = 50) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    for (let i = 0; i < itemCount; i++) {
      timeouts.push(
        setTimeout(() => {
          setVisibleItems(prev => [...prev, i]);
        }, i * delay)
      );
    }
    return () => timeouts.forEach(clearTimeout);
  }, [itemCount, delay]);

  return visibleItems;
}

// Custom hook for intersection observer
function useInView(threshold: number = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Animated counter hook
function useCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(!startOnView);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasStarted]);

  return { count, start: () => setHasStarted(true) };
}

function ToolCard({ tool, index, isVisible }: { tool: typeof tools[0]; index: number; isVisible: boolean }) {
  const t = useTranslations('tools');

  return (
    <Link href={tool.href} className="group">
      <div
        className={`gradient-border relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 h-full transition-all duration-300 hover:shadow-soft-lg hover:border-gray-300 dark:hover:border-slate-600 hover:-translate-y-0.5 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionDelay: `${index * 30}ms` }}
      >
        <div className="relative z-10">
          <div className={`w-12 h-12 rounded-xl ${tool.lightBg} ${tool.textColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-200 group-hover:shadow-md`}>
            {tool.icon}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {t(`${tool.id}.title`)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {t(`${tool.id}.description`)}
          </p>
        </div>

        {/* Arrow indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0 -translate-x-1">
          <svg className={`w-5 h-5 ${tool.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function UpcomingToolCard({ tool, index, isVisible }: { tool: typeof upcomingTools[0]; index: number; isVisible: boolean }) {
  const t = useTranslations('tools');

  return (
    <div className="group">
      <div
        className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 h-full transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionDelay: `${index * 30}ms` }}
      >
        {/* Coming Soon Badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white">
            Coming Soon
          </span>
        </div>

        <div className="relative z-10">
          <div className={`w-12 h-12 rounded-xl ${tool.lightBg} ${tool.textColor} flex items-center justify-center mb-3 opacity-60`}>
            {tool.icon}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {t(`${tool.id}.title`)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {t(`${tool.id}.description`)}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { ref, isInView } = useInView();
  const { count, start } = useCounter(value, 1500, true);

  useEffect(() => {
    if (isInView) start();
  }, [isInView, start]);

  return (
    <div
      ref={ref}
      className="text-center transition-all duration-700"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(16px)',
      }}
    >
      <div className="text-3xl lg:text-4xl font-bold text-indigo-600 dark:text-indigo-400">
        {value === 0 ? '0' : count}{suffix}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}

type CategoryFilter = 'all' | 'organize' | 'convert' | 'edit' | 'secure' | 'workflows';

export default function HomePage() {
  const tHero = useTranslations('hero');
  const tTrust = useTranslations('trust');
  const tNav = useTranslations('nav');
  const visibleItems = useStaggeredAnimation(tools.length + upcomingTools.length, 40);
  const { ref: toolsRef, isInView: toolsInView } = useInView(0.05);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const organizeTools = tools.filter(t => t.category === 'organize');
  const convertTools = tools.filter(t => t.category === 'convert');
  const editTools = tools.filter(t => t.category === 'edit');
  const secureTools = tools.filter(t => t.category === 'secure');

  const categoryTabs: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: tNav('allTools') },
    { key: 'organize', label: tNav('organize') },
    { key: 'convert', label: tNav('convert') },
    { key: 'edit', label: tNav('edit') },
    { key: 'secure', label: tNav('secure') },
    { key: 'workflows', label: tNav('workflows') },
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[40vh] flex items-center">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] " />
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium opacity-0 animate-fade-in-up">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  100% Private
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight opacity-0 animate-fade-in-up animation-delay-100">
                  {tHero('title').split(' ').map((word, i) => (
                    <span key={i} className={i === 0 ? 'text-indigo-600 dark:text-indigo-400' : ''}>
                      {word}{' '}
                    </span>
                  ))}
                </h1>
                <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-xl opacity-0 animate-fade-in-up animation-delay-200">
                  {tHero('subtitle')}
                </p>
              </div>

              {/* Dual CTA Buttons */}
              <div className="flex flex-wrap gap-4 opacity-0 animate-fade-in-up animation-delay-300">
                <Link
                  href="#tools"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold shadow-button hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                >
                  {tHero('cta')}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="#tools"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:-translate-y-0.5"
                >
                  {tHero('ctaSecondary')}
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200 dark:border-slate-700">
                <StatCard value={tools.length} label="PDF Tools" suffix="+" />
                <StatCard value={100} label="Free Forever" suffix="%" />
                <StatCard value={0} label="Uploads to Server" />
              </div>
            </div>

            {/* Right - Hero Illustration */}
            <div className="flex items-center justify-center opacity-0 animate-fade-in-up animation-delay-300">
              <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
                {/* Glow behind illustration */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-full blur-3xl scale-110" />
                <img
                  src="/hero-illustration.svg"
                  alt="Secure PDF editing"
                  className="relative w-full h-auto drop-shadow-2xl animate-float"
                  width={520}
                  height={520}
                />
              </div>
            </div>
          </div>

          {/* Trust Badges - compact inline */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mt-10 opacity-0 animate-fade-in-up animation-delay-500">
            {[
              { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, label: tTrust('secure.title'), color: 'text-green-600 dark:text-green-400' },
              { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: tTrust('free.title'), color: 'text-blue-600 dark:text-blue-400' },
              { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, label: tTrust('fast.title'), color: 'text-amber-600 dark:text-amber-400' },
              { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>, label: tTrust('noAds.title'), color: 'text-rose-600 dark:text-rose-400' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={badge.color}>{badge.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" ref={toolsRef} className="py-16 lg:py-20 bg-white dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Section Header */}
          <div className="text-center mb-12">
            <p className="section-label mb-3">PDF Tools</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Tool
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Select from our comprehensive suite of free online PDF tools. Whether you need to merge, split, compress, or convert files, every operation runs directly in your browser. Your documents never leave your device — no uploads, no accounts, no limits.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex justify-center mb-10 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="inline-flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 max-w-full scrollbar-hide">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeCategory === tab.key
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Organize Tools */}
          {(activeCategory === 'all' || activeCategory === 'organize') && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Organize Pages</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-3xl">
              Rearrange, merge, split, delete, reverse, or duplicate pages within your PDF. Perfect for assembling documents from multiple sources or removing pages you no longer need.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {organizeTools.map((tool, index) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  index={index}
                  isVisible={toolsInView && visibleItems.includes(index)}
                />
              ))}
            </div>
          </div>
          )}

          {/* Convert Tools */}
          {(activeCategory === 'all' || activeCategory === 'convert') && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Convert & Extract</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-3xl">
              Convert between PDF and other formats including Word, JPG, and PNG. Extract text content from scanned or digital PDFs for easy editing and reuse.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {convertTools.map((tool, index) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  index={index + organizeTools.length}
                  isVisible={toolsInView && visibleItems.includes(index + organizeTools.length)}
                />
              ))}
            </div>
          </div>
          )}

          {/* Edit Tools */}
          {(activeCategory === 'all' || activeCategory === 'edit') && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit & Enhance</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-3xl">
              Add watermarks, page numbers, signatures, and metadata to your PDFs. Compress files to reduce size, redact sensitive information, or flatten form fields — all without installing any software.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {editTools.map((tool, index) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  index={index + organizeTools.length + convertTools.length}
                  isVisible={toolsInView && visibleItems.includes(index + organizeTools.length + convertTools.length)}
                />
              ))}
            </div>
          </div>
          )}

          {/* Security Tools */}
          {(activeCategory === 'all' || activeCategory === 'secure') && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Security</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-3xl">
              Protect your PDF with a password or remove existing password protection. Keep sensitive documents secure while maintaining full control over access.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {secureTools.map((tool, index) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  index={index + organizeTools.length + convertTools.length + editTools.length}
                  isVisible={toolsInView && visibleItems.includes(index + organizeTools.length + convertTools.length + editTools.length)}
                />
              ))}
            </div>
          </div>
          )}

          {/* Workflows */}
          {(activeCategory === 'all' || activeCategory === 'workflows') && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Workflows</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getFeaturedTemplates().map((tpl) => (
                <WorkflowCard
                  key={tpl.id}
                  nameKey={tpl.nameKey}
                  descriptionKey={tpl.descriptionKey}
                  gradient={tpl.gradient}
                  lightBg={tpl.lightBg}
                  textColor={tpl.textColor}
                  steps={tpl.steps}
                  onAction={() => { window.location.href = `/workflows#${tpl.id}`; }}
                />
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/workflows"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all workflows
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
          )}

          {/* Coming Soon Tools */}
          {activeCategory === 'all' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Coming Soon</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {upcomingTools.map((tool, index) => (
                <UpcomingToolCard
                  key={tool.id}
                  tool={tool}
                  index={index + organizeTools.length + convertTools.length + editTools.length + secureTools.length}
                  isVisible={toolsInView && visibleItems.includes(index + organizeTools.length + convertTools.length + editTools.length + secureTools.length)}
                />
              ))}
            </div>
          </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-20 bg-gray-50 dark:bg-slate-800/50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Everything you need to know about our free online PDF editor.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: 'Is PDF2.in really free to use?',
                a: 'Yes, PDF2.in is completely free with no hidden fees, no premium tiers, and no usage limits. Every PDF tool on this site — from merging and splitting to compressing and converting — is available at no cost. There is no account or signup required to get started.',
              },
              {
                q: 'Are my files safe and private?',
                a: 'Absolutely. PDF2.in processes your documents entirely within your web browser using client-side JavaScript. Your PDF files are never uploaded to a remote server, which means no one else can access your data. Once you close the tab, your files are gone from memory.',
              },
              {
                q: 'What PDF tools are available?',
                a: 'PDF2.in offers a full suite of over 20 tools. You can merge multiple PDFs into one, split a document into parts, rotate or delete pages, compress file size, add watermarks or page numbers, sign documents, redact sensitive content, edit metadata, convert between PDF and Word or image formats, and much more.',
              },
              {
                q: 'Do I need to install any software?',
                a: 'No. PDF2.in is a web-based PDF editor that works directly in your browser on any device — desktop, tablet, or phone. There is nothing to download or install. Just open the site, pick a tool, and start editing your PDF instantly.',
              },
              {
                q: 'What file formats are supported for conversion?',
                a: 'You can convert PDF to Word (DOCX), PDF to JPG, PNG, or WebP images, and vice versa. Image-to-PDF conversion supports JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, HEIC, and SVG formats. Word-to-PDF conversion preserves formatting, tables, and images from your original document.',
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-left font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  {item.q}
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4 transition-transform duration-200 group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-6 pb-5 text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </PageLayout>
  );
}
