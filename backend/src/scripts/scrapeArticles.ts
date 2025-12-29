import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase } from '../db/index.js';
import db from '../db/index.js';
// Use the light scraper (faster, no browser needed)
import { scrapeBeyondChatsArticles } from '../services/scraperLight.js';

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 BeyondChats Article Scraper');
  console.log('='.repeat(60));
  console.log('');

  // Initialize database
  initializeDatabase();

  try {
    // Scrape articles
    const articles = await scrapeBeyondChatsArticles(5);

    console.log('');
    console.log('='.repeat(60));
    console.log(`📊 Successfully scraped ${articles.length} articles`);
    console.log('='.repeat(60));

    if (articles.length === 0) {
      console.log('❌ No articles were scraped.');
      process.exit(1);
    }

    // Save to database
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO articles (
        id, title, slug, content, excerpt, author,
        published_at, source_url, image_url, is_original
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    let savedCount = 0;

    console.log('\n📦 Saving to database...\n');

    for (const article of articles) {
      const id = uuidv4();
      const slug = createSlug(article.title) + '-' + id.slice(0, 8);

      try {
        stmt.run(
          id,
          article.title,
          slug,
          article.content,
          article.excerpt,
          article.author,
          article.publishedAt || new Date().toISOString(),
          article.sourceUrl,
          article.imageUrl
        );
        console.log(`✅ Saved: ${article.title.slice(0, 55)}...`);
        savedCount++;
      } catch (error: any) {
        console.error(`❌ Failed to save: ${article.title}`, error.message);
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log(`✅ Saved ${savedCount}/${articles.length} articles to database`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
