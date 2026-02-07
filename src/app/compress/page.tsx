'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFDropzone } from '@/components/pdf/PDFDropzone';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { usePDFPreview } from '@/hooks/usePDFPreview';
import Link from 'next/link';
import { ToolSEOSection } from '@/components/ToolSEOSection';

type CompressionQuality = 'low' | 'medium' | 'high';

interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  reduction: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function CompressPage() {
  const t = useTranslations('tools.compress');

  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<CompressionQuality>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'idle' | 'uploading' | 'compressing' | 'downloading' | 'done'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);
  const [outputFilename, setOutputFilename] = useState('compressed-document');
  const [compressedData, setCompressedData] = useState<Uint8Array | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    isPreviewOpen,
    previewData,
    previewFilename,
    showPreview,
    closePreview,
    downloadPreview,
  } = usePDFPreview();

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    setUploadError(null);
    setCompressionStats(null);
    setCompressedData(null);
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      const name = selectedFiles[0].name.replace(/\.pdf$/i, '');
      setOutputFilename(`${name}-compressed`);
    }
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingStage('uploading');
    setUploadError(null);
    setCompressionStats(null);
    setCompressedData(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', quality);

      const timings: Record<string, number> = {};
      timings.start = performance.now();

      console.log(`[TIMING] Starting compression for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Use XMLHttpRequest for upload progress tracking
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${apiUrl}/api/compress`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
            console.log(`[TIMING] Upload progress: ${percent}% (${(e.loaded / 1024 / 1024).toFixed(2)} MB / ${(e.total / 1024 / 1024).toFixed(2)} MB)`);
          }
        };

        xhr.upload.onloadend = () => {
          // Upload complete, now server is compressing
          setProcessingStage('compressing');
        };

        xhr.onload = () => {
          resolve(new Response(xhr.response, {
            status: xhr.status,
            headers: {
              'X-Original-Size': xhr.getResponseHeader('X-Original-Size') || '0',
              'X-Compressed-Size': xhr.getResponseHeader('X-Compressed-Size') || '0',
            }
          }));
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.responseType = 'blob';
        xhr.send(formData);
      });

      timings.responseReceived = performance.now();
      console.log(`[TIMING] Response received in ${((timings.responseReceived - timings.start) / 1000).toFixed(3)}s`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Compression failed');
      }

      setProcessingStage('downloading');

      const compressedBlob = await response.blob();
      timings.blobReceived = performance.now();
      console.log(`[TIMING] Blob downloaded in ${((timings.blobReceived - timings.responseReceived) / 1000).toFixed(3)}s`);

      const data = new Uint8Array(await compressedBlob.arrayBuffer());
      timings.end = performance.now();

      console.log(`[TIMING] Total time: ${((timings.end - timings.start) / 1000).toFixed(3)}s`);
      console.log(`[TIMING] Breakdown: Upload+Process=${((timings.responseReceived - timings.start) / 1000).toFixed(3)}s, Download=${((timings.blobReceived - timings.responseReceived) / 1000).toFixed(3)}s`);

      // Get size info from headers, fall back to actual sizes
      const originalSize = parseInt(response.headers.get('X-Original-Size') || '0', 10) || file.size;
      const compressedSize = parseInt(response.headers.get('X-Compressed-Size') || '0', 10) || data.length;

      // Calculate reduction
      const reduction = originalSize > 0
        ? Math.round((1 - compressedSize / originalSize) * 100)
        : 0;

      setCompressionStats({
        originalSize,
        compressedSize,
        reduction,
      });

      setCompressedData(data);
      setProcessingStage('done');
    } catch (error) {
      console.error('Compression failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Compression failed. Make sure the backend server is running.');
      setProcessingStage('idle');
    } finally {
      setIsProcessing(false);
    }
  }, [file, quality]);

  const clearFile = useCallback(() => {
    setFile(null);
    setCompressionStats(null);
    setCompressedData(null);
    setUploadError(null);
    setOutputFilename('compressed-document');
    setProcessingStage('idle');
  }, []);

  const handlePreview = useCallback(() => {
    if (compressedData) {
      const filename = outputFilename.trim() || 'compressed-document';
      showPreview(compressedData, `${filename}.pdf`);
    }
  }, [compressedData, outputFilename, showPreview]);

  const handleDownload = useCallback(() => {
    if (compressedData) {
      const blob = new Blob([new Uint8Array(compressedData)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${outputFilename.trim() || 'compressed-document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [compressedData, outputFilename]);

  return (
    <PageLayout>
      <PDFPreviewModal
        isOpen={isPreviewOpen}
        pdfData={previewData}
        filename={previewFilename}
        onClose={closePreview}
        onDownload={downloadPreview}
        currentTool="compress"
      />
      <div className="w-full px-6 lg:px-12 py-8">
        {/* Page Header */}
        <div className="mb-8">
            <Link href="/#tools" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All Tools
            </Link>
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
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Dropzone and Options */}
          <div className="space-y-4">
            <div className="card p-4">
              <PDFDropzone
                onFilesSelected={handleFilesSelected}
                isLoading={false}
                externalError={uploadError}
                onClearError={() => setUploadError(null)}
                fileLoaded={!!file}
                fileName={file?.name}
              />

              {file && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <div className="card p-4 space-y-4">
                {/* Quality Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('quality')}
                  </label>
                  <div className="space-y-2">
                    {(['low', 'medium', 'high'] as CompressionQuality[]).map((q) => (
                      <label
                        key={q}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          quality === q
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="quality"
                          value={q}
                          checked={quality === q}
                          onChange={() => setQuality(q)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {t(q)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t(`${q}Description`)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Output Filename */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Output filename
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={outputFilename}
                      onChange={(e) => setOutputFilename(e.target.value)}
                      placeholder="compressed-document"
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
                  disabled={isProcessing || !file}
                  className="btn btn-primary w-full"
                >
                  {isProcessing ? t('compressing') : t('compress')}
                </button>
              </div>
            )}
          </div>

          {/* Right: Stats/Info */}
          <div className="space-y-4">
            {/* Processing Status */}
            {isProcessing && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-6">
                  Processing...
                </h3>
                <div className="space-y-4">
                  {/* Uploading */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        processingStage === 'uploading'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : processingStage === 'compressing' || processingStage === 'downloading'
                          ? 'bg-emerald-500'
                          : 'bg-gray-100 dark:bg-slate-800'
                      }`}>
                        {processingStage === 'uploading' ? (
                          <svg className="w-4 h-4 text-emerald-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : processingStage === 'compressing' || processingStage === 'downloading' ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`text-sm ${
                          processingStage === 'uploading'
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                            : processingStage === 'compressing' || processingStage === 'downloading'
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          Uploading file...
                        </span>
                        {processingStage === 'uploading' && (
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {uploadProgress}%
                          </span>
                        )}
                      </div>
                    </div>
                    {processingStage === 'uploading' && (
                      <div className="ml-11">
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compressing */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      processingStage === 'compressing'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : processingStage === 'downloading'
                        ? 'bg-emerald-500'
                        : 'bg-gray-100 dark:bg-slate-800'
                    }`}>
                      {processingStage === 'compressing' ? (
                        <svg className="w-4 h-4 text-emerald-600 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : processingStage === 'downloading' ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                      )}
                    </div>
                    <span className={`text-sm ${
                      processingStage === 'compressing'
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : processingStage === 'downloading'
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      Compressing PDF...
                    </span>
                  </div>

                  {/* Downloading */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      processingStage === 'downloading'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-gray-100 dark:bg-slate-800'
                    }`}>
                      {processingStage === 'downloading' ? (
                        <svg className="w-4 h-4 text-emerald-600 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                      )}
                    </div>
                    <span className={`text-sm ${
                      processingStage === 'downloading'
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      Preparing compressed file...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {compressionStats && compressedData && !isProcessing ? (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Compression Results
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-gray-600 dark:text-gray-400">{t('originalSize')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatFileSize(compressionStats.originalSize)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-gray-600 dark:text-gray-400">{t('compressedSize')}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatFileSize(compressionStats.compressedSize)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <span className="text-emerald-700 dark:text-emerald-300">{t('reduction')}</span>
                    <span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">
                      {compressionStats.reduction}%
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handlePreview}
                      className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Preview
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {!isProcessing && !compressedData && (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {file ? 'Ready to compress' : 'No PDF selected'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {file
                    ? 'Select a compression quality and click Compress PDF'
                    : 'Upload a PDF file to reduce its size'}
                </p>
              </div>
            )}

            {/* Server-side Notice */}
            <div className="card p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  <p className="font-medium mb-1">Secure server processing</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    For optimal compression, this tool uses our secure server.
                    Your file is encrypted during transfer, processed instantly, and automatically deleted after compression.
                  </p>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">About compression</p>
                  <p className="text-blue-600 dark:text-blue-400">
                    Lower quality results in smaller file sizes but may reduce image clarity.
                    Medium is recommended for most use cases.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToolSEOSection toolId="compress" />
      </div>
    </PageLayout>
  );
}
