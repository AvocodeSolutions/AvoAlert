# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AvoAlert is a crypto trading signal platform built as a Turborepo monorepo. The backend is currently implemented as a **modular monolith** with Clean Architecture principles, despite the README describing a target microservice architecture. The frontend is a Next.js 15 application with admin tools for testing and monitoring.

## Common Development Commands

### Backend Development (apps/backend/api)
```bash
npm run dev         # Start Express API server with hot reload (tsx)
npm run worker      # Start signal processing worker (separate process)
npm run simulate    # Send test signals to webhook endpoint
npm run build       # Compile TypeScript to dist/
npm run type-check  # Run TypeScript compiler checks
npm run lint        # Run ESLint
```

### Frontend Development (apps/frontend/web-client)
```bash
npm run dev         # Start Next.js with Turbopack
npm run build       # Production build with static generation
```

### Monorepo Level
```bash
npm run dev         # Start all services via Turbo
npm run dev:api     # Start only backend API
npm run build       # Build all packages
```

## Architecture Overview

### Backend: Modular Monolith with Clean Architecture

The backend follows Clean Architecture with modules organized as:

```
src/modules/{module}/
├── domain/entities.ts         # Core business entities
├── application/
│   ├── ports.ts              # Interface definitions  
│   └── usecases/             # Business logic use cases
├── infrastructure/           # External integrations
└── interface/http/           # REST API endpoints
```

**Active Modules:**
- **Signal**: Handles TradingView webhooks with validation, normalization, and queue processing
- **Admin**: Testing utilities and user management for demo purposes
- **Notification**: Skeleton module for multi-channel delivery (planned)
- **Billing**: Skeleton module for Stripe integration (planned)

### Key Technologies

**Backend Stack:**
- Express.js + TypeScript 5.0
- Zod for schema validation
- Upstash Redis for queuing
- Supabase (PostgreSQL) for data storage
- tsx for development hot reloading

**Frontend Stack:**
- Next.js 15 with App Router
- Shadcn/ui + Radix UI components
- Tailwind CSS 4
- Turkish language support in admin interface

### Signal Processing Workflow

1. **Webhook Ingestion**: `/signals/tradingview` endpoint validates TradingView payloads
2. **Validation**: Required `TRADINGVIEW_WEBHOOK_SECRET` and Zod schema validation
3. **Normalization**: Converts symbols (BINANCE:BTCUSDT → BTCUSDT)
4. **Idempotency**: Redis-based deduplication using `symbol:timeframe:timestamp:action` key
5. **Queue Processing**: Redis RPUSH to `q:signal` queue for async processing
6. **Worker Processing**: Separate worker polls queue and simulates notifications

### Important Data Structures

**TradingSignal Entity** (core domain model):
```typescript
interface TradingSignal {
  symbol: string
  timeframe: string
  action: 'buy' | 'sell'
  price: number        // Required for queue processing
  timestamp: string
}
```

**Queue System**:
- `q:signal`: Main processing queue
- `q:signal:processed`: Last 100 processed signals
- `admin:notifications`: Last 200 notification deliveries
- `idemp:{key}`: Idempotency keys (5-minute TTL)

## Development Workflow

### Testing Signal Processing End-to-End

1. **Start Services**:
   ```bash
   npm run dev:api  # Terminal 1
   npm run worker   # Terminal 2 (in apps/backend/api)
   ```

2. **Test via Simulation Tool**:
   ```bash
   cd apps/backend/api
   npm run simulate -- --symbol BTCUSDT --action buy --price 50000
   ```

3. **Test via Admin Panel**:
   - Start frontend: `npm run dev` (from web-client)
   - Visit `http://localhost:3000/admin/test-panel`
   - Use "Seed Users" and "Simulate Signal" features

### Frontend Admin Tools

The admin panel (`/admin/test-panel`) provides:
- **User Management**: Seed/clear demo users in Supabase Auth
- **Signal Simulation**: Test signal processing without TradingView
- **Real-time Monitoring**: View processed signals and notification deliveries
- **Queue Statistics**: Monitor processing queue status

### Environment Setup

Required environment variables:
- `TRADINGVIEW_WEBHOOK_SECRET`: For webhook authentication
- `UPSTASH_REDIS_URL`: Redis connection string
- `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Database access

The system uses custom environment loading with `.env.local` priority in `src/shared/load-env.ts`.

## Architecture Notes

### Current State vs. Planned Architecture

The codebase is in transition:
- **Current**: Modular monolith with Clean Architecture
- **Planned**: Microservices architecture (per README)
- **Missing**: Shared packages (`shared-types`, `database`, etc.)

### Worker System Design

The signal worker (`src/workers/signal-consumer.ts`) is designed as a separate process that:
- Polls the Redis queue every 500ms
- Processes signals asynchronously from the HTTP API
- Maintains delivery simulation for demo users with @demo.local emails
- Stores processing results for admin monitoring

### Type Safety Approach

- All modules use strict TypeScript with proper domain entity typing
- Zod schemas provide runtime validation at API boundaries
- Use cases are strongly typed with clear input/output interfaces
- The `price` field was recently added to `TradingSignal` to match queue payload requirements

## Code Style

- ESLint configurations exist for both backend (`apps/backend/api/.eslintrc.js`) and frontend
- TypeScript strict mode enabled
- Clean Architecture boundaries respected (domain → application → infrastructure)
- Turkish language used in admin interface for user-facing text