'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function DocxToPdfPage() {
  const t = useTranslations('tools.docxToPdf');

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('converted-document');
  const [convertedData, setConvertedData] = useState<Uint8Array | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setUploadError(null);
    setConvertedData(null);

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.docx')) {
      setUploadError('Please upload a DOCX file');
      return;
    }

    // Validate file size (50MB max)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setUploadError('File exceeds 50MB limit');
      return;
    }

    setFile(selectedFile);
    const name = selectedFile.name.replace(/\.docx$/i, '');
    setOutputFilename(name);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleConvert = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingStage('uploading');
    setUploadError(null);
    setConvertedData(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${apiUrl}/api/docx-to-pdf`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.upload.onloadend = () => {
          setProcessingStage('processing');
        };

        xhr.onload = () => {
          resolve(new Response(xhr.response, {
            status: xhr.status,
          }));
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.responseType = 'blob';
        xhr.send(formData);
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to convert DOCX to PDF');
      }

      const convertedBlob = await response.blob();
      const data = new Uint8Array(await convertedBlob.arrayBuffer());

      setConvertedData(data);
      setProcessingStage('done');
    } catch (error) {
      console.error('Conversion failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to convert DOCX to PDF');
      setProcessingStage('idle');
    } finally {
      setIsProcessing(false);
    }
  }, [file]);

  const clearFile = useCallback(() => {
    setFile(null);
    setConvertedData(null);
    setUploadError(null);
    setOutputFilename('converted-document');
    setProcessingStage('idle');
  }, []);

  const handleDownload = useCallback(() => {
    if (convertedData) {
      const blob = new Blob([new Uint8Array(convertedData)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${outputFilename.trim() || 'converted-document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [convertedData, outputFilename]);

  return (
    <PageLayout>
      <div className="w-full px-6 lg:px-12 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
              {/* Custom Dropzone for DOCX */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isDragOver
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                    : 'border-gray-300 dark:border-slate-600 hover:border-red-400 dark:hover:border-red-500'
                }`}
              >
                <input
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Drop your DOCX file here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Supports Microsoft Word (.docx) files up to 50MB
                  </p>
                </div>
              </div>

              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
                </div>
              )}

              {file && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm1 9h-2v2h2v2h-2v2h-2v-2H9v2H7v-2h2v-2H7v-2h2V9H7V7h2v2h2V7h2v2h2v2zm-3 0h-2v2h2v-2zm5-4h-5V2l5 5z"/>
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
                      placeholder="converted-document"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    />
                    <span className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                      .pdf
                    </span>
                  </div>
                </div>

                {/* Convert Button */}
                <button
                  onClick={handleConvert}
                  disabled={isProcessing || !file}
                  className="btn btn-primary w-full"
                >
                  {isProcessing ? t('converting') : t('convert')}
                </button>
              </div>
            )}
          </div>

          {/* Right: Status/Results */}
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
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : processingStage === 'processing'
                          ? 'bg-red-500'
                          : 'bg-gray-100 dark:bg-slate-800'
                      }`}>
                        {processingStage === 'uploading' ? (
                          <svg className="w-4 h-4 text-red-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : processingStage === 'processing' ? (
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
                            ? 'text-red-600 dark:text-red-400 font-medium'
                            : processingStage === 'processing'
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          Uploading file...
                        </span>
                        {processingStage === 'uploading' && (
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            {uploadProgress}%
                          </span>
                        )}
                      </div>
                    </div>
                    {processingStage === 'uploading' && (
                      <div className="ml-11">
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Processing */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      processingStage === 'processing'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-gray-100 dark:bg-slate-800'
                    }`}>
                      {processingStage === 'processing' ? (
                        <svg className="w-4 h-4 text-red-600 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                      )}
                    </div>
                    <span className={`text-sm ${
                      processingStage === 'processing'
                        ? 'text-red-600 dark:text-red-400 font-medium'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      Converting to PDF...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {convertedData && !isProcessing && (
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t('success')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('successDescription')}
                    </p>
                  </div>
                </div>

                {/* File size info */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Output size</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatFileSize(convertedData.length)}
                    </span>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
              </div>
            )}

            {!isProcessing && !convertedData && (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {file ? 'Ready to convert' : 'No DOCX selected'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {file
                    ? 'Click Convert to PDF to start'
                    : 'Upload a DOCX file to convert it to PDF'}
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
                    Your file is encrypted during transfer, processed using LibreOffice, and automatically deleted after conversion.
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
                  <p className="font-medium mb-1">{t('infoTitle')}</p>
                  <p className="text-blue-600 dark:text-blue-400">
                    {t('infoDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
