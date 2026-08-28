'use client'

import { Stars, RocketTakeoff } from 'react-bootstrap-icons'

export default function AIPage() {
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Stars size={20} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">Asisten AI</h1>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-8 sm:p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <RocketTakeoff size={28} className="text-blue-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Segera Hadir</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
          Asisten AI untuk membantu mengelola gym Anda — analisis keanggotaan,
          kelas terlaris, dan saran pengembangan bisnis. Fitur ini sedang
          dikembangkan dan akan tersedia segera.
        </p>
      </div>
    </div>
  )
}
