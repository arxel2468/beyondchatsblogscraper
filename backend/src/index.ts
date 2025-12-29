import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'BeyondChats Article API',
    version: '1.0.0',
    status: 'running',
  });
});

// Start server
async function start() {
  // Initialize database
  initializeDatabase();

  app.listen(PORT, () => {
    console.log(`
🚀 Server running on http://localhost:${PORT}
📦 Database initialized
    `);
  });
}

start();
