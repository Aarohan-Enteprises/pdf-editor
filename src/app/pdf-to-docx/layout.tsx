import { generateToolMetadata, generateToolJsonLd } from '@/lib/seo';

export const metadata = generateToolMetadata('pdf-to-docx');

export default function PdfToDocxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = generateToolJsonLd('pdf-to-docx');

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
