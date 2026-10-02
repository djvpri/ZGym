// Cek mandiri helper masa aktif. Tanpa framework, tanpa dependensi baru.
// Jalankan: npm run cek:masa-aktif
// (atau: node --experimental-strip-types scripts/cek-masa-aktif.mts)
//
// Node 24 sudah bisa menjalankan TypeScript langsung, jadi tsx tak perlu
// ditambahkan sebagai devDependency.
import assert from 'node:assert'
import { hitungEndDate, akhirHariWib, awalHariWib, rentangHariIniWib } from '../src/lib/masaAktif.ts'

const wib = (d: Date) => new Date(d.getTime() + 7 * 3600e3).toISOString().replace('T', ' ').slice(0, 23)
const tgl = (d: Date) => wib(d).slice(0, 10)
const jam = (d: Date) => wib(d).slice(11)

// Kasus yg diminta pemilik produk: mulai 1 Sep 2026, plan 30 hari -> hari terakhir 30 Sep.
{
  const r = hitungEndDate(new Date('2026-09-01T02:00:00.000Z'), 30) // 09:00 WIB
  assert.equal(tgl(r), '2026-09-30', `dapat ${wib(r)}`)
  assert.equal(jam(r), '23:59:59.999', `jam harus akhir hari, dapat ${wib(r)}`)
  console.log('OK 1 Sep + 30 hari ->', wib(r), 'WIB')
}

// Daftar malam pun tak boleh menggeser tanggal.
{
  const r = hitungEndDate(new Date('2026-09-01T19:00:00.000Z'), 30) // 02:00 WIB 2 Sep
  assert.equal(tgl(r), '2026-10-01', `dapat ${wib(r)}`)
  console.log('OK daftar 02:00 WIB 2 Sep ->', wib(r), 'WIB')
}

// Daftar tepat tengah malam WIB.
{
  const r = hitungEndDate(new Date('2026-08-31T17:00:00.000Z'), 30) // 00:00 WIB 1 Sep
  assert.equal(tgl(r), '2026-09-30', `dapat ${wib(r)}`)
  console.log('OK daftar 00:00 WIB 1 Sep ->', wib(r), 'WIB')
}

// Durasi 1 hari: mulai dan berakhir di hari yang sama.
{
  const r = hitungEndDate(new Date('2026-09-01T02:00:00.000Z'), 1)
  assert.equal(tgl(r), '2026-09-01', `dapat ${wib(r)}`)
  console.log('OK durasi 1 hari ->', wib(r), 'WIB')
}

// Lintas bulan 31 hari (Agustus).
{
  const r = hitungEndDate(new Date('2026-08-01T02:00:00.000Z'), 30)
  assert.equal(tgl(r), '2026-08-30', `dapat ${wib(r)}`)
  console.log('OK 1 Agu + 30 hari ->', wib(r), 'WIB')
}

// Akhir hari WIB dari instan 17:00 UTC (= 00:00 WIB besok) tak boleh mundur sehari.
{
  const r = akhirHariWib(new Date('2026-09-30T17:00:00.000Z')) // 1 Okt 00:00 WIB
  assert.equal(tgl(r), '2026-10-01', `dapat ${wib(r)}`)
  console.log('OK 17:00 UTC -> akhir hari WIB =', wib(r), 'WIB')
}

// Awal hari WIB.
{
  const r = awalHariWib(new Date('2026-10-01T09:24:00.000Z')) // 16:24 WIB
  assert.equal(jam(r), '00:00:00.000', `dapat ${wib(r)}`)
  console.log('OK awal hari WIB =', wib(r), 'WIB')
}

// Rentang hari ini WIB harus pas 24 jam.
{
  const r = rentangHariIniWib()
  assert.equal(r.lte.getTime() - r.gte.getTime(), 86_400_000 - 1)
  console.log('OK rentang hari ini WIB:', wib(r.gte), '->', wib(r.lte))
}

console.log('\nSEMUA CEK LULUS')
