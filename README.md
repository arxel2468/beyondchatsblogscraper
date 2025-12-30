```<div align="center">
  <h1>📝 BeyondChats Article Scraper & AI Improver</h1>
  <p><strong>A full-stack application that scrapes blog articles, improves them using AI, and displays both versions in a professional UI</strong></p>
  
  <p>
    <a href="#-live-demo">Live Demo</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-api-reference">API Reference</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" alt="Node.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/AI-Groq%20LLama%203.1-purple" alt="Groq" />
  </p>
</div>

---

## 🎯 Project Overview

This project was built as a take-home assignment for **BeyondChats Full Stack Web Developer Intern** position.

### The Task (3 Phases)

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Scrape articles from BeyondChats blog, store in database, create CRUD APIs | ✅ Complete |
| **Phase 2** | Search Google for similar articles, scrape them, use LLM to improve original | ✅ Complete |
| **Phase 3** | React frontend to display original and improved articles | ✅ Complete |

---

## 🌐 Live Demo

- **Frontend**: [https://beyondchatsblogscraper.vercel.app](https://beyondchatsblogscraper.vercel.app) *(if deployed)*
- **Backend API**: [https://beyondchatsblogscraper-api.onrender.com](https://beyondchatsblogscraper-api.onrender.com) *(if deployed)*

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **Groq API Key** ([Get free key](https://console.groq.com/keys))

### 1. Clone the Repository

```bash
git clone https://github.com/arxel2468/beyondchatsblogscraper.git
cd beyondchatsblogscraper
2. Backend Setup
Bash

cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your Groq API key
# GROQ_API_KEY=your_key_here

# Scrape articles from BeyondChats blog
npm run scrape

# Start the server
npm run dev
Backend will run at: http://localhost:3001

3. Frontend Setup
Bash

# Open new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
Frontend will run at: http://localhost:5173

4. Test the Application
Open http://localhost:5173 in your browser
You should see the scraped articles
Click on an article → Click "Generate AI Improved Version"
Use "Compare Versions" to see original vs improved side-by-side
🏗️ Architecture
System Overview
text

┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                   React + TypeScript + Vite                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  HomePage   │  │ ArticlePage │  │     ComparePage         │  │
│  │  (List)     │  │  (Detail)   │  │  (Side-by-side)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                  Node.js + Express + TypeScript                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Routes Layer                         │   │
│  │         /api/articles (CRUD + Process endpoint)          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Services Layer                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐    │   │
│  │  │  Scraper   │  │  Google    │  │  Article         │    │   │
│  │  │  Service   │  │  Search    │  │  Processor       │    │   │
│  │  │            │  │  Service   │  │                  │    │   │
│  │  │ - Cheerio  │  │            │  │ - Orchestrates   │    │   │
│  │  │ - Axios    │  │ - DuckDuck │  │   entire flow    │    │   │
│  │  └────────────┘  └────────────┘  └──────────────────┘    │   │
│  │                                           │               │   │
│  │                              ┌────────────┴───────────┐   │   │
│  │                              │      LLM Service       │   │   │
│  │                              │   (Groq - LLama 3.1)   │   │   │
│  │                              └────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Database Layer                         │   │
│  │                  SQLite + better-sqlite3                  │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │                    articles                          │ │   │
│  │  │  - id, title, slug, content, excerpt                 │ │   │
│  │  │  - author, published_at, source_url, image_url       │ │   │
│  │  │  - is_original, original_article_id, references_json │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐         ┌──────────────────────┐
│   BeyondChats Blog   │         │     Groq API         │
│   (Source articles)  │         │   (LLM Processing)   │
└──────────────────────┘         └──────────────────────┘
Data Flow Diagram
text

┌─────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1: SCRAPING                              │
└─────────────────────────────────────────────────────────────────────────┘

  BeyondChats Blog                Scraper Service                 Database
  (Page 15, 14...)                                                
       │                               │                              │
       │  1. Fetch page HTML           │                              │
       │◄──────────────────────────────│                              │
       │                               │                              │
       │  2. Return HTML               │                              │
       │──────────────────────────────►│                              │
       │                               │                              │
       │                               │  3. Parse with Cheerio       │
       │                               │  4. Extract article links    │
       │                               │  5. Scrape each article      │
       │                               │                              │
       │                               │  6. Save to database         │
       │                               │─────────────────────────────►│
       │                               │                              │


