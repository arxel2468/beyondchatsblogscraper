import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  sourceUrl: string;
  imageUrl: string | null;
  isOriginal: boolean;
  originalArticleId: string | null;
  references: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticlesResponse {
  articles: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getArticles(type?: 'original' | 'improved'): Promise<ArticlesResponse> {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  params.set('limit', '50');

  const response = await axios.get(`${API_BASE}/articles?${params}`);
  return response.data;
}

export async function getArticle(id: string): Promise<{
  article: Article;
  improvedVersions: Article[];
  originalArticle: Article | null;
}> {
  const response = await axios.get(`${API_BASE}/articles/${id}`);
  return response.data;
}

export async function processArticle(id: string): Promise<{ improvedArticle: Article }> {
  const response = await axios.post(`${API_BASE}/articles/${id}/process`);
  return response.data;
}
