'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

interface ImageToPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConvert: (images: { data: ArrayBuffer; type: string }[]) => Promise<void>;
}

export function ImageToPdfModal({ isOpen, onClose, onConvert }: ImageToPdfModalProps) {
  const t = useTranslations('imageToPdf');
  const tCommon = useTranslations('common');

  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImageFile[] = [];

    Array.from(files).forEach((file) => {
      if (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg') {
        const id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const preview = URL.createObjectURL(file);
        newImages.push({ id, file, preview });
      }
    });

    setImages((prev) => [...prev, ...newImages]);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);

    try {
      const imageData = await Promise.all(
        images.map(async (img) => ({
          data: await img.file.arrayBuffer(),
          type: img.file.type,
        }))
      );

      await onConvert(imageData);
      handleClose();
    } catch (error) {
      console.error('Failed to convert images:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
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
            onClick={handleConvert}
            disabled={images.length === 0 || isProcessing}
            isLoading={isProcessing}
          >
            {t('convert')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          className="w-full"
        >
          {t('addImages')}
        </Button>

        {images.length === 0 ? (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
            {t('noImages')}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt=""
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
