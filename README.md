# AvoAlert - Real-time Crypto Signal Platform

A comprehensive crypto trading signal platform that delivers UT Bot indicator-based signals via email, SMS, and web push notifications.

## Architecture

This is a monorepo containing 6 microservices:

### Backend Services (Express.js)
Located in `apps/backend/`:
- **signal-engine**: TradingView webhook processor
- **alarm-dispatcher**: Signal processing and notification delivery
- **api-gateway**: REST API and authentication
- **subscription-service**: Stripe webhooks and credit management

### Frontend Application (Next.js)
Located in `apps/frontend/`:
- **web-client**: User portal with integrated admin panel for UT Bot configuration and monitoring

### Shared Packages
- **shared-types**: Common TypeScript interfaces
- **shared-config**: ESLint, TypeScript configurations
- **database**: Prisma schema and migrations
- **auth**: Authentication utilities

## Tech Stack

- **Backend**: Express.js, BullMQ, Prisma
- **Frontend**: Next.js, Tailwind CSS, Shadcn/ui
- **Database**: PostgreSQL (Supabase)
- **Queue**: Redis (Upstash)
- **Auth**: Supabase JWT
- **Payments**: Stripe
- **Notifications**: Resend, Netgsm, OneSignal

## Development

```bash
# Install dependencies
npm install

# Start all services in development
npm run dev

# Build all services
npm run build

# Run tests
npm run test

# Lint all code
npm run lint
```

## Deployment

- **Frontend Apps**: Vercel
- **Backend Services**: Render
- **Database**: Supabase
- **Queue**: Upstash Redis

## Project Structure

```
├── apps/
│   ├── backend/               # Backend services (Express.js)
│   │   ├── signal-engine/     # TradingView webhook processor
│   │   ├── alarm-dispatcher/  # Notification delivery service
│   │   ├── api-gateway/       # REST API gateway
│   │   └── subscription-service/ # Billing and subscriptions
│   └── frontend/              # Frontend application (Next.js)
│       └── web-client/        # User portal with integrated admin panel
├── packages/
│   ├── shared-types/          # Common TypeScript types
│   ├── shared-config/         # Shared configurations
│   ├── database/              # Prisma schema and client
│   └── auth/                  # Authentication utilities
└── docs/                      # Documentation
```

## License

Private - AvocodeSolutions