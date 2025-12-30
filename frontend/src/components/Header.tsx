import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid var(--border)',
      padding: '16px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link to="/" style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--text)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          📝 BeyondChats Articles
        </Link>
        <nav>
          <Link to="/" style={{ marginRight: '20px' }}>All Articles</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
