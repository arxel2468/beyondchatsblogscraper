import { Link } from 'react-router-dom';
import type { Article } from '../api/articles';

interface Props {
  article: Article;
}

const ArticleCard = ({ article }: Props) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}>
      {article.imageUrl && (
        <div style={{ height: '180px', overflow: 'hidden' }}>
          <img
            src={article.imageUrl}
            alt={article.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            background: article.isOriginal ? '#dbeafe' : '#dcfce7',
            color: article.isOriginal ? '#1d4ed8' : '#16a34a',
          }}>
            {article.isOriginal ? 'Original' : 'AI Improved'}
          </span>
          <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>
            {formatDate(article.publishedAt)}
          </span>
        </div>

        <h3 style={{ fontSize: '18px', marginBottom: '8px', lineHeight: 1.4 }}>
          <Link to={`/article/${article.id}`} style={{ color: 'var(--text)' }}>
            {article.title}
          </Link>
        </h3>

        <p style={{
          color: 'var(--text-light)',
          fontSize: '14px',
          marginBottom: '16px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {article.excerpt || 'No excerpt available.'}
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to={`/article/${article.id}`}
            style={{
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Read More
          </Link>
          {article.isOriginal && (
            <Link
              to={`/compare/${article.id}`}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Compare Versions
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
