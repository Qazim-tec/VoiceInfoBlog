import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Cache for API responses
const cache: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.voiceinfos.com';
const BASE_URL = 'https://www.voiceinfos.com';
const DEFAULT_IMAGE_URL = 'https://www.voiceinfos.com/INFOS_LOGO%5B1%5D.png';

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  featuredImageUrl: string;
  additionalImageUrls: string[];
  views: number;
  isFeatured: boolean;
  isLatestNews: boolean;
  createdAt: string;
  slug: string;
  authorId: string;
  authorName: string;
  categoryId: number;
  categoryName: string;
  tags: string[];
  comments: any[];
  commentsCount: number;
  likesCount: number;
  isLikedByUser: boolean;
}

const isSocialMediaCrawler = (userAgent: string | undefined): boolean => {
  const crawlers = ['whatsapp', 'facebookexternalhit', 'twitterbot', 'linkedinbot', 'slackbot'];
  return !!userAgent && crawlers.some(crawler => userAgent.toLowerCase().includes(crawler));
};

const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const getShareDescription = (post: Post): string => {
  return post.excerpt || post.content.substring(0, 160);
};

const isValidImageUrl = async (url: string | null | undefined): Promise<boolean> => {
  if (!url || typeof url !== 'string') return false;

  const regex = /^https?:\/\/.+(?:\/[^\/?#]+)?(?:\?.*)?(?:#.*)?$/i;
  if (!regex.test(url)) return false;

  try {
    const response = await axios.head(url, { timeout: 2000 });
    const contentType = response.headers['content-type'];
    return response.status === 200 && contentType && contentType.startsWith('image/');
  } catch {
    return false;
  }
};

const getValidImageUrl = async (post: Post): Promise<string> => {
  if (await isValidImageUrl(post.featuredImageUrl)) {
    return post.featuredImageUrl;
  }

  if (post.additionalImageUrls && post.additionalImageUrls.length > 0) {
    for (const url of post.additionalImageUrls) {
      if (await isValidImageUrl(url)) {
        return url;
      }
    }
  }

  return DEFAULT_IMAGE_URL;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;
  const userAgent = req.headers['user-agent'];

  if (typeof slug !== 'string') {
    return res.status(400).json({ error: 'Invalid slug' });
  }

  if (isSocialMediaCrawler(userAgent)) {
    try {
      // Check cache
      const cached = cache[slug];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        const post: Post = cached.data;
        const shareUrl = `${BASE_URL}/post/${post.slug}`;
        const shareDescription = getShareDescription(post);
        const imageUrl = await getValidImageUrl(post);

        const html = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>${escapeHtml(post.title)}</title>
              <meta name="description" content="${escapeHtml(shareDescription)}" />
              <meta property="og:title" content="${escapeHtml(post.title)}" />
              <meta property="og:description" content="${escapeHtml(shareDescription)}" />
              <meta property="og:image" content="${escapeHtml(imageUrl)}" />
              <meta property="og:url" content="${escapeHtml(shareUrl)}" />
              <meta property="og:type" content="article" />
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content="${escapeHtml(post.title)}" />
              <meta name="twitter:description" content="${escapeHtml(shareDescription)}" />
              <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
              <link rel="icon" type="image/png" href="/INFOS_LOGO[1].png" />
            </head>
            <body>
              <div id="root"></div>
              <script type="module" crossorigin src="/assets/index-DjrKsONo.js"></script>
              <link rel="stylesheet" crossorigin href="/assets/index-BOS6qCWl.css">
            </body>
          </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
      }

      // Fetch from API
      const response = await axios.get(`${API_BASE_URL}/api/Post/slug/${slug}`, {
        timeout: 3000,
      });
      const post: Post = response.data.data;

      if (!post) {
        return res.status(404).send('Post not found');
      }

      // Cache the response
      cache[slug] = { data: post, timestamp: Date.now() };

      const shareUrl = `${BASE_URL}/post/${post.slug}`;
      const shareDescription = getShareDescription(post);
      const imageUrl = await getValidImageUrl(post);

      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${escapeHtml(post.title)}</title>
            <meta name="description" content="${escapeHtml(shareDescription)}" />
            <meta property="og:title" content="${escapeHtml(post.title)}" />
            <meta property="og:description" content="${escapeHtml(shareDescription)}" />
            <meta property="og:image" content="${escapeHtml(imageUrl)}" />
            <meta property="og:url" content="${escapeHtml(shareUrl)}" />
            <meta property="og:type" content="article" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${escapeHtml(post.title)}" />
            <meta name="twitter:description" content="${escapeHtml(shareDescription)}" />
            <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
            <link rel="icon" type="image/png" href="/INFOS_LOGO[1].png" />
          </head>
          <body>
            <div id="root"></div>
            <script type="module" crossorigin src="/assets/index-DjrKsONo.js"></script>
            <link rel="stylesheet" crossorigin href="/assets/index-BOS6qCWl.css">
          </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (err) {
      console.error('Error fetching post:', err.message);
      return res.status(500).send('Internal server error');
    }
  }

  // Serve SPA for regular users
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/png" href="/INFOS_LOGO[1].png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>VoiceInfo</title>
        <script type="module" crossorigin src="/assets/index-DjrKsONo.js"></script>
        <link rel="stylesheet" crossorigin href="/assets/index-BOS6qCWl.css">
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `);
}