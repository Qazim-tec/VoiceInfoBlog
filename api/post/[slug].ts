import { API_BASE_URL } from '../../src/config/apiConfig';

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  featuredImageUrl: string;
  additionalImageUrls: string[];
  slug: string;
}

const SOCIAL_MEDIA_CRAWLERS = [
  'WhatsApp',
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'Googlebot'
];

const isSocialMediaCrawler = (userAgent: string | null): boolean => {
  if (!userAgent) return false;
  return SOCIAL_MEDIA_CRAWLERS.some((crawler) => userAgent.includes(crawler));
};

const isValidImageUrl = async (url: string | null | undefined): Promise<boolean> => {
  if (!url || typeof url !== 'string') return false;
  const regex = /^https?:\/\/.+(?:\/[^\/?#]+)?(?:\?.*)?(?:#.*)?$/i;
  if (!regex.test(url)) return false;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/') || false;
  } catch {
    return false;
  }
};

const getValidImageUrl = async (post: Post | null): Promise<string> => {
  const DEFAULT_IMAGE_URL = 'https://www.voiceinfos.com/INFOS_LOGO%5B1%5D.png';
  if (!post) return DEFAULT_IMAGE_URL;
  if (await isValidImageUrl(post.featuredImageUrl)) return post.featuredImageUrl;
  for (const url of post.additionalImageUrls || []) {
    if (await isValidImageUrl(url)) return url;
  }
  return DEFAULT_IMAGE_URL;
};

const getShareDescription = (post: Post): string => {
  return post.excerpt || post.content.substring(0, 160);
};

const sanitize = (str: string): string => str.replace(/[<>"'&]/g, (char) => ({
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
  '&': '&amp;'
}[char] || char));

export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Virginia region for better performance
};

// HTML template for the SPA fallback
const SPATemplate = (content?: string) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/INFOS_LOGO[1].png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoiceInfo</title>
    ${content || ''}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const userAgent = request.headers.get('user-agent');

  // 1. Handle static assets and API routes first
  if (path.startsWith('/_next/') || path.startsWith('/assets/') || path.startsWith('/api/')) {
    return fetch(request);
  }

  // 2. Handle social media crawlers for post routes
  if (path.startsWith('/post/') && isSocialMediaCrawler(userAgent)) {
    try {
      const slug = path.split('/').pop() || '';
      const response = await fetch(`${API_BASE_URL}/api/Post/slug/${slug}`);
      
      if (!response.ok) throw new Error('Failed to fetch post');
      
      const { data: post }: { data: Post } = await response.json();
      const imageUrl = await getValidImageUrl(post);
      const shareUrl = `https://${url.hostname}/post/${post.slug}`;

      const metaTags = `
        <meta name="description" content="${sanitize(getShareDescription(post))}" />
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${sanitize(shareUrl)}" />
        <meta property="og:title" content="${sanitize(post.title)}" />
        <meta property="og:description" content="${sanitize(getShareDescription(post))}" />
        <meta property="og:image" content="${sanitize(imageUrl)}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="${sanitize(shareUrl)}" />
        <meta name="twitter:title" content="${sanitize(post.title)}" />
        <meta name="twitter:description" content="${sanitize(getShareDescription(post))}" />
        <meta name="twitter:image" content="${sanitize(imageUrl)}" />
      `;

      return new Response(SPATemplate(metaTags), {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    } catch (err) {
      console.error('Edge function error:', err);
      // Fall through to default SPA behavior
    }
  }

  // 3. Default behavior: serve the SPA
  return new Response(SPATemplate(), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}