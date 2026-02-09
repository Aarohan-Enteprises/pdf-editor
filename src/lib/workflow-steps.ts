// Step registry: maps each step type to metadata + executor

import {
  rotatePages,
  reversePageOrder,
  addPageNumbers,
  addWatermark,
  editMetadata,
  flattenPDF,
  loadPDF,
} from '@/lib/pdf-operations';
import type { StepType, StepExecutor } from './workflow-engine';

export type ConfigFieldType = 'select' | 'text' | 'number' | 'color' | 'range' | 'password';

export interface ConfigField {
  key: string;
  labelKey: string;
  type: ConfigFieldType;
  required?: boolean;
  options?: { value: string; labelKey: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface StepDefinition {
  type: StepType;
  labelKey: string;
  descriptionKey: string;
  icon: string;
  gradient: string;
  lightBg: string;
  textColor: string;
  configFields: ConfigField[];
  defaultConfig: Record<string, string | number | boolean>;
  isBackend?: boolean;
}

export const stepRegistry: Record<StepType, StepDefinition> = {
  rotate: {
    type: 'rotate',
    labelKey: 'steps.rotate.label',
    descriptionKey: 'steps.rotate.description',
    icon: 'rotate',
    gradient: 'from-cyan-500 to-cyan-600',
    lightBg: 'bg-cyan-50 dark:bg-cyan-950/30',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    configFields: [
      {
        key: 'degrees',
        labelKey: 'steps.rotate.degrees',
        type: 'select',
        options: [
          { value: '90', labelKey: 'steps.rotate.90' },
          { value: '180', labelKey: 'steps.rotate.180' },
          { value: '270', labelKey: 'steps.rotate.270' },
        ],
      },
    ],
    defaultConfig: { degrees: '90' },
  },
  reverse: {
    type: 'reverse',
    labelKey: 'steps.reverse.label',
    descriptionKey: 'steps.reverse.description',
    icon: 'reverse',
    gradient: 'from-amber-500 to-amber-600',
    lightBg: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    configFields: [],
    defaultConfig: {},
  },
  'page-numbers': {
    type: 'page-numbers',
    labelKey: 'steps.pageNumbers.label',
    descriptionKey: 'steps.pageNumbers.description',
    icon: 'pageNumbers',
    gradient: 'from-indigo-500 to-indigo-600',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    configFields: [
      {
        key: 'position',
        labelKey: 'steps.pageNumbers.position',
        type: 'select',
        options: [
          { value: 'bottom-center', labelKey: 'steps.pageNumbers.bottomCenter' },
          { value: 'bottom-left', labelKey: 'steps.pageNumbers.bottomLeft' },
          { value: 'bottom-right', labelKey: 'steps.pageNumbers.bottomRight' },
          { value: 'top-center', labelKey: 'steps.pageNumbers.topCenter' },
          { value: 'top-left', labelKey: 'steps.pageNumbers.topLeft' },
          { value: 'top-right', labelKey: 'steps.pageNumbers.topRight' },
        ],
      },
      {
        key: 'format',
        labelKey: 'steps.pageNumbers.format',
        type: 'select',
        options: [
          { value: 'number', labelKey: 'steps.pageNumbers.formatNumber' },
          { value: 'pageOfTotal', labelKey: 'steps.pageNumbers.formatPageOfTotal' },
          { value: 'dash', labelKey: 'steps.pageNumbers.formatDash' },
        ],
      },
      {
        key: 'fontSize',
        labelKey: 'steps.pageNumbers.fontSize',
        type: 'number',
        min: 8,
        max: 24,
      },
      {
        key: 'startNumber',
        labelKey: 'steps.pageNumbers.startNumber',
        type: 'number',
        min: 1,
        max: 999,
      },
    ],
    defaultConfig: { position: 'bottom-center', format: 'number', fontSize: 12, startNumber: 1 },
  },
  watermark: {
    type: 'watermark',
    labelKey: 'steps.watermark.label',
    descriptionKey: 'steps.watermark.description',
    icon: 'watermark',
    gradient: 'from-pink-500 to-pink-600',
    lightBg: 'bg-pink-50 dark:bg-pink-950/30',
    textColor: 'text-pink-600 dark:text-pink-400',
    configFields: [
      {
        key: 'text',
        labelKey: 'steps.watermark.text',
        type: 'text',
        required: true,
        placeholder: 'DRAFT',
      },
      {
        key: 'fontSize',
        labelKey: 'steps.watermark.fontSize',
        type: 'number',
        min: 12,
        max: 120,
      },
      {
        key: 'opacity',
        labelKey: 'steps.watermark.opacity',
        type: 'range',
        min: 0.05,
        max: 1,
        step: 0.05,
      },
      {
        key: 'position',
        labelKey: 'steps.watermark.position',
        type: 'select',
        options: [
          { value: 'center', labelKey: 'steps.watermark.center' },
          { value: 'topLeft', labelKey: 'steps.watermark.topLeft' },
          { value: 'topRight', labelKey: 'steps.watermark.topRight' },
          { value: 'bottomLeft', labelKey: 'steps.watermark.bottomLeft' },
          { value: 'bottomRight', labelKey: 'steps.watermark.bottomRight' },
        ],
      },
    ],
    defaultConfig: { text: 'DRAFT', fontSize: 48, opacity: 0.3, position: 'center', color: '#888888' },
  },
  'edit-metadata': {
    type: 'edit-metadata',
    labelKey: 'steps.editMetadata.label',
    descriptionKey: 'steps.editMetadata.description',
    icon: 'editMetadata',
    gradient: 'from-violet-500 to-violet-600',
    lightBg: 'bg-violet-50 dark:bg-violet-950/30',
    textColor: 'text-violet-600 dark:text-violet-400',
    configFields: [
      { key: 'title', labelKey: 'steps.editMetadata.title', type: 'text', placeholder: 'Document Title' },
      { key: 'author', labelKey: 'steps.editMetadata.author', type: 'text', placeholder: 'Author Name' },
      { key: 'subject', labelKey: 'steps.editMetadata.subject', type: 'text', placeholder: 'Subject' },
      { key: 'keywords', labelKey: 'steps.editMetadata.keywords', type: 'text', placeholder: 'keyword1, keyword2' },
    ],
    defaultConfig: { title: '', author: '', subject: '', keywords: '' },
  },
  flatten: {
    type: 'flatten',
    labelKey: 'steps.flatten.label',
    descriptionKey: 'steps.flatten.description',
    icon: 'flatten',
    gradient: 'from-teal-500 to-teal-600',
    lightBg: 'bg-teal-50 dark:bg-teal-950/30',
    textColor: 'text-teal-600 dark:text-teal-400',
    configFields: [],
    defaultConfig: {},
  },
  compress: {
    type: 'compress',
    labelKey: 'steps.compress.label',
    descriptionKey: 'steps.compress.description',
    icon: 'compress',
    gradient: 'from-emerald-500 to-emerald-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    configFields: [
      {
        key: 'quality',
        labelKey: 'steps.compress.quality',
        type: 'select',
        options: [
          { value: 'low', labelKey: 'steps.compress.low' },
          { value: 'medium', labelKey: 'steps.compress.medium' },
          { value: 'high', labelKey: 'steps.compress.high' },
        ],
      },
    ],
    defaultConfig: { quality: 'medium' },
    isBackend: true,
  },
  lock: {
    type: 'lock',
    labelKey: 'steps.lock.label',
    descriptionKey: 'steps.lock.description',
    icon: 'lock',
    gradient: 'from-emerald-500 to-emerald-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    configFields: [
      {
        key: 'password',
        labelKey: 'steps.lock.password',
        type: 'password',
        required: true,
        placeholder: 'Enter password',
      },
    ],
    defaultConfig: { password: '' },
    isBackend: true,
  },
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.53, g: 0.53, b: 0.53 };
}

