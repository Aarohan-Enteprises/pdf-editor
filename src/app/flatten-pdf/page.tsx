'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { usePDFPreview } from '@/hooks/usePDFPreview';
import { flattenPDF, checkPDFEncryption, EncryptedPDFError } from '@/lib/pdf-operations';
import Link from 'next/link';
import { ToolSEOSection } from '@/components/ToolSEOSection';

export default function FlattenPdfPage() {
  const t = useTranslations('tools.flattenPdf');

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isPreviewOpen,
    previewData,
    previewFilename,
    showPreview,
    closePreview,
    downloadPreview,
  } = usePDFPreview();

  const handleFile = useCallback(async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file');
      return;
    }

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const isEncrypted = await checkPDFEncryption(arrayBuffer);
      if (isEncrypted) {
        setError(`The file "${selectedFile.name}" is password protected. Use our Unlock PDF tool to remove the password first, then try again.`);
        return;
      }

      setFile(selectedFile);
      setOutputFilename(selectedFile.name.replace('.pdf', '-flattened'));
      setError(null);
    } catch (err) {
      if (err instanceof EncryptedPDFError) {
        setError(err.message);
      } else {
        console.error('Failed to check PDF:', err);
        setError('Failed to load PDF file.');
      }
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) await handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) await handleFile(selectedFile);
    },
    [handleFile]
  );

  const handleFlatten = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const resultData = await flattenPDF(arrayBuffer);
      const filename = outputFilename.trim() || `flattened-${file.name.replace('.pdf', '')}`;
      showPreview(resultData, `${filename}.pdf`);
    } catch (err) {
      console.error('Failed to flatten PDF:', err);
      setError('Failed to flatten PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, outputFilename, showPreview]);

  const clearAll = useCallback(() => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <PageLayout>
      <PDFPreviewModal
        isOpen={isPreviewOpen}
        pdfData={previewData}
        filename={previewFilename}
        onClose={closePreview}
        onDownload={downloadPreview}
        currentTool="flatten-pdf"
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
            <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
        <div className="max-w-2xl mx-auto">
          <div className="card p-6 space-y-6">
            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                {file ? (
                  <>
                    <p className="text-gray-700 dark:text-gray-200 font-medium mb-1">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click to change file
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-700 dark:text-gray-200 font-medium mb-1">
                      Drop PDF file here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      or click to browse
                    </p>
                  </>
                )}
              </div>
            </div>

            {file && (
              <>
                <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl">
                  <p className="text-sm text-teal-800 dark:text-teal-200">
                    Flattening merges all form fields, annotations, and layers into the page content. This makes the PDF non-editable and is irreversible.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Output filename
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={outputFilename}
                      onChange={(e) => setOutputFilename(e.target.value)}
                      placeholder="flattened-document"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    />
                    <span className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                      .pdf
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={clearAll}
                    className="btn btn-secondary flex-1"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleFlatten}
                    disabled={isProcessing}
                    className="btn btn-primary flex-1"
                  >
                    {isProcessing ? 'Processing...' : 'Flatten & Preview'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <ToolSEOSection toolId="flatten-pdf" />
      </div>
    </PageLayout>
  );
}
