import { Metadata } from 'next';

const BASE_URL = 'https://pdf2.in';

interface ToolSEOConfig {
  title: string;
  description: string;
  keywords: string[];
  path: string;
}

const toolConfigs: Record<string, ToolSEOConfig> = {
  merge: {
    title: 'Merge PDF Files Online - Combine PDFs Free',
    description: 'Merge multiple PDF files into one document online for free. Drag, drop, reorder pages and combine PDFs instantly in your browser. No uploads required.',
    keywords: ['merge PDF', 'combine PDF', 'join PDF files', 'PDF merger', 'merge PDF online free', 'combine PDF files'],
    path: '/merge',
  },
  split: {
    title: 'Split PDF Online - Extract Pages from PDF Free',
    description: 'Split PDF into multiple documents or extract specific pages online for free. Easy-to-use PDF splitter that works in your browser.',
    keywords: ['split PDF', 'extract PDF pages', 'PDF splitter', 'separate PDF pages', 'split PDF online free'],
    path: '/split',
  },
  rotate: {
    title: 'Rotate PDF Pages Online - Free PDF Rotation Tool',
    description: 'Rotate PDF pages by 90, 180, or 270 degrees online for free. Rotate individual pages or entire documents instantly in your browser.',
    keywords: ['rotate PDF', 'PDF rotation', 'rotate PDF pages', 'flip PDF', 'rotate PDF online free'],
    path: '/rotate',
  },
  compress: {
    title: 'Compress PDF Online - Reduce PDF File Size Free',
    description: 'Compress PDF files to reduce file size while maintaining quality. Free online PDF compressor with multiple compression levels.',
    keywords: ['compress PDF', 'reduce PDF size', 'PDF compressor', 'shrink PDF', 'compress PDF online free', 'PDF size reducer'],
    path: '/compress',
  },
  watermark: {
    title: 'Add Watermark to PDF Online - Free PDF Watermark Tool',
    description: 'Add text watermarks to PDF documents online for free. Customize font, size, color, opacity and position of your watermark.',
    keywords: ['add watermark to PDF', 'PDF watermark', 'watermark PDF online', 'text watermark PDF', 'PDF watermark tool'],
    path: '/watermark',
  },
  'page-numbers': {
    title: 'Add Page Numbers to PDF Online - Free PDF Tool',
    description: 'Add page numbers to your PDF documents online for free. Customize position, format, and starting number easily.',
    keywords: ['add page numbers PDF', 'PDF page numbers', 'number PDF pages', 'PDF page numbering'],
    path: '/page-numbers',
  },
  'delete-pages': {
    title: 'Delete Pages from PDF Online - Remove PDF Pages Free',
    description: 'Delete unwanted pages from PDF documents online for free. Select and remove specific pages from your PDF instantly.',
    keywords: ['delete PDF pages', 'remove PDF pages', 'delete pages from PDF', 'PDF page remover'],
    path: '/delete-pages',
  },
  'reverse-pages': {
    title: 'Reverse PDF Page Order Online - Free PDF Tool',
    description: 'Reverse the order of pages in your PDF document online for free. Quickly flip page sequence with one click.',
    keywords: ['reverse PDF pages', 'flip PDF order', 'reverse page order PDF', 'PDF page reverser'],
    path: '/reverse-pages',
  },
  'duplicate-pages': {
    title: 'Duplicate PDF Pages Online - Copy PDF Pages Free',
    description: 'Duplicate or copy pages within your PDF document online for free. Create multiple copies of selected pages easily.',
    keywords: ['duplicate PDF pages', 'copy PDF pages', 'replicate PDF pages', 'PDF page duplicator'],
    path: '/duplicate-pages',
  },
  'insert-blank': {
    title: 'Insert Blank Pages in PDF Online - Free PDF Tool',
    description: 'Insert blank pages at any position in your PDF document online for free. Add empty pages for notes or separators.',
    keywords: ['insert blank PDF page', 'add blank page PDF', 'PDF blank page inserter', 'add empty page PDF'],
    path: '/insert-blank',
  },
  'jpg-to-pdf': {
    title: 'Convert Images to PDF Online - JPG, PNG to PDF Free',
    description: 'Convert JPG, PNG, WebP, GIF, and other images to PDF online for free. Combine multiple images into a single PDF document.',
    keywords: ['JPG to PDF', 'image to PDF', 'PNG to PDF', 'convert image to PDF', 'picture to PDF', 'photo to PDF'],
    path: '/jpg-to-pdf',
  },
  'pdf-to-jpg': {
    title: 'Convert PDF to Images Online - PDF to JPG, PNG Free',
    description: 'Convert PDF pages to JPG, PNG, or WebP images online for free. Extract high-quality images from PDF documents.',
    keywords: ['PDF to JPG', 'PDF to image', 'PDF to PNG', 'convert PDF to image', 'extract images from PDF'],
    path: '/pdf-to-jpg',
  },
  'docx-to-pdf': {
    title: 'Convert Word to PDF Online - DOCX to PDF Free',
    description: 'Convert Microsoft Word documents (DOCX) to PDF online for free. Preserve formatting, tables, and images perfectly.',
    keywords: ['Word to PDF', 'DOCX to PDF', 'convert Word to PDF', 'DOC to PDF', 'Word document to PDF'],
    path: '/docx-to-pdf',
  },
  'extract-text': {
    title: 'Extract Text from PDF Online - PDF Text Extractor Free',
    description: 'Extract all text content from PDF documents online for free. Copy text from PDF files easily and quickly.',
    keywords: ['extract text from PDF', 'PDF text extractor', 'copy text from PDF', 'PDF to text', 'get text from PDF'],
    path: '/extract-text',
  },
  'edit-metadata': {
    title: 'Edit PDF Metadata Online - Change PDF Properties Free',
    description: 'Edit PDF metadata including title, author, subject, and keywords online for free. Modify PDF document properties easily.',
    keywords: ['edit PDF metadata', 'PDF properties', 'change PDF title', 'PDF author editor', 'modify PDF metadata'],
    path: '/edit-metadata',
  },
  'sign-pdf': {
    title: 'Sign PDF Online - Add Signature to PDF Free',
    description: 'Add your signature to PDF documents online for free. Draw, type, or upload signature images to sign PDFs instantly.',
    keywords: ['sign PDF', 'add signature to PDF', 'PDF signature', 'electronic signature PDF', 'e-sign PDF'],
    path: '/sign-pdf',
  },
  'lock-pdf': {
    title: 'Lock PDF with Password Online - Protect PDF Free',
    description: 'Password protect your PDF documents online for free. Add encryption and security to prevent unauthorized access.',
    keywords: ['lock PDF', 'password protect PDF', 'encrypt PDF', 'secure PDF', 'PDF password protection'],
    path: '/lock-pdf',
  },
  'unlock-pdf': {
    title: 'Unlock PDF Online - Remove PDF Password Free',
    description: 'Remove password protection from PDF documents online for free. Unlock encrypted PDFs when you know the password.',
    keywords: ['unlock PDF', 'remove PDF password', 'decrypt PDF', 'PDF password remover', 'unprotect PDF'],
    path: '/unlock-pdf',
  },
  redact: {
    title: 'Redact PDF Online - Black Out Sensitive Information Free',
    description: 'Redact sensitive information in PDF documents online for free. Permanently black out text and images for privacy.',
    keywords: ['redact PDF', 'black out PDF', 'censor PDF', 'PDF redaction tool', 'hide text in PDF'],
    path: '/redact',
  },
  'pdf-to-docx': {
    title: 'Convert PDF to Word Online - PDF to DOCX Free',
    description: 'Convert PDF documents to editable Word files online for free. Preserve text and layout when converting PDF to DOCX.',
    keywords: ['PDF to Word', 'PDF to DOCX', 'convert PDF to Word', 'PDF converter', 'PDF to editable Word'],
    path: '/pdf-to-docx',
  },
  'crop-pdf': {
    title: 'Crop PDF Pages Online - Trim PDF Margins Free',
    description: 'Crop PDF pages to remove unwanted margins or resize page areas online for free. Trim PDF documents easily.',
    keywords: ['crop PDF', 'trim PDF', 'PDF cropper', 'resize PDF pages', 'cut PDF margins'],
    path: '/crop-pdf',
  },
  'resize-pdf': {
    title: 'Resize PDF Pages Online - Change PDF Page Size Free',
    description: 'Resize PDF page dimensions online for free. Change page size to A4, Letter, or custom dimensions.',
    keywords: ['resize PDF', 'change PDF page size', 'PDF resizer', 'scale PDF pages', 'PDF page dimensions'],
    path: '/resize-pdf',
  },
  'grayscale-pdf': {
    title: 'Convert PDF to Grayscale Online - Black & White PDF Free',
    description: 'Convert color PDF to grayscale/black and white online for free. Reduce file size and prepare for printing.',
    keywords: ['grayscale PDF', 'PDF to black and white', 'convert PDF grayscale', 'remove color PDF'],
    path: '/grayscale-pdf',
  },
  'flatten-pdf': {
    title: 'Flatten PDF Online - Merge PDF Layers Free',
    description: 'Flatten PDF to merge all layers and make forms non-editable online for free. Lock form fields permanently.',
    keywords: ['flatten PDF', 'merge PDF layers', 'lock PDF forms', 'PDF flattener', 'non-editable PDF'],
    path: '/flatten-pdf',
  },
  'organize-pdf': {
    title: 'Organize PDF Pages Online - Rearrange & Reorder Free',
    description: 'Organize and rearrange PDF pages with a simple select-and-place interface. Click pages to select, then click where to place them. No dragging required.',
    keywords: ['organize PDF', 'rearrange PDF pages', 'reorder PDF', 'PDF page organizer', 'sort PDF pages', 'move PDF pages'],
    path: '/organize-pdf',
  },
  workflows: {
    title: 'PDF Workflows - Automate Multi-Step PDF Processing Free',
    description: 'Automate multi-step PDF processing with one-click workflows. Compress, watermark, add page numbers, lock PDFs and more in a single pipeline.',
    keywords: ['PDF workflow', 'PDF automation', 'batch PDF processing', 'PDF pipeline', 'multi-step PDF', 'automate PDF'],
    path: '/workflows',
  },
};

export function generateToolMetadata(toolId: string): Metadata {
  const config = toolConfigs[toolId];

  if (!config) {
    return {
      title: 'PDF Tool',
      description: 'Free online PDF tool',
    };
  }

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    openGraph: {
      title: config.title,
      description: config.description,
      url: `${BASE_URL}${config.path}/`,
      siteName: 'PDF2.in',
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: `${BASE_URL}${config.path}/`,
    },
  };
}

export function generateToolJsonLd(toolId: string) {
  const config = toolConfigs[toolId];

  if (!config) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: config.title.split(' - ')[0],
    url: `${BASE_URL}${config.path}/`,
    description: config.description,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    browserRequirements: 'Requires JavaScript. Works in modern browsers.',
  };
}
