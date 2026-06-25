import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 1. Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'gymdemo' },
    update: {},
    create: {
      name: 'Gym Demo',
      slug: 'gymdemo',
      email: 'admin@gymdemo.id',
      phone: '081234567890',
      plan: 'pro',
      maxMembers: 500,
      maxInstructors: 25,
      maxClasses: 50,
    },
  })

  // 2. Create super admin (no tenantId - handled separately)
  const superAdminPassword = await bcrypt.hash('admin123', 10)
  // Note: superadmin needs a tenantId in current schema. We'll create a system tenant for superadmin.
  const systemTenant = await prisma.tenant.upsert({
    where: { slug: 'system' },
    update: {},
    create: {
      name: 'ZGym System',
      slug: 'system',
      email: 'admin@zgym.id',
      plan: 'enterprise',
      maxMembers: 99999,
      maxInstructors: 999,
      maxClasses: 999,
    },
  })

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: systemTenant.id, email: 'admin@zgym.id' } },
    update: {},
    create: {
      tenantId: systemTenant.id,
      name: 'Super Admin',
      email: 'admin@zgym.id',
      password: superAdminPassword,
      role: 'superadmin',
    },
  })

  // 3. Create tenant admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@gymdemo.id' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Admin Gym Demo',
      email: 'admin@gymdemo.id',
      password: adminPassword,
      role: 'owner',
    },
  })

  // 4. Create default membership plans (per tenant)
  const plans = [
    { name: 'Basic Monthly', description: 'Akses gym standar', duration: 30, price: 200000 },
    { name: 'Premium Monthly', description: 'Akses gym + kelas', duration: 30, price: 350000 },
    { name: 'Basic Yearly', description: 'Akses gym standar (1 tahun)', duration: 365, price: 2000000 },
    { name: 'Premium Yearly', description: 'Akses gym + kelas (1 tahun)', duration: 365, price: 3500000 },
    { name: 'PT Package (5x)', description: '5 sesi personal training', duration: 60, price: 750000 },
  ]

  for (const plan of plans) {
    await prisma.membershipPlan.create({
      data: { ...plan, tenantId: tenant.id },
    }).catch(() => {}) // ignore duplicates
  }

  // 5. Create sample instructors (per tenant)
  const instructors = [
    { name: 'Budi Santoso', specialty: 'Crossfit & Strength', phone: '081234567890' },
    { name: 'Sari Dewi', specialty: 'Yoga & Pilates', phone: '081234567891' },
    { name: 'Andi Kurniawan', specialty: 'Cardio & HIIT', phone: '081234567892' },
  ]

  const createdInstructors = []
  for (const inst of instructors) {
    const created = await prisma.instructor.create({
      data: { ...inst, tenantId: tenant.id },
    })
    createdInstructors.push(created)
  }

  // 6. Create sample gym classes (per tenant)
  if (createdInstructors.length >= 3) {
    const classes = [
      { name: 'Crossfit WOD', instructorId: createdInstructors[0].id, capacity: 15, duration: 60, color: '#EF4444' },
      { name: 'Yoga Flow', instructorId: createdInstructors[1].id, capacity: 20, duration: 60, color: '#8B5CF6' },
      { name: 'HIIT Blast', instructorId: createdInstructors[2].id, capacity: 20, duration: 45, color: '#F59E0B' },
      { name: 'Strength Training', instructorId: createdInstructors[0].id, capacity: 12, duration: 60, color: '#10B981' },
    ]
    for (const cls of classes) {
      await prisma.gymClass.create({
        data: { ...cls, tenantId: tenant.id },
      })
    }
  }

  console.log('✅ Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
