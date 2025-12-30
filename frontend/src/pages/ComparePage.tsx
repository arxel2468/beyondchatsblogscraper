import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticle, type Article } from '../api/articles';
import Loading from '../components/Loading';

const ComparePage = () => {
  const { id } = useParams<{ id: string }>();
  const [original, setOriginal] = useState<Article | null>(null);
  const [improved, setImproved] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await getArticle(id);
        setOriginal(response.article);
        if (response.improvedVersions.length > 0) {
          setImproved(response.improvedVersions[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const renderContent = (content: string) => {
    const clean = content.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<style[^>]*>.*?<\/style>/gi, '');
    if (clean.includes('<p>') || clean.includes('<h')) {
      return <div dangerouslySetInnerHTML={{ __html: clean }} style={{ fontSize: '14px' }} />;
    }
    return <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{clean}</div>;
  };

  if (loading) return <Loading />;
  if (!original) {
    return (
      <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
        <p>Article not found</p>
        <Link to="/">← Back to Articles</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        <Link to="/" style={{ color: 'var(--text-light)', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Articles
        </Link>

        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>📊 Article Comparison</h1>
        <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>
          Original vs AI-Improved Version
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
        }}>
          {/* Original */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <div style={{
              padding: '16px 20px',
              background: '#dbeafe',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontWeight: 600, color: '#1d4ed8' }}>📄 Original Article</span>
            </div>
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>{original.title}</h3>
              <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                {renderContent(original.content)}
              </div>
            </div>
          </div>

          {/* Improved */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <div style={{
              padding: '16px 20px',
              background: '#dcfce7',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontWeight: 600, color: '#16a34a' }}>🤖 AI Improved Version</span>
            </div>
            <div style={{ padding: '20px' }}>
              {improved ? (
                <>
                  <h3 style={{ marginBottom: '16px' }}>{improved.title}</h3>
                  <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                    {renderContent(improved.content)}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                  <p>No improved version yet.</p>
                  <Link to={`/article/${original.id}`} style={{ marginTop: '12px', display: 'inline-block' }}>
                    Generate one →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;
