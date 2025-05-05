const axios = require("axios");

const SOCIAL_MEDIA_CRAWLERS =
  /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|Googlebot/i;

const API_BASE_URL = process.env.API_BASE_URL || "https://your-api.com";
const DEFAULT_IMAGE_URL = "https://www.voiceinfos.com/INFOS_LOGO%5B1%5D.png";
const BASE_URL = "https://www.voiceinfos.com";

module.exports = async (req, res) => {
  const { slug } = req.query;
  const userAgent = req.headers["user-agent"] || "";
  const isCrawler = SOCIAL_MEDIA_CRAWLERS.test(userAgent);

  if (!isCrawler) {
    return res.status(200).end();
  }

  if (!slug) {
    return res.status(400).send("Slug not provided");
  }

  let post = null;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/Post/slug/${slug}`);
    post = response.data.data;
  } catch (error) {
    console.error("Error fetching post:", error.message);
  }

  const shareTitle = post && post.title ? post.title : "VoiceInfo";
  const shareDescription =
    post && post.excerpt
      ? post.excerpt
      : post && post.content && typeof post.content === "string"
      ? post.content.substring(0, 160)
      : "Discover the latest insights on VoiceInfo";
  const shareImage = post && post.featuredImageUrl ? post.featuredImageUrl : DEFAULT_IMAGE_URL;
  const shareUrl = post ? `${BASE_URL}/post/${slug}?cb=${Date.now()}` : BASE_URL;

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

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
};