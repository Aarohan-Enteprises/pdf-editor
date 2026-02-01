'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (file: File) => Promise<void>;
}

export function UnlockModal({ isOpen, onClose, onUnlock }: UnlockModalProps) {
  const t = useTranslations('unlock');
  const tCommon = useTranslations('common');

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUnlock = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      await onUnlock(file);
      onClose();
      setFile(null);
    } catch {
      setError(t('wrongPassword'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('title')}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {tCommon('cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleUnlock}
            disabled={!file || isProcessing}
            isLoading={isProcessing}
          >
            {t('unlockButton')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('description')}
        </p>

        <div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
          >
            {file ? (
              <p className="text-sm text-gray-700 dark:text-gray-300">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tCommon('browse')} PDF
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    </Modal>
  );
}
