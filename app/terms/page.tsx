import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — ThreeTop',
  description: 'Syarat dan ketentuan penggunaan layanan ThreeTop',
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
    id: 'definisi',
    title: '1. Definisi',
    content: [
      '"ThreeTop" mengacu pada platform layanan top up game digital yang dikelola oleh tim ThreeTop.',
      '"Pengguna" adalah setiap individu yang mengakses, mendaftar, atau menggunakan layanan ThreeTop.',
      '"Layanan" mencakup seluruh fitur, fungsi, dan konten yang tersedia di platform ThreeTop, termasuk namun tidak terbatas pada top up mata uang game, manajemen akun, dan riwayat transaksi.',
      '"Transaksi" adalah setiap proses pembelian produk digital melalui platform ThreeTop.',
      '"Item Virtual" adalah mata uang dalam game atau produk digital lainnya yang dibeli melalui ThreeTop.',
    ],
  },
  {
    id: 'penerimaan',
    title: '2. Penerimaan Syarat',
    content: [
      'Dengan mengakses atau menggunakan layanan ThreeTop, Pengguna menyatakan bahwa telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan ini.',
      'Jika Pengguna tidak menyetujui syarat dan ketentuan ini, Pengguna tidak diperkenankan untuk menggunakan layanan ThreeTop.',
      'Pengguna yang mendaftar harus berusia minimal 13 tahun. Pengguna di bawah usia 18 tahun wajib mendapatkan persetujuan dari orang tua atau wali.',
      'Syarat dan ketentuan ini dapat diperbarui sewaktu-waktu. Perubahan akan diberitahukan melalui website dan berlaku sejak tanggal publikasi.',
    ],
  },
  {
    id: 'akun',
    title: '3. Akun Pengguna',
    content: [
      'Setiap Pengguna hanya diperbolehkan memiliki satu akun aktif. Pembuatan beberapa akun untuk tujuan apapun tidak diperkenankan.',
      'Pengguna bertanggung jawab penuh atas keamanan akun, termasuk menjaga kerahasiaan password dan tidak membagikan akses kepada pihak lain.',
      'ThreeTop tidak akan pernah meminta password akun Pengguna melalui media apapun.',
      'Pengguna wajib memberikan informasi yang akurat dan terkini saat mendaftar. Penggunaan identitas palsu adalah pelanggaran syarat ini.',
      'Pengguna wajib segera menghubungi ThreeTop jika mendeteksi akses tidak sah pada akunnya.',
      'ThreeTop berhak menangguhkan atau menghapus akun yang melanggar syarat ini tanpa pemberitahuan terlebih dahulu.',
    ],
  },
  {
    id: 'layanan',
    title: '4. Layanan Top Up',
    content: [
      'ThreeTop beroperasi sebagai reseller produk digital yang bekerja sama dengan supplier berlisensi. ThreeTop bukan publisher atau developer game.',
      'Ketersediaan produk bergantung pada stok dan ketersediaan dari supplier. ThreeTop tidak menjamin ketersediaan semua produk setiap saat.',
      'Pengguna wajib memastikan kebenaran data akun game (User ID, Server ID, atau informasi lain yang diminta) sebelum melakukan transaksi.',
      'Proses pengiriman item virtual umumnya berlangsung secara otomatis dalam hitungan detik hingga 15 menit. Dalam kondisi tertentu dapat membutuhkan waktu lebih lama.',
      'ThreeTop tidak bertanggung jawab atas keterlambatan yang disebabkan oleh gangguan server game, pemeliharaan sistem, atau faktor di luar kendali ThreeTop.',
    ],
  },
  {
    id: 'pembayaran',
    title: '5. Pembayaran',
    content: [
      'Seluruh pembayaran diproses melalui Midtrans, payment gateway berlisensi Bank Indonesia. ThreeTop tidak menyimpan data kartu kredit atau informasi rekening bank Pengguna.',
      'Harga yang tertera di platform adalah harga final termasuk biaya layanan. ThreeTop berhak mengubah harga sewaktu-waktu tanpa pemberitahuan sebelumnya.',
      'Pembayaran yang telah berhasil tidak dapat dibatalkan kecuali terdapat kegagalan proses di pihak ThreeTop.',
      'Pengguna bertanggung jawab atas seluruh pajak atau biaya tambahan yang mungkin dikenakan oleh bank atau penyedia layanan pembayaran.',
      'Transaksi yang ditandai sebagai mencurigakan oleh sistem keamanan dapat ditangguhkan untuk verifikasi lebih lanjut.',
    ],
  },
  {
    id: 'refund',
    title: '6. Kebijakan Refund & Pembatalan',
    content: [
      'Refund atau pengembalian dana dapat diproses dalam kondisi berikut: (a) item tidak terkirim ke akun game dalam 1×24 jam sejak pembayaran dikonfirmasi; (b) terjadi kesalahan sistem dari pihak ThreeTop atau supplier.',
      'Refund TIDAK dapat diproses jika: (a) kegagalan disebabkan oleh kesalahan data yang dimasukkan Pengguna; (b) akun game Pengguna diblokir oleh publisher; (c) Pengguna lupa atau salah memasukkan User ID atau Server ID.',
      'Pengajuan refund dilakukan dengan menghubungi customer service ThreeTop dengan menyertakan: Order ID, bukti pembayaran, dan tangkapan layar akun game.',
      'Proses verifikasi refund membutuhkan waktu 3-7 hari kerja. Pengembalian dana dilakukan ke metode pembayaran yang sama dengan transaksi asli.',
      'ThreeTop berhak menolak pengajuan refund yang tidak memenuhi syarat di atas.',
    ],
  },
  {
    id: 'larangan',
    title: '7. Larangan Penggunaan',
    content: [
      'Pengguna dilarang menggunakan layanan ThreeTop untuk tujuan yang melanggar hukum, termasuk pencucian uang, penipuan, atau pembiayaan kegiatan ilegal.',
      'Pengguna dilarang melakukan transaksi menggunakan kartu kredit atau rekening yang bukan miliknya tanpa izin pemilik yang sah.',
      'Pengguna dilarang memanipulasi harga, memanfaatkan bug atau celah sistem, atau melakukan tindakan yang merugikan ThreeTop atau pengguna lain.',
      'Pengguna dilarang menggunakan script otomatis, bot, atau perangkat lunak pihak ketiga untuk mengakses layanan ThreeTop tanpa izin tertulis.',
      'Pengguna dilarang menjual kembali produk yang dibeli melalui ThreeTop tanpa izin tertulis dari ThreeTop.',
    ],
  },
  {
    id: 'kekayaan-intelektual',
    title: '8. Kekayaan Intelektual',
    content: [
      'Seluruh konten pada platform ThreeTop, termasuk logo, desain, teks, dan kode program, adalah milik ThreeTop dan dilindungi oleh hukum kekayaan intelektual yang berlaku.',
      'Pengguna tidak diperkenankan menggandakan, mendistribusikan, atau memodifikasi konten ThreeTop tanpa izin tertulis.',
      'Nama game, karakter, dan mata uang virtual adalah milik masing-masing publisher dan developer game yang bersangkutan.',
    ],
  },
  {
    id: 'batasan-tanggung-jawab',
    title: '9. Batasan Tanggung Jawab',
    content: [
      'ThreeTop tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan layanan.',
      'Tanggung jawab maksimal ThreeTop kepada Pengguna dibatasi sebesar nilai transaksi yang menjadi sumber perselisihan.',
      'ThreeTop tidak menjamin layanan akan selalu tersedia tanpa gangguan. Pemeliharaan sistem dijadwalkan dan akan diinformasikan sebelumnya.',
      'ThreeTop tidak bertanggung jawab atas kerugian yang timbul akibat akses tidak sah ke akun Pengguna yang disebabkan oleh kelalaian Pengguna sendiri.',
    ],
  },
  {
    id: 'penyelesaian-sengketa',
    title: '10. Penyelesaian Sengketa',
    content: [
      'Syarat dan ketentuan ini tunduk pada hukum Republik Indonesia.',
      'Segala sengketa yang timbul akan diselesaikan secara musyawarah mufakat terlebih dahulu antara Pengguna dan ThreeTop.',
      'Jika penyelesaian musyawarah tidak tercapai dalam 30 hari, sengketa akan diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI) atau pengadilan yang berwenang di Indonesia.',
      'Pengguna menyetujui bahwa yurisdiksi eksklusif untuk penyelesaian sengketa adalah di wilayah hukum Indonesia.',
    ],
  },
  {
    id: 'kontak',
    title: '11. Hubungi Kami',
    content: [
      'Jika memiliki pertanyaan atau keluhan terkait syarat dan ketentuan ini, Pengguna dapat menghubungi ThreeTop melalui:',
      'Email: support@threetop.id',
      'Customer Service tersedia Senin – Minggu, pukul 08.00 – 22.00 WIB.',
      'ThreeTop berkomitmen untuk merespons setiap pertanyaan dalam 1×24 jam kerja.',
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080C14]">
      {/* Header */}
      <div className="border-b border-slate-800/60 sticky top-0 z-10" style={{ background: 'rgba(8,12,20,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Logo />
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 text-sm">Syarat &amp; Ketentuan</span>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/privacy" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Kebijakan Privasi</Link>
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
              <h1 className="text-3xl font-bold text-white">Syarat &amp; Ketentuan</h1>
              <p className="text-slate-400 text-sm mt-2">
                Terakhir diperbarui: {LAST_UPDATED} · Berlaku untuk semua pengguna ThreeTop
              </p>
            </div>

            {/* Pengantar */}
            <div className="rounded-2xl border border-sky-500/20 p-6 bg-sky-500/5">
              <p className="text-slate-300 text-sm leading-relaxed">
                Dokumen ini mengatur hubungan hukum antara ThreeTop dan Pengguna layanan platform top up game kami.
                Mohon baca seluruh ketentuan dengan seksama. Dengan mendaftar atau menggunakan layanan ThreeTop,
                Pengguna dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan yang berlaku di bawah ini.
              </p>
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
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-500/60 shrink-0 mt-2" />
                      <p className="text-slate-400 text-sm leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Footer */}
            <div className="rounded-2xl border border-slate-700/30 p-6 text-center" style={{ background: 'rgba(15,20,35,0.6)' }}>
              <p className="text-slate-400 text-sm mb-2">
                Dengan menggunakan ThreeTop, kamu menyetujui seluruh syarat &amp; ketentuan di atas.
              </p>
              <p className="text-slate-600 text-xs mb-5">Versi {LAST_UPDATED}</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/privacy"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-slate-700/50 hover:text-white hover:border-slate-600 transition-colors">
                  Kebijakan Privasi
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