┌─────────────────────────────────────────────────────────────────────────┐
│                      PHASE 2: AI PROCESSING                              │
└─────────────────────────────────────────────────────────────────────────┘

   Client              Backend              DuckDuckGo        External       Groq LLM
     │                    │                    │              Articles          │
     │ POST /process      │                    │                 │              │
     │───────────────────►│                    │                 │              │
     │                    │                    │                 │              │
     │                    │ 1. Get original    │                 │              │
     │                    │    from DB         │                 │              │
     │                    │                    │                 │              │
     │                    │ 2. Search query    │                 │              │
     │                    │───────────────────►│                 │              │
     │                    │                    │                 │              │
     │                    │ 3. Top 2 results   │                 │              │
     │                    │◄───────────────────│                 │              │
     │                    │                    │                 │              │
     │                    │ 4. Scrape articles │                 │              │
     │                    │─────────────────────────────────────►│              │
     │                    │                    │                 │              │
     │                    │ 5. Article content │                 │              │
     │                    │◄─────────────────────────────────────│              │
     │                    │                    │                 │              │
     │                    │ 6. Generate improved article         │              │
     │                    │───────────────────────────────────────────────────►│
     │                    │                    │                 │              │
     │                    │ 7. Improved content│                 │              │
     │                    │◄───────────────────────────────────────────────────│
     │                    │                    │                 │              │
     │                    │ 8. Save to DB      │                 │              │
     │                    │                    │                 │              │
     │ 9. Return improved │                    │                 │              │
     │◄───────────────────│                    │                 │              │


┌─────────────────────────────────────────────────────────────────────────┐
│                       PHASE 3: FRONTEND                                  │
└─────────────────────────────────────────────────────────────────────────┘

    User                   React App                    Backend API
      │                        │                             │
      │  1. Open app           │                             │
      │───────────────────────►│                             │
      │                        │                             │
      │                        │  2. GET /api/articles       │
      │                        │────────────────────────────►│
      │                        │                             │
      │                        │  3. Articles list           │
      │                        │◄────────────────────────────│
      │                        │                             │
      │  4. Display articles   │                             │
      │◄───────────────────────│                             │
      │                        │                             │
      │  5. Click article      │                             │
      │───────────────────────►│                             │
      │                        │                             │
      │                        │  6. GET /api/articles/:id   │
      │                        │────────────────────────────►│
      │                        │                             │
      │                        │  7. Article + versions      │
      │                        │◄────────────────────────────│
      │                        │                             │
      │  8. Show detail page   │                             │
      │◄───────────────────────│                             │
📁 Project Structure
text

beyondchatsblogscraper/
│
├── backend/                          # Node.js + Express API
│   ├── src/
│   │   ├── index.ts                  # Express app entry point
│   │   ├── routes/
│   │   │   └── articles.ts           # CRUD + Process endpoints
│   │   ├── services/
│   │   │   ├── scraperLight.ts       # BeyondChats blog scraper
│   │   │   ├── googleSearch.ts       # DuckDuckGo search + external scraper
│   │   │   ├── llm.ts                # Groq LLM integration
│   │   │   └── articleProcessor.ts   # Orchestrates AI processing
│   │   ├── db/
│   │   │   ├── index.ts              # SQLite connection
│   │   │   └── helpers.ts            # DB helper functions
│   │   └── types/
│   │       └── index.ts              # TypeScript interfaces
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                         # React + Vite
│   ├── src/
│   │   ├── api/
│   │   │   └── articles.ts           # API client functions
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── ArticleCard.tsx
│   │   │   └── Loading.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx          # Article listing
│   │   │   ├── ArticlePage.tsx       # Article detail
│   │   │   └── ComparePage.tsx       # Side-by-side comparison
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                         # This file
📡 API Reference
Base URL
text

http://localhost:3001/api
Endpoints
List Articles
http

GET /articles?type=original|improved&page=1&limit=10
Response:

JSON

