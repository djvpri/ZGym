// Seed data DEMO untuk ZGym — mengisi tenant tempat akun demo@zomet.my.id berada
// (yang diakses lewat SSO dari Z One) dengan member, kelas, jadwal, membership,
// absensi, sesi PT, pembayaran, dan produk yang realistis & tersebar ~3 bulan.
//
// IDEMPOTENT / RESET MANUAL: tiap dijalankan, data demo lama tenant ini DIHAPUS
// lalu diisi ulang (user/admin & tenant TIDAK dihapus). Jalankan ulang kapan pun
// untuk mengembalikan akun demo ke kondisi bersih:
//   node scripts/seed-demo.js
//
// Override target tenant via env kalau perlu: DEMO_EMAIL=... atau DEMO_SLUG=...

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@zomet.my.id'
const DEMO_SLUG = process.env.DEMO_SLUG || 'demo'

const now = new Date()
const rint = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
function daysAgo(n, hour) {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  if (hour != null) d.setHours(hour, rint(0, 59), 0, 0)
  return d
}
function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const FIRST = ['Budi', 'Sari', 'Andi', 'Dewi', 'Rizky', 'Putri', 'Agus', 'Maya', 'Fajar', 'Indah',
  'Hendra', 'Ratna', 'Yoga', 'Lestari', 'Bayu', 'Wulan', 'Dimas', 'Citra', 'Eko', 'Nadia',
  'Reza', 'Sinta', 'Galih', 'Mega', 'Aldi']
const LAST = ['Santoso', 'Dewi', 'Kurniawan', 'Pratama', 'Wijaya', 'Sari', 'Nugroho', 'Putra',
  'Halim', 'Permata', 'Saputra', 'Anggraini', 'Hidayat', 'Maharani']

