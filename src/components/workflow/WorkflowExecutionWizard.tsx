'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { WorkflowStep, WorkflowProgress } from '@/lib/workflow-engine';
import { executeWorkflow } from '@/lib/workflow-engine';
import { stepRegistry } from '@/lib/workflow-steps';
import { createStepExecutors } from '@/lib/workflow-steps';
import { downloadPDF } from '@/lib/pdf-operations';
import { usePDFPreview } from '@/hooks/usePDFPreview';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { StepConfigPanel } from './StepConfigPanel';
import { WorkflowProgressStepper } from './WorkflowProgress';

type Phase = 'upload' | 'configure' | 'processing' | 'done' | 'error';

interface WorkflowExecutionWizardProps {
  workflowName: string;
  initialSteps: WorkflowStep[];
  onBack: () => void;
}

export function WorkflowExecutionWizard({ workflowName, initialSteps, onBack }: WorkflowExecutionWizardProps) {
  const t = useTranslations('workflows');
  const [phase, setPhase] = useState<Phase>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>(() =>
    initialSteps.map((s) => ({ ...s, config: { ...s.config } }))
  );
  const [progress, setProgress] = useState<WorkflowProgress | null>(null);
  const [resultData, setResultData] = useState<Uint8Array | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isPreviewOpen,
    previewData,
    previewFilename,
    showPreview,
    closePreview,
    downloadPreview,
  } = usePDFPreview();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setPhase('configure');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
      setPhase('configure');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const updateStepConfig = useCallback((stepIndex: number, key: string, value: string | number | boolean) => {
    setSteps((prev) => {
      const next = [...prev];
      next[stepIndex] = { ...next[stepIndex], config: { ...next[stepIndex].config, [key]: value } };
      return next;
    });
  }, []);

  const isConfigValid = useCallback(() => {
    for (const step of steps) {
      const def = stepRegistry[step.type];
      if (!def) return false;
      for (const field of def.configFields) {
        if (field.required) {
          const val = step.config[field.key];
          if (val === undefined || val === null || val === '') return false;
        }
      }
    }
    return true;
  }, [steps]);

  const runWorkflow = useCallback(async () => {
    if (!file) return;
    setPhase('processing');
    setErrorMessage('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      const executors = createStepExecutors();

      const result = await executeWorkflow(pdfData, steps, executors, (p) => {
        setProgress({ ...p });
      });

      setResultData(result);
      setPhase('done');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Workflow failed');
      setPhase('error');
    }
  }, [file, steps]);

  const getOutputFilename = useCallback(() => {
    if (!file) return 'workflow.pdf';
    return file.name.replace(/\.pdf$/i, '') + '-workflow.pdf';
  }, [file]);

  const handleDownload = useCallback(() => {
    if (resultData) {
      downloadPDF(resultData, getOutputFilename());
    }
  }, [resultData, getOutputFilename]);

  const handlePreview = useCallback(() => {
    if (resultData) {
      showPreview(resultData, getOutputFilename());
    }
  }, [resultData, getOutputFilename, showPreview]);

  const handleReset = useCallback(() => {
    setPhase('upload');
    setFile(null);
    setProgress(null);
    setResultData(null);
    setErrorMessage('');
    setSteps(initialSteps.map((s) => ({ ...s, config: { ...s.config } })));
  }, [initialSteps]);

  return (
    <div className="max-w-2xl mx-auto">
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{workflowName}</h2>

        {/* Phase indicators */}
        <div className="flex items-center gap-2 mt-4">
          {(['upload', 'configure', 'processing', 'done'] as const).map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                phase === p || (phase === 'error' && p === 'processing')
                  ? 'bg-indigo-600 text-white'
                  : (['upload', 'configure', 'processing', 'done'].indexOf(phase === 'error' ? 'processing' : phase) > i)
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500'
              }`}>
                {(['upload', 'configure', 'processing', 'done'].indexOf(phase === 'error' ? 'processing' : phase) > i) ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div className={`w-8 h-0.5 ${
                  (['upload', 'configure', 'processing', 'done'].indexOf(phase === 'error' ? 'processing' : phase) > i)
                    ? 'bg-green-300 dark:bg-green-700'
                    : 'bg-gray-200 dark:bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Phase */}
      {phase === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
        >
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('uploadTitle')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('uploadSubtitle')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Configure Phase */}
      {phase === 'configure' && file && (
        <div>
          {/* File info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={handleReset}
              className="ml-auto text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              {t('changeFile')}
            </button>
          </div>

          {/* Step configs */}
          <div className="space-y-4">
            {steps.map((step, i) => {
              const def = stepRegistry[step.type];
              if (!def) return null;
              return (
                <div key={step.id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-6 h-6 rounded-full bg-gradient-to-r ${def.gradient} text-white text-xs flex items-center justify-center font-medium`}>
                      {i + 1}
                    </span>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t(def.labelKey)}</h4>
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

          {/* Run button */}
          <button
            onClick={runWorkflow}
            disabled={!isConfigValid()}
            className="w-full mt-6 py-3 px-6 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-button"
          >
            {t('runWorkflow')}
          </button>
        </div>
      )}

      {/* Processing Phase */}
      {phase === 'processing' && progress && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('processing')}
          </div>

          <div className="max-w-xs mx-auto">
            <WorkflowProgressStepper
              steps={steps.map((s) => ({ stepId: s.id, type: s.type }))}
              progress={progress.steps}
            />
          </div>
        </div>
      )}

      {/* Done Phase */}
      {phase === 'done' && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('completeTitle')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('completeDescription')}
          </p>

          {progress && (
            <div className="max-w-xs mx-auto mb-6">
              <WorkflowProgressStepper
                steps={steps.map((s) => ({ stepId: s.id, type: s.type }))}
                progress={progress.steps}
              />
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={handlePreview}
              className="py-3 px-6 rounded-xl text-indigo-600 dark:text-indigo-400 font-semibold border-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200"
            >
              {t('preview')}
            </button>
            <button
              onClick={handleDownload}
              className="py-3 px-6 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-button"
            >
              {t('download')}
            </button>
            <button
              onClick={handleReset}
              className="py-3 px-6 rounded-xl text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              {t('runAnother')}
            </button>
          </div>
        </div>
      )}

      {/* Error Phase */}
      {phase === 'error' && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('errorTitle')}
          </h3>
          <p className="text-red-500 mb-6">{errorMessage}</p>

          {progress && (
            <div className="max-w-xs mx-auto mb-6">
              <WorkflowProgressStepper
                steps={steps.map((s) => ({ stepId: s.id, type: s.type }))}
                progress={progress.steps}
              />
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setPhase('configure'); setProgress(null); }}
              className="py-3 px-6 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-button"
            >
              {t('tryAgain')}
            </button>
            <button
              onClick={handleReset}
              className="py-3 px-6 rounded-xl text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              {t('startOver')}
            </button>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={isPreviewOpen}
        pdfData={previewData}
        filename={previewFilename}
        onClose={closePreview}
        onDownload={downloadPreview}
      />
    </div>
  );
}
