'use client';

import { useState, useCallback, DragEvent, ChangeEvent, useRef } from 'react';
import { useTranslations } from 'next-intl';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface PDFDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isLoading?: boolean;
  externalError?: string | null;
  onClearError?: () => void;
  multiple?: boolean;
  fileLoaded?: boolean;
  fileName?: string;
}

export function PDFDropzone({ onFilesSelected, isLoading, externalError, onClearError, multiple = false, fileLoaded = false, fileName }: PDFDropzoneProps) {
  const t = useTranslations('dropzone');
  const [isDragActive, setIsDragActive] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const error = externalError || internalError;

  const validateFiles = useCallback(
    (files: FileList | File[]): File[] => {
      const validFiles: File[] = [];
      const fileArray = Array.from(files);

      if (!multiple && fileArray.length > 1) {
        setInternalError('Please upload only one PDF file');
        if (onClearError) onClearError();
        return [];
      }

      for (const file of fileArray) {
        if (file.type !== 'application/pdf') {
          setInternalError(t('invalidFile'));
          if (onClearError) onClearError();
          return [];
        }

        if (file.size > MAX_FILE_SIZE) {
          setInternalError(t('fileTooLarge'));
          if (onClearError) onClearError();
          return [];
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0 && fileArray.length > 0) {
        setInternalError(t('invalidFile'));
        if (onClearError) onClearError();
        return [];
      }

      setInternalError(null);
      return validFiles;
    },
    [t, onClearError, multiple]
  );

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = e.dataTransfer.files;
      const validFiles = validateFiles(files);

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [validateFiles, onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const validFiles = validateFiles(files);

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [validateFiles, onFilesSelected]
  );

  const handleClick = useCallback(() => {
    if (!multiple && fileLoaded) return;
    inputRef.current?.click();
  }, [multiple, fileLoaded]);

  // Single-file mode with a file already loaded
  if (!multiple && fileLoaded) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
            {fileName || 'PDF loaded'}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            File uploaded successfully
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        dropzone
        ${isDragActive ? 'dropzone-active dropzone-pulse border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : ''}
        ${isLoading ? 'opacity-50 cursor-wait' : ''}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple={multiple}
        className="hidden"
        onChange={handleFileInput}
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-4">
        <div className={`w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center transition-transform duration-300 ${isDragActive ? 'scale-110' : ''}`}>
          <svg
            className="w-10 h-10 text-indigo-600 dark:text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            {t('title')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {t('hint')}
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm">Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}
