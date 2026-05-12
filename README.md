# Kairos AI | Production SaaS Edition

This is the production-ready Next.js version of Kairos, featuring persistent storage, authentication, and AI-powered recruitment tools.

## 🚀 Key Features

- **Next.js 15+ & React 19**: Modern full-stack architecture.
- **Prisma & SQLite**: Robust database for persistent candidate and workspace management.
- **NextAuth**: Authentication ready (GitHub/Email).
- **Tailwind CSS v4**: Cutting-edge styling.
- **Sourcing Scraper**: Automated headless candidate retrieval.
- **Blind Recruitment Mode**: Bias-reduction features for fair hiring.

## 🛠️ Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file.
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-generated-secret"
   GITHUB_ID="..."
   GITHUB_SECRET="..."
   ```

3. **Database Migration**:
   ```bash
   npx prisma migrate dev
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

- `/src/app/api`: Serverless API routes for scoring and sourcing.
- `/src/components`: UI components with Tailwind v4.
- `/src/lib`: Shared logic for scoring, PDF parsing, and database clients.
- `/prisma`: Database schema and migrations.

---
Built for Kairos · 2026 SaaS Edition
