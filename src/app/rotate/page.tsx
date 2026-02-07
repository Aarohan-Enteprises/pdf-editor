'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFDropzone } from '@/components/pdf/PDFDropzone';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { usePDFDocument, PageLimitError, EncryptedPDFError } from '@/hooks/usePDFDocument';
import { usePDFPreview } from '@/hooks/usePDFPreview';
import { mergePDFsWithOrder } from '@/lib/pdf-operations';
import Link from 'next/link';

export default function RotatePage() {
  const t = useTranslations('tools.rotate');
  const tDropzone = useTranslations('dropzone');
  const tCommon = useTranslations('common');

  const {
    files,
    pages,
    selectedPages,
    isLoading,
    addFiles,
    removePage,
    reorderPages,
    rotatePage,
    rotateSelectedPages,
    togglePageSelection,
    selectAllPages,
    deselectAllPages,
    updatePageThumbnail,
    clearAll,
  } = usePDFDocument();

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('rotated-document');

  const {
    isPreviewOpen,
    previewData,
    previewFilename,
    showPreview,
    closePreview,
    downloadPreview,
  } = usePDFPreview();

  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      setUploadError(null);
      try {
        await addFiles(selectedFiles);
      } catch (error) {
        if (error instanceof PageLimitError) {
          setUploadError(tDropzone('tooManyPages'));
        } else if (error instanceof EncryptedPDFError) {
          setUploadError(error.message);
        } else {
          console.error('Failed to load files:', error);
        }
      }
    },
    [addFiles, tDropzone]
  );

  const handleDownload = useCallback(async () => {
    if (pages.length === 0 || files.length === 0) return;
    setIsProcessing(true);
    try {
      const pdfData = await mergePDFsWithOrder(files.map((f) => f.data), pages);
      const filename = outputFilename.trim() || 'rotated-document';
      showPreview(pdfData, `${filename}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, pages, outputFilename, showPreview]);

  return (
    <PageLayout>
      <PDFPreviewModal
        isOpen={isPreviewOpen}
        pdfData={previewData}
        filename={previewFilename}
        onClose={closePreview}
        onDownload={downloadPreview}
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
            <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
            <div className="card p-4 lg:sticky lg:top-24 space-y-4">
              <PDFDropzone
                onFilesSelected={handleFilesSelected}
                isLoading={isLoading}
                externalError={uploadError}
                onClearError={() => setUploadError(null)}
              />

              {pages.length > 0 && (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllPages}
                      className="btn btn-secondary flex-1 text-sm"
                    >
                      {tCommon('selectAll')}
                    </button>
                    <button
                      onClick={deselectAllPages}
                      className="btn btn-secondary flex-1 text-sm"
                    >
                      {tCommon('deselectAll')}
                    </button>
                  </div>

                  {/* Rotation Controls */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Rotate {selectedPages.size > 0 ? `${selectedPages.size} selected` : 'all'} page(s):
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => rotateSelectedPages(-90)}
                        disabled={selectedPages.size === 0}
                        className="btn btn-secondary text-sm flex flex-col items-center py-3"
                      >
                        <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        90° Left
                      </button>
                      <button
                        onClick={() => rotateSelectedPages(180)}
                        disabled={selectedPages.size === 0}
                        className="btn btn-secondary text-sm flex flex-col items-center py-3"
                      >
                        <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        180°
                      </button>
                      <button
                        onClick={() => rotateSelectedPages(90)}
                        disabled={selectedPages.size === 0}
                        className="btn btn-secondary text-sm flex flex-col items-center py-3"
                      >
                        <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                        </svg>
                        90° Right
                      </button>
                    </div>
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
                        placeholder="rotated-document"
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
                    onClick={handleDownload}
                    disabled={isProcessing || pages.length === 0}
                    className="btn btn-primary w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Rotate & Preview'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: PDF Viewer */}
          <div className="lg:col-span-2">
            {pages.length > 0 ? (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {pages.length} pages
                  </h2>
                  {selectedPages.size > 0 && (
                    <span className="text-sm text-indigo-600 dark:text-indigo-400">
                      {selectedPages.size} selected
                    </span>
                  )}
                </div>
                <PDFViewer
                  files={files}
                  pages={pages}
                  selectedPages={selectedPages}
                  onToggleSelection={togglePageSelection}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No PDF added yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload a PDF file to rotate pages
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
