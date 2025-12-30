import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedArticle {
  title: string;
  content: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  sourceUrl: string;
  imageUrl: string | null;
}

const BASE_URL = 'https://beyondchats.com/blogs/';

// Custom axios instance with timeout and headers
const http = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  },
});

/**
 * Get article links from a specific page
 */
async function getArticleLinksFromPage(pageNum: number): Promise<string[]> {
  const url = pageNum === 1 ? BASE_URL : `${BASE_URL}page/${pageNum}/`;
  console.log(`   📄 Fetching page ${pageNum}: ${url}`);

  try {
    const response = await http.get(url);
    const $ = cheerio.load(response.data);

    const links: string[] = [];

    // Using the exact structure from BeyondChats HTML
    $('article.entry-card').each((_, article) => {
      const link = $(article).find('h2.entry-title a').attr('href');
      if (link && !links.includes(link)) {
        links.push(link);
      }
    });

    console.log(`   ✅ Found ${links.length} articles on page ${pageNum}`);
    return links;
  } catch (error: any) {
    console.error(`   ❌ Failed to fetch page ${pageNum}: ${error.message}`);
    return [];
  }
}

/**
 * Scrape articles from BeyondChats blog
 * Fetches the oldest articles from the last pages
 */
export async function scrapeBeyondChatsArticles(count: number = 5): Promise<ScrapedArticle[]> {
  console.log('🔍 Starting to scrape BeyondChats blog (light mode)...');
  console.log(`📊 Target: ${count} oldest articles\n`);

  // Collect article links from last pages until we have enough
  const allArticleLinks: string[] = [];
  let currentPage = 15; // Start from last page
  const minPage = 10; // Don't go beyond page 10

  console.log('📑 Collecting article links from last pages...\n');

  while (allArticleLinks.length < count && currentPage >= minPage) {
    const links = await getArticleLinksFromPage(currentPage);

    // Add only unique links
    for (const link of links) {
      if (!allArticleLinks.includes(link)) {
        allArticleLinks.push(link);
        console.log(`   📌 Added: ${link}`);
      }
    }

    console.log(`   📊 Total collected so far: ${allArticleLinks.length}\n`);

    // Move to previous page
    currentPage--;

    // Small delay between page requests
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n📝 Total unique article links collected: ${allArticleLinks.length}`);

  // Take the required number of articles
  // The first ones in our list are from page 15 (oldest), then page 14, etc.
  const articlesToScrape = allArticleLinks.slice(0, count);
  console.log(`📚 Will scrape ${articlesToScrape.length} articles\n`);

  // Debug: Show which articles we'll scrape
  console.log('Articles to scrape:');
  articlesToScrape.forEach((link, i) => {
    console.log(`   ${i + 1}. ${link}`);
  });
  console.log('');

  const articles: ScrapedArticle[] = [];

  for (let i = 0; i < articlesToScrape.length; i++) {
    const link = articlesToScrape[i];
    console.log(`📖 [${i + 1}/${articlesToScrape.length}] Scraping: ${link}`);

    try {
      const article = await scrapeArticleContent(link);
      if (article) {
        articles.push(article);
        console.log(`   ✅ "${article.title.slice(0, 50)}..."\n`);
      }
      // Small delay between requests
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}\n`);
    }
  }

  return articles;
}

async function scrapeArticleContent(url: string): Promise<ScrapedArticle | null> {
  try {
    const response = await http.get(url);
    const $ = cheerio.load(response.data);

    // Title - try multiple selectors
    let title = '';
    const titleSelectors = [
      'h1.entry-title',
      'h1.post-title',
      'article h1',
      '.elementor-heading-title',
      'h1',
    ];
    for (const sel of titleSelectors) {
      title = $(sel).first().text().trim();
      if (title) break;
    }

    if (!title) {
      console.warn(`   ⚠️ No title found for ${url}`);
      return null;
    }

    // Content - get the main article content
    let content = '';
    const contentSelectors = [
      '.entry-content',
      '.post-content',
      '.elementor-widget-theme-post-content .elementor-widget-container',
      'article .elementor-section',
      'article',
    ];

    for (const sel of contentSelectors) {
      const el = $(sel).first();
      if (el.length) {
        // Clone to avoid modifying original
        const clone = el.clone();
        // Remove unwanted elements
        clone.find('script, style, nav, .sidebar, .share-buttons, .related-posts, .comments').remove();
        content = clone.html() || '';
        if (content.length > 200) break;
      }
    }

    // If still no content, try to get all paragraphs
    if (!content || content.length < 200) {
      const paragraphs: string[] = [];
      $('article p, .entry-content p, .post-content p').each((_, p) => {
        const text = $(p).text().trim();
        if (text.length > 20) {
          paragraphs.push(`<p>${text}</p>`);
        }
      });
      if (paragraphs.length > 0) {
        content = paragraphs.join('\n');
      }
    }

    // Author
    const author =
      $('.ct-meta-element-author span').first().text().trim() ||
      $('.author-name').first().text().trim() ||
      $('[rel="author"]').first().text().trim() ||
      'BeyondChats';

    // Date
    const timeEl = $('time.ct-meta-element-date, time[datetime], .entry-date').first();
    const publishedAt = timeEl.attr('datetime') || timeEl.text().trim() || new Date().toISOString();

    // Image
    const imageUrl =
      $('.wp-post-image').first().attr('src') ||
      $('article img').first().attr('src') ||
      $('meta[property="og:image"]').attr('content') ||
      null;

    // Excerpt - first paragraph or meta description
    let excerpt = '';
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc) {
      excerpt = metaDesc;
    } else {
      excerpt = $('article p, .entry-content p').first().text().slice(0, 300).trim();
    }

    return {
      title,
      content: content || excerpt || 'Content could not be extracted.',
      excerpt,
      author,
      publishedAt,
      sourceUrl: url,
      imageUrl,
    };
  } catch (error: any) {
    console.error(`   Error scraping ${url}:`, error.message);
    return null;
  }
}
