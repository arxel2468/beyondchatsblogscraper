import type { Article } from '../types/index.js';

// Convert database row to Article type
export function rowToArticle(row: any): Article | null {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt,
    author: row.author,
    publishedAt: row.published_at,
    sourceUrl: row.source_url,
    imageUrl: row.image_url,
    isOriginal: Boolean(row.is_original),
    originalArticleId: row.original_article_id,
    references: row.references_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
