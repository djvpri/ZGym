export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'
import { kasirModulGuard } from '@/lib/kasirPerm'


export async function GET() {
  const tenantId = await requireTenant()
  const g = await kasirModulGuard(tenantId, 'products'); if (g) return g
  const products = await prisma.product.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const tenantId = await requireTenant()
  const g = await kasirModulGuard(tenantId, 'products'); if (g) return g
  const body = await req.json()
  const product = await prisma.product.create({
    data: {
      tenantId,
      name: body.name,
      description: body.description || null,
      category: body.category || null,
      price: body.price,
      stock: body.stock || 0,
    },
  })
  return NextResponse.json(product, { status: 201 })
}

