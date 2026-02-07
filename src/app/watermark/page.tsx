'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/PageLayout';
import { PDFDropzone } from '@/components/pdf/PDFDropzone';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { usePDFDocument, PageLimitError, EncryptedPDFError } from '@/hooks/usePDFDocument';
import { usePDFPreview } from '@/hooks/usePDFPreview';
import { mergePDFsWithOrder, addWatermark, WatermarkOptions } from '@/lib/pdf-operations';
import Link from 'next/link';

export default function WatermarkPage() {
  const t = useTranslations('tools.watermark');
  const tWatermark = useTranslations('watermark');
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
    togglePageSelection,
    selectAllPages,
    deselectAllPages,
    updatePageThumbnail,
    clearAll,
    getSelectedPageIndices,
  } = usePDFDocument();

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    isPreviewOpen,
    previewData,
    previewFilename,
    showPreview,
    closePreview,
    downloadPreview,
  } = usePDFPreview();

  // Watermark options
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#888888');
  const [opacity, setOpacity] = useState(0.3);
  const [position, setPosition] = useState<WatermarkOptions['position']>('center');
  const [applyToAll, setApplyToAll] = useState(true);
  const [outputFilename, setOutputFilename] = useState('watermarked-document');

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

  // Convert hex color to RGB (0-1 range for pdf-lib)
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      };
    }
    return { r: 0.5, g: 0.5, b: 0.5 }; // Default gray
  };

  const handleApplyWatermark = useCallback(async () => {
    if (pages.length === 0 || files.length === 0 || !watermarkText.trim()) return;
    setIsProcessing(true);
    try {
      const mergedData = await mergePDFsWithOrder(files.map((f) => f.data), pages);
      const pageIndices = applyToAll ? undefined : getSelectedPageIndices();
      const rgbColor = hexToRgb(color);
      const watermarkedData = await addWatermark(
        mergedData,
        { text: watermarkText, fontSize, color: rgbColor, opacity, position },
        pageIndices
      );
      const filename = outputFilename.trim() || 'watermarked-document';
      showPreview(watermarkedData, `${filename}.pdf`);
    } catch (error) {
      console.error('Failed to add watermark:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, pages, watermarkText, fontSize, color, opacity, position, applyToAll, getSelectedPageIndices, outputFilename, showPreview]);

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
            <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
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
                  {/* Watermark Options */}
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {tWatermark('text')}
                      </label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder={tWatermark('textPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {tWatermark('fontSize')}
                        </label>
                        <input
                          type="number"
                          min={12}
                          max={120}
                          value={fontSize}
                          onChange={(e) => setFontSize(parseInt(e.target.value) || 48)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {tWatermark('color')}
                        </label>
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-full h-10 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {tWatermark('opacity')}: {Math.round(opacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.1}
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {tWatermark('position')}
                      </label>
                      <select
                        value={position}
                        onChange={(e) => setPosition(e.target.value as WatermarkOptions['position'])}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      >
                        <option value="center">{tWatermark('positions.center')}</option>
                        <option value="top-left">{tWatermark('positions.topLeft')}</option>
                        <option value="top-right">{tWatermark('positions.topRight')}</option>
                        <option value="bottom-left">{tWatermark('positions.bottomLeft')}</option>
                        <option value="bottom-right">{tWatermark('positions.bottomRight')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {tWatermark('applyTo')}
                      </label>
                      <div className="flex gap-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={applyToAll}
                            onChange={() => setApplyToAll(true)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{tWatermark('allPages')}</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={!applyToAll}
                            onChange={() => setApplyToAll(false)}
                            disabled={selectedPages.size === 0}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {tWatermark('selectedPages')} ({selectedPages.size})
                          </span>
                        </label>
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
                          placeholder="watermarked-document"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                        />
                        <span className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                          .pdf
                        </span>
                      </div>
                    </div>
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

                  <button
                    onClick={clearAll}
                    className="btn btn-ghost w-full text-sm text-red-600 dark:text-red-400"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleApplyWatermark}
                    disabled={isProcessing || pages.length === 0 || !watermarkText.trim()}
                    className="btn btn-primary w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Apply Watermark & Preview'}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No PDF added yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload a PDF file to add watermark
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
