import { generateToolMetadata, generateToolJsonLd } from '@/lib/seo';

export const metadata = generateToolMetadata('grayscale-pdf');

export default function GrayscalePdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = generateToolJsonLd('grayscale-pdf');

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
