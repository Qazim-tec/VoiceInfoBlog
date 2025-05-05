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
    return SOCIAL_MEDIA_CRAWLERS.some((crawler) => userAgent.toLowerCase().includes(crawler.toLowerCase()));
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
  
  export const config = {
    runtime: 'edge',
  };
  
  export default async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const slug = url.pathname.split('/').pop() || '';
    const userAgent = request.headers.get('user-agent');
  
    // If not a social media crawler, serve index.html
    if (!isSocialMediaCrawler(userAgent)) {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/png" href="/INFOS_LOGO%5B1%5D.png" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>VoiceInfo</title>
            <script type="module" crossorigin src="/assets/index-DHLWRb6I.js"></script>
            <link rel="stylesheet" crossorigin href="/assets/index-BOS6qCWl.css">
          </head>
          <body>
            <div id="root"></div>
          </body>
        </html>
      `;
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }
  
    try {
      // Fetch post data
      const response = await fetch(`${API_BASE_URL}/api/Post/slug/${slug}`);
      if (!response.ok) throw new Error(`Failed to fetch post: ${response.status}`);
      const { data: post }: { data: Post } = await response.json();
  
      const imageUrl = await getValidImageUrl(post);
      const shareTitle = post.title;
      const shareDescription = getShareDescription(post);
      const shareUrl = `https://www.voiceinfos.com/post/${post.slug}`;
  
      const sanitize = (str: string) => str.replace(/[<>"'&]/g, (char) => ({
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
        '&': '&amp;'
      }[char] || char));
  
  
      // Generate HTML with meta tags for crawlers
      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${sanitize(shareTitle)}</title>
            <meta name="description" content="${sanitize(shareDescription)}" />
            <meta property="og:title" content="${sanitize(shareTitle)}" />
            <meta property="og:description" content="${sanitize(shareDescription)}" />
            <meta property="og:image" content="${sanitize(imageUrl)}" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:url" content="${sanitize(shareUrl)}" />
            <meta property="og:type" content="article" />
            <meta property="og:site_name" content="VoiceInfo" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${sanitize(shareTitle)}" />
            <meta name="twitter:description" content="${sanitize(shareDescription)}" />
            <meta name="twitter:image" content="${sanitize(imageUrl)}" />
            <meta name="twitter:image:alt" content="Image for ${sanitize(shareTitle)}" />
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
      `;
  
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    } catch (err) {
      console.error('Edge function error:', err);
      // Fallback to index.html if API fails
      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/png" href="/INFOS_LOGO%5B1%5D.png" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>VoiceInfo</title>
            <script type="module" crossorigin src="/assets/index-DHLWRb6I.js"></script>
            <link rel="stylesheet" crossorigin href="/assets/index-BOS6qCWl.css">
          </head>
          <body>
            <div id="root"></div>
          </body>
        </html>
      `;
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }
  }