// Pre-built workflow templates

import type { WorkflowTemplate } from './workflow-engine';

let stepIdCounter = 0;
function nextId(): string {
  return `tpl-step-${++stepIdCounter}`;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'prepare-for-email',
    nameKey: 'templates.prepareForEmail.name',
    descriptionKey: 'templates.prepareForEmail.description',
    icon: 'email',
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    featured: true,
    steps: [
      { id: nextId(), type: 'compress', config: { quality: 'medium' } },
      { id: nextId(), type: 'lock', config: { password: '' } },
    ],
  },
  {
    id: 'professional-document',
    nameKey: 'templates.professionalDocument.name',
    descriptionKey: 'templates.professionalDocument.description',
    icon: 'document',
    gradient: 'from-indigo-500 to-purple-600',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    featured: true,
    steps: [
      { id: nextId(), type: 'page-numbers', config: { position: 'bottom-center', format: 'number', fontSize: 12, startNumber: 1 } },
      { id: nextId(), type: 'watermark', config: { text: 'DRAFT', fontSize: 48, opacity: 0.15, position: 'center', color: '#cccccc' } },
    ],
  },
  {
    id: 'archive-ready',
    nameKey: 'templates.archiveReady.name',
    descriptionKey: 'templates.archiveReady.description',
    icon: 'archive',
    gradient: 'from-teal-500 to-emerald-600',
    lightBg: 'bg-teal-50 dark:bg-teal-950/30',
    textColor: 'text-teal-600 dark:text-teal-400',
    featured: true,
    steps: [
      { id: nextId(), type: 'flatten', config: {} },
      { id: nextId(), type: 'edit-metadata', config: { title: '', author: '', subject: '', keywords: '' } },
      { id: nextId(), type: 'compress', config: { quality: 'high' } },
    ],
  },
  {
    id: 'confidential-report',
    nameKey: 'templates.confidentialReport.name',
    descriptionKey: 'templates.confidentialReport.description',
    icon: 'confidential',
    gradient: 'from-red-500 to-rose-600',
    lightBg: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-600 dark:text-red-400',
    steps: [
      { id: nextId(), type: 'watermark', config: { text: 'CONFIDENTIAL', fontSize: 48, opacity: 0.2, position: 'center', color: '#dc2626' } },
      { id: nextId(), type: 'page-numbers', config: { position: 'bottom-center', format: 'pageOfTotal', fontSize: 10, startNumber: 1 } },
      { id: nextId(), type: 'lock', config: { password: '' } },
    ],
  },
  {
    id: 'clean-and-compress',
    nameKey: 'templates.cleanAndCompress.name',
    descriptionKey: 'templates.cleanAndCompress.description',
    icon: 'clean',
    gradient: 'from-emerald-500 to-green-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    steps: [
      { id: nextId(), type: 'flatten', config: {} },
      { id: nextId(), type: 'edit-metadata', config: { title: '', author: '', subject: '', keywords: '' } },
      { id: nextId(), type: 'compress', config: { quality: 'low' } },
    ],
  },
  {
    id: 'presentation-ready',
    nameKey: 'templates.presentationReady.name',
    descriptionKey: 'templates.presentationReady.description',
    icon: 'presentation',
    gradient: 'from-orange-500 to-amber-600',
    lightBg: 'bg-orange-50 dark:bg-orange-950/30',
    textColor: 'text-orange-600 dark:text-orange-400',
    steps: [
      { id: nextId(), type: 'rotate', config: { degrees: '90' } },
      { id: nextId(), type: 'page-numbers', config: { position: 'bottom-right', format: 'number', fontSize: 10, startNumber: 1 } },
      { id: nextId(), type: 'watermark', config: { text: 'DRAFT', fontSize: 36, opacity: 0.1, position: 'topRight', color: '#999999' } },
    ],
  },
  {
    id: 'reverse-and-number',
    nameKey: 'templates.reverseAndNumber.name',
    descriptionKey: 'templates.reverseAndNumber.description',
    icon: 'reverseNumber',
    gradient: 'from-purple-500 to-violet-600',
    lightBg: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    steps: [
      { id: nextId(), type: 'reverse', config: {} },
      { id: nextId(), type: 'page-numbers', config: { position: 'bottom-center', format: 'number', fontSize: 12, startNumber: 1 } },
    ],
  },
];

export function getFeaturedTemplates(): WorkflowTemplate[] {
  return workflowTemplates.filter((t) => t.featured);
}
