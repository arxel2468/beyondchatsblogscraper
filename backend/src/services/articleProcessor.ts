import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { rowToArticle } from '../db/helpers.js';
import { searchArticles, scrapeExternalArticle } from './googleSearch.js';
import { generateImprovedArticle, type ReferenceArticle } from './llm.js';
import type { Article } from '../types/index.js';

/**
 * Process an article:
 * 1. Search for similar articles on the web
 * 2. Scrape top 2 results
 * 3. Generate improved version using LLM
 * 4. Save as new article with references
 */
export async function processArticle(articleId: string): Promise<Article> {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 Processing article: ${articleId}`);
  console.log('='.repeat(60) + '\n');

  // 1. Get original article
  const stmt = db.prepare('SELECT * FROM articles WHERE id = ?');
  const row = stmt.get(articleId);
  const article = rowToArticle(row);

  if (!article) {
    throw new Error('Article not found');
  }

  if (!article.isOriginal) {
    throw new Error('Can only process original articles');
  }

  console.log(`📄 Original: "${article.title}"\n`);

  // 2. Search for similar articles
  const searchResults = await searchArticles(article.title, 2);

  if (searchResults.length === 0) {
    throw new Error('No reference articles found. Try again later.');
  }

  // 3. Scrape content from search results
  const references: ReferenceArticle[] = [];

  for (const result of searchResults) {
    console.log(`\n📥 Fetching: ${result.url}`);
    const scraped = await scrapeExternalArticle(result.url);

    if (scraped) {
      references.push({
        title: scraped.title || result.title,
        url: result.url,
        content: scraped.content,
      });
    }

    // Delay between requests
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (references.length === 0) {
    throw new Error('Failed to scrape any reference articles');
  }

  console.log(`\n✅ Scraped ${references.length} reference articles\n`);

  // 4. Generate improved article using LLM
  const generated = await generateImprovedArticle(
    article.title,
    article.content,
    references
  );

  // 5. Save improved article to database
  const improvedId = uuidv4();
  const improvedSlug = `${article.slug}-improved-${Date.now()}`;

  const insertStmt = db.prepare(`
    INSERT INTO articles (
      id, title, slug, content, excerpt, author,
      published_at, source_url, image_url,
      is_original, original_article_id, references_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const referencesJson = JSON.stringify(
    references.map((r) => ({ title: r.title, url: r.url }))
  );

  insertStmt.run(
    improvedId,
    generated.title,
    improvedSlug,
    generated.content,
    generated.excerpt,
    article.author,
    new Date().toISOString(),
    article.sourceUrl,
    article.imageUrl,
    0, // is_original = false (this is improved version)
    article.id, // reference to original
    referencesJson
  );

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Improved article saved!`);
  console.log(`   ID: ${improvedId}`);
  console.log(`   Title: ${generated.title}`);
  console.log('='.repeat(60) + '\n');

  // Return the new article
  const newRow = db.prepare('SELECT * FROM articles WHERE id = ?').get(improvedId);
  return rowToArticle(newRow)!;
}
