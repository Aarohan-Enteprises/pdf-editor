'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PDFPreviewModalProps {
  isOpen: boolean;
  pdfData: Uint8Array | null;
  filename: string;
  onClose: () => void;
  onDownload: () => void;
}

interface PagePreview {
  pageNum: number;
  dataUrl: string;
  width: number;
  height: number;
}

export function PDFPreviewModal({
  isOpen,
  pdfData,
  filename,
  onClose,
  onDownload,
}: PDFPreviewModalProps) {
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);

  // Render PDF pages
  useEffect(() => {
    if (!isOpen || !pdfData) {
      setPages([]);
      return;
    }

    const renderPages = async () => {
      setIsLoading(true);
      setError(null);
      setPages([]);

      try {
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const totalPages = pdf.numPages;
        const renderedPages: PagePreview[] = [];

        // Calculate scale based on screen size
        const isMobile = window.innerWidth < 768;
        const maxWidth = isMobile ? window.innerWidth - 80 : 500;

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });

          const scale = Math.min(maxWidth / viewport.width, 2);
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;
          const ctx = canvas.getContext('2d')!;

          await page.render({
            canvasContext: ctx,
            viewport: scaledViewport,
          }).promise;

          renderedPages.push({
            pageNum: i,
            dataUrl: canvas.toDataURL(),
            width: scaledViewport.width,
            height: scaledViewport.height,
          });
        }

        setPages(renderedPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to render PDF preview:', err);
        setError('Failed to load PDF preview');
      } finally {
        setIsLoading(false);
      }
    };

    renderPages();
  }, [isOpen, pdfData]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              Preview: {filename}
            </h2>
            {pages.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pages.length} page{pages.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-slate-900">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading preview...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!isLoading && !error && pages.length > 0 && (
            <div className="space-y-4">
              {/* Page navigation for multi-page PDFs */}
              {pages.length > 1 && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary px-3 py-1.5 text-sm"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {pages.length}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(pages.length, p + 1))}
                    disabled={currentPage === pages.length}
                    className="btn btn-secondary px-3 py-1.5 text-sm"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Current page preview */}
              <div className="flex justify-center">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pages[currentPage - 1].dataUrl}
                    alt={`Page ${currentPage}`}
                    className="max-w-full h-auto"
                  />
                </div>
              </div>

              {/* Thumbnail strip for multi-page PDFs */}
              {pages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto py-2 px-1">
                  {pages.map((page) => (
                    <button
                      key={page.pageNum}
                      onClick={() => setCurrentPage(page.pageNum)}
                      className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        currentPage === page.pageNum
                          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.dataUrl}
                        alt={`Page ${page.pageNum} thumbnail`}
                        className="w-16 h-20 object-cover object-top"
                      />
                      <div className="text-xs text-center py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400">
                        {page.pageNum}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            onClick={onClose}
            className="btn btn-secondary flex-1 sm:flex-none"
          >
            Close
          </button>
          <button
            onClick={onDownload}
            disabled={isLoading}
            className="btn btn-primary flex-1 sm:flex-none sm:ml-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
