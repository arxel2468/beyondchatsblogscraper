import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticle, processArticle, type Article } from '../api/articles';
import Loading from '../components/Loading';

const ArticlePage = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [improvedVersions, setImprovedVersions] = useState<Article[]>([]);
  const [originalArticle, setOriginalArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await getArticle(id);
        setArticle(response.article);
        setImprovedVersions(response.improvedVersions);
        setOriginalArticle(response.originalArticle);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const handleProcess = async () => {
    if (!article) return;
    setProcessing(true);
    try {
      const response = await processArticle(article.id);
      setImprovedVersions((prev) => [response.improvedArticle, ...prev]);
      alert('Article processed successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to process article');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Simple markdown to HTML (basic)
  const renderContent = (content: string) => {
    // Remove excessive HTML if present
    let clean = content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '');

    // If it looks like HTML, render as-is
    if (clean.includes('<p>') || clean.includes('<h')) {
      return <div dangerouslySetInnerHTML={{ __html: clean }} />;
    }

    // Otherwise, treat as markdown-ish
    return (
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {clean.split('\n').map((line, i) => {
          if (line.startsWith('## ')) {
            return <h2 key={i} style={{ marginTop: '24px', marginBottom: '12px' }}>{line.replace('## ', '')}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={i} style={{ marginTop: '20px', marginBottom: '10px' }}>{line.replace('### ', '')}</h3>;
          }
          if (line.startsWith('- ')) {
            return <li key={i} style={{ marginLeft: '20px' }}>{line.replace('- ', '')}</li>;
          }
          if (line.trim() === '') {
            return <br key={i} />;
          }
          return <p key={i} style={{ marginBottom: '12px' }}>{line}</p>;
        })}
      </div>
    );
  };

  if (loading) return <Loading />;
  if (error || !article) {
    return (
      <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ color: 'red' }}>{error || 'Article not found'}</p>
        <Link to="/" style={{ marginTop: '20px', display: 'inline-block' }}>← Back to Articles</Link>
      </div>
    );
  }

  const references = article.references ? JSON.parse(article.references) : [];

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <Link to="/" style={{ color: 'var(--text-light)', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Articles
        </Link>

        <div style={{ marginBottom: '24px' }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            background: article.isOriginal ? '#dbeafe' : '#dcfce7',
            color: article.isOriginal ? '#1d4ed8' : '#16a34a',
          }}>
            {article.isOriginal ? 'Original Article' : 'AI Improved Version'}
          </span>
        </div>

        <h1 style={{ fontSize: '32px', marginBottom: '16px', lineHeight: 1.3 }}>
          {article.title}
        </h1>

        <div style={{ color: 'var(--text-light)', marginBottom: '24px', fontSize: '14px' }}>
          By {article.author} • {formatDate(article.publishedAt)}
          {article.sourceUrl && (
            <>
              {' • '}
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                Original Source
              </a>
            </>
          )}
        </div>

        {article.isOriginal && (
          <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleProcess}
              disabled={processing}
              style={{
                padding: '12px 24px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 500,
                cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.7 : 1,
              }}
            >
              {processing ? '⏳ Processing...' : '🤖 Generate AI Improved Version'}
            </button>
            {improvedVersions.length > 0 && (
              <Link
                to={`/compare/${article.id}`}
                style={{
                  padding: '12px 24px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontWeight: 500,
                }}
              >
                Compare Versions ({improvedVersions.length})
              </Link>
            )}
          </div>
        )}

        {!article.isOriginal && originalArticle && (
          <div style={{ marginBottom: '24px' }}>
            <Link to={`/article/${originalArticle.id}`}>
              ← View Original Article
            </Link>
          </div>
        )}


        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          {renderContent(article.content)}
        </div>

        {references.length > 0 && (
          <div style={{ marginTop: '32px', padding: '24px', background: '#f8fafc', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '16px' }}>📚 References</h3>
            <ul style={{ paddingLeft: '20px' }}>
              {references.map((ref: { title: string; url: string }, i: number) => (
                <li key={i} style={{ marginBottom: '8px' }}>
                  <a href={ref.url} target="_blank" rel="noopener noreferrer">
                    {ref.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlePage;
