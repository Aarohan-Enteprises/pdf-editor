'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { usePDFPreview } from '@/hooks/usePDFPreview';
import { getPDFPageCount, checkPDFEncryption, EncryptedPDFError } from '@/lib/pdf-operations';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

const pageSizes = {
  a4: { width: 595, height: 842, label: 'A4' },
  letter: { width: 612, height: 792, label: 'Letter' },
  legal: { width: 612, height: 1008, label: 'Legal' },
};

interface PageItem {
  id: string;
  type: 'pdf' | 'blank';
  pageNum?: number; // Original page number for PDF pages
  thumbnail?: string;
}

export default function InsertBlankPage() {
  const t = useTranslations('tools.insertBlank');

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('');
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isPreviewOpen,
    previewData,
    previewFilename,
    showPreview,
    closePreview,
    downloadPreview,
  } = usePDFPreview();

  // Generate unique ID
  const generateId = () => `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Load PDF and generate thumbnails
  const loadPdf = useCallback(async (pdfFile: File) => {
    setIsLoadingThumbnails(true);
    const newPages: PageItem[] = [];

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        await page.render({ canvasContext: ctx, viewport }).promise;
        newPages.push({
          id: generateId(),
          type: 'pdf',
          pageNum: i,
          thumbnail: canvas.toDataURL(),
        });
      }

      setPages(newPages);
    } catch (err) {
      console.error('Failed to load PDF:', err);
      setError('Failed to load PDF file.');
    } finally {
      setIsLoadingThumbnails(false);
    }
  }, []);

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
      setOutputFilename(selectedFile.name.replace('.pdf', '-edited'));
      setError(null);

      await getPDFPageCount(arrayBuffer);
      loadPdf(selectedFile);
    } catch (err) {
      if (err instanceof EncryptedPDFError) {
        setError(err.message);
      } else {
        console.error('Failed to load PDF:', err);
        setError('Failed to load PDF file.');
      }
    }
  }, [loadPdf]);

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

  // Insert a blank page at specific index
  const insertBlankAt = useCallback((index: number) => {
    setPages(prev => {
      const newPages = [...prev];
      newPages.splice(index, 0, {
        id: generateId(),
        type: 'blank',
      });
      return newPages;
    });
  }, []);

  // Remove a page by id
  const removePage = useCallback((id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  }, []);

  // Process and create final PDF
  const handleProcess = useCallback(async () => {
    if (!file || pages.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      for (const page of pages) {
        if (page.type === 'pdf' && page.pageNum) {
          const [copiedPage] = await newPdf.copyPages(srcPdf, [page.pageNum - 1]);
          newPdf.addPage(copiedPage);
        } else if (page.type === 'blank') {
          const size = pageSizes[pageSize];
          newPdf.addPage([size.width, size.height]);
        }
      }

      const resultData = await newPdf.save();
      const filename = outputFilename.trim() || `edited-${file.name.replace('.pdf', '')}`;
      showPreview(resultData, `${filename}.pdf`);
    } catch (err) {
      console.error('Failed to process PDF:', err);
      setError('Failed to process PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, pages, pageSize, outputFilename, showPreview]);

  const clearAll = useCallback(() => {
    setFile(null);
    setError(null);
    setPages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Count blank pages
  const blankCount = pages.filter(p => p.type === 'blank').length;
  const originalCount = pages.filter(p => p.type === 'pdf').length;

  return (
    <PageLayout>
      <PDFPreviewModal
        isOpen={isPreviewOpen}
        pdfData={previewData}
        filename={previewFilename}
        onClose={closePreview}
        onDownload={downloadPreview}
      />
      <div className="w-full px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {t('pageTitle')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {t('pageDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left: Controls */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="card p-4 space-y-4 lg:sticky lg:top-24">
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`dropzone py-4 ${isDragging ? 'dropzone-active' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  {file ? (
                    <p className="text-gray-700 dark:text-gray-200 font-medium text-sm truncate max-w-full px-2">
                      {file.name}
                    </p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Drop PDF or click to browse</p>
                  )}
                </div>
              </div>

              {file && pages.length > 0 && (
                <>
                  {/* Page Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Blank Page Size
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'legal')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    >
                      {Object.entries(pageSizes).map(([key, value]) => (
                        <option key={key} value={key}>{value.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Stats */}
                  <div className="p-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Original pages:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{originalCount}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600 dark:text-gray-400">Blank pages added:</span>
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">{blankCount}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1 pt-1 border-t border-gray-200 dark:border-slate-600">
                      <span className="text-gray-600 dark:text-gray-400">Total pages:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{pages.length}</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                    <p className="text-xs text-indigo-800 dark:text-indigo-200">
                      Click the <strong>+</strong> button between pages to add a blank page there.
                    </p>
                  </div>

                  {/* Output filename */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Output filename
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={outputFilename}
                        onChange={(e) => setOutputFilename(e.target.value)}
                        placeholder="document-edited"
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
                    <button onClick={clearAll} className="btn btn-secondary flex-1 text-sm">
                      Clear
                    </button>
                    <button
                      onClick={handleProcess}
                      disabled={isProcessing}
                      className="btn btn-primary flex-1 text-sm"
                    >
                      {isProcessing ? 'Processing...' : 'Apply & Preview'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Page Grid */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {pages.length > 0 ? (
              <div className="card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Pages
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {pages.length} total
                  </span>
                </div>

                {/* Pages Grid with Insert Buttons */}
                <div className="flex flex-wrap items-start gap-2">
                  {/* Insert at beginning */}
                  <button
                    onClick={() => insertBlankAt(0)}
                    className="flex-shrink-0 w-6 h-32 sm:h-40 flex items-center justify-center group"
                    title="Insert blank page at beginning"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center transition-all group-hover:scale-110">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>

                  {pages.map((page, index) => (
                    <div key={page.id} className="flex items-start">
                      {/* Page Card */}
                      <div className="relative group">
                        {page.type === 'pdf' ? (
                          /* PDF Page */
                          <div className="w-24 sm:w-28 aspect-[1/1.414] bg-white dark:bg-slate-700 rounded-lg shadow-md border border-gray-200 dark:border-slate-600 overflow-hidden">
                            {page.thumbnail && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={page.thumbnail}
                                alt={`Page ${page.pageNum}`}
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>
                        ) : (
                          /* Blank Page */
                          <div className="w-24 sm:w-28 aspect-[1/1.414] bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-600 flex flex-col items-center justify-center">
                            <svg className="w-8 h-8 text-indigo-400 dark:text-indigo-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400">BLANK</span>
                          </div>
                        )}

                        {/* Page number badge */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-xs font-medium rounded-full">
                          {index + 1}
                        </div>

                        {/* Remove button for blank pages */}
                        {page.type === 'blank' && (
                          <button
                            onClick={() => removePage(page.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-slate-700 border-2 border-red-400 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:border-red-500 hover:text-white shadow-md transition-all opacity-0 group-hover:opacity-100"
                            title="Remove blank page"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Insert button after each page */}
                      <button
                        onClick={() => insertBlankAt(index + 1)}
                        className="flex-shrink-0 w-6 h-32 sm:h-40 flex items-center justify-center group ml-2"
                        title="Insert blank page here"
                      >
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center transition-all group-hover:scale-110">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : isLoadingThumbnails ? (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400">Loading pages...</p>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Insert Blank Pages
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload a PDF to add blank pages between existing pages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
