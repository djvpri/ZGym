import { prisma } from '@/lib/prisma'
import type { MembershipPlan, Member } from '@prisma/client'

// Demo data: 2 membership plans
const DEMO_PLANS = [
  { name: 'Basic Monthly', duration: 30, price: 199000 },
  { name: 'Premium Yearly', duration: 365, price: 1999000 },
]

// Demo members: 8 members
const DEMO_MEMBERS = [
  { name: 'Andi Wijaya', email: 'andi.wijaya@demo.com', phone: '081234567890' },
  { name: 'Siti Nurhaliza', email: 'siti.demo@demo.com', phone: '082345678901' },
  { name: 'Budi Santoso', email: 'budi.demo@demo.com', phone: '083456789012' },
  { name: 'Lisa Mona', email: 'lisa.demo@demo.com', phone: '084567890123' },
  { name: 'Ahmad Ridho', email: 'ahmad.demo@demo.com', phone: '085678901234' },
  { name: 'Nina Kusuma', email: 'nina.demo@demo.com', phone: '086789012345' },
  { name: 'Reza Pratama', email: 'reza.demo@demo.com', phone: '087890123456' },
  { name: 'Desi Ramadhani', email: 'desi.demo@demo.com', phone: '088901234567' },
]

// Demo classes: 4 classes
const DEMO_CLASSES = [
  { name: 'Yoga Flow', duration: 60, description: 'Relaxing yoga for all levels' },
  { name: 'HIIT Blast', duration: 45, description: 'High-intensity interval training' },
  { name: 'Spin Class', duration: 50, description: 'Indoor cycling workout' },
  { name: 'Strength Training', duration: 60, description: 'Functional strength exercises' },
]

// Seed membership plans
async function seedPlans(tenantId: string) {
  return Promise.all(
    DEMO_PLANS.map(p =>
      prisma.membershipPlan.create({
        data: {
          tenantId,
          name: p.name,
          duration: p.duration,
          price: p.price,
        },
      })
    )
  )
}

// Seed members + memberships
async function seedMembers(tenantId: string, plans: MembershipPlan[]) {
  const now = new Date()
  
  return Promise.all(
    DEMO_MEMBERS.map(async (m, idx) => {
      const member = await prisma.member.create({
        data: {
          tenantId,
          name: m.name,
          email: m.email,
          phone: m.phone,
          memberNumber: `GYM-${String(idx + 1).padStart(5, '0')}`,
          joinDate: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      })

      // Create membership for 60% of members
      if (Math.random() > 0.4) {
        const plan = plans[Math.floor(Math.random() * plans.length)]!
        await prisma.membership.create({
          data: {
            tenantId,
            memberId: member.id,
            planId: plan.id,
            startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            endDate: new Date(now.getTime() + (plan.duration - 10) * 24 * 60 * 60 * 1000),
            status: 'active',
          },
        })
      }

      return member
    })
  )
}

// Seed classes
async function seedClasses(tenantId: string) {
  return Promise.all(
    DEMO_CLASSES.map(c =>
      prisma.gymClass.create({
        data: {
          tenantId,
          name: c.name,
          description: c.description,
          duration: c.duration,
          capacity: 20,
        },
      })
    )
  )
}

// Seed attendance: past 7 days
async function seedAttendance(tenantId: string, members: Member[]) {
  const now = new Date()
  
  for (let day = 6; day >= 0; day--) {
    const date = new Date(now)
    date.setDate(date.getDate() - day)
    
    // 4-5 random members per day
    const count = 4 + Math.floor(Math.random() * 2)
    for (let i = 0; i < count; i++) {
      const member = members[Math.floor(Math.random() * members.length)]!
      await prisma.attendance.create({
        data: {
          tenantId,
          memberId: member.id,
          checkIn: new Date(date.getTime() + (8 + Math.random() * 12) * 60 * 60 * 1000),
        },
      })
    }
  }
}

// Cleanup demo data
export async function bersihkanDataGym(tenantId: string) {
  await prisma.attendance.deleteMany({ where: { tenantId } })
  await prisma.payment.deleteMany({ where: { tenantId } })
  await prisma.ptSession.deleteMany({ where: { tenantId } })
  await prisma.booking.deleteMany({ where: { tenantId } })
  await prisma.schedule.deleteMany({ where: { tenantId } })
  await prisma.membership.deleteMany({ where: { tenantId } })
  await prisma.member.deleteMany({ where: { tenantId } })
  await prisma.instructor.deleteMany({ where: { tenantId } })
  await prisma.gymClass.deleteMany({ where: { tenantId } })
  await prisma.membershipPlan.deleteMany({ where: { tenantId } })
}

// Seed full demo data
export async function seedDataDemo(tenantId: string) {
  const [plans] = await Promise.all([
    seedPlans(tenantId),
  ])

  const [members] = await Promise.all([
    seedMembers(tenantId, plans),
  ])

  const [classes] = await Promise.all([
    seedClasses(tenantId),
  ])

  await seedAttendance(tenantId, members)

  return {
    plans: plans.length,
    members: members.length,
    classes: classes.length,
    attendance: members.length * 5, // ~5 per member across 7 days
  }
}
