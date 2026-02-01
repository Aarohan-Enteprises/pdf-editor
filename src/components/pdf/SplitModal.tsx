'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPages: number;
  onSplitAtPage: (pageNumber: number, downloadOption: 'first' | 'second' | 'both') => void;
}

export function SplitModal({
  isOpen,
  onClose,
  totalPages,
  onSplitAtPage,
}: SplitModalProps) {
  const t = useTranslations('split');
  const tCommon = useTranslations('common');

  const [splitPage, setSplitPage] = useState(Math.floor(totalPages / 2));

  const handleSplit = (option: 'first' | 'second' | 'both') => {
    onSplitAtPage(splitPage, option);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      footer={
        <Button variant="secondary" onClick={onClose}>
          {tCommon('cancel')}
        </Button>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('splitAtPage')}
          </label>
          <input
            type="number"
            value={splitPage}
            onChange={(e) => setSplitPage(Math.max(1, Math.min(totalPages - 1, Number(e.target.value))))}
            min={1}
            max={totalPages - 1}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {t('pageNumber')}: 1 - {totalPages - 1}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">{t('firstPart')}</span> {splitPage}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">{t('secondPart')}</span> {splitPage + 1} {t('toEnd')}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            onClick={() => handleSplit('both')}
            className="w-full"
          >
            {t('downloadBoth')}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handleSplit('first')}
              className="flex-1"
            >
              {t('downloadFirst')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSplit('second')}
              className="flex-1"
            >
              {t('downloadSecond')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
