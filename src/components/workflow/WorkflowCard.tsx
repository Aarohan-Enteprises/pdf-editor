'use client';

import { useTranslations } from 'next-intl';
import type { StepType } from '@/lib/workflow-engine';
import { stepRegistry } from '@/lib/workflow-steps';

interface WorkflowCardProps {
  nameKey: string;
  descriptionKey: string;
  gradient: string;
  lightBg: string;
  textColor: string;
  steps: { type: StepType }[];
  onAction: () => void;
  actionLabel?: string;
}

export function WorkflowCard({ nameKey, descriptionKey, lightBg, textColor, steps, onAction, actionLabel }: WorkflowCardProps) {
  const t = useTranslations('workflows');

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 sm:p-5 h-full flex flex-col transition-all duration-300 hover:shadow-soft-lg hover:border-gray-300 dark:hover:border-slate-600 hover:-translate-y-0.5">
      <div className="relative z-10 flex flex-col flex-1">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${lightBg} ${textColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-200 group-hover:shadow-md`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
          {t(nameKey)}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 min-h-[2.5rem]">
          {t(descriptionKey)}
        </p>

        {/* Step flow */}
        <div className="flex flex-wrap items-center gap-1 mb-4">
          {steps.map((step, i) => {
            const def = stepRegistry[step.type];
            return (
              <span key={i} className="inline-flex items-center gap-0.5 sm:gap-1">
                <span
                  className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${def?.lightBg || 'bg-gray-100 dark:bg-slate-700'} ${def?.textColor || 'text-gray-600 dark:text-gray-400'}`}
                >
                  {t(def?.labelKey || step.type)}
                </span>
                {i < steps.length - 1 && (
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </span>
            );
          })}
        </div>

        {/* Action - pushed to bottom */}
        <div className="mt-auto">
          <button
            onClick={onAction}
            className="w-full py-2 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
          >
            {actionLabel || t('runWorkflow')}
          </button>
        </div>
      </div>
    </div>
  );
}
