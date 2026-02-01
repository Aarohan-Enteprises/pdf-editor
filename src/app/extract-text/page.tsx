'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export default function ExtractTextPage() {
  const t = useTranslations('tools.extractText');

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setExtractedText('');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFile(selectedFile);
    },
    [handleFile]
  );

  const handleExtractText = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setExtractedText('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }

      setExtractedText(fullText);
    } catch (err) {
      console.error('Failed to extract text:', err);
      setError('Failed to extract text. The PDF might be scanned or protected.');
    } finally {
      setIsProcessing(false);
    }
  }, [file]);

  const handleCopyText = useCallback(() => {
    navigator.clipboard.writeText(extractedText);
  }, [extractedText]);

  const handleDownloadText = useCallback(() => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name.replace('.pdf', '')}-text.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [extractedText, file]);

  const clearAll = useCallback(() => {
    setFile(null);
    setError(null);
    setExtractedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <PageLayout>
      <div className="w-full px-6 lg:px-12 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
        <div className="max-w-4xl mx-auto">
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
                <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

            {file && !extractedText && (
              <div className="flex gap-3">
                <button onClick={clearAll} className="btn btn-secondary flex-1">
                  Clear
                </button>
                <button
                  onClick={handleExtractText}
                  disabled={isProcessing}
                  className="btn btn-primary flex-1"
                >
                  {isProcessing ? 'Extracting...' : 'Extract Text'}
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {extractedText && (
              <>
                <div className="flex gap-2 justify-end">
                  <button onClick={handleCopyText} className="btn btn-secondary text-sm">
                    Copy to Clipboard
                  </button>
                  <button onClick={handleDownloadText} className="btn btn-secondary text-sm">
                    Download as TXT
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {extractedText}
                  </pre>
                </div>
                <button onClick={clearAll} className="btn btn-secondary w-full">
                  Extract from Another PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
