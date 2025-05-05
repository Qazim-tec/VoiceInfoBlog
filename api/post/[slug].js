// api/post/[slug].js
const SOCIAL_MEDIA_CRAWLERS =
  /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|Googlebot/i;

const DEFAULT_IMAGE_URL = 'https://www.voiceinfos.com/INFOS_LOGO%5B1%5D.png';
const BASE_URL = 'https://www.voiceinfos.com';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const userAgent = req.headers.get('user-agent') || '';
  const isCrawler = SOCIAL_MEDIA_CRAWLERS.test(userAgent);

  if (!isCrawler) {
    return new Response(null, { status: 200 });
  }

  if (!slug) {
    return new Response('Slug not provided', { status: 400 });
  }

  const shareTitle = `Post | VoiceInfo`;
  const shareDescription = 'Discover the latest insights on VoiceInfo';
  const shareImage = DEFAULT_IMAGE_URL;
  const shareUrl = `${BASE_URL}/post/${slug}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${shareTitle}</title>
        <meta name="description" content="${shareDescription}" />
        <meta property="og:title" content="${shareTitle}" />
        <meta property="og:description" content="${shareDescription}" />
        <meta property="og:image" content="${shareImage}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="${shareUrl}" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="VoiceInfo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${shareTitle}" />
        <meta name="twitter:description" content="${shareDescription}" />
        <meta name="twitter:image" content="${shareImage}" />
        <meta name="twitter:image:alt" content="Image for ${shareTitle}" />
      </head>
      <body>
        <h1>${shareTitle}</h1>
        <p>${shareDescription}</p>
        <img src="${shareImage}" alt="${shareTitle}" />
      </body>
    </html>
  `;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}