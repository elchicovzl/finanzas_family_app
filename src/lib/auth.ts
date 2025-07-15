import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { createWelcomeEmailJob } from './email-jobs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Allow account linking with same email
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)

        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Check if this is a new Google user by looking for existing accounts
      if (account?.provider === 'google' && user.email && user.name) {
        const existingAccounts = await prisma.account.findMany({
          where: { userId: user.id }
        })
        
        const isNewUser = existingAccounts.length === 1 // Only the Google account just created
        
        if (isNewUser) {
          const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
          
          // Create welcome email job asynchronously
          createWelcomeEmailJob({
            to: user.email,
            userName: user.name,
            isGoogleSignup: true,
            loginUrl
          }).catch(error => {
            console.error('Failed to create welcome email job for Google signup:', error)
            // Don't fail the signin if job creation fails
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
      }
      return session
    }
  }
}