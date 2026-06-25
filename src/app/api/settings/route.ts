import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const settings = await prisma.setting.findMany()
  const obj: Record<string, string> = {}
  settings.forEach((s) => { obj[s.key] = s.value })
  return NextResponse.json(obj)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  for (const [key, value] of Object.entries(body)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    })
  }
  return NextResponse.json({ success: true })
}
