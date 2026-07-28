<div align="center">

# 🚀 LC Company Tracker

**A modern, high-performance web platform to track and master LeetCode company-wise interview questions.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![React Query](https://img.shields.io/badge/React_Query-TanStack-FF4154?style=for-the-badge&logo=react-query)](https://tanstack.com/query/latest)

</div>

---

## ✨ Features

- 🏢 **650+ Company Tracks**: Comprehensive question lists organized by target companies (Google, Meta, Amazon, Apple, Microsoft, Netflix, etc.).
- 🔄 **Automated LeetCode Sync**: Seamless background incremental & full sync via LeetCode GraphQL / Session Cookie (no manual CSV editing needed).
- ⚡ **Ultra-Fast Database Query Engine**: Direct SQL aggregation, SQLite indexing, and paginated loading (<20ms response time).
- 🔍 **Real-Time Debounced Search**: Instant search experience across 650+ companies with 250ms debouncing to prevent server load.
- 📊 **Interactive Analytics**: Global solve progress, difficulty breakdowns (Easy/Medium/Hard), daily streaks, and recent activity logs.
- 🎨 **Premium Modern Aesthetics**: Dark/Light mode toggle, smooth glassmorphism containers, gradient progress indicators, and dynamic micro-animations.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router + Turbopack)](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) & [TanStack React Query](https://tanstack.com/query) |
| **Database & ORM** | [SQLite](https://www.sqlite.org/) via [Prisma ORM](https://www.prisma.io/) |
| **Icons & UI** | [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/) |

---

## ⚡ Performance Optimizations

1. **SQL-Level Filtering & Aggregations**: Replaced full table scans with SQLite `HAVING`, `WHERE LIKE`, and `ORDER BY` logic.
2. **Database Indexing**: Indexed key fields (`Company.name`, `Problem.solved`, `Problem.difficulty`, `CompanyProblem.frequency`).
3. **Search Debouncing**: 250ms debounce on global search input prevents redundant API requests while maintaining snappy typing.
4. **Parallelized API Endpoints**: Executed independent database queries concurrently using `Promise.all()`.
5. **Smart React Query Caching**: Extended `staleTime` to 2 minutes and reduced background polling interval.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation & Database Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Push database schema & generate Prisma Client
npx prisma db push
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start tracking your interview preparation.

---

## 📂 Project Structure

```
frontend/
├── app/                  # Next.js App Router pages & API endpoints
│   ├── api/              # High-performance REST API routes
│   │   ├── companies/    # Company listing, search & filtering
│   │   ├── leetcode-sync/# Authenticated & public LeetCode sync engine
│   │   ├── problems/     # Problem details & bookmark updates
│   │   └── stats/        # Global progress & streak statistics
│   ├── company/[slug]/   # Detailed company question track page
│   ├── settings/         # Sync configuration & LeetCode settings
│   ├── statistics/       # In-depth analytics dashboard
│   ├── layout.tsx        # Root layout with sidebar & topbar nav
│   └── page.tsx          # Main dashboard & company directory
├── components/           # Reusable UI components (Navbar, Sidebar, ProblemModal, etc.)
├── prisma/               # Database schema (`schema.prisma`) & SQLite `dev.db`
├── store/                # Zustand global state management (`useTrackerStore.ts`)
├── types/                # TypeScript interface definitions
└── utils/                # Helper functions & formatting utilities
```

---

## 📡 API Endpoints

- `GET /api/companies?search=&filter=&sort=&page=&limit=` - Returns filtered, sorted, paginated company list with completion stats.
- `GET /api/companies/[slug]` - Returns detailed question track for a specific company slug.
- `GET /api/stats` - Returns global overall statistics, difficulty breakdown, streak, and sync status.
- `POST /api/leetcode-sync` - Triggers full or incremental synchronization with user's LeetCode account.
- `GET /api/problems/[id]` - Returns problem metadata, company frequency breakdown, and personal notes.

---

<div align="center">
  <sub>Built with ❤️ for algorithm interview preparation.</sub>
</div>
