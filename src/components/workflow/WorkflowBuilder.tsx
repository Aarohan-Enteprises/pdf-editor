'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { WorkflowStep, StepType } from '@/lib/workflow-engine';
import { stepRegistry, allStepTypes } from '@/lib/workflow-steps';
import { generateWorkflowId, generateStepId, saveCustomWorkflow } from '@/lib/workflow-storage';
import { StepConfigPanel } from './StepConfigPanel';

interface WorkflowBuilderProps {
  onBack: () => void;
  onRun: (name: string, steps: WorkflowStep[]) => void;
  /** Pre-populate for editing an existing custom workflow */
  editId?: string;
  editName?: string;
  editDescription?: string;
  editSteps?: WorkflowStep[];
}

export function WorkflowBuilder({ onBack, onRun, editId, editName, editDescription, editSteps }: WorkflowBuilderProps) {
  const t = useTranslations('workflows');
  const [name, setName] = useState(editName || '');
  const [description, setDescription] = useState(editDescription || '');
  const [steps, setSteps] = useState<WorkflowStep[]>(
    editSteps?.map((s) => ({ ...s, config: { ...s.config } })) || []
  );

  const addStep = useCallback((type: StepType) => {
    const def = stepRegistry[type];
    setSteps((prev) => [
      ...prev,
      { id: generateStepId(), type, config: { ...def.defaultConfig } },
    ]);
  }, []);

  const removeStep = useCallback((index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveStep = useCallback((index: number, direction: 'up' | 'down') => {
    setSteps((prev) => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const updateStepConfig = useCallback((index: number, key: string, value: string | number | boolean) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], config: { ...next[index].config, [key]: value } };
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim() || steps.length === 0) return;
    saveCustomWorkflow({
      id: editId || generateWorkflowId(),
      name: name.trim(),
      description: description.trim(),
      steps,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    onBack();
  }, [name, description, steps, editId, onBack]);

  const handleSaveAndRun = useCallback(() => {
    if (!name.trim() || steps.length === 0) return;
    const id = editId || generateWorkflowId();
    saveCustomWorkflow({
      id,
      name: name.trim(),
      description: description.trim(),
      steps,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    onRun(name.trim(), steps);
  }, [name, description, steps, editId, onRun]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-3 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('backToList')}
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {editId ? t('editWorkflow') : t('createWorkflow')}
        </h2>
      </div>

      {/* Name & Description */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('workflowName')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('workflowNamePlaceholder')}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('workflowDescription')}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('workflowDescriptionPlaceholder')}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Available steps */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
            {t('availableSteps')}
          </h3>
          <div className="space-y-2">
            {allStepTypes.map((type) => {
              const def = stepRegistry[type];
              return (
                <button
                  key={type}
                  onClick={() => addStep(type)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all text-left"
                >
                  <div className={`w-8 h-8 rounded-lg ${def.lightBg} ${def.textColor} flex items-center justify-center flex-shrink-0`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t(def.labelKey)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t(def.descriptionKey)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Pipeline */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
            {t('pipeline')} ({steps.length})
          </h3>

          {steps.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {t('emptyPipeline')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, i) => {
                const def = stepRegistry[step.type];
                if (!def) return null;
                return (
                  <div key={step.id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-6 h-6 rounded-full ${def.lightBg} ${def.textColor} text-xs flex items-center justify-center font-semibold`}>
                        {i + 1}
                      </span>
                      <h4 className="font-medium text-gray-900 dark:text-white flex-1">{t(def.labelKey)}</h4>

                      {/* Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveStep(i, 'up')}
                          disabled={i === 0}
                          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveStep(i, 'down')}
                          disabled={i === steps.length - 1}
                          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeStep(i)}
                          className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove step"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <StepConfigPanel
                      fields={def.configFields}
                      config={step.config}
                      onChange={(key, value) => updateStepConfig(i, key, value)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          {steps.length > 0 && name.trim() && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 py-3 px-6 rounded-xl text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
              >
                {t('save')}
              </button>
              <button
                onClick={handleSaveAndRun}
                className="flex-1 py-3 px-6 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
              >
                {t('saveAndRun')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
