import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — ThreeTop',
  description: 'Kebijakan privasi dan perlindungan data pengguna layanan ThreeTop',
}

const LAST_UPDATED = 'Juni 2025'

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.9"/>
          <path d="M5 8H11M8 5V11" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <span className="text-base font-black text-white">THREE<span className="text-sky-400">TOP</span></span>
    </Link>
  )
}

const SECTIONS = [
  {
    id: 'pendahuluan',
    title: '1. Pendahuluan',
    content: [
      'ThreeTop ("kami", "platform kami") berkomitmen untuk melindungi privasi dan keamanan data pribadi Pengguna. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Pengguna.',
      'Kebijakan ini berlaku untuk semua layanan yang disediakan oleh ThreeTop, termasuk website, aplikasi mobile (jika tersedia), dan seluruh interaksi Pengguna dengan platform kami.',
      'Dengan menggunakan layanan ThreeTop, Pengguna menyetujui praktik yang dijelaskan dalam Kebijakan Privasi ini.',
    ],
  },
  {
    id: 'data-dikumpulkan',
    title: '2. Data yang Kami Kumpulkan',
    content: [
      'Data Identitas: nama lengkap, alamat email, foto profil (jika login melalui Google).',
      'Data Akun: password terenkripsi (tidak pernah disimpan dalam bentuk teks biasa), provider login (email/Google), waktu pendaftaran.',
      'Data Transaksi: riwayat pembelian, produk yang dibeli, User ID game yang dimasukkan, status transaksi, jumlah pembayaran, metode pembayaran.',
      'Data Teknis: alamat IP, jenis browser, sistem operasi, waktu akses, dan halaman yang dikunjungi. Data ini dikumpulkan secara otomatis melalui cookie dan log server.',
      'Data yang TIDAK kami kumpulkan: nomor kartu kredit, data rekening bank, nomor KTP, atau informasi sensitif lainnya. Pembayaran diproses langsung oleh Midtrans.',
    ],
  },
  {
    id: 'penggunaan-data',
    title: '3. Cara Kami Menggunakan Data',
    content: [
      'Memproses dan menyelesaikan transaksi top up game Pengguna.',
      'Mengelola akun Pengguna, termasuk autentikasi dan pemulihan akun.',
      'Mengirimkan konfirmasi transaksi dan pembaruan status pesanan.',
      'Memberikan layanan customer support dan merespons pertanyaan.',
      'Mendeteksi, mencegah, dan menginvestigasi aktivitas penipuan atau pelanggaran syarat layanan.',
      'Meningkatkan kualitas layanan melalui analisis penggunaan platform (menggunakan data yang dianonimkan).',
      'Memenuhi kewajiban hukum dan regulasi yang berlaku.',
      'Mengirimkan informasi promosi hanya jika Pengguna telah memberikan persetujuan eksplisit.',
    ],
  },
  {
    id: 'dasar-hukum',
    title: '4. Dasar Hukum Pemrosesan Data',
    content: [
      'Pelaksanaan kontrak: pemrosesan data diperlukan untuk memenuhi kewajiban layanan yang disepakati dengan Pengguna.',
      'Kewajiban hukum: pemrosesan data diperlukan untuk memenuhi ketentuan perundang-undangan yang berlaku, termasuk peraturan perpajakan dan anti-pencucian uang.',
      'Kepentingan sah: pemrosesan data untuk mencegah penipuan, meningkatkan keamanan platform, dan meningkatkan layanan.',
      'Persetujuan: untuk pengiriman komunikasi pemasaran, kami hanya akan memproses data berdasarkan persetujuan eksplisit Pengguna.',
    ],
  },
  {
    id: 'berbagi-data',
    title: '5. Berbagi Data dengan Pihak Ketiga',
    content: [
      'ThreeTop tidak menjual, menyewakan, atau memperdagangkan data pribadi Pengguna kepada pihak ketiga untuk tujuan komersial.',
      'Kami hanya berbagi data dengan pihak ketiga dalam kondisi berikut:',
      'Midtrans (payment gateway): data minimum yang diperlukan untuk memproses pembayaran, meliputi nama dan email.',
      'Digiflazz (supplier top up): User ID game dan kode produk yang diperlukan untuk memproses transaksi.',
      'Google (autentikasi OAuth): jika Pengguna memilih login dengan Google, kami menerima data profil dasar dari Google sesuai izin yang diberikan.',
      'Otoritas hukum: jika diwajibkan oleh hukum, perintah pengadilan, atau otoritas pemerintah yang berwenang.',
      'Semua mitra pihak ketiga diwajibkan untuk menjaga kerahasiaan data dan menggunakannya hanya untuk tujuan yang disepakati.',
    ],
  },
  {
    id: 'keamanan-data',
    title: '6. Keamanan Data',
    content: [
      'Password disimpan menggunakan algoritma bcrypt dengan salt rounds yang kuat — tidak ada yang bisa membaca password Pengguna, termasuk tim ThreeTop.',
      'Seluruh komunikasi antara browser Pengguna dan server ThreeTop dienkripsi menggunakan protokol HTTPS/TLS.',
      'Database disimpan di infrastruktur cloud yang aman (Supabase) dengan enkripsi data at-rest.',
      'Akses ke data pengguna dibatasi hanya untuk personel yang memiliki kebutuhan operasional yang sah.',
      'Kami melakukan pemantauan keamanan secara berkala dan menerapkan patch keamanan sesegera mungkin.',
      'Meskipun demikian, tidak ada sistem yang 100% aman. Kami menyarankan Pengguna untuk menggunakan password yang kuat dan unik.',
    ],
  },
  {
    id: 'retensi-data',
    title: '7. Penyimpanan dan Retensi Data',
    content: [
      'Data akun disimpan selama akun Pengguna aktif. Jika akun dihapus, data akan dihapus dalam 30 hari, kecuali terdapat kewajiban hukum untuk menyimpannya lebih lama.',
      'Riwayat transaksi disimpan selama minimal 5 tahun untuk keperluan audit dan kepatuhan hukum.',
      'Log teknis (IP address, waktu akses) disimpan selama maksimal 90 hari.',
      'Data yang sudah tidak diperlukan akan dihapus atau dianonimkan secara aman.',
    ],
  },
  {
    id: 'hak-pengguna',
    title: '8. Hak-Hak Pengguna',
    content: [
      'Hak Akses: Pengguna berhak meminta salinan data pribadi yang kami miliki tentang Pengguna.',
      'Hak Koreksi: Pengguna berhak meminta koreksi atas data yang tidak akurat atau tidak lengkap.',
      'Hak Penghapusan: Pengguna berhak meminta penghapusan data pribadi ("right to be forgotten"), dengan pengecualian data yang wajib disimpan berdasarkan hukum.',
      'Hak Pembatasan: Pengguna berhak meminta pembatasan pemrosesan data dalam kondisi tertentu.',
      'Hak Portabilitas: Pengguna berhak menerima data yang mereka berikan dalam format yang dapat dibaca mesin.',
      'Hak Keberatan: Pengguna berhak mengajukan keberatan atas pemrosesan data untuk tujuan tertentu.',
      'Untuk mengajukan permintaan terkait hak-hak di atas, hubungi kami di support@threetop.id.',
    ],
  },
  {
    id: 'cookie',
    title: '9. Cookie dan Teknologi Pelacakan',
    content: [
      'ThreeTop menggunakan cookie yang diperlukan untuk menjalankan layanan, termasuk session cookie untuk autentikasi.',
      'Kami tidak menggunakan cookie pelacakan pihak ketiga untuk iklan atau profiling perilaku pengguna.',
      'Pengguna dapat mengatur browser untuk menolak cookie, namun hal ini dapat memengaruhi fungsionalitas layanan.',
      'Cookie sesi akan otomatis dihapus saat Pengguna menutup browser atau logout.',
    ],
  },
  {
    id: 'anak-anak',
    title: '10. Privasi Anak-Anak',
    content: [
      'Layanan ThreeTop tidak ditujukan untuk anak-anak di bawah usia 13 tahun.',
      'Kami tidak dengan sengaja mengumpulkan data pribadi dari anak-anak di bawah 13 tahun.',
      'Jika kami mengetahui bahwa kami telah mengumpulkan data dari anak-anak di bawah 13 tahun, kami akan segera menghapus data tersebut.',
      'Pengguna berusia 13–17 tahun harus mendapatkan persetujuan orang tua atau wali sebelum menggunakan layanan.',
    ],
  },
  {
    id: 'transfer-data',
    title: '11. Transfer Data Internasional',
    content: [
      'Data Pengguna disimpan di server yang berlokasi di wilayah Asia Tenggara (Singapura). Dalam proses operasional, data mungkin diproses di lokasi lain oleh mitra layanan kami.',
      'Setiap transfer data internasional dilakukan dengan memastikan perlindungan yang memadai sesuai dengan peraturan perlindungan data yang berlaku.',
    ],
  },
  {
    id: 'perubahan',
    title: '12. Perubahan Kebijakan',
    content: [
      'ThreeTop berhak mengubah Kebijakan Privasi ini sewaktu-waktu. Perubahan material akan diberitahukan melalui email atau notifikasi di platform setidaknya 7 hari sebelum berlaku.',
      'Penggunaan layanan ThreeTop setelah tanggal efektif perubahan dianggap sebagai penerimaan atas Kebijakan Privasi yang baru.',
      'Versi terbaru Kebijakan Privasi selalu tersedia di halaman ini.',
    ],
  },
  {
    id: 'kontak-privasi',
    title: '13. Kontak Terkait Privasi',
    content: [
      'Untuk pertanyaan, keluhan, atau permintaan terkait privasi dan perlindungan data, Pengguna dapat menghubungi kami:',
      'Email: privacy@threetop.id',
      'Subjek email: [PRIVASI] diikuti dengan deskripsi singkat permintaan.',
      'ThreeTop berkomitmen untuk merespons permintaan terkait privasi dalam 5 hari kerja.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080C14]">
      {/* Header */}
      <div className="border-b border-slate-800/60 sticky top-0 z-10" style={{ background: 'rgba(8,12,20,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Logo />
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 text-sm">Kebijakan Privasi</span>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/terms" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Syarat &amp; Ketentuan</Link>
            <Link href="/dashboard" className="text-sky-400 hover:text-sky-300 text-xs transition-colors">Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">

          {/* Sidebar navigasi */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-1">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Daftar Isi</p>
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`}
                  className="block text-slate-400 hover:text-white text-xs py-1.5 transition-colors leading-tight">
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Konten */}
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Kebijakan Privasi</h1>
              <p className="text-slate-400 text-sm mt-2">
                Terakhir diperbarui: {LAST_UPDATED} · Berlaku untuk semua pengguna ThreeTop
              </p>
            </div>

            {/* Pengantar */}
            <div className="rounded-2xl border border-emerald-500/20 p-6 bg-emerald-500/5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Privasi Pengguna adalah prioritas kami. ThreeTop tidak menjual data Pengguna kepada pihak ketiga
                  dan hanya menggunakan data yang benar-benar diperlukan untuk menjalankan layanan.
                  Dokumen ini menjelaskan secara transparan bagaimana kami mengelola data Pengguna.
                </p>
              </div>
            </div>

            {/* Sections */}
            {SECTIONS.map((section) => (
              <div key={section.id} id={section.id}
                className="rounded-2xl border border-slate-700/50 p-6 scroll-mt-20"
                style={{ background: 'rgba(15,20,35,0.8)' }}>
                <h2 className="text-white font-semibold text-lg mb-4">{section.title}</h2>
                <ul className="space-y-3">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 shrink-0 mt-2" />
                      <p className="text-slate-400 text-sm leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Footer */}
            <div className="rounded-2xl border border-slate-700/30 p-6 text-center" style={{ background: 'rgba(15,20,35,0.6)' }}>
              <p className="text-slate-400 text-sm mb-2">
                Pertanyaan tentang privasi? Hubungi kami di{' '}
                <a href="mailto:privacy@threetop.id" className="text-sky-400 hover:text-sky-300 transition-colors">
                  privacy@threetop.id
                </a>
              </p>
              <p className="text-slate-600 text-xs mb-5">Versi {LAST_UPDATED}</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/terms"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-slate-700/50 hover:text-white hover:border-slate-600 transition-colors">
                  Syarat &amp; Ketentuan
                </Link>
                <Link href="/dashboard"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                  Kembali ke Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