export function createStepExecutors(): Record<StepType, StepExecutor> {
  return {
    rotate: {
      async execute(pdfData, config) {
        const pdf = await loadPDF(pdfData);
        const pageCount = pdf.getPageCount();
        const allIndices = Array.from({ length: pageCount }, (_, i) => i);
        return rotatePages(pdfData, allIndices, Number(config.degrees) || 90);
      },
    },
    reverse: {
      async execute(pdfData) {
        return reversePageOrder(pdfData);
      },
    },
    'page-numbers': {
      async execute(pdfData, config) {
        return addPageNumbers(pdfData, {
          position: (config.position as 'bottom-center') || 'bottom-center',
          format: (config.format as 'number') || 'number',
          fontSize: Number(config.fontSize) || 12,
          startNumber: Number(config.startNumber) || 1,
          margin: 30,
        });
      },
    },
    watermark: {
      async execute(pdfData, config) {
        const colorHex = String(config.color || '#888888');
        return addWatermark(pdfData, {
          text: String(config.text || 'DRAFT'),
          fontSize: Number(config.fontSize) || 48,
          color: hexToRgb(colorHex),
          opacity: Number(config.opacity) || 0.3,
          position: (config.position as 'center') || 'center',
        });
      },
    },
    'edit-metadata': {
      async execute(pdfData, config) {
        return editMetadata(pdfData, {
          title: String(config.title || ''),
          author: String(config.author || ''),
          subject: String(config.subject || ''),
          keywords: String(config.keywords || ''),
          creator: 'https://pdf2.in',
        });
      },
    },
    flatten: {
      async execute(pdfData) {
        return flattenPDF(pdfData);
      },
    },
    compress: {
      async execute(pdfData, config) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const blob = new Blob([pdfData as unknown as BlobPart], { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', blob, 'document.pdf');
        formData.append('quality', String(config.quality || 'medium'));

        const response = await fetch(`${apiUrl}/api/compress`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Compression failed');
        }

        const resultBlob = await response.blob();
        return new Uint8Array(await resultBlob.arrayBuffer());
      },
    },
    lock: {
      async execute(pdfData, config) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const blob = new Blob([pdfData as unknown as BlobPart], { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', blob, 'document.pdf');
        formData.append('password', String(config.password));

        const response = await fetch(`${apiUrl}/api/lock`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Locking failed');
        }

        const resultBlob = await response.blob();
        return new Uint8Array(await resultBlob.arrayBuffer());
      },
    },
  };
}

export const allStepTypes: StepType[] = [
  'rotate',
  'reverse',
  'page-numbers',
  'watermark',
  'edit-metadata',
  'flatten',
  'compress',
  'lock',
];
