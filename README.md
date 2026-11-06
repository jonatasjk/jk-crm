# JK CRM

<p align="center">
  <img src="apps/frontend/public/chief-delivery-officer.png" alt="Chief Delivery Officer" width="160" />
</p>

<p align="center">
  <a href="https://buymeacoffee.com/jonatas" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" />
  </a>
</p>

A modern CRM for managing **Investors** and **Partners**, featuring Kanban pipelines, email dispatch with attachments, email sequences, CSV import, materials management, and a daily send-count dashboard.

## Features

- **Investor & Partner pipelines** — drag-and-drop Kanban boards across 7 and 6 stages respectively
- **Email composition** — rich-text editor, HTML email, material attachments, `{{first_name}}` / `{{last_name}}` / `{{name}}` placeholders
- **Email sequences** — automated drip campaigns with per-step delays; enroll individuals or entire lists
- **Email control** - send up to 100 emails a day (Resend's free-tier limit)
- **Materials library** — upload pitch decks and documents (PDF, Excel, etc.) to local directory; attach to any outbound email
- **CSV import** — client-side header mapping, field preview, bulk upsert with a per-row result report
- **Dashboard** — stat cards for total investors/partners, active counts, and **emails sent today** (live from server, no cap extrapolation)
- **Auth** — JWT-based login, forgot/reset password flow

## Tech Stack

| Concern | Choice |
|---|---|
| Build tool | Vite 8 |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Server state | TanStack Query v5 |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| Drag & Drop | @dnd-kit |
| HTTP | Axios |
| Rich text | Tiptap |
| CSV parsing | PapaParse |
| Global state | Zustand |

## Getting Started

### Prerequisites

- Node.js 20 LTS
- The API running. See [apps/api/README.md](apps/api/README.md)

### Install & run

```bash
cd apps/frontend
npm install
npm run dev
```

The app starts at `http://localhost:5173` by default.

### Environment

Create a `.env` file in `apps/frontend/`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Build for production

```bash
npm run build
```

Output goes to `dist/`. The included `nginx.conf` and `Dockerfile` are ready for containerised deployment.

### Run with Docker

The repo root has a unified `Dockerfile` (frontend + api targets) and a `docker-compose.yml` that runs the frontend, the API, and MongoDB together.

1. Copy `.env.example` to `.env` at the repo root and fill in the values (`JWT_SECRET`, `SEED_ADMIN_PASSWORD`, Resend keys, etc.).
2. From the repo root:

   ```bash
   docker compose up --build
   ```

3. Services:
   - Frontend → `http://localhost:8080`
   - API → proxied by the frontend container at `/api/v1`, internal port `3001`
   - MongoDB → `localhost:27017`, data persisted in the `mongo-data` volume

To build/run a single image directly instead of compose:

```bash
docker build --target frontend -t jk-crm-frontend .
docker build --target api      -t jk-crm-api .
```

## Project Structure

```
apps/
  frontend/     # This app (React + Vite)
    src/
      api/          # Axios API clients (auth, investors, partners, email, sequences, materials)
      components/   # Feature components (email, investors, partners, materials, sequences, shared UI)
      pages/        # Route-level page components
      store/        # Zustand stores (auth)
      types/        # TypeScript models and enums
      utils/        # Shared helpers
  api/          # Backend API — see apps/api/README.md
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript type-checking without emitting files |

## License

MIT — see [LICENSE](apps/frontend/LICENSE).