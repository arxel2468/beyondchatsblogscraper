import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const http = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  },
});

/**
 * Search using DuckDuckGo HTML (more reliable than Google scraping)
 */
export async function searchArticles(
  query: string,
  numResults: number = 2
): Promise<SearchResult[]> {
  console.log(`🔍 Searching for: "${query}"`);

  try {
    // Use DuckDuckGo HTML version (easier to scrape)
    const searchQuery = encodeURIComponent(`${query} blog article`);
    const url = `https://html.duckduckgo.com/html/?q=${searchQuery}`;

    const response = await http.get(url);
    const $ = cheerio.load(response.data);

    const results: SearchResult[] = [];

    $('.result').each((_, element) => {
      if (results.length >= numResults) return false;

      const titleEl = $(element).find('.result__a');
      const snippetEl = $(element).find('.result__snippet');

      const title = titleEl.text().trim();
      let resultUrl = titleEl.attr('href') || '';

      // DuckDuckGo wraps URLs, need to extract actual URL
      if (resultUrl.includes('uddg=')) {
        const match = resultUrl.match(/uddg=([^&]+)/);
        if (match) {
          resultUrl = decodeURIComponent(match[1]);
        }
      }

      const snippet = snippetEl.text().trim();

      // Filter out unwanted results
      if (
        resultUrl &&
        title &&
        resultUrl.startsWith('http') &&
        !resultUrl.includes('beyondchats.com') &&
        !resultUrl.includes('youtube.com') &&
        !resultUrl.includes('facebook.com') &&
        !resultUrl.includes('twitter.com') &&
        !resultUrl.includes('.pdf')
      ) {
        results.push({ title, url: resultUrl, snippet });
      }
    });

    console.log(`✅ Found ${results.length} search results`);
    return results;
  } catch (error: any) {
    console.error('Search error:', error.message);
    return [];
  }
}

/**
 * Scrape content from an external article URL
 */
export async function scrapeExternalArticle(
  url: string
): Promise<{ title: string; content: string } | null> {
  console.log(`📖 Scraping external article: ${url}`);

  try {
    const response = await http.get(url);
    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .sidebar, .comments, .ads, .advertisement, .social-share, .related-posts').remove();

    // Get title
    const title =
      $('h1').first().text().trim() ||
      $('title').text().trim() ||
      '';

    // Get main content - try multiple selectors
    let content = '';
    const contentSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content',
      '.blog-post',
    ];

    for (const sel of contentSelectors) {
      const el = $(sel).first();
      if (el.length) {
        // Get text content, not HTML
        content = el.text().trim();
        if (content.length > 500) break;
      }
    }

    // Fallback: get all paragraphs
    if (!content || content.length < 500) {
      const paragraphs: string[] = [];
      $('p').each((_, p) => {
        const text = $(p).text().trim();
        if (text.length > 30) {
          paragraphs.push(text);
        }
      });
      content = paragraphs.join('\n\n');
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .slice(0, 8000); // Limit length for LLM

    if (!title || content.length < 200) {
      console.warn(`⚠️ Insufficient content from ${url}`);
      return null;
    }

    console.log(`✅ Scraped: "${title.slice(0, 50)}..." (${content.length} chars)`);
    return { title, content };
  } catch (error: any) {
    console.error(`❌ Failed to scrape ${url}: ${error.message}`);
    return null;
  }
}