async function main() {
  // 1. Temukan tenant demo (via user demo, fallback slug)
  const demoUser = await prisma.user.findFirst({ where: { email: DEMO_EMAIL }, include: { tenant: true } })
  let tenantId = demoUser?.tenantId
  if (!tenantId) {
    const t = await prisma.tenant.findFirst({ where: { slug: DEMO_SLUG } })
    tenantId = t?.id
  }
  if (!tenantId) {
    throw new Error(`Tenant demo tidak ditemukan (user ${DEMO_EMAIL} atau slug ${DEMO_SLUG}). Buat dulu.`)
  }
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  console.log(`Target tenant: ${tenant.name} (${tenant.slug}) [${tenantId}]`)

  // 2. RESET — hapus data anak tenant ini (user/tenant/settings dipertahankan)
  await prisma.payment.deleteMany({ where: { tenantId } })
  await prisma.attendance.deleteMany({ where: { tenantId } })
  await prisma.booking.deleteMany({ where: { tenantId } })
  await prisma.ptSession.deleteMany({ where: { tenantId } })
  await prisma.membership.deleteMany({ where: { tenantId } })
  await prisma.schedule.deleteMany({ where: { tenantId } })
  await prisma.member.deleteMany({ where: { tenantId } })
  await prisma.gymClass.deleteMany({ where: { tenantId } })
  await prisma.instructor.deleteMany({ where: { tenantId } })
  await prisma.membershipPlan.deleteMany({ where: { tenantId } })
  await prisma.product.deleteMany({ where: { tenantId } })
  console.log('Data demo lama dibersihkan.')

  // 3. Membership plans
  const planDefs = [
    { name: 'Basic Monthly', description: 'Akses gym standar', duration: 30, price: 200000 },
    { name: 'Premium Monthly', description: 'Akses gym + semua kelas', duration: 30, price: 350000 },
    { name: 'Basic Yearly', description: 'Akses gym standar (1 tahun)', duration: 365, price: 2000000 },
    { name: 'Premium Yearly', description: 'Akses gym + kelas (1 tahun)', duration: 365, price: 3500000 },
  ]
  const plans = []
  for (const p of planDefs) {
    plans.push(await prisma.membershipPlan.create({ data: { ...p, tenantId } }))
  }

  // 4. Instructors
  const instDefs = [
    { name: 'Budi Santoso', specialty: 'Crossfit & Strength', phone: '081234500001', hourlyRate: 150000 },
    { name: 'Sari Dewi', specialty: 'Yoga & Pilates', phone: '081234500002', hourlyRate: 130000 },
    { name: 'Andi Kurniawan', specialty: 'Cardio & HIIT', phone: '081234500003', hourlyRate: 140000 },
  ]
  const instructors = []
  for (const i of instDefs) {
    instructors.push(await prisma.instructor.create({ data: { ...i, tenantId } }))
  }

  // 5. Gym classes
  const classDefs = [
    { name: 'Crossfit WOD', instructorId: instructors[0].id, capacity: 15, duration: 60, color: '#EF4444' },
    { name: 'Yoga Flow', instructorId: instructors[1].id, capacity: 20, duration: 60, color: '#8B5CF6' },
    { name: 'HIIT Blast', instructorId: instructors[2].id, capacity: 20, duration: 45, color: '#F59E0B' },
    { name: 'Strength Training', instructorId: instructors[0].id, capacity: 12, duration: 60, color: '#10B981' },
  ]
  const classes = []
  for (const c of classDefs) {
    classes.push(await prisma.gymClass.create({ data: { ...c, tenantId } }))
  }

  // 6. Weekly schedules (jadwal mingguan tetap)
  const schedDefs = [
    { classIdx: 0, day: 1, startTime: '07:00', endTime: '08:00' },
    { classIdx: 1, day: 2, startTime: '17:00', endTime: '18:00' },
    { classIdx: 2, day: 3, startTime: '18:00', endTime: '18:45' },
    { classIdx: 3, day: 4, startTime: '07:00', endTime: '08:00' },
    { classIdx: 0, day: 5, startTime: '18:00', endTime: '19:00' },
    { classIdx: 1, day: 6, startTime: '08:00', endTime: '09:00' },
  ]
  for (const s of schedDefs) {
    const cls = classes[s.classIdx]
    await prisma.schedule.create({
      data: { tenantId, classId: cls.id, instructorId: cls.instructorId, dayOfWeek: s.day, startTime: s.startTime, endTime: s.endTime },
    })
  }

  // 7. Members (20) + membership + pembayaran membership
  const members = []
  const MEMBER_COUNT = 20
  for (let i = 0; i < MEMBER_COUNT; i++) {
    const name = `${pick(FIRST)} ${pick(LAST)}`
    const joinedDaysAgo = rint(5, 110)
    const joinDate = daysAgo(joinedDaysAgo, 9)
    const plan = pick(plans)
    const endDate = addDays(joinDate, plan.duration)
    const expired = endDate < now
    const member = await prisma.member.create({
      data: {
        tenantId,
        memberNumber: `GYM-${String(i + 1).padStart(5, '0')}`,
        name,
        email: `member${i + 1}@demo.id`,
        phone: `0812345${String(rint(10000, 99999))}`,
        gender: pick(['male', 'female']),
        dateOfBirth: new Date(rint(1985, 2003), rint(0, 11), rint(1, 28)),
        joinDate,
        expiryDate: endDate,
        status: expired ? (Math.random() < 0.5 ? 'expired' : 'inactive') : 'active',
      },
    })
    members.push(member)

    const membership = await prisma.membership.create({
      data: {
        tenantId, memberId: member.id, planId: plan.id,
        startDate: joinDate, endDate,
        status: expired ? 'expired' : 'active',
      },
    })
    // Pembayaran membership (saat join)
    await prisma.payment.create({
      data: {
        tenantId, memberId: member.id, membershipId: membership.id,
        type: 'membership', description: `Pembayaran ${plan.name}`,
        amount: plan.price, method: pick(['cash', 'transfer', 'e_wallet', 'card']),
        status: 'paid', paidAt: joinDate,
      },
    })
  }
  const activeMembers = members.filter((m) => m.status === 'active')

  // 8. Absensi — tersebar 90 hari terakhir, hanya member aktif
  let attendanceCount = 0
  for (const m of activeMembers) {
    const visits = rint(4, 16)
    const usedDays = new Set()
    for (let v = 0; v < visits; v++) {
      let d = rint(0, 89)
      while (usedDays.has(d)) d = rint(0, 89)
      usedDays.add(d)
      const checkIn = daysAgo(d, pick([6, 7, 8, 17, 18, 19]))
      const checkOut = new Date(checkIn.getTime() + rint(45, 110) * 60000)
      await prisma.attendance.create({
        data: { tenantId, memberId: m.id, checkIn, checkOut, method: pick(['manual', 'qr', 'qr']) },
      })
      attendanceCount++
    }
  }

  // 9. Booking kelas — beberapa member ke kelas pada tanggal spesifik (2 minggu terakhir + minggu depan)
  let bookingCount = 0
  for (const m of activeMembers.slice(0, 14)) {
    const n = rint(1, 3)
    const used = new Set()
    for (let b = 0; b < n; b++) {
      const cls = pick(classes)
      const offset = rint(-14, 6) // hari relatif hari ini
      const date = new Date(now); date.setDate(date.getDate() + offset); date.setHours(0, 0, 0, 0)
      const key = `${cls.id}-${date.toISOString().slice(0, 10)}`
      if (used.has(key)) continue
      used.add(key)
      const status = offset < 0 ? pick(['attended', 'attended', 'no_show', 'cancelled']) : 'booked'
      await prisma.booking.create({
        data: { tenantId, memberId: m.id, classId: cls.id, date, status },
      }).then(() => bookingCount++).catch(() => {})
    }
  }

  // 10. Sesi PT — campuran selesai (lampau, ada pembayaran) & terjadwal (mendatang)
  let ptCount = 0
  for (let i = 0; i < 14; i++) {
    const m = pick(activeMembers)
    const inst = pick(instructors)
    const offset = rint(-60, 10)
    const date = new Date(now); date.setDate(date.getDate() + offset); date.setHours(0, 0, 0, 0)
    const hour = pick([9, 10, 16, 19])
    const completed = offset < 0
    const pt = await prisma.ptSession.create({
      data: {
        tenantId, memberId: m.id, instructorId: inst.id, date,
        startTime: `${String(hour).padStart(2, '0')}:00`, endTime: `${String(hour + 1).padStart(2, '0')}:00`,
        status: completed ? 'completed' : 'scheduled',
        sessionType: pick(['regular', 'regular', 'assessment']),
      },
    })
    ptCount++
    if (completed) {
      await prisma.payment.create({
        data: {
          tenantId, memberId: m.id, ptSessionId: pt.id,
          type: 'pt_session', description: `Sesi PT dengan ${inst.name}`,
          amount: 175000, method: pick(['cash', 'transfer', 'e_wallet']),
          status: 'paid', paidAt: date,
        },
      })
    }
  }

  // 11. Produk + beberapa penjualan produk (pembayaran type product)
  const prodDefs = [
    { name: 'Whey Protein 1kg', category: 'supplement', price: 450000, stock: 24 },
    { name: 'Pre-Workout', category: 'supplement', price: 280000, stock: 18 },
    { name: 'Shaker Bottle', category: 'accessories', price: 65000, stock: 50 },
    { name: 'Gym T-Shirt', category: 'apparel', price: 120000, stock: 40 },
    { name: 'Lifting Gloves', category: 'accessories', price: 90000, stock: 30 },
  ]
  const products = []
  for (const p of prodDefs) products.push(await prisma.product.create({ data: { ...p, tenantId } }))

  let productSales = 0
  for (let i = 0; i < 18; i++) {
    const m = pick(activeMembers)
    const prod = pick(products)
    await prisma.payment.create({
      data: {
        tenantId, memberId: m.id,
        type: 'product', description: `Pembelian ${prod.name}`,
        amount: prod.price, method: pick(['cash', 'e_wallet', 'card']),
        status: 'paid', paidAt: daysAgo(rint(0, 85), 14),
      },
    })
    productSales++
  }

  console.log('✅ Seed demo selesai:')
  console.log(`   members=${members.length} (aktif ${activeMembers.length}), instructors=${instructors.length}, classes=${classes.length}`)
  console.log(`   absensi=${attendanceCount}, booking=${bookingCount}, sesi PT=${ptCount}, produk=${products.length}, penjualan produk=${productSales}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
