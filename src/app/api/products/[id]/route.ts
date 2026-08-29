export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const tenantId = await requireTenant()
  const body = await req.json()
  const exists = await prisma.product.findFirst({ where: { id: params.id, tenantId } })
  if (!exists) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 })
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: body.name ?? exists.name,
      description: body.description ?? exists.description,
      category: body.category ?? exists.category,
      price: body.price ?? exists.price,
      stock: body.stock ?? exists.stock,
      isActive: body.isActive ?? exists.isActive,
    },
  })
  return NextResponse.json(product)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const tenantId = await requireTenant()
  const exists = await prisma.product.findFirst({ where: { id: params.id, tenantId } })
  if (!exists) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 })
  await prisma.product.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
