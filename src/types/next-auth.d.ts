import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      role: string
      id: string
      tenantId?: string
      tenantName?: string
      tenantSlug?: string
      tenantPlan?: string
      tenantPlanExpires?: string | null
      tenantMaxMembers?: number
      tenantMaxInstructors?: number
      tenantMaxClasses?: number
      joinToken?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    id?: string
    tenantId?: string
    tenantName?: string
    tenantSlug?: string
    tenantPlan?: string
    tenantPlanExpires?: string | null
    tenantMaxMembers?: number
    tenantMaxInstructors?: number
    tenantMaxClasses?: number
    joinToken?: string
  }
}