{
  "articles": [
    {
      "id": "uuid",
      "title": "Article Title",
      "slug": "article-title-uuid",
      "content": "<p>HTML content...</p>",
      "excerpt": "Short description...",
      "author": "Author Name",
      "publishedAt": "2024-01-01T00:00:00Z",
      "sourceUrl": "https://beyondchats.com/blogs/...",
      "imageUrl": "https://...",
      "isOriginal": true,
      "originalArticleId": null,
      "references": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
Get Single Article
http

GET /articles/:id
Response:

JSON

{
  "article": { ... },
  "improvedVersions": [ ... ],
  "originalArticle": null
}
Create Article
http

POST /articles
Content-Type: application/json

{
  "title": "Article Title",
  "content": "Article content...",
  "excerpt": "Optional excerpt",
  "author": "Author Name"
}
Update Article
http

PUT /articles/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content..."
}
Delete Article
http

DELETE /articles/:id
Process Article (AI Improvement)
http

POST /articles/:id/process
Response:

JSON

{
  "success": true,
  "message": "Article processed successfully",
  "originalId": "original-uuid",
  "improvedArticle": {
    "id": "improved-uuid",
    "title": "Improved: Article Title",
    "content": "## Improved content...",
    "isOriginal": false,
    "originalArticleId": "original-uuid",
    "references": "[{\"title\":\"Ref 1\",\"url\":\"https://...\"}]"
  }
}
🗄️ Database Schema
SQL

CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author TEXT DEFAULT 'BeyondChats',
  published_at TEXT,
  source_url TEXT,
  image_url TEXT,
  is_original INTEGER DEFAULT 1,        -- 1 = original, 0 = AI improved
  original_article_id TEXT,              -- Reference to original (for improved versions)
  references_json TEXT,                  -- JSON array of reference articles
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (original_article_id) REFERENCES articles(id)
);
🤖 LLM Integration
Provider
Groq with LLama 3.1 8B Instant model

Why Groq?
⚡ Extremely fast inference (~200-500ms)
💰 Generous free tier
🔄 OpenAI-compatible API
📈 Easy to upgrade to larger models
Processing Flow
Original Article → Extract title and clean content
Search → Query DuckDuckGo for similar articles
Scrape → Extract content from top 2 results
Generate → Send to LLM with prompt:
System: "You are an expert content writer..."
User: Original article + Reference articles
Save → Store improved version with references
Prompt Strategy
text

System Prompt:
- Expert content writer and SEO specialist
- Improve structure and readability
- Incorporate insights from references
- Keep core message intact
- Output in Markdown format

User Prompt:
- Original article title and content
- Reference articles (title, URL, content)
- Requested format: TITLE, EXCERPT, CONTENT
⚡ Trade-offs & Decisions
Decision  Trade-off Reasoning
SQLite  Not suitable for high concurrency Simple setup, no external DB needed
DuckDuckGo  Less comprehensive than Google  More scraping-friendly, no API key needed
Cheerio Can't handle JS-rendered content  Much faster than Puppeteer, works for most blogs
LLama 3.1 8B  Less capable than 70B Faster, cheaper, good enough for this task
🔮 Future Improvements
If I had more time, I would add:

 Authentication - User accounts and saved articles
 Queue System - Redis/Bull for async processing
 Better Scraping - Puppeteer fallback for JS-heavy sites
 Rate Limiting - Prevent API abuse
 Caching - Redis for API responses
 Tests - Jest unit tests, Playwright E2E
 Docker - Containerized deployment
 CI/CD - GitHub Actions pipeline
 Analytics - Track article views and processing stats
🧪 Testing
Manual Test Scenarios
Scraping Test

Bash

cd backend && npm run scrape
# Should scrape 5 oldest articles from BeyondChats
API Test

Bash

# List articles
curl http://localhost:3001/api/articles

# Get single article
curl http://localhost:3001/api/articles/{id}

# Process article
curl -X POST http://localhost:3001/api/articles/{id}/process
Frontend Test

Open http://localhost:5173
Verify articles load
Click "Generate AI Improved Version"
Use "Compare Versions"
📄 Environment Variables
Backend (backend/.env)
env

# Server
PORT=3001

# Database
DATABASE_PATH=./data/articles.db

# Groq API (Required for AI processing)
GROQ_API_KEY=gsk_your_api_key_here
Frontend (frontend/.env)
env

# API URL (optional, defaults to /api with proxy)
VITE_API_URL=http://localhost:3001/api
🔒 Security Notes
✅ API keys stored in .env (not committed)
✅ Input validation with Zod schemas
✅ SQL injection prevented via parameterized queries
✅ CORS configured for frontend origin
✅ Request body size limited

👤 Author
Amit Pandit (@arxel2468)

📜 License
This project was created as a take-home assignment. The code is my own work and is shared for evaluation purposes.

<div align="center"> <sub>Built with ❤️ for BeyondChats</sub> </div> ```
