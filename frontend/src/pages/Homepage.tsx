import { useState, useEffect } from 'react';
import { getArticles, type Article } from '../api/articles';
import ArticleCard from '../components/ArticleCard';
import Loading from '../components/Loading';

const HomePage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'original' | 'improved'>('all');

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const type = filter === 'all' ? undefined : filter;
        const response = await getArticles(type);
        setArticles(response.articles);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch articles');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [filter]);

  const originalCount = articles.filter((a) => a.isOriginal).length;
  const improvedCount = articles.filter((a) => !a.isOriginal).length;

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>📚 Article Collection</h1>
          <p style={{ color: 'var(--text-light)' }}>
            Original articles and their AI-improved versions
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}>
          {[
            { label: 'Original', count: originalCount, color: '#1d4ed8' },
            { label: 'AI Improved', count: improvedCount, color: '#16a34a' },
            { label: 'Total', count: articles.length, color: 'var(--primary)' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <span style={{ fontSize: '36px', fontWeight: 700, color: stat.color }}>
                {stat.count}
              </span>
              <br />
              <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {(['all', 'original', 'improved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '10px 20px',
                border: `1px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '8px',
                background: filter === f ? 'var(--primary)' : 'white',
                color: filter === f ? 'white' : 'var(--text)',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? 'All Articles' : f + ' Only'}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {loading ? (
          <Loading />
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
            {error}
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-light)' }}>
            <p>No articles found.</p>
            <p style={{ marginTop: '8px', fontSize: '14px' }}>
              Run <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                npm run scrape
              </code> in the backend to fetch articles.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px',
          }}>
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
