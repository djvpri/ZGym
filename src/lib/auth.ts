import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
            isActive: true,
          },
          include: { tenant: true },
        })

        if (!user) return null
        if (!user.isActive) return null
        // Superadmin bypass: no tenantId needed
        if (user.role !== 'superadmin' && (!user.tenant || !user.tenant.isActive)) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      // Fetch role + tenant info from DB
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { tenant: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          if (dbUser.tenant) {
            token.tenantId = dbUser.tenantId
            token.tenantName = dbUser.tenant.name
            token.tenantSlug = dbUser.tenant.slug
            token.tenantPlan = dbUser.tenant.plan
            token.tenantMaxMembers = dbUser.tenant.maxMembers
            token.tenantMaxInstructors = dbUser.tenant.maxInstructors
            token.tenantMaxClasses = dbUser.tenant.maxClasses
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        if (token.tenantId) {
          session.user.tenantId = token.tenantId as string
          session.user.tenantName = token.tenantName as string
          session.user.tenantSlug = token.tenantSlug as string
          session.user.tenantPlan = token.tenantPlan as string
          session.user.tenantMaxMembers = token.tenantMaxMembers as number
          session.user.tenantMaxInstructors = token.tenantMaxInstructors as number
          session.user.tenantMaxClasses = token.tenantMaxClasses as number
        }
      }
      return session
    },
  },
})
