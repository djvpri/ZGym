import Link from 'next/link'

const features = [
  {
    icon: 'bi-people-fill',
    title: 'Manajemen Member',
    desc: 'Daftar, perpanjang, lacak aktivitas member. Nomor otomatis, status real-time.',
  },
  {
    icon: 'bi-calendar3',
    title: 'Jadwal & Booking',
    desc: 'Kalender mingguan, booking kelas online, kapasitas otomatis.',
  },
  {
    icon: 'bi-clipboard-check-fill',
    title: 'Absensi Cepat',
    desc: 'Check-in/out manual atau QR code. Riwayat lengkap per member.',
  },
  {
    icon: 'bi-person-badge-fill',
    title: 'Personal Trainer',
    desc: 'Jadwalkan sesi PT, lacak progress, kelola pembayaran per sesi.',
  },
  {
    icon: 'bi-cash-coin',
    title: 'Pembayaran',
    desc: 'Tagihan otomatis, multi metode bayar, laporan keuangan real-time.',
  },
  {
    icon: 'bi-bar-chart-line-fill',
    title: 'Laporan Bisnis',
    desc: 'Omset, pertumbuhan member, kelas populer — semua ada di dashboard.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '0',
    period: '/bulan',
    desc: 'Coba gratis, fitur lengkap',
    features: ['50 Member', '3 Instruktur', '5 Kelas', 'Semua fitur dasar'],
    highlight: false,
    cta: 'Mulai Gratis',
  },
  {
    name: 'Basic',
    price: '100K',
    period: '/bulan',
    desc: 'Untuk gym kecil',
    features: ['200 Member', '10 Instruktur', '20 Kelas', 'Laporan lanjutan', 'Support email'],
    highlight: false,
    cta: 'Pilih Basic',
  },
  {
    name: 'Pro',
    price: '500K',
    period: '/bulan',
    desc: 'Paling populer',
    features: ['500 Member', '25 Instruktur', '50 Kelas', 'Semua fitur', 'Prioritas support', 'Custom branding'],
    highlight: true,
    cta: 'Pilih Pro',
  },
  {
    name: 'Enterprise',
    price: '1JT',
    period: '/bulan',
    desc: 'Untuk gym besar',
    features: ['Unlimited Member', 'Unlimited Instruktur', 'Unlimited Kelas', 'White-label', 'API akses', 'Dedicated support'],
    highlight: false,
    cta: 'Hubungi Kami',
  },
]

const testimonials = [
  { name: 'Andi', gym: 'Gym Demo', text: 'ZGym beneran ngasih kemudahan. Member gw tinggal daftar online, langsung kebayar. Gak perlu ribet lagi.' },
  { name: 'Rina', gym: 'Fitness Plus', text: 'Sejak pakai ZGym, laporan keuangan jadi jelas. Tau persis berapa omset tiap bulan.' },
  { name: 'Budi', gym: 'Power Gym', text: 'Fitur absensi QR code-nya keren. Member tinggal scan, langsung kecatat. Simple!' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="bi bi-lightning-charge-fill text-yellow-500 text-2xl" />
            <span className="text-xl font-bold text-gray-900">ZGym</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#fitur" className="hover:text-blue-600 transition">Fitur</a>
            <a href="#harga" className="hover:text-blue-600 transition">Harga</a>
            <a href="#testimoni" className="hover:text-blue-600 transition">Testimoni</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition">
              Masuk
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="max-w-6xl mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <div className="inline-block bg-white/10 text-sm px-3 py-1 rounded-full mb-6">
              <i className="bi bi-trophy-fill text-yellow-300 mr-1" /> Sistem Manajemen Gym #1 di Indonesia
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Kelola Gym<br />
              <span className="text-yellow-300">Lebih Mudah</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-xl">
              Kelola member, jadwal, pembayaran, dan laporan — semua dalam satu aplikasi. 
              Mulai gratis, bayar sesuai pertumbuhan gym kamu.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="bg-white text-blue-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-blue-50 transition shadow-lg"
              >
                Mulai Gratis →
              </Link>
              <a
                href="#harga"
                className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-white/10 transition"
              >
                Lihat Harga
              </a>
            </div>
            <p className="mt-6 text-sm text-blue-200 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span><i className="bi bi-check-circle-fill text-green-300 mr-1" />Gratis untuk 50 member pertama</span>
              <span>·</span>
              <span><i className="bi bi-check-circle-fill text-green-300 mr-1" />Tanpa kartu kredit</span>
              <span>·</span>
              <span><i className="bi bi-check-circle-fill text-green-300 mr-1" />Setup 5 menit</span>
            </p>
          </div>
        </div>
        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,80C672,85,768,75,864,64C960,53,1056,43,1152,42.7C1248,43,1344,53,1392,58.7L1440,64V120H1392C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120H0V64Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-12 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <div className="text-sm text-gray-500 mt-1">Gym Aktif</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">50K+</div>
              <div className="text-sm text-gray-500 mt-1">Member Terdaftar</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">99.9%</div>
              <div className="text-sm text-gray-500 mt-1">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">4.9★</div>
              <div className="text-sm text-gray-500 mt-1">Rating Pengguna</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Fitur Lengkap untuk Gym Kamu</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Semua yang kamu butuhkan untuk mengelola gym — dari pendaftaran member hingga laporan keuangan.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border hover:shadow-md transition">
                <i className={`bi ${f.icon} text-4xl text-blue-600 mb-4 block`} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Harga Sesuai Pertumbuhan</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Mulai gratis, upgrade saat gym kamu berkembang. Tanpa kontrak jangka panjang.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 border-2 transition ${
                  p.highlight
                    ? 'border-blue-600 shadow-xl scale-105 bg-white relative'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Paling Populer
                  </div>
                )}
                <div className="text-sm font-medium text-gray-500 mb-2">{p.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-gray-900">Rp{p.price}</span>
                  <span className="text-sm text-gray-400">{p.period}</span>
                </div>
                <div className="text-sm text-gray-400 mb-6">{p.desc}</div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-2.5 rounded-xl font-medium text-sm transition ${
                    p.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Mulai dalam 3 Langkah</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Daftar Gratis', desc: 'Buat akun dalam 30 detik. Tanpa kartu kredit.' },
              { step: '2', title: 'Setup Gym', desc: 'Masukkan data gym, jadwal, instruktur, dan paket membership.' },
              { step: '3', title: 'Jalankan!', desc: 'Mulai daftarkan member, kelola jadwal, dan terima pembayaran.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Dipercaya Gym di Seluruh Indonesia</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 border">
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {'★★★★★'.split('').map((s, j) => <span key={j}>{s}</span>)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.gym}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Siap Kelola Gym Lebih Baik?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Mulai gratis sekarang. Upgrade kapan saja sesuai pertumbuhan gym kamu.
          </p>
          <Link
            href="/register"
            className="bg-white text-blue-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition shadow-lg inline-block"
          >
            Daftar Gratis Sekarang →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <i className="bi bi-lightning-charge-fill text-yellow-400 text-xl" />
                <span className="text-lg font-bold text-white">ZGym</span>
              </div>
              <p className="text-sm leading-relaxed">
                Sistem manajemen gym modern. Kelola member, jadwal, dan keuangan dalam satu aplikasi.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">Produk</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#fitur" className="hover:text-white transition">Fitur</a></li>
                <li><a href="#harga" className="hover:text-white transition">Harga</a></li>
                <li><a href="#testimoni" className="hover:text-white transition">Testimoni</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">Dukungan</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs">
            &copy; {new Date().getFullYear()} ZGym. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
