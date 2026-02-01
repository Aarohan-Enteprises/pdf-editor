'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFDropzone } from '@/components/pdf/PDFDropzone';
import {
  compressPDF,
  formatFileSize,
  CompressionQuality,
  CompressionResult,
} from '@/lib/pdf-compress';
import { downloadPDF } from '@/lib/pdf-operations';

export default function CompressPage() {
  const t = useTranslations('tools.compress');
  const tCommon = useTranslations('common');

  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<CompressionQuality>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('compressed');

  // Progress state
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    setUploadError(null);
    setResult(null);

    if (selectedFiles.length > 0) {
      const selectedFile = selectedFiles[0];
      setFile(selectedFile);
      const baseName = selectedFile.name.replace(/\.pdf$/i, '');
      setOutputFilename(`${baseName}-compressed`);
    }
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setResult(null);
    setProgressStage('Starting...');
    setProgressPercent(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const compressionResult = await compressPDF(
        arrayBuffer,
        { quality },
        (stage, percent) => {
          setProgressStage(stage);
          setProgressPercent(percent);
        }
      );
      setResult(compressionResult);
    } catch (error) {
      console.error('Compression failed:', error);
      setUploadError(
        error instanceof Error ? error.message : 'Failed to compress PDF'
      );
    } finally {
      setIsProcessing(false);
    }
  }, [file, quality]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const filename = outputFilename.trim() || 'compressed';
    downloadPDF(result.data, `${filename}.pdf`);
  }, [result, outputFilename]);

  const handleClear = useCallback(() => {
    setFile(null);
    setResult(null);
    setUploadError(null);
    setOutputFilename('compressed');
    setProgressStage('');
    setProgressPercent(0);
  }, []);

  return (
    <PageLayout>
      <div className="w-full px-6 lg:px-12 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {t('pageTitle')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('pageDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Dropzone & Controls */}
          <div className="lg:col-span-1">
            <div className="card p-4 sticky top-24 space-y-4">
              <PDFDropzone
                onFilesSelected={handleFilesSelected}
                isLoading={isProcessing}
                externalError={uploadError}
                onClearError={() => setUploadError(null)}
              />

              {file && (
                <>
                  {/* File Info */}
                  <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Quality Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('qualityLabel')}
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <input
                          type="radio"
                          name="quality"
                          value="low"
                          checked={quality === 'low'}
                          onChange={() => setQuality('low')}
                          className="mr-3"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {t('qualityLow')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('qualityLowDesc')}
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <input
                          type="radio"
                          name="quality"
                          value="medium"
                          checked={quality === 'medium'}
                          onChange={() => setQuality('medium')}
                          className="mr-3"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {t('qualityMedium')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('qualityMediumDesc')}
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <input
                          type="radio"
                          name="quality"
                          value="high"
                          checked={quality === 'high'}
                          onChange={() => setQuality('high')}
                          className="mr-3"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {t('qualityHigh')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('qualityHighDesc')}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Output filename */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('outputFilename')}
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={outputFilename}
                        onChange={(e) => setOutputFilename(e.target.value)}
                        placeholder="compressed"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                      />
                      <span className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                        .pdf
                      </span>
                    </div>
                  </div>

                  {/* Compress Button */}
                  <button
                    onClick={handleCompress}
                    disabled={isProcessing}
                    className="btn btn-primary w-full"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t('processing')}
                      </span>
                    ) : (
                      t('compressButton')
                    )}
                  </button>

                  {/* Clear Button */}
                  <button
                    onClick={handleClear}
                    className="btn btn-ghost w-full text-sm text-red-600 dark:text-red-400"
                  >
                    {tCommon('cancel')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Results / Progress */}
          <div className="lg:col-span-2">
            {isProcessing ? (
              /* Progress Display */
              <div className="card p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="animate-spin w-10 h-10 text-emerald-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {progressStage}
                  </h2>
                </div>

                {/* Progress Bar */}
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>{t('progress')}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : result ? (
              /* Results Display */
              <div className="card p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('compressionComplete')}
                  </h2>
                </div>

                {/* Size Comparison */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {t('originalSize')}
                    </p>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                      {formatFileSize(result.originalSize)}
                    </p>
                  </div>
                  <div className="flex items-center text-emerald-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {t('compressedSize')}
                    </p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatFileSize(result.compressedSize)}
                    </p>
                  </div>
                </div>

                {/* Savings Badge */}
                <div className="text-center mb-8">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {result.savings > 0
                      ? t('savingsPercent', { percent: result.savings.toFixed(1) })
                      : t('noSavings')}
                  </span>
                </div>

                {/* Download Button */}
                <div className="text-center">
                  <button
                    onClick={handleDownload}
                    className="btn btn-primary px-8 py-3 text-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('downloadButton')}
                  </button>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('noPdfYet')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('uploadPrompt')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
