import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import db from '../db/index.js';
import { rowToArticle } from '../db/helpers.js';

const router = Router();

// Validation schemas
const createArticleSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  publishedAt: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  isOriginal: z.boolean().optional().default(true),
  originalArticleId: z.string().uuid().optional(),
});

const updateArticleSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
});

// Helper to create slug
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

/**
 * GET /api/articles
 * List all articles with optional filtering
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { type, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = '';
    if (type === 'original') {
      whereClause = 'WHERE is_original = 1';
    } else if (type === 'improved') {
      whereClause = 'WHERE is_original = 0';
    }

    // Get total count
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM articles ${whereClause}`);
    const { count } = countStmt.get() as { count: number };

    // Get articles
    const stmt = db.prepare(`
      SELECT * FROM articles 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(limitNum, offset);
    const articles = rows.map(rowToArticle).filter(Boolean);

    res.json({
      articles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

/**
 * GET /api/articles/:id
 * Get a single article by ID or slug
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('SELECT * FROM articles WHERE id = ? OR slug = ?');
    const row = stmt.get(id, id);
    const article = rowToArticle(row);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // If it's an original article, also fetch improved versions
    let improvedVersions: any[] = [];
    if (article.isOriginal) {
      const improvedStmt = db.prepare(
        'SELECT * FROM articles WHERE original_article_id = ? ORDER BY created_at DESC'
      );
      const improvedRows = improvedStmt.all(article.id);
      improvedVersions = improvedRows.map(rowToArticle).filter(Boolean);
    }

    // If it's an improved article, fetch the original
    let originalArticle = null;
    if (!article.isOriginal && article.originalArticleId) {
      const origStmt = db.prepare('SELECT * FROM articles WHERE id = ?');
      const origRow = origStmt.get(article.originalArticleId);
      originalArticle = rowToArticle(origRow);
    }

    res.json({
      article,
      improvedVersions,
      originalArticle,
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

/**
 * POST /api/articles
 * Create a new article
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const validation = createArticleSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const data = validation.data;
    const id = uuidv4();
    const slug = createSlug(data.title) + '-' + id.slice(0, 8);

    const stmt = db.prepare(`
      INSERT INTO articles (
        id, title, slug, content, excerpt, author,
        published_at, source_url, image_url,
        is_original, original_article_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.title,
      slug,
      data.content,
      data.excerpt || data.content.slice(0, 200),
      data.author || 'BeyondChats',
      data.publishedAt || new Date().toISOString(),
      data.sourceUrl || null,
      data.imageUrl || null,
      data.isOriginal ? 1 : 0,
      data.originalArticleId || null
    );

    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
    const article = rowToArticle(row);

    res.status(201).json({ article });
  } catch (error: any) {
    console.error('Error creating article:', error);

    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Article with this slug already exists' });
    }

    res.status(500).json({ error: 'Failed to create article' });
  }
});

/**
 * PUT /api/articles/:id
 * Update an article
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if article exists
    const existingRow = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
    if (!existingRow) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const validation = updateArticleSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const data = validation.data;
    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.content !== undefined) {
      updates.push('content = ?');
      params.push(data.content);
    }
    if (data.excerpt !== undefined) {
      updates.push('excerpt = ?');
      params.push(data.excerpt);
    }
    if (data.author !== undefined) {
      updates.push('author = ?');
      params.push(data.author);
    }
    if (data.imageUrl !== undefined) {
      updates.push('image_url = ?');
      params.push(data.imageUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = datetime("now")');
    params.push(id);

    const stmt = db.prepare(`
      UPDATE articles 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...params);

    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
    const article = rowToArticle(row);

    res.json({ article });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

/**
 * DELETE /api/articles/:id
 * Delete an article
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingRow = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
    if (!existingRow) {
      return res.status(404).json({ error: 'Article not found' });
    }

    db.prepare('DELETE FROM articles WHERE id = ?').run(id);

    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

export default router;
