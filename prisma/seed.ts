import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = [
    { name: 'Food & Dining', color: '#EF4444', icon: '🍽️' },
    { name: 'Transportation', color: '#3B82F6', icon: '🚗' },
    { name: 'Entertainment', color: '#8B5CF6', icon: '🎬' },
    { name: 'Utilities', color: '#F59E0B', icon: '⚡' },
    { name: 'Shopping', color: '#EC4899', icon: '🛍️' },
    { name: 'Healthcare', color: '#10B981', icon: '🏥' },
    { name: 'Education', color: '#6366F1', icon: '📚' },
    { name: 'Travel', color: '#14B8A6', icon: '✈️' },
    { name: 'Groceries', color: '#84CC16', icon: '🛒' },
    { name: 'Subscriptions', color: '#F97316', icon: '📱' },
    { name: 'Rent/Mortgage', color: '#64748B', icon: '🏠' },
    { name: 'Insurance', color: '#0EA5E9', icon: '🛡️' },
    { name: 'Savings', color: '#22C55E', icon: '💰' },
    { name: 'Investment', color: '#A855F7', icon: '📈' },
    { name: 'Salary', color: '#059669', icon: '💼' },
    { name: 'Freelance', color: '#0D9488', icon: '💻' },
    { name: 'Other Income', color: '#16A34A', icon: '💵' },
    { name: 'Other Expense', color: '#DC2626', icon: '💸' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  console.log('Categories seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })