# GymCentre - Project Context

## Overview
GymCentre is a gym membership management application built with Next.js 16 App Router and Supabase as the database backend.

## Tech Stack
- **Framework**: Next.js 16.1.1 (App Router, Turbopack)
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL)
- **Supabase Client**: `@supabase/ssr` (NOT `@supabase/supabase-js`)
- **Styling**: Tailwind CSS 4
- **Auth**: Custom mock auth provider (not Supabase Auth)

## Project Location
```
/Users/niraj/GymCentre/gym-centre/
```

## Database Schema

### plans
| Column | Type | Notes |
|--------|------|-------|
| id | int8 | Primary key |
| name | text | "Monthly", "Quarterly", "Yearly" |
| duration_days | int8 | NOT duration_months |
| price | int8 | In rupees |
| is_active | bool | NOT features array |
| created_at | timestamptz | |

### members
| Column | Type | Notes |
|--------|------|-------|
| id | int8 | Primary key |
| name | text | |
| email | text | |
| phone | text | |
| plan_id | int8 | FK to plans.id |
| plan | text | Legacy field (may be NULL) |
| start_date | date | NOT join_date |
| expiry_date | date | NOT membership_expiry_date |
| photo_url | text | Nullable |
| created_at | timestamptz | |

### payments
| Column | Type | Notes |
|--------|------|-------|
| id | int8 | Primary key |
| member_id | int8 | FK to members.id |
| amount | int8 | |
| payment_date | text | Stored as text YYYY-MM-DD |
| mode | text | NOT payment_method |
| created_at | timestamptz | |

## Key Architecture Decisions

### Supabase Client Setup
Uses `@supabase/ssr` with separate client/server files:

```
lib/supabase/
├── client.ts   # For 'use client' components
└── server.ts   # For server actions (async, uses cookies)
```

**Client usage** (in 'use client' pages):
```typescript
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

**Server usage** (in server actions):
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient() // Note: async!
```

### Data Fetching Pattern
Client components fetch data directly from Supabase (no API routes needed):
```typescript
const { data, error } = await supabase
  .from('members')
  .select('*, plans(*)')
```

### Server Actions
Located in `app/actions/`:
- `members.ts` - CRUD for members
- `plans.ts` - CRUD for plans
- `payments.ts` - CRUD for payments
- `stats.ts` - Dashboard statistics

## File Structure

```
gym-centre/
├── app/
│   ├── actions/           # Server actions
│   ├── api/test-connection/route.ts
│   ├── dashboard/page.tsx
│   ├── login/page.tsx
│   ├── me/page.tsx        # Member portal
│   ├── members/           # Member CRUD pages
│   └── plans/             # Plan CRUD pages
├── components/auth/       # AuthGuard, MemberGuard
├── contexts/AuthContext.tsx
├── lib/
│   ├── supabase/client.ts & server.ts
│   ├── auth/              # Mock auth provider
│   └── types/             # TypeScript interfaces
└── supabase/migrations/   # SQL migration scripts
```

## Data Transformations
Frontend uses **camelCase**, Supabase uses **snake_case**:
```typescript
planId: data.plan_id,
planName: (data.plans as any)?.name || 'Unknown',
membershipExpiryDate: new Date(data.expiry_date),
```

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Fixed Issues
1. ✅ Mock data layer removed (was `mock-firestore.ts`)
2. ✅ App Router handler error fixed (removed `export const dynamic` from client components)
3. ✅ Supabase client migrated to `@supabase/ssr`
4. ✅ Server actions created for CRUD operations

## Testing
```
GET /api/test-connection
```
Returns test results for all Supabase tables.

## Commands
```bash
cd gym-centre && npm run dev  # http://localhost:3000
```
