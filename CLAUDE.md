# 众爱联盟公益积分平台 — CLAUDE.md

## Project Overview

A full-stack WeChat Mini Program platform for volunteer management with a "dual-point system" (activity points + donation points). Volunteers earn points through activity participation and donations, then spend them on marketplace posts and rewards redemption.

## Monorepo Structure

```
zhongai/
├── package.json          # pnpm workspace root
├── server/               # Nuxt v4 backend (Nitro + h3)
│   ├── nuxt.config.ts
│   ├── server/
│   │   ├── api/          # Auto-registered API routes (h3 event handlers)
│   │   ├── db/
│   │   │   ├── schema/   # Drizzle ORM PostgreSQL schemas
│   │   │   └── index.ts  # DB connection (pg Pool)
│   │   ├── services/     # Business logic layer
│   │   ├── utils/        # jwt, response, pagination, upload, wechat
│   │   ├── middleware/   # Nitro middleware (auth, admin-auth)
│   │   └── types/        # Shared TypeScript types
│   ├── pages/            # Admin dashboard (Nuxt UI v3)
│   ├── layouts/          # Nuxt layouts (default, admin)
│   ├── composables/      # useAuth, useApi
│   └── components/       # Admin UI components
└── app/                  # Uniapp frontend (wot-starter-v2)
    └── src/
        ├── pages/        # Mini Program pages
        ├── components/   # Reusable UI components
        ├── composables/  # Vue composables (useAuth, useRequest, usePoints)
        ├── services/     # API client modules
        ├── stores/       # Pinia stores (user, points, app)
        ├── utils/        # request, storage, format, validator
        └── types/        # TypeScript type declarations
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend framework | Nuxt v4 (Nitro + h3) |
| Admin UI | Nuxt UI v3 (@nuxt/ui) |
| ORM | Drizzle ORM 0.41+ (PostgreSQL) |
| Auth | JWT (jsonwebtoken, access 7d / refresh 30d) |
| Validation | Zod |
| Frontend | Uniapp + wot-starter-v2 |
| Frontend UI | Wot Design Uni |
| State mgmt | Pinia |
| Package mgr | pnpm (workspaces) |

## Environment Variables

All prefixed `NUXT_`:
- `NUXT_JWT_SECRET` — JWT signing key
- `NUXT_WECHAT_APP_ID` / `NUXT_WECHAT_APP_SECRET` — WeChat Mini Program credentials
- `NUXT_DATABASE_URL` — PostgreSQL connection string
- `NUXT_APP_NAME`, `NUXT_APP_ENV` — app metadata

## API Conventions

### Routing

Files under `server/server/api/` auto-register as routes:
- `auth/login.post.ts` → `POST /api/auth/login`
- `activities/[id].get.ts` → `GET /api/activities/:id`
- `activities/[id]/checkin.post.ts` → `POST /api/activities/:id/checkin`

Use `defineEventHandler` from `h3`.

### Response Format

Every endpoint uses `success(data, message?)` / `error(message, code?)` / `paginated(list, total, page, pageSize)` from `server/server/utils/response.ts`:

```ts
// Success: { code: 0, message: "success", data: { ... } }
// Error:   { code: 4xx/5xx, message: "...", data: null }
// Paginated: { code: 0, message: "success", data: { list, pagination: { total, page, pageSize, totalPages } } }
```

### Service Pattern

API handlers delegate all logic to service functions. Example:

```ts
// API route handler
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { code } = body
  if (!code) return error('缺少微信登录 code', 400)
  const result = await loginWithWechat(code)
  return success(result)
})
```

All business logic lives in `server/server/services/`. The service pattern:
- Services import from `../db` and `../db/schema`
- Use Drizzle ORM for all queries (parameterized, no SQL injection risk)
- Return plain objects (not DB rows directly when appropriate)

### Auth

- JWT access token in `Authorization: Bearer <token>` header
- Token payload structure: `{ id: string, role: string }` (defined in `server/server/types/index.ts`)
- Admin middleware at `server/middleware/admin-auth.ts` checks role

## Database Conventions

### Schema Structure

Each schema file in `server/server/db/schema/` defines:
1. Drizzle table definition (camelCase columns)
2. Drizzle relations for foreign keys
3. Exported through `schema/index.ts`

```ts
// Example: server/server/db/schema/users.ts
export const users = pgTable('users', { ... })
export const usersRelations = relations(users, ...)
```

### Key Design Decisions

- **Dual-point system**: Separate `activity_points` and `donation_points` columns in `point_accounts`, with typed `point_type` column in `point_transactions`
- **UUID primary keys** everywhere, generated with `defaultRandom()`
- **TIMESTAMPTZ** with `defaultNow()` for audit columns (createdAt, updatedAt)
- **JSONB** for image arrays (`evidence_images`, `images`)
- **Point operations MUST use DB transactions** — see `points.service.ts`

## Coding Patterns

### Code Style
- TypeScript with strict mode
- No comments unless non-obvious (WHAT in code, WHY in CL, comments in PR)
- Chinese log messages displayed to users; use `error()` messages for user-facing errors
- Use `camelCase` in TypeScript, `snake_case` in database columns

### Nuxt v4 Specific
- Uses `compatibilityVersion: 4` and `future.compatibilityVersion: 4`
- Nuxt UI v3 (note: not v4 as stated in design doc — `@nuxt/ui@^3.0.0`)
- Server route auto-registration via h3
- `runtimeConfig` for env vars (server-side keys not exposed to client)

### Frontend Conventions
- Pinia stores with Setup Store syntax (composition API style)
- `services/` directory mirrors `server/server/api/` structure
- Request wrapper at `utils/request.ts` auto-attaches JWT token

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start Nuxt dev server |
| `pnpm dev:app` | Start Uniapp H5 dev |
| `pnpm dev:app:mp` | Start WeChat Mini Program dev |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:push` | Push schema to DB (dev) |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm build` | Build server for production |

## Project Architecture Notes

1. **Dual-point system**: Activity points (from checkins) and donation points (from donations) are tracked separately in both balance and transactions. They have different earning rules and spending scenarios.

2. **Checkin flow**: Volunteer registers → GPS/qrcode checkin → leader verifies → points granted (transactional)

3. **Point spending**: Marketplace posts and mall orders deduct points atomically (balance check + deduction + record creation in a single DB transaction)

4. **Roles**: `volunteer` (default), `leader` (can create activities, verify checkins), `admin` (full backend access)

5. **The design doc** at `众爱联盟_详细设计文档.md` is the authoritative reference for planned features. The current codebase implements all schema definitions and API endpoints described there.
