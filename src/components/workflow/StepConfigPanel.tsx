'use client';

import { useTranslations } from 'next-intl';
import type { ConfigField } from '@/lib/workflow-steps';

interface StepConfigPanelProps {
  fields: ConfigField[];
  config: Record<string, string | number | boolean>;
  onChange: (key: string, value: string | number | boolean) => void;
}

export function StepConfigPanel({ fields, config, onChange }: StepConfigPanelProps) {
  const t = useTranslations('workflows');

  if (fields.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 italic">
        {t('noConfigNeeded')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t(field.labelKey)}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>

          {field.type === 'select' && field.options && (
            <select
              value={String(config[field.key] ?? '')}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          )}

          {field.type === 'text' && (
            <input
              type="text"
              value={String(config[field.key] ?? '')}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          )}

          {field.type === 'password' && (
            <input
              type="password"
              value={String(config[field.key] ?? '')}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          )}

          {field.type === 'number' && (
            <input
              type="number"
              value={Number(config[field.key] ?? field.min ?? 1)}
              onChange={(e) => onChange(field.key, Number(e.target.value))}
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          )}

          {field.type === 'range' && (
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={Number(config[field.key] ?? 0.3)}
                onChange={(e) => onChange(field.key, Number(e.target.value))}
                min={field.min ?? 0}
                max={field.max ?? 1}
                step={field.step ?? 0.05}
                className="flex-1 accent-indigo-600"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 w-10 text-right">
                {Math.round(Number(config[field.key] ?? 0.3) * 100)}%
              </span>
            </div>
          )}

          {field.type === 'color' && (
            <input
              type="color"
              value={String(config[field.key] ?? '#888888')}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-12 h-10 rounded-lg border border-gray-300 dark:border-slate-600 cursor-pointer"
            />
          )}
        </div>
      ))}
    </div>
  );
}
