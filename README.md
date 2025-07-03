# Finanzas App - Personal Finance Manager

A comprehensive family finance web application that integrates with Colombian banks through Belvo API to provide automated transaction tracking, budget management, family financial coordination, and detailed analytics.

## 🚀 Features

### Core Functionality
- **🏦 Bank Integration**: Connect securely with Bancolombia and other Colombian banks via Belvo API
- **👨‍👩‍👧‍👦 Family Management**: Multi-user families with role-based access control (Admin/Member/Viewer)
- **📧 Email Invitations**: Secure invitation system with complete user onboarding flow
- **📊 Dashboard**: Real-time financial overview with balance, income, and expense tracking
- **💳 Transaction Management**: Automatic and manual transaction tracking with categorization
- **📈 Analytics & Reporting**: Interactive charts showing spending patterns and trends
- **🎯 Budget Management**: Recurring budget templates with automatic generation and alerts
- **🔄 Family Context**: Switch between multiple families with isolated financial data
- **🔒 Security**: Bank-level security with encrypted data storage

### Technical Features
- **⚡ Modern Stack**: Next.js 14, TypeScript, Tailwind CSS, Prisma ORM
- **🎨 UI Components**: shadcn/ui for consistent, accessible design
- **🔐 Authentication**: NextAuth.js with Google OAuth and credentials support
- **📧 Email System**: SMTP integration with professional HTML templates
- **📱 Responsive Design**: Mobile-first design with comprehensive component library
- **🔄 Real-time Sync**: Webhook-based transaction synchronization
- **🌐 Multi-family Support**: Context switching with isolated data per family

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS 4
- **UI Library**: shadcn/ui components, Lucide React icons
- **Backend**: Next.js API Routes, NextAuth.js for authentication
- **Database**: PostgreSQL with Prisma ORM
- **External API**: Belvo API for bank integration
- **Email**: Nodemailer with SMTP support (Mailtrap for development)
- **Charts**: Recharts for data visualization
- **Deployment**: Vercel-ready configuration with cron jobs

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js 18+ installed
- PostgreSQL database
- Belvo API credentials (for bank integration)
- SMTP server credentials (Mailtrap recommended for development)
- Google OAuth credentials (optional)

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd finanzas_app
npm install
```

### 2. Environment Setup

Copy the environment file and configure your variables:

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/finanzas_app"

# NextAuth.js
NEXTAUTH_SECRET="your-secure-random-string"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Belvo API
BELVO_SECRET_ID="your-belvo-secret-id"
BELVO_SECRET_PASSWORD="your-belvo-secret-password"
BELVO_ENVIRONMENT="sandbox"
BELVO_WEBHOOK_URL="http://localhost:3000/api/belvo/webhook"

# Email Configuration (Mailtrap)
EMAIL_SERVER_HOST="smtp.mailtrap.io"
EMAIL_SERVER_PORT="2525"
EMAIL_SERVER_USER="your-mailtrap-user"
EMAIL_SERVER_PASSWORD="your-mailtrap-password"
EMAIL_FROM="noreply@finanzasapp.com"

# Cron Jobs Security
CRON_SECRET="your-secure-cron-secret"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed default categories
npm run db:seed

# Optional: Open Prisma Studio
npm run db:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
finanzas_app/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (auth)/            # Authentication pages (signin, signup, invite)
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Layout components (MainNav, UserNav)
│   │   ├── providers/         # Context providers
│   │   ├── FamilyMemberList.tsx    # Family member management
│   │   ├── FamilySelector.tsx      # Family context switching
│   │   └── AddTransactionModal.tsx # Transaction creation
│   ├── contexts/              # React Context providers
│   │   └── FamilyContext.tsx  # Family state management
│   └── lib/                   # Utility functions
│       ├── auth.ts            # NextAuth configuration
│       ├── belvo.ts           # Belvo API integration
│       ├── email.ts           # Email sending utilities
│       ├── family-context.ts  # Family context helpers
│       ├── db.ts              # Prisma client
│       └── utils.ts           # Helper functions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
└── public/                    # Static assets
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints (Google OAuth + credentials)

### Family Management
- `GET/POST /api/families` - Family CRUD operations
- `POST /api/families/[familyId]/invite` - Send family invitations via email
- `GET/POST /api/families/[familyId]/members` - Family member management
- `PATCH/DELETE /api/families/[familyId]/members/[memberId]` - Member role updates
- `GET /api/families/invitations/[token]` - Retrieve invitation details
- `POST /api/families/invitations/accept` - Accept family invitation
- `POST /api/migration/family-setup` - Migrate existing users to family system

### Bank Integration
- `POST /api/belvo/connect` - Connect bank account
- `POST /api/belvo/link` - Create bank link and import transactions
- `POST /api/belvo/callback` - Handle Belvo webhook responses
- `POST /api/belvo/webhook` - Belvo webhook handler

### Data Management
- `GET /api/accounts` - Fetch user bank accounts
- `GET/POST /api/transactions` - Combined view of manual and automatic transactions
- `POST /api/transactions/manual` - Create manual cash transactions
- `GET/POST /api/budget` - Budget management with real-time calculations
- `GET/POST /api/budget/templates` - Budget template CRUD for recurring budgets
- `POST /api/budget/generate` - Generate budget from template
- `POST /api/budget/generate-all` - Bulk generation of missing budgets
- `GET /api/budget/missing` - Auto-detection of missing budgets
- `GET /api/categories` - Expense/income categories
- `GET /api/analytics/overview` - Financial analytics and dashboard data

### Automation
- `POST /api/cron/generate-monthly-budgets` - Automatic monthly budget generation

## 🏦 Belvo Integration

This app uses [Belvo](https://belvo.com/) for secure bank connectivity:

1. **Account Connection**: Users connect their bank accounts through Belvo's secure flow
2. **Transaction Sync**: Automatic import of transaction data
3. **Real-time Updates**: Webhook notifications for new transactions
4. **Security**: Read-only access with bank-level encryption

### Supported Banks
- Bancolombia
- Other Colombian banks supported by Belvo

## 📊 Database Schema

### Core Models
- **User**: User account and authentication data
- **Family**: Family groups with shared financial data
- **FamilyMember**: User membership in families with role-based access
- **FamilyInvitation**: Email invitation system with secure tokens
- **BankAccount**: Connected bank accounts with Belvo integration
- **Transaction**: Financial transactions with categorization (manual + automatic)
- **Category**: Expense/income categories with hierarchy
- **Budget**: Spending limits and budget tracking with real-time calculations
- **BudgetTemplate**: Reusable budget configurations for recurring budgets

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:migrate      # Create and run migrations
npm run db:seed         # Seed database with default data
npm run db:studio       # Open Prisma Studio
```

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secure random string for NextAuth
- `NEXTAUTH_URL` - Your production URL
- `GOOGLE_CLIENT_ID` - Google OAuth credentials (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth credentials (optional)
- `BELVO_SECRET_ID` - Belvo API credentials
- `BELVO_SECRET_PASSWORD` - Belvo API credentials
- `BELVO_ENVIRONMENT` - Set to "production"
- `EMAIL_SERVER_HOST` - SMTP server host
- `EMAIL_SERVER_PORT` - SMTP server port
- `EMAIL_SERVER_USER` - SMTP username
- `EMAIL_SERVER_PASSWORD` - SMTP password
- `EMAIL_FROM` - From email address
- `CRON_SECRET` - Secure token for cron job authentication

## 🔒 Security Features

- **Authentication**: Multi-provider authentication with NextAuth.js (Google OAuth + credentials)
- **Family Access Control**: Role-based permissions (Admin/Member/Viewer)
- **Invitation Security**: Crypto-secure tokens with 7-day expiration
- **Data Encryption**: Sensitive data encrypted at rest
- **API Security**: Rate limiting, input validation, and user-scoped queries
- **Bank Integration**: Read-only access through Belvo's secure API
- **Email Security**: SMTP authentication and secure token delivery
- **HTTPS**: SSL/TLS encryption for all communications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you need help or have questions:

1. Check the documentation above
2. Review the code comments and types
3. Open an issue on GitHub
4. Contact the development team

## 🎯 Current Features Status

### ✅ Completed Features
- **Family Management**: Multi-user families with role-based access control
- **Email Invitations**: Complete invitation flow with user onboarding
- **Budget System**: Recurring budget templates with automatic generation
- **Transaction Tracking**: Manual cash transactions + automatic bank imports
- **Real-time Analytics**: Interactive dashboard with financial insights
- **Bank Integration**: Secure Belvo integration for Colombian banks
- **Responsive Design**: Mobile-first UI with comprehensive component library

### 🚧 In Development
- Enhanced family financial reporting
- Advanced budget analytics and forecasting
- Improved mobile experience

### 🗺️ Roadmap
- [ ] Mobile app development
- [ ] Additional bank integrations (Plaid, CSV imports)
- [ ] Investment tracking and portfolio management
- [ ] Financial goal automation and recommendations
- [ ] Multi-currency support
- [ ] Advanced family financial planning tools
- [ ] AI-powered spending insights and predictions
- [ ] Expense receipt scanning and categorization
