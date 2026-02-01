'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFDropzone } from '@/components/pdf/PDFDropzone';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { usePDFDocument, PageLimitError } from '@/hooks/usePDFDocument';
import { mergePDFsWithOrder, downloadPDF } from '@/lib/pdf-operations';

export default function MergePage() {
  const t = useTranslations('tools.merge');
  const tDropzone = useTranslations('dropzone');

  const {
    files,
    pages,
    isLoading,
    addFiles,
    removePage,
    reorderPages,
    rotatePage,
    updatePageThumbnail,
    clearAll,
  } = usePDFDocument();

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('merged-document');

  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      setUploadError(null);
      try {
        await addFiles(selectedFiles);
      } catch (error) {
        if (error instanceof PageLimitError) {
          setUploadError(tDropzone('tooManyPages'));
        } else {
          console.error('Failed to load files:', error);
        }
      }
    },
    [addFiles, tDropzone]
  );

  const handleMergeAndDownload = useCallback(async () => {
    if (pages.length === 0 || files.length === 0) return;
    setIsProcessing(true);
    try {
      const pdfData = await mergePDFsWithOrder(files.map((f) => f.data), pages);
      const filename = outputFilename.trim() || 'merged-document';
      downloadPDF(pdfData, `${filename}.pdf`);
    } catch (error) {
      console.error('Failed to merge PDF:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, pages, outputFilename]);

  return (
    <PageLayout>
      <div className="w-full px-6 lg:px-12 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
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
          {/* Left: Dropzone */}
          <div className="lg:col-span-1">
            <div className="card p-4 sticky top-24">
              <PDFDropzone
                onFilesSelected={handleFilesSelected}
                isLoading={isLoading}
                externalError={uploadError}
                onClearError={() => setUploadError(null)}
              />

              {pages.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Drag pages to reorder them. Click the X to remove a page.
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
                        placeholder="merged-document"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                      />
                      <span className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                        .pdf
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={clearAll}
                    className="btn btn-ghost w-full text-sm text-red-600 dark:text-red-400"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleMergeAndDownload}
                    disabled={isProcessing || pages.length === 0}
                    className="btn btn-primary w-full"
                  >
                    {isProcessing ? 'Processing...' : `Merge & Download (${pages.length} pages)`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: PDF Viewer */}
          <div className="lg:col-span-2">
            {pages.length > 0 ? (
              <div className="card p-4">
                <div className="mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {pages.length} pages from {files.length} file(s)
                  </h2>
                </div>
                <PDFViewer
                  files={files}
                  pages={pages}
                  selectedPages={new Set()}
                  onToggleSelection={() => {}}
                  onReorder={reorderPages}
                  onRotate={rotatePage}
                  onDelete={removePage}
                  onThumbnailLoad={updatePageThumbnail}
                />
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No PDFs added yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload PDF files to start merging them
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
