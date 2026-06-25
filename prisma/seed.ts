import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@zgym.id' },
    update: {},
    create: {
      name: 'Admin ZGym',
      email: 'admin@zgym.id',
      password: adminPassword,
      role: 'admin',
    },
  })

  // Create default membership plans
  const plans = [
    { name: 'Basic Monthly', description: 'Akses gym standar', duration: 30, price: 200000 },
    { name: 'Premium Monthly', description: 'Akses gym + kelas', duration: 30, price: 350000 },
    { name: 'Basic Yearly', description: 'Akses gym standar (1 tahun)', duration: 365, price: 2000000 },
    { name: 'Premium Yearly', description: 'Akses gym + kelas (1 tahun)', duration: 365, price: 3500000 },
    { name: 'PT Package (5x)', description: '5 sesi personal training', duration: 60, price: 750000 },
  ]

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { id: plan.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: plan,
    })
  }

  // Create sample instructors
  const instructors = [
    { name: 'Budi Santoso', specialty: 'Crossfit & Strength', phone: '081234567890' },
    { name: 'Sari Dewi', specialty: 'Yoga & Pilates', phone: '081234567891' },
    { name: 'Andi Kurniawan', specialty: 'Cardio & HIIT', phone: '081234567892' },
  ]

  for (const inst of instructors) {
    await prisma.instructor.create({ data: inst })
  }

  // Create sample gym classes
  const instructorList = await prisma.instructor.findMany()
  if (instructorList.length >= 3) {
    const classes = [
      { name: 'Crossfit WOD', instructorId: instructorList[0].id, capacity: 15, duration: 60, color: '#EF4444' },
      { name: 'Yoga Flow', instructorId: instructorList[1].id, capacity: 20, duration: 60, color: '#8B5CF6' },
      { name: 'HIIT Blast', instructorId: instructorList[2].id, capacity: 20, duration: 45, color: '#F59E0B' },
      { name: 'Strength Training', instructorId: instructorList[0].id, capacity: 12, duration: 60, color: '#10B981' },
    ]
    for (const cls of classes) {
      await prisma.gymClass.create({ data: cls })
    }
  }

  console.log('✅ Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
