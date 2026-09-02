# 🛒 E-Commerce Platform

A modern full-stack e-commerce platform built with Next.js, NestJS, and PostgreSQL.

## 🚀 Tech Stack

### Frontend

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- TypeScript

### Backend

- NestJS
- PostgreSQL
- Prisma ORM
- JWT Authentication

### Infrastructure

- pnpm (Monorepo)
- Turborepo
- Docker
- Husky
- Commitlint
- lint-staged

## 📁 Project Structure

```text
ecommerce-platform/
├── apps/
│   ├── backend/              # NestJS API
│   └── frontend/             # Next.js App
├── packages/
│   └── shared/               # Shared types & utilities
├── .husky/                   # Git hooks
├── package.json              # Root workspace
├── pnpm-workspace.yaml       # pnpm workspace configuration
└── turbo.json                # Turborepo configuration
```

## 🛠️ Development

### Prerequisites

Make sure you have the following installed:

- Node.js >= 18
- pnpm >= 8
- Docker

### Installation

Clone the repository and install the dependencies:

```bash
pnpm install
```

### Start Development Servers

Start the frontend and backend development servers:

```bash
pnpm dev
```

## 🔧 Code Quality

This project uses Husky, Commitlint, and lint-staged to maintain code quality and enforce consistent commit messages.

### Git Hooks

- `pre-commit` — Runs lint-staged before a commit is created.
- `commit-msg` — Validates commit messages using Commitlint.

### Commit Convention

This project follows the Conventional Commits specification.

Examples:

```text
feat: add product management
fix: resolve authentication issue
docs: update README
chore: update dependencies
refactor: restructure product service
test: add product service tests
```

## 📝 License

Private - All rights reserved
