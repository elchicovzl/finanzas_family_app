# Finanzas App - Personal Finance Manager

A comprehensive personal finance web application that integrates with Colombian banks through Belvo API to provide automated transaction tracking, budget management, and financial analytics.

## 🚀 Features

### Core Functionality
- **🏦 Bank Integration**: Connect securely with Bancolombia and other Colombian banks via Belvo API
- **📊 Dashboard**: Real-time financial overview with balance, income, and expense tracking
- **💳 Transaction Management**: Automatic transaction import with categorization and search
- **📈 Analytics & Reporting**: Interactive charts showing spending patterns and trends
- **🎯 Budget Management**: Set spending limits by category with alerts and tracking
- **🔒 Security**: Bank-level security with encrypted data storage

### Technical Features
- **⚡ Modern Stack**: Next.js 14, TypeScript, Tailwind CSS, Prisma ORM
- **🎨 UI Components**: shadcn/ui for consistent, accessible design
- **🔐 Authentication**: NextAuth.js with secure session management
- **📱 Responsive Design**: Mobile-first design with dark/light mode support
- **🔄 Real-time Sync**: Webhook-based transaction synchronization

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS 4
- **UI Library**: shadcn/ui components, Lucide React icons
- **Backend**: Next.js API Routes, NextAuth.js for authentication
- **Database**: PostgreSQL with Prisma ORM
- **External API**: Belvo API for bank integration
- **Charts**: Recharts for data visualization
- **Deployment**: Vercel-ready configuration

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js 18+ installed
- PostgreSQL database
- Belvo API credentials (for bank integration)

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

# Belvo API
BELVO_SECRET_ID="your-belvo-secret-id"
BELVO_SECRET_PASSWORD="your-belvo-secret-password"
BELVO_ENVIRONMENT="sandbox"
BELVO_WEBHOOK_URL="http://localhost:3000/api/belvo/webhook"
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
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Layout components
│   │   └── providers/         # Context providers
│   └── lib/                   # Utility functions
│       ├── auth.ts            # NextAuth configuration
│       ├── belvo.ts           # Belvo API integration
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
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Bank Integration
- `POST /api/belvo/connect` - Connect bank account
- `POST /api/belvo/webhook` - Belvo webhook handler

### Data Management
- `GET /api/accounts` - Fetch user bank accounts
- `GET/POST /api/transactions` - Transaction CRUD operations
- `GET/POST /api/budget` - Budget management
- `GET /api/categories` - Expense categories
- `GET /api/analytics/overview` - Financial analytics

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
- **BankAccount**: Connected bank accounts with Belvo integration
- **Transaction**: Financial transactions with categorization
- **Category**: Expense/income categories with hierarchy
- **Budget**: Spending limits and budget tracking
- **SavingsGoal**: Financial goals and targets

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
- `BELVO_SECRET_ID` - Belvo API credentials
- `BELVO_SECRET_PASSWORD` - Belvo API credentials
- `BELVO_ENVIRONMENT` - Set to "production"

## 🔒 Security Features

- **Authentication**: Secure session management with NextAuth.js
- **Data Encryption**: Sensitive data encrypted at rest
- **API Security**: Rate limiting and input validation
- **Bank Integration**: Read-only access through Belvo's secure API
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

## 🗺️ Roadmap

- [ ] Mobile app development
- [ ] Additional bank integrations
- [ ] Investment tracking
- [ ] Financial goal automation
- [ ] Multi-currency support
- [ ] Family sharing features
- [ ] AI-powered insights
