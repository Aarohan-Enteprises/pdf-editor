'use client';

import { useTranslations } from 'next-intl';
import type { StepProgress } from '@/lib/workflow-engine';
import type { StepType } from '@/lib/workflow-engine';
import { stepRegistry } from '@/lib/workflow-steps';

interface WorkflowProgressProps {
  steps: { stepId: string; type: StepType }[];
  progress: StepProgress[];
}

function StatusIcon({ status }: { status: StepProgress['status'] }) {
  switch (status) {
    case 'completed':
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'running':
      return (
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      );
    case 'error':
      return (
        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-slate-500" />
        </div>
      );
  }
}

export function WorkflowProgressStepper({ steps, progress }: WorkflowProgressProps) {
  const t = useTranslations('workflows');

  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const stepProgress = progress[i];
        const def = stepRegistry[step.type];
        const isLast = i === steps.length - 1;

        return (
          <div key={step.stepId} className="flex items-start gap-3">
            {/* Icon + connector line */}
            <div className="flex flex-col items-center">
              <StatusIcon status={stepProgress?.status || 'pending'} />
              {!isLast && (
                <div className={`w-0.5 h-6 ${
                  stepProgress?.status === 'completed'
                    ? 'bg-green-300 dark:bg-green-700'
                    : 'bg-gray-200 dark:bg-slate-700'
                }`} />
              )}
            </div>

            {/* Label */}
            <div className="pt-1.5">
              <p className={`text-sm font-medium ${
                stepProgress?.status === 'running'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : stepProgress?.status === 'completed'
                  ? 'text-green-600 dark:text-green-400'
                  : stepProgress?.status === 'error'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {t(def?.labelKey || step.type)}
              </p>
              {stepProgress?.status === 'error' && stepProgress.error && (
                <p className="text-xs text-red-500 mt-0.5">{stepProgress.error}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
