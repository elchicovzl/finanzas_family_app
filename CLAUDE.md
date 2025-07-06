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
User (1) → (n) BudgetTemplate → (1) Category
User (1) → (n) Family [as admin/member/viewer]
Family (1) → (n) FamilyMember → (1) User
Family (1) → (n) FamilyInvitation [pending invitations]
BudgetTemplate (1) → (n) Budget [generated budgets]
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
- `/api/budget`: Budget management with category relationships and real-time calculations
- `/api/budget/templates`: Budget template CRUD operations for recurring budgets
- `/api/budget/generate`: Generate individual budget from template
- `/api/budget/generate-all`: Bulk generation of missing budgets
- `/api/budget/missing`: Auto-detection of missing budgets for notifications
- `/api/categories`: Expense/income categories (hierarchical support)
- `/api/analytics/overview`: Financial dashboard data aggregation

#### Belvo Integration Endpoints
- `/api/belvo/connect`: Initiate bank connection flow
- `/api/belvo/link`: Create bank link and import transactions
- `/api/belvo/callback`: Handle Belvo webhook responses

#### Family Management Endpoints
- `/api/families`: Family CRUD operations (create, list, update)
- `/api/families/[familyId]/invite`: Send family invitations via email
- `/api/families/[familyId]/members`: Family member management
- `/api/families/[familyId]/members/[memberId]`: Individual member operations
- `/api/families/invitations/[token]`: Retrieve invitation details by token
- `/api/families/invitations/accept`: Accept family invitation
- `/api/migration/family-setup`: Migrate existing users to family system

#### Automation Endpoints
- `/api/cron/generate-monthly-budgets`: Vercel cron job for automatic budget generation (1st of each month)

### UI/UX Architecture

#### Route Grouping
- `(auth)`: Unauthenticated pages (signin, signup, invite/[token])
- `(dashboard)`: Protected application pages with shared layout

#### Component Organization
- `components/ui/`: shadcn/ui primitive components
- `components/layout/`: Application-specific layout components (MainNav, UserNav)
- `components/`: Feature-specific components (FamilyMemberList, FamilySelector, AddTransactionModal)
- `stores/`: Zustand stores for global state management
- Page components handle their own state and API calls

#### State Management Pattern
- **Zustand**: Primary state management solution for global state
- **Family Store**: Global family state management via `useFamilyStore()` hook
- **Persistence**: Automatic localStorage persistence for selected family using Zustand persist middleware
- Local state with React hooks for component-specific data
- Server state via direct API calls (complementing Zustand for global state)
- Form handling with controlled components and validation
- Session management via NextAuth.js for user authentication

#### Zustand Store Architecture
- **Family Store** (`src/stores/family-store.ts`): Manages family data, current family selection, loading states, and family switching
- **Store Features**: TypeScript support, persistent state, async actions, optimistic updates
- **Usage Pattern**: Import `useFamilyStore` hook directly in components, no Provider wrapper needed
- **State Structure**: `{ families, currentFamily, loading, error, actions }`

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

# Cron Jobs Security
CRON_SECRET="..."

# Email Configuration (Mailtrap)
EMAIL_SERVER_HOST="smtp.mailtrap.io"
EMAIL_SERVER_PORT="2525"
EMAIL_SERVER_USER="..."
EMAIL_SERVER_PASSWORD="..."
EMAIL_FROM="noreply@finanzasapp.com"
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

### Family System
The application implements a comprehensive family financial management system:

#### Family Structure
- **Multi-user families**: One family can have multiple members with different roles
- **Role-based access**: ADMIN (full access), MEMBER (add transactions, view data), VIEWER (read-only)
- **Family context**: All financial data is scoped to the active family
- **Family switching**: Users can belong to multiple families and switch between them

#### Invitation System
- **Email-based invitations**: Invitations sent via SMTP (Mailtrap configuration)
- **Token-based security**: Secure invitation tokens with expiration (7 days)
- **Complete user flow**: Supports both existing users and new user registration
- **Auto-acceptance**: New users automatically join family after registration

### Budget System
The application implements a comprehensive budget management system with recurring capabilities:

#### Budget Templates (BudgetTemplate Model)
- **Purpose**: Reusable configurations for recurring budgets
- **Key Fields**: `autoGenerate` (boolean), `lastGenerated` (timestamp), `period` (enum)
- **Relationships**: One template can generate multiple budgets over time
- **Auto-generation**: Templates marked with `autoGenerate: true` create budgets automatically

#### Budget Management
- **Category-based budget limits**: Each budget is tied to a specific expense category
- **Real-time calculations**: Current spending aggregated from transactions in real-time
- **Alert thresholds**: Configurable percentage warnings (default 80%)
- **Multi-period support**: Weekly, monthly, quarterly, yearly periods
- **Template linkage**: Budgets can reference their originating template via `templateId`

#### Recurring Budget System (Hybrid Approach)
1. **Auto-detection**: System detects missing budgets on page load (`/api/budget/missing`)
2. **Visual notifications**: Orange banner shows missing budgets with direct actions
3. **Manual generation**: "Generate All" button for immediate budget creation
4. **Automatic generation**: Vercel cron job runs monthly (1st at midnight UTC)
5. **Fallback redundancy**: Multiple trigger points ensure budget creation

#### Budget Calculation Logic
- **Current spent**: Sum of all EXPENSE transactions in current period for category
- **Includes both sources**: Manual cash transactions AND bank account transactions
- **Date filtering**: Proper month boundaries (1st to last day of month)
- **Status indicators**: On Track, Near Limit, Over Budget based on percentage used

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
- Cron job authentication via `CRON_SECRET` token verification

## Deployment Configuration

### Vercel Settings
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/generate-monthly-budgets",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

### Required Vercel Environment Variables
- `CRON_SECRET`: Secure token for cron job authentication
- All database and authentication variables from `.env.example`

### Post-Deployment Verification
1. Check Vercel Functions tab for cron job registration
2. Monitor `/api/cron/generate-monthly-budgets` logs for execution
3. Verify budget template auto-generation on 1st of month

## Current Implementation Status

### Completed Features
- ✅ Manual and automatic transaction tracking
- ✅ Real-time budget calculations with visual progress indicators
- ✅ Budget template system for recurring budgets
- ✅ Hybrid auto-generation (manual triggers + automatic cron)
- ✅ Missing budget detection and notifications
- ✅ Bulk budget generation capabilities
- ✅ Currency formatting (Colombian Peso - COP)
- ✅ Input masking for monetary values (thousands separators, no decimals)
- ✅ Family management system with role-based access control
- ✅ Email invitation system with complete user onboarding flow
- ✅ Family context switching and multi-family support
- ✅ Zustand state management for global application state

### Budget Page Features
- **Tabbed interface**: Separate views for Active Budgets and Templates
- **Smart notifications**: Auto-detection of missing budgets with clear actions
- **Template management**: Create, view, and generate budgets from templates
- **Visual indicators**: Progress bars, status badges, and formatted currency display
- **Bulk operations**: Generate all missing budgets with single click

### Family Page Features
- **Family member management**: View all family members with roles and status
- **Invitation system**: Send email invitations with role selection
- **Role management**: Admin users can change member roles and remove members
- **Family context switching**: Users can switch between families they belong to
- **Responsive invitation flow**: Handles both new user registration and existing user login

### Email System Features
- **SMTP Integration**: Configured with Mailtrap for development/testing
- **HTML email templates**: Professional design with responsive layout
- **Invitation emails**: Automatic sending when family invitations are created
- **Expiration handling**: Clear communication of invitation expiry dates
- **Multi-language support**: Email content in Spanish (Colombian localization)