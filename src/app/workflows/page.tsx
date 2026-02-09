'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { WorkflowCard } from '@/components/workflow/WorkflowCard';
import { WorkflowExecutionWizard } from '@/components/workflow/WorkflowExecutionWizard';
import { WorkflowBuilder } from '@/components/workflow/WorkflowBuilder';
import { workflowTemplates } from '@/lib/workflow-templates';
import { getCustomWorkflows, deleteCustomWorkflow } from '@/lib/workflow-storage';
import { cloneStepsWithNewIds } from '@/lib/workflow-storage';
import { stepRegistry } from '@/lib/workflow-steps';
import type { WorkflowStep, CustomWorkflow } from '@/lib/workflow-engine';

type ViewMode = 'list' | 'execute' | 'builder';

export default function WorkflowsPage() {
  const t = useTranslations('workflows');
  const [view, setView] = useState<ViewMode>('list');
  const [customWorkflows, setCustomWorkflows] = useState<CustomWorkflow[]>([]);
  const [executeName, setExecuteName] = useState('');
  const [executeSteps, setExecuteSteps] = useState<WorkflowStep[]>([]);
  const [editWorkflow, setEditWorkflow] = useState<CustomWorkflow | null>(null);

  // Load custom workflows
  useEffect(() => {
    setCustomWorkflows(getCustomWorkflows());
  }, [view]); // Refresh when returning to list

  // Handle deep-links via hash
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const template = workflowTemplates.find((tpl) => tpl.id === hash);
      if (template) {
        setExecuteName(t(template.nameKey));
        setExecuteSteps(cloneStepsWithNewIds(template.steps));
        setView('execute');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRunTemplate = useCallback((templateId: string) => {
    const template = workflowTemplates.find((tpl) => tpl.id === templateId);
    if (!template) return;
    setExecuteName(t(template.nameKey));
    setExecuteSteps(cloneStepsWithNewIds(template.steps));
    setEditWorkflow(null);
    setView('execute');
  }, [t]);

  const handleRunCustom = useCallback((workflow: CustomWorkflow) => {
    setExecuteName(workflow.name);
    setExecuteSteps(cloneStepsWithNewIds(workflow.steps));
    setEditWorkflow(null);
    setView('execute');
  }, []);

  const handleEditCustom = useCallback((workflow: CustomWorkflow) => {
    setEditWorkflow(workflow);
    setView('builder');
  }, []);

  const handleDeleteCustom = useCallback((id: string) => {
    deleteCustomWorkflow(id);
    setCustomWorkflows(getCustomWorkflows());
  }, []);

  const handleBuilderRun = useCallback((name: string, steps: WorkflowStep[]) => {
    setExecuteName(name);
    setExecuteSteps(cloneStepsWithNewIds(steps));
    setEditWorkflow(null);
    setView('execute');
  }, []);

  const handleBackToList = useCallback(() => {
    setView('list');
    setEditWorkflow(null);
    // Clear hash
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          {/* Breadcrumb (list view only) */}
          {view === 'list' && (
            <div className="mb-8">
              <Link
                href="/#tools"
                className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('allTools')}
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {t('title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('subtitle')}
              </p>
            </div>
          )}

          {/* List View */}
          {view === 'list' && (
            <>
              {/* Pre-built templates */}
              <section className="mb-12">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {t('templatesLabel')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {workflowTemplates.map((tpl) => (
                    <WorkflowCard
                      key={tpl.id}
                      nameKey={tpl.nameKey}
                      descriptionKey={tpl.descriptionKey}
                      gradient={tpl.gradient}
                      lightBg={tpl.lightBg}
                      textColor={tpl.textColor}
                      steps={tpl.steps}
                      onAction={() => handleRunTemplate(tpl.id)}
                    />
                  ))}
                </div>
              </section>

              {/* Custom workflows */}
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('myWorkflows')}
                  </h2>
                  <button
                    onClick={() => { setEditWorkflow(null); setView('builder'); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('createNew')}
                  </button>
                </div>

                {customWorkflows.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl p-8 text-center">
                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 mb-3">
                      {t('noCustomWorkflows')}
                    </p>
                    <button
                      onClick={() => { setEditWorkflow(null); setView('builder'); }}
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {t('createFirst')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {customWorkflows.map((cw) => (
                      <div key={cw.id} className="relative group">
                        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 h-full flex flex-col transition-all duration-300 hover:shadow-soft-lg hover:border-gray-300 dark:hover:border-slate-600">
                          <div className="relative z-10 flex flex-col flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 flex items-center justify-center mb-3">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{cw.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 min-h-[2.5rem]">{cw.description || '\u00A0'}</p>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {cw.steps.map((step, i) => {
                                const def = stepRegistry[step.type];
                                return (
                                  <span
                                    key={i}
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${def?.lightBg || 'bg-gray-100 dark:bg-slate-700'} ${def?.textColor || 'text-gray-600 dark:text-gray-400'}`}
                                  >
                                    {t(def?.labelKey || step.type)}
                                  </span>
                                );
                              })}
                            </div>
                            <div className="flex gap-2 mt-auto">
                              <button
                                onClick={() => handleRunCustom(cw)}
                                className="flex-1 py-2 px-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                              >
                                {t('runWorkflow')}
                              </button>
                              <button
                                onClick={() => handleEditCustom(cw)}
                                className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteCustom(cw.id)}
                                className="p-2 rounded-xl text-gray-400 hover:text-red-500 border border-gray-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600 transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {/* Execute View */}
          {view === 'execute' && (
            <WorkflowExecutionWizard
              workflowName={executeName}
              initialSteps={executeSteps}
              onBack={handleBackToList}
            />
          )}

          {/* Builder View */}
          {view === 'builder' && (
            <WorkflowBuilder
              onBack={handleBackToList}
              onRun={handleBuilderRun}
              editId={editWorkflow?.id}
              editName={editWorkflow?.name}
              editDescription={editWorkflow?.description}
              editSteps={editWorkflow?.steps}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
