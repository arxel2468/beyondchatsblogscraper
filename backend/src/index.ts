import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/index.js';
import articlesRoutes from './routes/articles.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/articles', articlesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'BeyondChats Article API',
    version: '1.0.0',
    endpoints: {
      'GET /api/articles': 'List all articles',
      'GET /api/articles/:id': 'Get single article',
      'POST /api/articles': 'Create article',
      'PUT /api/articles/:id': 'Update article',
      'DELETE /api/articles/:id': 'Delete article',
    },
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  initializeDatabase();

  app.listen(PORT, () => {
    console.log(`
🚀 Server running on http://localhost:${PORT}
📦 Database initialized

Endpoints:
  GET    /api/articles          - List articles
  GET    /api/articles/:id      - Get article
  POST   /api/articles          - Create article
  PUT    /api/articles/:id      - Update article
  DELETE /api/articles/:id      - Delete article
    `);
  });
}

start();
