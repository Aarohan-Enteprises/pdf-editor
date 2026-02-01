'use client';

import {
  compressLossless,
  compressBalanced,
  compressMax,
  type CompressionResult as LibCompressionResult,
  type ProgressEvent,
} from '@quicktoolsone/pdf-compress';

export type CompressionQuality = 'low' | 'medium' | 'high';

export interface CompressionResult {
  data: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savings: number;
}

export interface CompressOptions {
  quality: CompressionQuality;
}

export type ProgressCallback = (stage: string, percent: number) => void;

export async function compressPDF(
  pdfData: ArrayBuffer,
  options: CompressOptions,
  onProgress?: ProgressCallback
): Promise<CompressionResult> {
  const handleProgress = (event: ProgressEvent) => {
    const stage = event.message || `${event.phase}...`;
    onProgress?.(stage, Math.round(event.progress));
  };

  let result: LibCompressionResult;

  switch (options.quality) {
    case 'low':
      // Maximum compression
      result = await compressMax(pdfData, { onProgress: handleProgress });
      break;
    case 'medium':
      // Balanced compression (recommended)
      result = await compressBalanced(pdfData, { onProgress: handleProgress });
      break;
    case 'high':
      // Lossless compression
      result = await compressLossless(pdfData, { onProgress: handleProgress });
      break;
    default:
      result = await compressBalanced(pdfData, { onProgress: handleProgress });
  }

  return {
    data: new Uint8Array(result.pdf),
    originalSize: result.stats.originalSize,
    compressedSize: result.stats.compressedSize,
    savings: result.stats.percentageSaved,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
