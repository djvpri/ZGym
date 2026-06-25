export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Revenue this month
  const revenueThisMonth = await prisma.payment.aggregate({
    where: { paidAt: { gte: startOfMonth, lte: endOfMonth }, status: 'paid' },
    _sum: { amount: true },
    _count: true,
  })

  // Revenue last month
  const revenueLastMonth = await prisma.payment.aggregate({
    where: { paidAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: 'paid' },
    _sum: { amount: true },
  })

  // Total members
  const totalMembers = await prisma.member.count()
  const activeMembers = await prisma.member.count({ where: { status: 'active' } })

  // Attendance this month
  const attendanceThisMonth = await prisma.attendance.count({
    where: { checkIn: { gte: startOfMonth, lte: endOfMonth } },
  })

  // Popular classes
  const popularClasses = await prisma.gymClass.findMany({
    include: {
      _count: { select: { bookings: true } },
      instructor: true,
    },
    orderBy: { bookings: { _count: 'desc' } },
    take: 5,
  })

  // Payment by type
  const paymentsByType = await prisma.payment.groupBy({
    by: ['type'],
    where: { paidAt: { gte: startOfMonth, lte: endOfMonth }, status: 'paid' },
    _sum: { amount: true },
    _count: true,
  })

  // Attendance trend (last 7 days)
  const attendanceTrend = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const count = await prisma.attendance.count({
      where: { checkIn: { gte: date, lt: nextDate } },
    })
    attendanceTrend.push({
      date: date.toISOString().split('T')[0],
      count,
    })
  }

  return NextResponse.json({
    revenue: {
      thisMonth: Number(revenueThisMonth._sum.amount || 0),
      lastMonth: Number(revenueLastMonth._sum.amount || 0),
      count: revenueThisMonth._count,
    },
    members: { total: totalMembers, active: activeMembers },
    attendance: { thisMonth: attendanceThisMonth, trend: attendanceTrend },
    popularClasses,
    paymentsByType,
  })
}
