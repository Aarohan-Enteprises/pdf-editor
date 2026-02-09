export interface HowToStep {
  title: string;
  description: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ToolSEOContent {
  howToTitle: string;
  steps: HowToStep[];
  faqs: FAQ[];
}

export const toolSEOContent: Record<string, ToolSEOContent> = {
  merge: {
    howToTitle: 'How to Merge PDF Files',
    steps: [
      { title: 'Upload PDFs', description: 'Drag and drop or browse to select multiple PDF files you want to combine.' },
      { title: 'Arrange Order', description: 'Reorder files and pages by dragging them into your preferred sequence.' },
      { title: 'Merge Files', description: 'Click the Merge button to combine all PDFs into a single document.' },
      { title: 'Download Result', description: 'Preview the merged PDF and download it to your device.' },
    ],
    faqs: [
      { question: 'Is there a limit on how many PDFs I can merge?', answer: 'You can merge as many PDFs as you like, with a total page limit of 200 pages and 50MB per file. All processing happens in your browser.' },
      { question: 'Will merging PDFs reduce quality?', answer: 'No. Merging preserves the original quality of each PDF. No recompression or downsampling is applied.' },
      { question: 'Can I reorder pages before merging?', answer: 'Yes. After uploading, you can drag and drop individual pages or entire files to rearrange the order before merging.' },
      { question: 'Are my files uploaded to a server?', answer: 'No. All merging is done locally in your browser. Your files never leave your device.' },
    ],
  },
  split: {
    howToTitle: 'How to Split a PDF',
    steps: [
      { title: 'Upload PDF', description: 'Select or drag the PDF file you want to split into your browser.' },
      { title: 'Choose Split Method', description: 'Select specific pages to extract or choose a page number to split at.' },
      { title: 'Split Document', description: 'Click Split to separate the PDF into the chosen sections.' },
      { title: 'Download Parts', description: 'Download one or both parts of the split PDF.' },
    ],
    faqs: [
      { question: 'Can I extract specific pages from a PDF?', answer: 'Yes. Select individual pages and extract them as a new PDF, or split the document at a specific page number.' },
      { question: 'Does splitting alter the original PDF?', answer: 'No. The original file remains unchanged. Splitting creates new PDF files from the selected pages.' },
      { question: 'Can I split a password-protected PDF?', answer: 'You need to unlock the PDF first using our Unlock PDF tool, then split it.' },
    ],
  },
  rotate: {
    howToTitle: 'How to Rotate PDF Pages',
    steps: [
      { title: 'Upload PDF', description: 'Drag and drop your PDF file or click to browse and select it.' },
      { title: 'Select Pages', description: 'Choose which pages you want to rotate - individual pages or all pages.' },
      { title: 'Set Rotation', description: 'Rotate pages by 90, 180, or 270 degrees clockwise.' },
      { title: 'Download PDF', description: 'Preview the result and download the rotated PDF.' },
    ],
    faqs: [
      { question: 'Can I rotate just one page in a PDF?', answer: 'Yes. Select individual pages and rotate them independently. Other pages remain unchanged.' },
      { question: 'What rotation angles are supported?', answer: 'You can rotate pages by 90 degrees (clockwise), 180 degrees, or 270 degrees (counter-clockwise).' },
      { question: 'Will rotation affect text and images?', answer: 'No. Rotation changes the page orientation without altering any content. Text, images, and formatting are preserved.' },
    ],
  },
  compress: {
    howToTitle: 'How to Compress a PDF',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF file you want to compress.' },
      { title: 'Choose Quality', description: 'Select Low (smallest size), Medium (balanced), or High (best quality) compression.' },
      { title: 'Compress File', description: 'Click Compress to reduce the file size.' },
      { title: 'Download Result', description: 'See the size reduction and download your compressed PDF.' },
    ],
    faqs: [
      { question: 'How much can I reduce the file size?', answer: 'Compression results vary depending on the PDF content. Image-heavy PDFs can see 50-80% size reduction. Text-only PDFs may see smaller improvements.' },
      { question: 'Will compression reduce quality?', answer: 'The High quality setting preserves most quality. Medium provides a good balance. Low prioritizes smaller file size with some quality trade-off.' },
      { question: 'Is there a file size limit?', answer: 'The maximum file size is 50MB per file. For best results, compress one file at a time.' },
    ],
  },
  watermark: {
    howToTitle: 'How to Add a Watermark to PDF',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF file you want to watermark.' },
      { title: 'Configure Watermark', description: 'Enter your watermark text and customize font size, color, opacity, and position.' },
      { title: 'Choose Pages', description: 'Apply the watermark to all pages or only selected pages.' },
      { title: 'Download PDF', description: 'Preview and download the watermarked PDF.' },
    ],
    faqs: [
      { question: 'Can I customize the watermark appearance?', answer: 'Yes. You can set the text, font size, color, opacity, and position (center, corners) of the watermark.' },
      { question: 'Can I add a watermark to specific pages only?', answer: 'Yes. Select the pages you want to watermark, or apply it to all pages at once.' },
      { question: 'Is the watermark permanent?', answer: 'Yes. The watermark is embedded in the PDF. It cannot be removed without re-editing the original PDF.' },
    ],
  },
  'sign-pdf': {
    howToTitle: 'How to Sign a PDF',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF document you need to sign.' },
      { title: 'Create Signature', description: 'Draw your signature, type it with a custom font, or upload a signature image.' },
      { title: 'Place Signature', description: 'Position and resize the signature on the desired page.' },
      { title: 'Download Signed PDF', description: 'Preview and download your signed document.' },
    ],
    faqs: [
      { question: 'What signature methods are available?', answer: 'You can draw a freehand signature, type your name with a handwriting font, or upload an image of your signature.' },
      { question: 'Can I sign multiple pages?', answer: 'Yes. You can place a signature on any page and add different signatures to different pages.' },
      { question: 'Does the tool remove the background from uploaded signatures?', answer: 'Yes. Auto background removal is enabled by default for uploaded signature images, making them blend naturally with the PDF.' },
      { question: 'Is this a legally binding electronic signature?', answer: 'This tool adds a visual signature to the PDF. For legally binding digital signatures with certificates, you may need specialized e-signature software.' },
    ],
  },
  'extract-text': {
    howToTitle: 'How to Extract Text from PDF',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF file you want to extract text from.' },
      { title: 'Extract Text', description: 'The tool automatically extracts all text content from the PDF.' },
      { title: 'Copy or Edit', description: 'Review the extracted text, select portions, or copy all.' },
      { title: 'Download Text', description: 'Download the extracted text as a file or copy it to your clipboard.' },
    ],
    faqs: [
      { question: 'Can I extract text from scanned PDFs?', answer: 'This tool extracts embedded text from digital PDFs. Scanned documents (image-based PDFs) may require OCR software for text extraction.' },
      { question: 'Does it preserve formatting?', answer: 'The tool extracts raw text content. Complex formatting like tables and columns may not be perfectly preserved in the extracted text.' },
      { question: 'Is there a page limit for text extraction?', answer: 'You can extract text from PDFs with up to 200 pages. The 50MB file size limit also applies.' },
    ],
  },
  'page-numbers': {
    howToTitle: 'How to Add Page Numbers to PDF',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF file that needs page numbers.' },
      { title: 'Configure Numbers', description: 'Choose the position, format, and starting number for page numbering.' },
      { title: 'Apply Numbers', description: 'Click Apply to add page numbers to your document.' },
      { title: 'Download PDF', description: 'Preview and download the PDF with page numbers.' },
    ],
    faqs: [
      { question: 'Can I choose where page numbers appear?', answer: 'Yes. You can place page numbers at the top or bottom of the page, aligned left, center, or right.' },
      { question: 'Can I start numbering from a specific page?', answer: 'Yes. You can set a custom starting number and choose which pages receive numbering.' },
      { question: 'What number formats are available?', answer: 'Standard numeric format (1, 2, 3...) is supported. You can customize the starting number.' },
    ],
  },
  'edit-metadata': {
    howToTitle: 'How to Edit PDF Metadata',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF whose metadata you want to edit.' },
      { title: 'View Metadata', description: 'See the current title, author, subject, and keywords.' },
      { title: 'Edit Fields', description: 'Modify any metadata field - title, author, subject, or keywords.' },
      { title: 'Save & Download', description: 'Apply changes and download the PDF with updated metadata.' },
    ],
    faqs: [
      { question: 'What PDF metadata can I edit?', answer: 'You can edit the title, author, subject, and keywords of the PDF document.' },
      { question: 'Does editing metadata change the PDF content?', answer: 'No. Metadata editing only changes the document properties. The visible content of the PDF remains unchanged.' },
      { question: 'Why should I edit PDF metadata?', answer: 'Proper metadata improves document organization, searchability, and accessibility. It is also useful for SEO when sharing PDFs online.' },
    ],
  },
  redact: {
    howToTitle: 'How to Redact a PDF',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF containing sensitive information you want to redact.' },
      { title: 'Select Areas', description: 'Draw black rectangles over the text or images you want to hide.' },
      { title: 'Apply Redaction', description: 'Click Apply to permanently black out the selected areas.' },
      { title: 'Download PDF', description: 'Download the redacted PDF with sensitive content permanently removed.' },
    ],
    faqs: [
      { question: 'Is redaction permanent?', answer: 'Yes. Redacted content is permanently covered with black rectangles. The underlying text or images cannot be recovered from the redacted PDF.' },
      { question: 'Can I redact multiple areas?', answer: 'Yes. You can draw multiple redaction boxes on any page, covering as many areas as needed.' },
      { question: 'Does redaction work on images in the PDF?', answer: 'Yes. The redaction boxes cover any content in the area - text, images, or graphics.' },
    ],
  },
  'delete-pages': {
    howToTitle: 'How to Delete Pages from PDF',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF from which you want to remove pages.' },
      { title: 'Select Pages', description: 'Click on the pages you want to delete to select them.' },
      { title: 'Delete Pages', description: 'Click Delete to remove the selected pages from the document.' },
      { title: 'Download PDF', description: 'Preview and download the PDF with pages removed.' },
    ],
    faqs: [
      { question: 'Can I undo page deletion?', answer: 'Before downloading, you can re-upload the original file to start over. Once downloaded, the deleted pages are not in the new file.' },
      { question: 'Can I delete non-consecutive pages?', answer: 'Yes. Click on any pages you want to remove, regardless of their position in the document.' },
      { question: 'Will page numbers update after deletion?', answer: 'The remaining pages will be renumbered sequentially in the new PDF.' },
    ],
  },
  'reverse-pages': {
    howToTitle: 'How to Reverse PDF Page Order',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF whose page order you want to reverse.' },
      { title: 'Preview Pages', description: 'See all pages in their current order.' },
      { title: 'Reverse Order', description: 'Click Reverse to flip the page order of the entire document.' },
      { title: 'Download PDF', description: 'Preview and download the reversed PDF.' },
    ],
    faqs: [
      { question: 'What does reversing pages do?', answer: 'It flips the page order so the last page becomes the first and vice versa. Useful for double-sided printing corrections.' },
      { question: 'Can I reverse only some pages?', answer: 'This tool reverses all pages in the document. To reorder specific pages, use the Merge tool which allows drag-and-drop reordering.' },
    ],
  },
  'duplicate-pages': {
    howToTitle: 'How to Duplicate PDF Pages',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF containing pages you want to duplicate.' },
      { title: 'Select Pages', description: 'Choose which pages you want to create copies of.' },
      { title: 'Duplicate', description: 'Click Duplicate to create copies of the selected pages.' },
      { title: 'Download PDF', description: 'Preview and download the PDF with duplicated pages.' },
    ],
    faqs: [
      { question: 'Can I duplicate multiple pages at once?', answer: 'Yes. Select all the pages you want to duplicate and create copies in a single operation.' },
      { question: 'Where are duplicated pages inserted?', answer: 'Duplicated pages are typically inserted adjacent to the original pages.' },
      { question: 'Can I control how many copies are made?', answer: 'You can specify the number of duplicates for each selected page.' },
    ],
  },
  'insert-blank': {
    howToTitle: 'How to Insert Blank Pages in PDF',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF where you want to add blank pages.' },
      { title: 'Choose Position', description: 'Select where in the document to insert the blank page.' },
      { title: 'Insert Pages', description: 'Click Insert to add blank pages at the chosen position.' },
      { title: 'Download PDF', description: 'Preview and download the PDF with blank pages added.' },
    ],
    faqs: [
      { question: 'Can I insert blank pages at any position?', answer: 'Yes. You can insert blank pages before or after any existing page in the document.' },
      { question: 'What size are the blank pages?', answer: 'Blank pages match the size of the existing pages in the document.' },
      { question: 'Can I insert multiple blank pages?', answer: 'Yes. You can add as many blank pages as needed at various positions.' },
    ],
  },
  'lock-pdf': {
    howToTitle: 'How to Lock a PDF with Password',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF file you want to protect.' },
      { title: 'Set Password', description: 'Enter and confirm a strong password for the PDF.' },
      { title: 'Lock PDF', description: 'Click Lock to encrypt the document with your password.' },
      { title: 'Download PDF', description: 'Download the password-protected PDF.' },
    ],
    faqs: [
      { question: 'How strong should my password be?', answer: 'Use a mix of uppercase, lowercase, numbers, and special characters. Longer passwords provide stronger protection.' },
      { question: 'Can I recover a forgotten password?', answer: 'No. Passwords cannot be recovered. Make sure to remember or securely store your password.' },
      { question: 'What encryption is used?', answer: 'The PDF is encrypted using standard PDF encryption, requiring the password to open the document.' },
    ],
  },
  'unlock-pdf': {
    howToTitle: 'How to Unlock a PDF',
    steps: [
      { title: 'Upload PDF', description: 'Select the password-protected PDF you want to unlock.' },
      { title: 'Enter Password', description: 'Type the current password of the PDF document.' },
      { title: 'Unlock PDF', description: 'Click Unlock to remove the password protection.' },
      { title: 'Download PDF', description: 'Download the unlocked PDF without password restrictions.' },
    ],
    faqs: [
      { question: 'Do I need to know the password?', answer: 'Yes. You must enter the correct password to unlock a protected PDF. This tool removes the password requirement, it does not crack passwords.' },
      { question: 'Will unlocking change the PDF content?', answer: 'No. Unlocking removes the password protection only. All content remains identical.' },
    ],
  },
  'docx-to-pdf': {
    howToTitle: 'How to Convert DOCX to PDF',
    steps: [
      { title: 'Upload DOCX', description: 'Select the Word document you want to convert to PDF.' },
      { title: 'Convert', description: 'Click Convert to transform the DOCX file into PDF format.' },
      { title: 'Preview Result', description: 'Review the converted PDF to verify formatting is correct.' },
      { title: 'Download PDF', description: 'Download the converted PDF file.' },
    ],
    faqs: [
      { question: 'Does it preserve formatting?', answer: 'Yes. The conversion uses LibreOffice for high-fidelity conversion that preserves tables, images, fonts, and formatting.' },
      { question: 'What Word file formats are supported?', answer: 'DOCX format (Microsoft Word 2007 and later) is supported.' },
      { question: 'Is the DOCX file uploaded to a server?', answer: 'Yes, DOCX to PDF conversion requires server-side processing. The file is uploaded, converted, and the result is returned. Files are deleted after conversion.' },
    ],
  },
  'pdf-to-docx': {
    howToTitle: 'How to Convert PDF to Word',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF file you want to convert to Word format.' },
      { title: 'Convert', description: 'Click Convert to transform the PDF into an editable DOCX file.' },
      { title: 'Review Result', description: 'The converted Word document preserves text and basic layout.' },
      { title: 'Download DOCX', description: 'Download the converted Word document.' },
    ],
    faqs: [
      { question: 'Will the conversion be perfect?', answer: 'Text-based PDFs convert well. Complex layouts with multiple columns, tables, or special formatting may need manual adjustment.' },
      { question: 'Can I convert scanned PDFs to Word?', answer: 'The tool works best with text-based PDFs. Scanned documents (image-based) may require OCR before conversion.' },
      { question: 'Is the PDF uploaded to a server?', answer: 'Yes, PDF to DOCX conversion requires server-side processing. Files are deleted from the server after conversion.' },
    ],
  },
  'jpg-to-pdf': {
    howToTitle: 'How to Convert Images to PDF',
    steps: [
      { title: 'Upload Images', description: 'Select or drag and drop JPG, PNG, WebP, or other image files.' },
      { title: 'Arrange Order', description: 'Reorder images by dragging them into the desired sequence.' },
      { title: 'Convert to PDF', description: 'Click Convert to create a PDF from your images.' },
      { title: 'Download PDF', description: 'Preview and download the PDF containing your images.' },
    ],
    faqs: [
      { question: 'What image formats are supported?', answer: 'JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, HEIC, SVG and more image formats are supported.' },
      { question: 'Can I combine multiple images into one PDF?', answer: 'Yes. Upload multiple images and they will be combined into a single PDF with one image per page.' },
      { question: 'Will image quality be preserved?', answer: 'Yes. Images are embedded in the PDF at their original resolution without compression.' },
    ],
  },
  'flatten-pdf': {
    howToTitle: 'How to Flatten a PDF',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF file with form fields or annotations you want to flatten.' },
      { title: 'Flatten Document', description: 'Click Flatten to merge all form fields, annotations, and layers into the page content.' },
      { title: 'Preview Result', description: 'Review the flattened PDF to confirm all fields are locked in place.' },
      { title: 'Download PDF', description: 'Download the flattened PDF with all content permanently embedded.' },
    ],
    faqs: [
      { question: 'What does flattening a PDF do?', answer: 'Flattening converts all interactive form fields, annotations, and layers into static page content. The filled-in values become part of the page and can no longer be edited.' },
      { question: 'Can I undo flattening?', answer: 'No. Flattening is irreversible. Once form fields and annotations are merged into the page, they cannot be made interactive again. Keep a copy of the original if needed.' },
      { question: 'Will flattening change how my PDF looks?', answer: 'No. The visual appearance stays the same. Text, images, and filled form values remain exactly where they are — they just become non-editable.' },
      { question: 'Why would I flatten a PDF?', answer: 'Flattening is useful when sharing completed forms, preventing further edits, reducing file complexity, or ensuring the PDF prints and displays consistently across all viewers.' },
      { question: 'Does flattening work on PDFs without forms?', answer: 'Yes. If the PDF has no form fields, it is returned as-is. No data is lost or changed.' },
    ],
  },
  'organize-pdf': {
    howToTitle: 'How to Organize PDF Pages',
    steps: [
      { title: 'Upload PDF', description: 'Select or drag and drop the PDF file whose pages you want to rearrange.' },
      { title: 'Select Pages', description: 'Click on pages to select them in the order you want to move them. Numbered badges show your selection order.' },
      { title: 'Place Pages', description: 'Click a teal insertion bar between pages to place the selected pages at that position.' },
      { title: 'Download PDF', description: 'Preview the reorganized PDF and download it to your device.' },
    ],
    faqs: [
      { question: 'How is this different from the Merge tool?', answer: 'The Merge tool uses drag-and-drop which can be awkward on mobile or for moving multiple pages. The Organize tool uses a click-to-select, click-to-place workflow that is easier for bulk moves.' },
      { question: 'Can I move multiple pages at once?', answer: 'Yes. Click multiple pages to select them (in order), then click an insertion point to place them all at once.' },
      { question: 'Does this work on mobile?', answer: 'Yes. The select-and-place interface is designed to work well on touch devices without requiring drag-and-drop.' },
      { question: 'Are my files uploaded to a server?', answer: 'No. All processing happens locally in your browser. Your files never leave your device.' },
    ],
  },
  workflows: {
    howToTitle: 'How to Use PDF Workflows',
    steps: [
      { title: 'Choose a Workflow', description: 'Pick a pre-built template like "Prepare for Email" or create your own custom workflow with the builder.' },
      { title: 'Upload Your PDF', description: 'Drag and drop or browse to select the PDF file you want to process.' },
      { title: 'Configure Steps', description: 'Review and adjust each step\'s settings - compression quality, watermark text, password, etc.' },
      { title: 'Run & Download', description: 'Click Run to process all steps automatically. Preview the result and download when done.' },
    ],
    faqs: [
      { question: 'What is a PDF workflow?', answer: 'A workflow chains multiple PDF operations into a single automated pipeline. Instead of running each tool separately, you upload once and all steps (compress, watermark, lock, etc.) run in sequence.' },
      { question: 'What operations are available in workflows?', answer: 'Workflows support: Rotate, Reverse Pages, Page Numbers, Watermark, Edit Metadata, Flatten, Compress, and Lock. These cover most common PDF processing needs.' },
      { question: 'Are my files uploaded to a server?', answer: 'Most steps run locally in your browser. Compress and Lock require server-side processing - for those steps the file is uploaded, processed, and returned. Files are deleted after processing.' },
      { question: 'Can I create my own custom workflows?', answer: 'Yes. Use the workflow builder to add steps in any order, configure each one, and save it for reuse. Custom workflows are stored in your browser\'s local storage.' },
      { question: 'Can I edit or delete saved workflows?', answer: 'Yes. Custom workflows can be edited or deleted at any time from the "My Workflows" section. Pre-built templates cannot be modified but you can use them as a starting point.' },
      { question: 'Is there a limit on the number of steps?', answer: 'There is no hard limit on steps. However, each step processes the entire PDF, so workflows with many steps on large files may take longer.' },
    ],
  },
  'pdf-to-jpg': {
    howToTitle: 'How to Convert PDF to Images',
    steps: [
      { title: 'Upload PDF', description: 'Select the PDF file you want to convert to images.' },
      { title: 'Choose Format', description: 'Select your preferred output format: JPG, PNG, or WebP.' },
      { title: 'Convert Pages', description: 'Each PDF page is converted into a separate image file.' },
      { title: 'Download Images', description: 'Download individual images or all images at once.' },
    ],
    faqs: [
      { question: 'What image formats can I export to?', answer: 'You can export PDF pages as JPG, PNG, or WebP images.' },
      { question: 'What resolution are the exported images?', answer: 'Images are exported at high resolution suitable for viewing and printing.' },
      { question: 'Can I convert specific pages only?', answer: 'All pages are converted. You can download specific page images individually.' },
    ],
  },
};
