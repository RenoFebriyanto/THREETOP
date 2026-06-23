# Banner Promosi

Letakkan file gambar banner di folder ini.

## File Default (sudah dikonfigurasi di carousel)

| File | Untuk |
|------|-------|
| `banner-mobile-legends.jpg` | Slide 1 — Mobile Legends |
| `banner-free-fire.jpg` | Slide 2 — Free Fire |
| `banner-pubg-mobile.jpg` | Slide 3 — PUBG Mobile |

## Spesifikasi yang Disarankan

- Format: JPG atau PNG
- Ukuran ideal: **1200 x 400px** (ratio 3:1)
- Ukuran file: max 300KB per banner (gunakan kompresi)
- Background: gelap lebih baik karena teks overlay berwarna putih

## Cara Tambah/Ubah Slide

Edit array `DEFAULT_SLIDES` di `components/ui/PromoCarousel.tsx`,
atau passing prop `slides` dari halaman untuk override default:

```tsx
// Contoh custom slides di halaman lain
<PromoCarousel slides={[
  {
    id: 'ramadan-sale',
    image: '/banners/ramadan-sale.jpg',
    title: 'Ramadan Sale',
    subtitle: 'Diskon spesial untuk semua game',
    badge: 'LIMITED',
    badgeColor: 'bg-green-500',
    href: '/dashboard/topup',
    cta: 'Lihat Promo',
  },
]} />
```

## Selama Banner Belum Ada

Carousel tetap tampil dengan gradient fallback + teks judul game.
Begitu file JPG diletakkan di sini, langsung muncul tanpa restart.
