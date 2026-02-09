import { generateToolMetadata, generateToolJsonLd } from '@/lib/seo';

export const metadata = generateToolMetadata('workflows');

export default function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = generateToolJsonLd('workflows');

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
