import { auth } from './auth'

export async function getTenantId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.tenantId || null
}

export async function requireTenant(): Promise<string> {
  const tenantId = await getTenantId()
  if (!tenantId) throw new Error('Unauthorized: no tenant')
  return tenantId
}
