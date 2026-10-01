# 🏎️ The Racing Shop

A modern full-stack e-commerce platform for Formula 1 merchandise, built with Next.js, NestJS, and PostgreSQL.

## 🚀 Tech Stack

### Frontend

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- TypeScript
- next-intl (English + Swahili)

### Backend

- NestJS
- PostgreSQL
- Prisma ORM
- JWT Authentication

### Infrastructure

- pnpm workspaces (monorepo)
- Turborepo
- Husky + Commitlint + lint-staged
- GitHub Actions (CI)
- Playwright (E2E)

## 📁 Project Structure

```text
ecommerce-platform/

├── apps/
│   ├── backend/                 # NestJS API
│   │   ├── prisma/              # Schema, migrations, seed & utility scripts
│   │   ├── src/                 # Modules (auth, products, categories, etc.)
│   │   └── uploads/             # Local product & category images
│   │
│   └── frontend/                # Next.js application
│       ├── messages/             # en.json, sw.json
│       ├── e2e/                  # Playwright E2E specs
│       └── src/
│           ├── app/[locale]/     # Locale-aware pages
│           ├── components/       # UI + feature components
│           ├── i18n/             # next-intl configuration
│           └── stores/            # Zustand stores
│
├── packages/
│   └── shared/                  # Shared types & utilities
│
├── .github/workflows/           # GitHub Actions workflows
├── .husky/                      # Git hooks
├── package.json                 # Root workspace configuration
├── pnpm-workspace.yaml
└── turbo.json
```

## 🛠️ Development

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- PostgreSQL database (local, Docker, or Neon)

### Installation

```bash
pnpm install
```

### Environment Variables

Copy the example files and fill in the required values:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

See the `.env.example` files for the complete list of required environment variables, including:

- Database URL
- JWT secrets
- Stripe keys
- M-Pesa sandbox credentials
- SMTP settings
- CORS origins

### Database Setup

Apply migrations:

```bash
pnpm --filter @ecommerce/backend prisma:migrate
```

Generate the Prisma client:

```bash
pnpm --filter @ecommerce/backend prisma:generate
```

Open Prisma Studio (optional):

```bash
pnpm --filter @ecommerce/backend prisma:studio
```

### Start Development Servers

```bash
pnpm dev
```

Services:

- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

## 🧪 Testing

### Unit Tests

Backend:

```bash
pnpm --filter @ecommerce/backend test
```

Frontend:

```bash
pnpm --filter @ecommerce/frontend test
```

### E2E Tests (Playwright)

The E2E tests require the backend and frontend to be running.

```bash
pnpm --filter @ecommerce/frontend test:e2e
```

Interactive UI mode:

```bash
pnpm --filter @ecommerce/frontend test:e2e:ui
```

Headed mode:

```bash
pnpm --filter @ecommerce/frontend test:e2e:headed
```

The E2E suite covers:

- Home page
- Internationalization (English and Swahili)
- Product listing and product details
- Cart functionality
- Authentication flows
- Admin product management

## 🔄 CI/CD

GitHub Actions runs CI on pushes and pull requests targeting the `develop` and `master` branches.

### Lint, Unit Tests, and Build

The CI pipeline:

- Installs dependencies
- Generates the Prisma client
- Runs ESLint
- Type-checks the frontend
- Runs backend unit tests
- Runs frontend unit tests
- Builds the backend
- Builds the frontend

### E2E (Playwright)

The E2E job:

- Starts a PostgreSQL service container
- Applies database migrations
- Seeds the CI admin user
- Builds the backend and frontend
- Starts both applications
- Runs the Playwright test suite in Chromium

Both CI jobs must pass before a pull request can be merged.

## 🚀 Deployment

- **Backend:** Render (Node.js web service)
- **Frontend:** Vercel (Next.js project)
- **Database:** Neon (serverless PostgreSQL)

Deployment is triggered from the `master` branch.

Refer to the `.env.example` files for the environment variables required by each platform.

## 🔧 Code Quality

This project uses Husky, Commitlint, and lint-staged to maintain code quality and enforce consistent commit messages.

### Git Hooks

- **pre-commit** — Runs lint-staged before a commit is created.
- **commit-msg** — Validates commit messages using Commitlint.

### Commit Convention

This project follows Conventional Commits:

```text
feat: add product management
fix: resolve authentication issue
docs: update README
chore: update dependencies
refactor: restructure product service
test: add product service tests
ci: adjust GitHub Actions workflow
```

## 📝 License

Educational project — for learning and portfolio purposes.
