
import { API_BASE_URL } from '../../src/config/apiConfig';

const SOCIAL_MEDIA_CRAWLERS =
  /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|Googlebot/i;

export const config = {
  runtime: "edge",
};

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  featuredImageUrl: string;
  additionalImageUrls: string[];
  slug: string;
}

const DEFAULT_IMAGE_URL = "https://www.voiceinfos.com/INFOS_LOGO%5B1%5D.png";
const BASE_URL = "https://www.voiceinfos.com";

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const userAgent = request.headers.get("user-agent") || "";
  const isCrawler = SOCIAL_MEDIA_CRAWLERS.test(userAgent);

  // Handle /post/:slug for crawlers
  if (pathname.startsWith("/post/") && isCrawler) {
    const slug = pathname.split("/").pop();
    if (!slug) {
      return new Response("Slug not provided", { status: 400 });
    }

    let post: Post | null = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/Post/slug/${slug}`);
      if (!response.ok) {
        throw new Error("Failed to fetch post");
      }
      const postData: { data: Post } = await response.json();
      post = postData.data;
    } catch (error) {
      console.error("Error fetching post:", error);
    }

    if (post) {
      const shareTitle = post.title;
      const shareDescription = post.excerpt || post.content.substring(0, 160);
      const shareImage = post.featuredImageUrl || DEFAULT_IMAGE_URL;
      const shareUrl = `${BASE_URL}/post/${post.slug}?cb=${Date.now()}`;

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
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  // Serve index.html for all other requests
  try {
    const indexUrl = new URL("/index.html", BASE_URL).toString();
    const indexResponse = await fetch(indexUrl);
    if (!indexResponse.ok) {
      throw new Error("Failed to fetch index.html");
    }
    const indexHtml = await indexResponse.text();

    return new Response(indexHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error serving index.html:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}