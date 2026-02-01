'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

interface ToolbarProps {
  hasPages: boolean;
  hasSelection: boolean;
  selectedCount: number;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onRotate180: () => void;
  onSplit: () => void;
  onSplitAtPage: () => void;
  onWatermark: () => void;
  onDownload: () => void;
  onClear: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onUnlock: () => void;
  onImageToPdf: () => void;
  isProcessing?: boolean;
}

export function Toolbar({
  hasPages,
  hasSelection,
  selectedCount,
  onRotateLeft,
  onRotateRight,
  onRotate180,
  onSplit,
  onSplitAtPage,
  onWatermark,
  onDownload,
  onClear,
  onSelectAll,
  onDeselectAll,
  onUnlock,
  onImageToPdf,
  isProcessing,
}: ToolbarProps) {
  const t = useTranslations('toolbar');
  const tCommon = useTranslations('common');
  const [showRotateMenu, setShowRotateMenu] = useState(false);

  if (!hasPages) return null;

  return (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 py-3 px-4 -mx-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 border-r border-gray-200 dark:border-slate-700 pr-4 mr-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={hasSelection ? onDeselectAll : onSelectAll}
          >
            {hasSelection ? tCommon('deselectAll') : tCommon('selectAll')}
          </Button>
          {hasSelection && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowRotateMenu(!showRotateMenu)}
            disabled={!hasSelection || isProcessing}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('rotate')}
          </Button>
          {showRotateMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 min-w-[140px] z-40">
              <button
                onClick={() => {
                  onRotateLeft();
                  setShowRotateMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                {t('rotateLeft')}
              </button>
              <button
                onClick={() => {
                  onRotateRight();
                  setShowRotateMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                {t('rotateRight')}
              </button>
              <button
                onClick={() => {
                  onRotate180();
                  setShowRotateMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                {t('rotate180')}
              </button>
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onSplit}
          disabled={!hasSelection || isProcessing}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {t('split')}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onSplitAtPage}
          disabled={isProcessing}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t('splitByPage')}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onWatermark}
          disabled={isProcessing}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {t('watermark')}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onUnlock}
          disabled={isProcessing}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          {t('unlock')}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onImageToPdf}
          disabled={isProcessing}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {t('imageToPdf')}
        </Button>

        <div className="flex-1" />

        <Button
          variant="danger"
          size="sm"
          onClick={onClear}
          disabled={isProcessing}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {t('clear')}
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onDownload}
          disabled={isProcessing}
          isLoading={isProcessing}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t('download')}
        </Button>
      </div>
    </div>
  );
}
