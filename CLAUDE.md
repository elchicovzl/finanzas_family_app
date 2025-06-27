# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database Operations
npm run db:generate     # Generate Prisma client (run after schema changes)
npm run db:push         # Push schema to database (development)
npm run db:migrate      # Create and run migrations (production)
npm run db:seed         # Seed database with default categories
npm run db:studio       # Open Prisma Studio for database inspection
```

## Architecture Overview

### Core Application Structure
This is a full-stack Next.js 14 personal finance application with the following key architectural patterns:

- **App Router**: Uses Next.js 14 app directory structure with grouped routes
- **Database-First Design**: Prisma ORM with PostgreSQL, schema defines data relationships
- **Dual Transaction Sources**: Supports both automatic bank imports (via Belvo) and manual cash transactions
- **Component-Based UI**: shadcn/ui components with Tailwind CSS and Radix UI primitives

### Authentication Architecture
- **NextAuth.js**: Configured with dual provider support (Google OAuth + credentials)
- **Session Management**: JWT strategy with Prisma adapter for user persistence
- **Route Protection**: Auth pages in `(auth)` group, protected pages in `(dashboard)` group
- **User Context**: Session provides user ID for all database operations

### Data Layer Architecture

#### Transaction Management
The application handles two distinct transaction types with different data flows:

**Automatic Transactions (Belvo Integration)**:
- Flow: Belvo API → `/api/belvo/link` → Database with `source: 'BELVO'`
- Linked to specific `BankAccount` via `accountId`
- Include Belvo-specific fields (`belvoTransactionId`, `belvoLinkId`)

**Manual Transactions (Cash/Manual Entry)**:
- Flow: Frontend form → `/api/transactions/manual` → Database with `source: 'MANUAL'`
- No `accountId` (represents cash transactions)
- Direct `userId` relationship for orphaned transactions

#### Key Database Relationships
```
User (1) → (n) BankAccount → (n) Transaction [automatic]
User (1) → (n) Transaction [manual, accountId: null]
User (1) → (n) Budget → (1) Category
Transaction (n) → (1) Category [optional]
```

### API Architecture

#### Authentication Endpoints
- `/api/auth/[...nextauth]`: NextAuth.js handler (Google + credentials)
- `/api/auth/register`: User registration with bcrypt password hashing

#### Financial Data Endpoints
- `/api/accounts`: Bank account CRUD operations
- `/api/transactions`: Combined view of both manual and automatic transactions
- `/api/transactions/manual`: Dedicated endpoint for manual transaction creation
- `/api/budget`: Budget management with category relationships
- `/api/categories`: Expense/income categories (hierarchical support)
- `/api/analytics/overview`: Financial dashboard data aggregation

#### Belvo Integration Endpoints
- `/api/belvo/connect`: Initiate bank connection flow
- `/api/belvo/link`: Create bank link and import transactions
- `/api/belvo/callback`: Handle Belvo webhook responses

### UI/UX Architecture

#### Route Grouping
- `(auth)`: Unauthenticated pages (signin, signup)
- `(dashboard)`: Protected application pages with shared layout

#### Component Organization
- `components/ui/`: shadcn/ui primitive components
- `components/layout/`: Application-specific layout components
- Page components handle their own state and API calls

#### State Management Pattern
- Local state with React hooks for component-specific data
- Server state via direct API calls (no global state library)
- Form handling with controlled components and validation

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Belvo Integration
BELVO_SECRET_ID="..."
BELVO_SECRET_PASSWORD="..."
BELVO_ENVIRONMENT="sandbox"
BELVO_WEBHOOK_URL="..."
```

## Database Schema Key Points

### Transaction Source Differentiation
The `TransactionSource` enum distinguishes between:
- `BELVO`: Automatically imported from bank
- `MANUAL`: User-entered cash transactions
- `CSV_IMPORT`: Future bulk import feature
- `PLAID`: Future alternative bank integration

### Flexible Category System
- Pre-defined categories with icons and colors
- Custom categories via `customCategory` field on transactions
- Hierarchical category support (parent/child relationships)

### Budget Tracking
- Category-based budget limits
- Automatic calculation of spent amounts
- Alert thresholds for budget warnings

## Key Development Patterns

### Error Handling
- Toast notifications using Sonner for user feedback
- Proper HTTP status codes in API responses
- TypeScript for compile-time error prevention

### Data Validation
- Zod schemas for API request validation
- Prisma type safety for database operations
- Form validation in frontend components

### Security Considerations
- All database queries filtered by authenticated user ID
- No direct foreign key exposure in API responses
- Encrypted credential storage via NextAuth.js