// Shared tool metadata for navigation and suggestions

export interface ToolNavItem {
  id: string;
  href: string;
  category: 'organize' | 'convert' | 'edit' | 'secure';
}

export const toolNavItems: ToolNavItem[] = [
  { id: 'merge', href: '/merge', category: 'organize' },
  { id: 'split', href: '/split', category: 'organize' },
  { id: 'rotate', href: '/rotate', category: 'organize' },
  { id: 'deletePages', href: '/delete-pages', category: 'organize' },
  { id: 'reversePages', href: '/reverse-pages', category: 'organize' },
  { id: 'duplicatePages', href: '/duplicate-pages', category: 'organize' },
  { id: 'insertBlank', href: '/insert-blank', category: 'organize' },
  { id: 'jpgToPdf', href: '/jpg-to-pdf', category: 'convert' },
  { id: 'pdfToJpg', href: '/pdf-to-jpg', category: 'convert' },
  { id: 'extractText', href: '/extract-text', category: 'convert' },
  { id: 'docxToPdf', href: '/docx-to-pdf', category: 'convert' },
  { id: 'pdfToDocx', href: '/pdf-to-docx', category: 'convert' },
  { id: 'watermark', href: '/watermark', category: 'edit' },
  { id: 'pageNumbers', href: '/page-numbers', category: 'edit' },
  { id: 'signPdf', href: '/sign-pdf', category: 'edit' },
  { id: 'editMetadata', href: '/edit-metadata', category: 'edit' },
  { id: 'redact', href: '/redact', category: 'edit' },
  { id: 'compress', href: '/compress', category: 'edit' },
  { id: 'flattenPdf', href: '/flatten-pdf', category: 'edit' },
  { id: 'lockPdf', href: '/lock-pdf', category: 'secure' },
  { id: 'unlockPdf', href: '/unlock-pdf', category: 'secure' },
];

// Map URL slug to tool translation id
export const slugToToolId: Record<string, string> = {
  'merge': 'merge',
  'split': 'split',
  'rotate': 'rotate',
  'delete-pages': 'deletePages',
  'reverse-pages': 'reversePages',
  'duplicate-pages': 'duplicatePages',
  'insert-blank': 'insertBlank',
  'jpg-to-pdf': 'jpgToPdf',
  'pdf-to-jpg': 'pdfToJpg',
  'extract-text': 'extractText',
  'docx-to-pdf': 'docxToPdf',
  'pdf-to-docx': 'pdfToDocx',
  'watermark': 'watermark',
  'page-numbers': 'pageNumbers',
  'sign-pdf': 'signPdf',
  'edit-metadata': 'editMetadata',
  'redact': 'redact',
  'compress': 'compress',
  'flatten-pdf': 'flattenPdf',
  'lock-pdf': 'lockPdf',
  'unlock-pdf': 'unlockPdf',
};

// Suggested tools after completing an operation (slug → slugs)
export const toolSuggestions: Record<string, string[]> = {
  'merge': ['compress', 'page-numbers', 'lock-pdf'],
  'split': ['merge', 'delete-pages', 'rotate'],
  'rotate': ['merge', 'compress', 'page-numbers'],
  'delete-pages': ['merge', 'split', 'compress'],
  'reverse-pages': ['rotate', 'merge', 'page-numbers'],
  'duplicate-pages': ['merge', 'delete-pages', 'compress'],
  'insert-blank': ['merge', 'page-numbers', 'delete-pages'],
  'jpg-to-pdf': ['merge', 'compress', 'watermark'],
  'pdf-to-jpg': ['jpg-to-pdf', 'compress', 'split'],
  'extract-text': ['split', 'pdf-to-jpg', 'compress'],
  'docx-to-pdf': ['compress', 'watermark', 'lock-pdf'],
  'pdf-to-docx': ['docx-to-pdf', 'extract-text', 'compress'],
  'watermark': ['compress', 'lock-pdf', 'sign-pdf'],
  'page-numbers': ['merge', 'compress', 'watermark'],
  'sign-pdf': ['compress', 'lock-pdf', 'watermark'],
  'edit-metadata': ['compress', 'lock-pdf', 'watermark'],
  'redact': ['compress', 'lock-pdf', 'sign-pdf'],
  'compress': ['flatten-pdf', 'lock-pdf', 'watermark'],
  'flatten-pdf': ['compress', 'lock-pdf', 'sign-pdf'],
  'lock-pdf': ['compress', 'watermark', 'sign-pdf'],
  'unlock-pdf': ['compress', 'edit-metadata', 'split'],
};
