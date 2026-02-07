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
  { id: 'organizePdf', href: '/organize-pdf', category: 'organize' },
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
  'organize-pdf': 'organizePdf',
  'lock-pdf': 'lockPdf',
  'unlock-pdf': 'unlockPdf',
};

// Suggested tools after completing an operation (slug → slugs)
// Logic: suggest what makes sense to do NEXT with the OUTPUT PDF.
// Empty array = no suggestions (output isn't a PDF, or can't be edited further).
export const toolSuggestions: Record<string, string[]> = {
  'merge': ['compress', 'watermark', 'lock-pdf'],
  'split': ['compress', 'watermark', 'rotate'],
  'rotate': ['compress', 'watermark', 'page-numbers'],
  'delete-pages': ['compress', 'watermark', 'page-numbers'],
  'reverse-pages': ['compress', 'page-numbers', 'watermark'],
  'duplicate-pages': ['compress', 'page-numbers', 'watermark'],
  'insert-blank': ['page-numbers', 'compress', 'watermark'],
  'organize-pdf': ['compress', 'watermark', 'page-numbers'],
  'jpg-to-pdf': ['compress', 'watermark', 'lock-pdf'],
  'pdf-to-jpg': [],
  'extract-text': [],
  'docx-to-pdf': ['compress', 'watermark', 'lock-pdf'],
  'pdf-to-docx': [],
  'watermark': ['compress', 'lock-pdf', 'sign-pdf'],
  'page-numbers': ['compress', 'watermark', 'lock-pdf'],
  'sign-pdf': ['compress', 'lock-pdf', 'flatten-pdf'],
  'edit-metadata': ['compress', 'lock-pdf', 'watermark'],
  'redact': ['flatten-pdf', 'compress', 'lock-pdf'],
  'compress': ['lock-pdf', 'watermark', 'sign-pdf'],
  'flatten-pdf': ['compress', 'lock-pdf', 'sign-pdf'],
  'lock-pdf': [],
  'unlock-pdf': ['edit-metadata', 'compress', 'watermark'],
};
