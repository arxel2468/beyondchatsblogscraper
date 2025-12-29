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

export interface CreateArticleDTO {
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  publishedAt?: string;
  sourceUrl?: string;
  imageUrl?: string;
  isOriginal?: boolean;
  originalArticleId?: string;
}

export interface UpdateArticleDTO {
  title?: string;
  content?: string;
  excerpt?: string;
  author?: string;
  imageUrl?: string;
}
