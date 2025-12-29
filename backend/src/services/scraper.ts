import puppeteer from 'puppeteer';

export interface ScrapedArticle {
  title: string;
  content: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  sourceUrl: string;
  imageUrl: string | null;
}

const BEYONDCHATS_BLOG_URL = 'https://beyondchats.com/blogs/';
const LAST_PAGE_URL = 'https://beyondchats.com/blogs/page/15/';

/**
 * Scrape articles from BeyondChats blog
 * Fetches the 5 oldest articles from the last page
 */
export async function scrapeBeyondChatsArticles(count: number = 5): Promise<ScrapedArticle[]> {
  console.log('🔍 Starting to scrape BeyondChats blog...');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080',
    ],
  });

  try {
    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Disable images and CSS to load faster
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Go directly to the last page (page 15)
    console.log(`📄 Loading last page: ${LAST_PAGE_URL}`);

    await page.goto(LAST_PAGE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });

    // Wait for the articles container to load
    console.log('⏳ Waiting for articles to load...');
    await page.waitForSelector('article.entry-card', { timeout: 30000 }).catch(() => {
      console.log('⚠️ article.entry-card not found, trying alternative selectors...');
    });

    // Give extra time for dynamic content
    await new Promise((r) => setTimeout(r, 3000));

    // Extract article links using the exact selectors from the HTML
    const articleLinks = await page.evaluate(() => {
      const links: string[] = [];

      // Select all article cards
      const articles = document.querySelectorAll('article.entry-card');

      articles.forEach((article) => {
        // Get the link from h2.entry-title > a
        const titleLink = article.querySelector('h2.entry-title a');
        if (titleLink) {
          const href = titleLink.getAttribute('href');
          if (href && !links.includes(href)) {
            links.push(href);
          }
        }
      });

      return links;
    });

    console.log(`📝 Found ${articleLinks.length} article links on last page`);

    if (articleLinks.length === 0) {
      // Fallback: try to get any blog links
      const fallbackLinks = await page.evaluate(() => {
        const links: string[] = [];
        const allLinks = document.querySelectorAll('a[href*="/blogs/"]');
        allLinks.forEach((a) => {
          const href = a.getAttribute('href');
          if (
            href &&
            href.includes('/blogs/') &&
            !href.endsWith('/blogs/') &&
            !href.includes('/page/') &&
            !href.includes('/tag/') &&
            !href.includes('/category/') &&
            !links.includes(href)
          ) {
            links.push(href);
          }
        });
        return links;
      });
      console.log(`📝 Fallback found ${fallbackLinks.length} links`);
      articleLinks.push(...fallbackLinks);
    }

    // Take up to 'count' articles (they're already the oldest since we're on last page)
    const articlesToScrape = articleLinks.slice(0, count);
    console.log(`📚 Scraping ${articlesToScrape.length} articles...`);

    const articles: ScrapedArticle[] = [];

    for (let i = 0; i < articlesToScrape.length; i++) {
      const link = articlesToScrape[i];
      try {
        console.log(`\n📖 [${i + 1}/${articlesToScrape.length}] Scraping: ${link}`);
        const article = await scrapeArticleContent(page, link);
        if (article) {
          articles.push(article);
          console.log(`✅ Scraped: "${article.title.slice(0, 50)}..."`);
        }
        // Delay between requests
        await new Promise((r) => setTimeout(r, 2000));
      } catch (error) {
        console.error(`❌ Failed to scrape ${link}:`, error);
      }
    }

    return articles;
  } finally {
    await browser.close();
    console.log('\n🔒 Browser closed');
  }
}

async function scrapeArticleContent(
  page: puppeteer.Page,
  url: string
): Promise<ScrapedArticle | null> {
  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for content to be present
    await page.waitForSelector('h1, .entry-title', { timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));

    const articleData = await page.evaluate(() => {
      // Helper to get text content
      const getText = (selectors: string[]): string => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el?.textContent) {
            return el.textContent.trim();
          }
        }
        return '';
      };

      // Title
      const title = getText([
        'h1.entry-title',
        'h1.post-title',
        'article h1',
        '.elementor-heading-title',
        'h1',
      ]);

      // Content - get main article body
      let content = '';
      const contentSelectors = [
        '.entry-content',
        '.post-content',
        'article .elementor-widget-theme-post-content',
        '.elementor-widget-theme-post-content .elementor-widget-container',
        'article',
      ];

      for (const sel of contentSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          // Clone and remove unwanted elements
          const clone = el.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('script, style, nav, .sidebar, .comments, .share-buttons').forEach(e => e.remove());
          content = clone.innerHTML;
          if (content.length > 100) break;
        }
      }

      // Author - from meta or author link
      let author = '';
      const authorEl = document.querySelector('.ct-meta-element-author span, .author-name, [rel="author"]');
      if (authorEl) {
        author = authorEl.textContent?.trim() || '';
      }
      if (!author) author = 'BeyondChats';

      // Date
      let publishedAt = '';
      const timeEl = document.querySelector('time.ct-meta-element-date, time[datetime], .entry-date');
      if (timeEl) {
        publishedAt = timeEl.getAttribute('datetime') || timeEl.textContent?.trim() || '';
      }

      // Image
      let imageUrl: string | null = null;
      const imgEl = document.querySelector(
        '.wp-post-image, article img, .featured-image img, meta[property="og:image"]'
      );
      if (imgEl) {
        imageUrl = imgEl.getAttribute('src') || imgEl.getAttribute('content') || null;
      }

      // Excerpt
      const excerptEl = document.querySelector('.entry-excerpt p, article p');
      const excerpt = excerptEl?.textContent?.slice(0, 300).trim() || '';

      return { title, content, author, publishedAt, imageUrl, excerpt };
    });

    if (!articleData.title) {
      console.warn(`⚠️ No title found for ${url}`);
      return null;
    }

    if (!articleData.content || articleData.content.length < 50) {
      console.warn(`⚠️ No/little content found for ${url}`);
      // Still return with basic content
      articleData.content = articleData.excerpt || 'Content could not be extracted.';
    }

    return {
      ...articleData,
      sourceUrl: url,
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}
