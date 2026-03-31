'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { checkPDFEncryption, EncryptedPDFError } from '@/lib/pdf-operations';
import * as pdfjsLib from 'pdfjs-dist';
import Link from 'next/link';
import { ToolSEOSection } from '@/components/ToolSEOSection';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

type OCRProgress = {
  page: number;
  totalPages: number;
  percent: number;
  status: string;
};

type OCRWorker = {
  recognize: (input: HTMLCanvasElement) => Promise<{ data?: { text?: string } }>;
  terminate: () => Promise<unknown>;
};

const EMPTY_PROGRESS: OCRProgress = {
  page: 0,
  totalPages: 0,
  percent: 0,
  status: '',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatOCRStatus(status?: string): string {
  if (!status) return 'Processing...';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function PdfToOcrPage() {
  const t = useTranslations('tools.pdfToOcr');

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [progress, setProgress] = useState<OCRProgress>(EMPTY_PROGRESS);
  const [usedOCR, setUsedOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef({ page: 0, totalPages: 0 });

  const resetState = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setError(null);
    setExtractedText('');
    setProgress(EMPTY_PROGRESS);
    setUsedOCR(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFile = useCallback(async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('This PDF exceeds the 50MB limit. Please choose a smaller file.');
      return;
    }

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const isEncrypted = await checkPDFEncryption(arrayBuffer);

      if (isEncrypted) {
        setError(`The file "${selectedFile.name}" is password protected. Use our Unlock PDF tool first, then try OCR again.`);
        return;
      }

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      if (pdf.numPages > 200) {
        setError('This PDF exceeds the 200-page limit for browser processing.');
        return;
      }

      setFile(selectedFile);
      setPageCount(pdf.numPages);
      setError(null);
      setExtractedText('');
      setProgress(EMPTY_PROGRESS);
      setUsedOCR(false);
    } catch (err) {
      if (err instanceof EncryptedPDFError) {
        setError(err.message);
      } else {
        console.error('Failed to load PDF:', err);
        setError('Failed to load the PDF file. Please try another document.');
      }
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await handleFile(selectedFile);
    }
  }, [handleFile]);

  const handleRunOCR = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setExtractedText('');
    setUsedOCR(false);

    let worker: OCRWorker | null = null;
    let ocrWasUsed = false;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      let fullText = '';

      progressRef.current = { page: 0, totalPages };
      setProgress({
        page: 0,
        totalPages,
        percent: 2,
        status: 'Analyzing PDF pages...',
      });

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        progressRef.current = { page: i, totalPages };
        setProgress({
          page: i,
          totalPages,
          percent: Math.max(5, Math.round(((i - 1) / totalPages) * 100)),
          status: `Checking page ${i} of ${totalPages}...`,
        });

        const textContent = await page.getTextContent();
        const embeddedText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (embeddedText.length >= 20) {
          fullText += `--- Page ${i} ---\n${embeddedText}\n\n`;
          continue;
        }

        if (!worker) {
          setProgress({
            page: i,
            totalPages,
            percent: Math.max(8, Math.round(((i - 1) / totalPages) * 100)),
            status: 'Loading OCR engine...',
          });

          const { createWorker } = await import('tesseract.js');
          worker = await createWorker('eng', 1, {
            logger: (message: { status?: string; progress?: number }) => {
              const currentPage = progressRef.current.page || 1;
              const currentTotal = progressRef.current.totalPages || 1;
              const pageOffset = (currentPage - 1) / currentTotal;
              const pageProgress = (message.progress ?? 0) / currentTotal;

              setProgress({
                page: currentPage,
                totalPages: currentTotal,
                percent: Math.min(99, Math.max(10, Math.round((pageOffset + pageProgress) * 100))),
                status: `${formatOCRStatus(message.status)} (${currentPage}/${currentTotal})`,
              });
            },
          }) as OCRWorker;
        }

        ocrWasUsed = true;
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Canvas rendering is not available in this browser.');
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({ canvasContext: context, viewport }).promise;

        const result = await worker.recognize(canvas);
        const ocrText = (result?.data?.text ?? '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        fullText += `--- Page ${i} ---\n${ocrText || '[No readable text detected on this page]'}\n\n`;
      }

      const finalText = fullText.trim();

      if (!finalText) {
        setError('No readable text was detected in this PDF. Try a clearer scan or higher-resolution document.');
      } else {
        setExtractedText(finalText);
        setUsedOCR(ocrWasUsed);
        setProgress({
          page: totalPages,
          totalPages,
          percent: 100,
          status: 'OCR complete',
        });
      }
    } catch (err) {
      console.error('Failed to run OCR:', err);
      setError('OCR failed for this file. Please try again or use a clearer PDF scan.');
      setProgress(EMPTY_PROGRESS);
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setIsProcessing(false);
    }
  }, [file]);

  const handleCopyText = useCallback(async () => {
    if (!extractedText) return;
    await navigator.clipboard.writeText(extractedText);
  }, [extractedText]);

  const handleDownloadText = useCallback(() => {
    if (!extractedText) return;

    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name.replace(/\.pdf$/i, '') || 'ocr-output'}-ocr.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [extractedText, file]);

  return (
    <PageLayout>
      <div className="w-full px-6 lg:px-12 py-8">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3H5a2 2 0 00-2 2v2m16-4h-2m2 0a2 2 0 012 2v2M3 17v2a2 2 0 002 2h2m12-4v2a2 2 0 01-2 2h-2M8 8h8M8 12h8m-8 4h5" />
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

        <div className="max-w-5xl mx-auto space-y-6">
          <div className="card p-6 space-y-6">
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

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3H5a2 2 0 00-2 2v2m16-4h-2m2 0a2 2 0 012 2v2M3 17v2a2 2 0 002 2h2m12-4v2a2 2 0 01-2 2h-2M8 8h8M8 12h8m-8 4h5" />
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
                      Drop a scanned PDF here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      or click to browse from your device
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-800/50">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">File size</p>
                <p className="font-semibold text-gray-900 dark:text-white">{file ? formatFileSize(file.size) : '—'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-800/50">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Pages</p>
                <p className="font-semibold text-gray-900 dark:text-white">{pageCount || '—'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-800/50">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Mode</p>
                <p className="font-semibold text-gray-900 dark:text-white">Smart text + OCR</p>
              </div>
            </div>

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

            {file && !extractedText && (
              <div className="flex gap-3">
                <button onClick={resetState} className="btn btn-secondary flex-1" disabled={isProcessing}>
                  Clear
                </button>
                <button
                  onClick={handleRunOCR}
                  disabled={isProcessing}
                  className="btn btn-primary flex-1"
                >
                  {isProcessing ? t('converting') : t('convert')}
                </button>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{progress.status || 'Running OCR...'}</span>
                  <span>{progress.percent}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {extractedText && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-800/50">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Result</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{t('success')}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-800/50">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Pages processed</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{pageCount}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-800/50">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Detection mode</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{usedOCR ? 'Embedded text + OCR' : 'Embedded text'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <button onClick={handleCopyText} className="btn btn-secondary text-sm">
                    Copy to Clipboard
                  </button>
                  <button onClick={handleDownloadText} className="btn btn-secondary text-sm">
                    Download as TXT
                  </button>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 max-h-[28rem] overflow-y-auto border border-gray-200 dark:border-slate-700">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono leading-6">
                    {extractedText}
                  </pre>
                </div>

                <button onClick={resetState} className="btn btn-secondary w-full">
                  Process Another PDF
                </button>
              </>
            )}
          </div>
        </div>

        <ToolSEOSection toolId="pdf-to-ocr" />
      </div>
    </PageLayout>
  );
}
