import { generateToolMetadata, generateToolJsonLd } from '@/lib/seo';

export const metadata = generateToolMetadata('pdf-to-ocr');

export default function PdfToOcrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = generateToolJsonLd('pdf-to-ocr');

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
