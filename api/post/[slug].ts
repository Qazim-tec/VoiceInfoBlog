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

const SOCIAL_MEDIA_CRAWLERS =
  /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|Googlebot|bingbot|Pinterest|Discordbot|TelegramBot|Redditbot|Facebot|facebookcatalog/i;

const DEFAULT_IMAGE_URL = 'https://www.voiceinfos.com/INFOS_LOGO%5B1%5D.png';
const BASE_URL = 'https://www.voiceinfos.com';

const isSocialMediaCrawler = (userAgent: string | null): boolean => {
  if (!userAgent) return false;
  console.log(`Checking user-agent: ${userAgent}`);
  return SOCIAL_MEDIA_CRAWLERS.test(userAgent);
};

const isValidImageUrl = async (url: string | null | undefined): Promise<boolean> => {
  if (!url || typeof url !== 'string') return false;
  const regex = /^https?:\/\/.+(?:\/[^\/?#]+)?(?:\?.*)?(?:#.*)?$/i;
  if (!regex.test(url)) return false;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const isValid = response.ok && response.headers.get('content-type')?.startsWith('image/') || false;
    console.log(`Image URL ${url} valid: ${isValid}`);
    return isValid;
  } catch (err) {
    console.error(`Error validating image URL ${url}:`, err);
    return false;
  }
};

const getValidImageUrl = async (post: Post | null): Promise<string> => {
  if (!post) return DEFAULT_IMAGE_URL;
  if (await isValidImageUrl(post.featuredImageUrl)) return post.featuredImageUrl;
  for (const url of post.additionalImageUrls || []) {
    if (await isValidImageUrl(url)) return url;
  }
  return DEFAULT_IMAGE_URL;
};

const getShareDescription = (post: Post | null): string => {
  if (!post) return 'Discover the latest insights on VoiceInfo';
  return post.excerpt || (typeof post.content === 'string' ? post.content.substring(0, 160) : 'Discover the latest insights on VoiceInfo');
};

const sanitize = (str: string | undefined): string => {
  if (!str) return '';
  return str.replace(/[<>&"']/g, (char) => ({
    '<': '<',
    '>': '>',
    '&': '&',
    '"': '"',
    "'": ''
  }[char] || char));
};

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.pathname.split('/').pop() || '';
  const userAgent = request.headers.get('user-agent') || '';

  console.log(`Request URL: ${request.url}, User-Agent: ${userAgent}, IsCrawler: ${isSocialMediaCrawler(userAgent)}`);

  if (!isSocialMediaCrawler(userAgent)) {
    console.log('Non-crawler detected, passing to index.html');
    return new Response(null, { status: 200 }); // Let catch-all rewrite handle
  }

  if (!slug) {
    console.log('No slug provided');
    return new Response('Slug not provided', { status: 400 });
  }

  let post: Post | null = null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/Post/slug/${slug}`);
    console.log(`API response status: ${response.status}`);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    post = data.data || null;
    console.log(`API response data: ${JSON.stringify(post)}`);
  } catch (err) {
    console.error('Error fetching post:', err);
  }

  const shareTitle = post?.title || 'Post | VoiceInfo';
  const shareDescription = getShareDescription(post);
  const shareImage = await getValidImageUrl(post);
  const shareUrl = `${BASE_URL}/post/${slug}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${sanitize(shareTitle)}</title>
        <meta name="description" content="${sanitize(shareDescription)}">
        <meta property="og:title" content="${sanitize(shareTitle)}">
        <meta property="og:description" content="${sanitize(shareDescription)}">
        <meta property="og:image" content="${sanitize(shareImage)}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:url" content="${sanitize(shareUrl)}">
        <meta property="og:type" content="article">
        <meta property="og:site_name" content="VoiceInfo">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${sanitize(shareTitle)}">
        <meta name="twitter:description" content="${sanitize(shareDescription)}">
        <meta name="twitter:image" content="${sanitize(shareImage)}">
        <meta name="twitter:image:alt" content="Image for ${sanitize(shareTitle)}">
      </head>
      <body>
        <h1>${sanitize(shareTitle)}</h1>
        <p>${sanitize(shareDescription)}</p>
        <img src="${sanitize(shareImage)}" alt="${sanitize(shareTitle)}">
      </body>
    </html>
  `;

  console.log(`Serving OG tags for slug: ${slug}`);
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': Buffer.byteLength(html).toString()
    }
  });
}