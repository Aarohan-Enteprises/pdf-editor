import { MetadataRoute } from 'next';

const BASE_URL = 'https://pdf2.in';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: '/about', priority: 0.5 },
    { path: '/workflows', priority: 0.7 },
    { path: '/organize-pdf', priority: 0.6 },
  ];

  const tools = [
    { path: '/merge', priority: 0.9 },
    { path: '/split', priority: 0.9 },
    { path: '/rotate', priority: 0.8 },
    { path: '/compress', priority: 0.9 },
    { path: '/watermark', priority: 0.8 },
    { path: '/page-numbers', priority: 0.7 },
    { path: '/delete-pages', priority: 0.7 },
    { path: '/reverse-pages', priority: 0.6 },
    { path: '/duplicate-pages', priority: 0.6 },
    { path: '/insert-blank', priority: 0.6 },
    { path: '/jpg-to-pdf', priority: 0.9 },
    { path: '/pdf-to-jpg', priority: 0.9 },
    { path: '/docx-to-pdf', priority: 0.8 },
    { path: '/pdf-to-docx', priority: 0.8 },
    { path: '/extract-text', priority: 0.7 },
    { path: '/edit-metadata', priority: 0.6 },
    { path: '/sign-pdf', priority: 0.8 },
    { path: '/lock-pdf', priority: 0.7 },
    { path: '/unlock-pdf', priority: 0.7 },
    { path: '/redact', priority: 0.7 },
    { path: '/crop-pdf', priority: 0.6 },
    { path: '/resize-pdf', priority: 0.6 },
    { path: '/grayscale-pdf', priority: 0.5 },
    { path: '/flatten-pdf', priority: 0.5 },
  ];

  const currentDate = new Date().toISOString();

  return [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...pages.map((page) => ({
      url: `${BASE_URL}${page.path}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: page.priority,
    })),
    ...tools.map((tool) => ({
      url: `${BASE_URL}${tool.path}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: tool.priority,
    })),
  ];
}
