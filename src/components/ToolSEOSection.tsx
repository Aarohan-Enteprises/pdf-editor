'use client';

import { useState } from 'react';
import { toolSEOContent } from '@/lib/tool-seo-content';

interface ToolSEOSectionProps {
  toolId: string;
}

export function ToolSEOSection({ toolId }: ToolSEOSectionProps) {
  const content = toolSEOContent[toolId];
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  if (!content) return null;

  return (
    <div className="mt-16 border-t border-gray-200 dark:border-slate-700 pt-12 space-y-12">
      {/* How-To Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          {content.howToTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-gray-50 dark:bg-slate-800/50 rounded-xl p-5 border border-gray-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      {content.faqs.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 max-w-3xl">
            {content.faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 text-gray-500 transition-transform duration-200 ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFAQ === index && (
                  <div className="px-5 pb-4 bg-white dark:bg-slate-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
