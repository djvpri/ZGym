import { prisma } from '@/lib/prisma'
import type { MembershipPlan, Member, Instructor, GymClass } from '@prisma/client'

const DEMO_PLANS = [
  { name: 'Basic Monthly', duration: 30, price: 199000 },
  { name: 'Premium Yearly', duration: 365, price: 1999000 },
]

const DEMO_MEMBERS = [
  { name: 'Andi Wijaya',     email: 'andi.wijaya@demo.com',     phone: '081234567890' },
  { name: 'Siti Nurhaliza',  email: 'siti.demo@demo.com',       phone: '082345678901' },
  { name: 'Budi Santoso',    email: 'budi.demo@demo.com',       phone: '083456789012' },
  { name: 'Lisa Mona',       email: 'lisa.demo@demo.com',       phone: '084567890123' },
  { name: 'Ahmad Ridho',     email: 'ahmad.demo@demo.com',      phone: '085678901234' },
  { name: 'Nina Kusuma',     email: 'nina.demo@demo.com',       phone: '086789012345' },
  { name: 'Reza Pratama',    email: 'reza.demo@demo.com',       phone: '087890123456' },
  { name: 'Desi Ramadhani',  email: 'desi.demo@demo.com',       phone: '088901234567' },
]

const DEMO_INSTRUCTORS = [
  { name: 'Fitri Handayani', email: 'fitri@demo.com', specialty: 'Yoga, Pilates',     hourlyRate: 150000 },
  { name: 'Hendra Setiawan', email: 'hendra@demo.com', specialty: 'HIIT, Strength',   hourlyRate: 175000 },
]

const DEMO_CLASSES = [
  { name: 'Yoga Flow',        duration: 60, color: '#4CAF50', description: 'Relaxing yoga for all levels',    instructorIdx: 0 },
  { name: 'HIIT Blast',       duration: 45, color: '#F44336', description: 'High-intensity interval training', instructorIdx: 1 },
  { name: 'Spin Class',       duration: 50, color: '#2196F3', description: 'Indoor cycling workout',           instructorIdx: 1 },
  { name: 'Strength Training', duration: 60, color: '#FF9800', description: 'Functional strength exercises',   instructorIdx: 1 },
]

// day offset (0=today, 1=yesterday, 7=last week)
function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function seedPlans(tenantId: string) {
  return Promise.all(
    DEMO_PLANS.map(p =>
      prisma.membershipPlan.create({
        data: { tenantId, name: p.name, duration: p.duration, price: p.price },
      })
    )
  )
}

async function seedInstructors(tenantId: string) {
  return Promise.all(
    DEMO_INSTRUCTORS.map(i =>
      prisma.instructor.create({
        data: {
          tenantId,
          name: i.name,
          email: i.email,
          specialty: i.specialty,
          hourlyRate: i.hourlyRate,
          isActive: true,
        },
      })
    )
  )
}

async function seedMembers(tenantId: string, plans: MembershipPlan[]) {
  const basicPlan = plans[0]!
  const premiumPlan = plans[1]!

  return Promise.all(
    DEMO_MEMBERS.map(async (m, idx) => {
      const member = await prisma.member.create({
        data: {
          tenantId,
          name: m.name,
          email: m.email,
          phone: m.phone,
          memberNumber: `GYM-${String(idx + 1).padStart(5, '0')}`,
          joinDate: daysAgo(idx * 5 + 10),
          status: 'active',
        },
      })

      // Members 0–5: active membership (deterministic assignment)
      if (idx < 6) {
        const plan = idx % 3 === 0 ? premiumPlan : basicPlan
        const membership = await prisma.membership.create({
          data: {
            tenantId,
            memberId: member.id,
            planId: plan.id,
            startDate: daysAgo(10),
            endDate: daysAgo(-(plan.duration - 10)),
            status: 'active',
          },
        })

        // Payment for membership
        await prisma.payment.create({
          data: {
            tenantId,
            memberId: member.id,
            membershipId: membership.id,
            type: 'membership',
            description: `Pembayaran ${plan.name} — ${m.name}`,
            amount: plan.price,
            method: idx % 2 === 0 ? 'transfer' : 'cash',
            status: 'paid',
            paidAt: daysAgo(10),
          },
        })
      }

      return member
    })
  )
}

