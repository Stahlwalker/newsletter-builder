import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

/**
 * Fetch and extract article content from a URL
 */
async function fetchArticleContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const title = $('title').text() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('h1').first().text() ||
                  '';

    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       '';

    const imageUrl = $('meta[property="og:image"]').attr('content') ||
                    $('meta[name="twitter:image"]').attr('content') ||
                    '';

    // Try to extract main content
    // Remove scripts, styles, nav, header, footer
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .social-share').remove();

    // Try common article containers
    let articleContent = '';
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      '#content'
    ];

    for (const selector of selectors) {
      const content = $(selector).html();
      if (content && content.length > 200) {
        articleContent = content;
        break;
      }
    }

    // Fallback to body if no article content found
    if (!articleContent) {
      articleContent = $('body').html() || '';
    }

    // Convert HTML to clean text using JSDOM and Turndown
    const dom = new JSDOM(articleContent);
    const markdown = turndownService.turndown(dom.window.document.body.innerHTML);

    // Clean up the markdown
    const cleanedContent = markdown
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      url,
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      content: cleanedContent,
      contentLength: cleanedContent.length
    };
  } catch (error) {
    console.error(`Error fetching article from ${url}:`, error);
    throw new Error(`Failed to fetch article: ${error.message}`);
  }
}

/**
 * Convert an external image URL to base64 data URI
 */
async function imageUrlToBase64(imageUrl) {
  if (!imageUrl) return '';

  try {
    // Handle relative URLs by making them absolute
    let absoluteUrl = imageUrl;
    if (imageUrl.startsWith('//')) {
      absoluteUrl = 'https:' + imageUrl;
    }

    const response = await fetch(absoluteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.warn(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return '';
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.warn(`URL is not an image: ${contentType}`);
      return '';
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Error converting image to base64:`, error);
    return '';
  }
}

export {
  fetchArticleContent,
  imageUrlToBase64
};
