import { generateToolMetadata, generateToolJsonLd } from '@/lib/seo';

export const metadata = generateToolMetadata('insert-blank');

export default function InsertBlankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = generateToolJsonLd('insert-blank');

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