async function seedClasses(tenantId: string, instructors: Instructor[]) {
  return Promise.all(
    DEMO_CLASSES.map(c =>
      prisma.gymClass.create({
        data: {
          tenantId,
          name: c.name,
          description: c.description,
          duration: c.duration,
          capacity: 20,
          color: c.color,
          instructorId: instructors[c.instructorIdx]?.id,
          isActive: true,
        },
      })
    )
  )
}

async function seedSchedules(tenantId: string, classes: GymClass[], instructors: Instructor[]) {
  const scheduleData = [
    { classIdx: 0, instructorIdx: 0, dayOfWeek: 1, startTime: '08:00', endTime: '09:00' }, // Yoga — Mon
    { classIdx: 0, instructorIdx: 0, dayOfWeek: 4, startTime: '08:00', endTime: '09:00' }, // Yoga — Thu
    { classIdx: 1, instructorIdx: 1, dayOfWeek: 2, startTime: '06:00', endTime: '06:45' }, // HIIT — Tue
    { classIdx: 1, instructorIdx: 1, dayOfWeek: 5, startTime: '06:00', endTime: '06:45' }, // HIIT — Fri
    { classIdx: 2, instructorIdx: 1, dayOfWeek: 3, startTime: '17:00', endTime: '17:50' }, // Spin — Wed
    { classIdx: 3, instructorIdx: 1, dayOfWeek: 6, startTime: '09:00', endTime: '10:00' }, // Strength — Sat
  ]

  return Promise.all(
    scheduleData.map(s =>
      prisma.schedule.create({
        data: {
          tenantId,
          classId: classes[s.classIdx]!.id,
          instructorId: instructors[s.instructorIdx]!.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isRecurring: true,
        },
      })
    )
  )
}

async function seedBookings(tenantId: string, members: Member[], classes: GymClass[]) {
  const bookingData = [
    { memberIdx: 0, classIdx: 0, daysBack: 6, status: 'attended' },
    { memberIdx: 1, classIdx: 1, daysBack: 5, status: 'attended' },
    { memberIdx: 2, classIdx: 0, daysBack: 4, status: 'attended' },
    { memberIdx: 3, classIdx: 2, daysBack: 3, status: 'attended' },
    { memberIdx: 4, classIdx: 1, daysBack: 2, status: 'attended' },
    { memberIdx: 0, classIdx: 3, daysBack: 1, status: 'attended' },
    { memberIdx: 1, classIdx: 2, daysBack: 0, status: 'booked' },
    { memberIdx: 5, classIdx: 0, daysBack: 0, status: 'booked' },
  ]

  return Promise.all(
    bookingData.map(b =>
      prisma.booking.create({
        data: {
          tenantId,
          memberId: members[b.memberIdx]!.id,
          classId: classes[b.classIdx]!.id,
          date: daysAgo(b.daysBack),
          status: b.status,
        },
      })
    )
  )
}

async function seedAttendance(tenantId: string, members: Member[]) {
  // 5 members check in per day for past 7 days — deterministic pattern
  const attendanceData: Array<{ memberIdx: number; daysBack: number; hourOffset: number }> = []
  for (let day = 6; day >= 0; day--) {
    for (let slot = 0; slot < 5; slot++) {
      attendanceData.push({
        memberIdx: (day * 3 + slot) % members.length,
        daysBack: day,
        hourOffset: 8 + slot * 2, // 8, 10, 12, 14, 16
      })
    }
  }

  for (const a of attendanceData) {
    const checkIn = daysAgo(a.daysBack)
    checkIn.setHours(a.hourOffset, 0, 0, 0)
    const checkOut = new Date(checkIn)
    checkOut.setHours(a.hourOffset + 1, 30, 0, 0)

    await prisma.attendance.create({
      data: {
        tenantId,
        memberId: members[a.memberIdx]!.id,
        checkIn,
        checkOut,
        method: 'manual',
      },
    })
  }
}

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
  await prisma.product.deleteMany({ where: { tenantId } })
}

export async function seedDataDemo(tenantId: string) {
  const plans       = await seedPlans(tenantId)
  const instructors = await seedInstructors(tenantId)
  const members     = await seedMembers(tenantId, plans)
  const classes     = await seedClasses(tenantId, instructors)

  await seedSchedules(tenantId, classes, instructors)
  await seedBookings(tenantId, members, classes)
  await seedAttendance(tenantId, members)

  return {
    plans:       plans.length,
    instructors: instructors.length,
    members:     members.length,
    classes:     classes.length,
    attendance:  35, // 5 per day × 7 days
  }
}
