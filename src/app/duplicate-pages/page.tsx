'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFDropzone } from '@/components/pdf/PDFDropzone';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { usePDFDocument, PageLimitError, EncryptedPDFError } from '@/hooks/usePDFDocument';
import { usePDFPreview } from '@/hooks/usePDFPreview';
import { splitPDF } from '@/lib/pdf-operations';
import Link from 'next/link';
import { ToolSEOSection } from '@/components/ToolSEOSection';

export default function DuplicatePagesPage() {
  const t = useTranslations('tools.duplicatePages');
  const tDropzone = useTranslations('dropzone');
  const tCommon = useTranslations('common');

  const {
    files,
    pages,
    selectedPages,
    isLoading,
    addFiles,
    reorderPages,
    togglePageSelection,
    selectAllPages,
    deselectAllPages,
    updatePageThumbnail,
    clearAll,
  } = usePDFDocument();

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState('document-duplicated');
  const [copies, setCopies] = useState(1);

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
        if (selectedFiles.length > 0) {
          setOutputFilename(selectedFiles[0].name.replace('.pdf', '-duplicated'));
        }
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

  const handleDuplicate = useCallback(async () => {
    if (pages.length === 0 || files.length === 0 || selectedPages.size === 0) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = files[0].data;

      // Build page list: keep all pages, insert duplicates after selected ones
      const allIndices: number[] = [];
      for (const page of pages) {
        allIndices.push(page.pageIndex);
        if (selectedPages.has(page.id)) {
          for (let i = 0; i < copies; i++) {
            allIndices.push(page.pageIndex);
          }
        }
      }

      const resultData = await splitPDF(arrayBuffer, allIndices);
      const filename = outputFilename.trim() || 'document-duplicated';
      showPreview(resultData, `${filename}.pdf`);
    } catch (error) {
      console.error('Failed to duplicate pages:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, pages, selectedPages, copies, outputFilename, showPreview]);

  return (
    <PageLayout>
      <PDFPreviewModal
        isOpen={isPreviewOpen}
        pdfData={previewData}
        filename={previewFilename}
        onClose={closePreview}
        onDownload={downloadPreview}
        currentTool="duplicate-pages"
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
            <div className="w-14 h-14 rounded-2xl bg-lime-100 dark:bg-lime-950/30 text-lime-600 dark:text-lime-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                fileLoaded={files.length > 0}
                fileName={files[0]?.name}
              />

              {pages.length > 0 && (
                <>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Select pages you want to duplicate. Each selected page will be copied the specified number of times.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number of Copies
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={copies}
                      onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">Original + {copies} copy/copies = {copies + 1} total per page</p>
                  </div>

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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Output filename
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={outputFilename}
                        onChange={(e) => setOutputFilename(e.target.value)}
                        placeholder="document-duplicated"
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
                    onClick={handleDuplicate}
                    disabled={isProcessing || selectedPages.size === 0}
                    className="btn btn-primary w-full"
                  >
                    {isProcessing ? 'Processing...' : `Duplicate & Preview ${selectedPages.size} Page(s)`}
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
                    <span className="text-sm text-lime-600 dark:text-lime-400">
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
                  onThumbnailLoad={updatePageThumbnail}
                />
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No PDF added yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload a PDF file to duplicate pages
                </p>
              </div>
            )}
          </div>
        </div>
        <ToolSEOSection toolId="duplicate-pages" />
      </div>
    </PageLayout>
  );
}
