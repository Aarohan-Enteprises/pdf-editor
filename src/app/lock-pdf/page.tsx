'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFDropzone } from '@/components/pdf/PDFDropzone';
import { getPendingPDF } from '@/lib/pdf-store';
import Link from 'next/link';
import { ToolSEOSection } from '@/components/ToolSEOSection';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function LockPdfPage() {
  const t = useTranslations('tools.lockPdf');

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('locked-document');
  const [lockedData, setLockedData] = useState<Uint8Array | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');


  // Auto-load pending PDF from cross-tool navigation
  useEffect(() => {
    const pending = getPendingPDF();
    if (pending) {
      const f = new File([pending.data], pending.filename, { type: 'application/pdf' });
      setFile(f);
      const name = pending.filename.replace(/\.pdf$/i, '');
      setOutputFilename(`${name}-locked`);
    }
  }, []);

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    setUploadError(null);
    setLockedData(null);
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      const name = selectedFiles[0].name.replace(/\.pdf$/i, '');
      setOutputFilename(`${name}-locked`);
    }
  }, []);

  const handleLock = useCallback(async () => {
    if (!file || !password) return;

    if (password !== confirmPassword) {
      setUploadError('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      setUploadError('Password must be at least 4 characters');
      return;
    }

    setIsProcessing(true);
    setProcessingStage('uploading');
    setUploadError(null);
    setLockedData(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${apiUrl}/api/lock`);

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
        throw new Error(errorData.detail || 'Failed to lock PDF');
      }

      const lockedBlob = await response.blob();
      const data = new Uint8Array(await lockedBlob.arrayBuffer());

      setLockedData(data);
      setProcessingStage('done');
    } catch (error) {
      console.error('Lock failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to lock PDF');
      setProcessingStage('idle');
    } finally {
      setIsProcessing(false);
    }
  }, [file, password, confirmPassword]);

  const clearFile = useCallback(() => {
    setFile(null);
    setLockedData(null);
    setUploadError(null);
    setPassword('');
    setConfirmPassword('');
    setOutputFilename('locked-document');
    setProcessingStage('idle');
  }, []);

  const handleDownload = useCallback(() => {
    if (lockedData) {
      const blob = new Blob([new Uint8Array(lockedData)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${outputFilename.trim() || 'locked-document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [lockedData, outputFilename]);

  const passwordsMatch = password === confirmPassword && password.length > 0;

  return (
    <PageLayout>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('passwordPlaceholder')}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('confirmPassword')}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('confirmPasswordPlaceholder')}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm ${
                      confirmPassword && !passwordsMatch
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-red-500 text-xs mt-1">{t('passwordMismatch')}</p>
                  )}
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
                      placeholder="locked-document"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    />
                    <span className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                      .pdf
                    </span>
                  </div>
                </div>

                {/* Lock Button */}
                <button
                  onClick={handleLock}
                  disabled={isProcessing || !file || !passwordsMatch}
                  className="btn btn-primary w-full"
                >
                  {isProcessing ? t('locking') : t('lock')}
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
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : processingStage === 'processing'
                          ? 'bg-emerald-500'
                          : 'bg-gray-100 dark:bg-slate-800'
                      }`}>
                        {processingStage === 'uploading' ? (
                          <svg className="w-4 h-4 text-emerald-600 animate-spin" fill="none" viewBox="0 0 24 24">
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
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                            : processingStage === 'processing'
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

                  {/* Processing */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      processingStage === 'processing'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-gray-100 dark:bg-slate-800'
                    }`}>
                      {processingStage === 'processing' ? (
                        <svg className="w-4 h-4 text-emerald-600 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                      )}
                    </div>
                    <span className={`text-sm ${
                      processingStage === 'processing'
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      Encrypting PDF...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {lockedData && !isProcessing && (
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                {/* Note about preview */}
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Preview is not available for password-protected PDFs. Download the file and open it with your password.
                  </p>
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Locked PDF
                </button>
              </div>
            )}

            {!isProcessing && !lockedData && (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {file ? 'Ready to lock' : 'No PDF selected'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {file
                    ? 'Enter a password and click Lock PDF'
                    : 'Upload a PDF file to add password protection'}
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
                    Your file is encrypted during transfer, processed instantly, and automatically deleted after encryption.
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
        <ToolSEOSection toolId="lock-pdf" />
      </div>
    </PageLayout>
  );
}
