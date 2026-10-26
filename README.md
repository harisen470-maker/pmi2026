# Penjaga Pecahan

Media belajar pecahan interaktif bergaya pixel art untuk pelajar. Pemain dapat mengamati representasi pecahan, menyelesaikan misi kuis, dan memainkan platformer Ekspedisi Puncak dengan delapan area, slime, serta platform bergerak.

## Tujuan

- Memahami pembilang, penyebut, pecahan senilai, penjumlahan, pengurangan, perkalian, dan pembagian.
- Menghubungkan pecahan dengan gambar lingkaran, balok, garis bilangan, desimal, dan persen.
- Menaklukkan 8 area platformer dan mengumpulkan kristal yang nilainya sama dengan target.

## Kontrol

- **Spasi / Enter**: mulai dari layar judul.
- **1–4**: memilih jawaban kuis.
- **H**: membuka petunjuk kuis.
- **A / D atau panah kiri / kanan**: berlari di mini-game.
- **Spasi / W / panah atas**: melompat; injak slime dari atas untuk mengalahkannya.
- **Esc**: jeda atau menutup dialog.
- **M**: mengaktifkan atau mematikan suara.
- Pada layar sentuh, gunakan tombol **Kiri** dan **Kanan**.

## Menjalankan proyek

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
npm run preview
```

## Sistem utama

- Lab Pecahan dengan pengatur pembilang dan penyebut serta tiga representasi visual.
- Lima misi berjenjang, masing-masing berisi tiga soal, petunjuk, pembahasan, hati, skor, kombo, dan bintang.
- Platformer Ekspedisi Puncak dengan delapan area, tiga hati, kombo, slime, platform bergerak, bonus tanpa cedera, checkpoint pemulihan hati, kemenangan, kekalahan, jeda, dan restart.
- Efek suara Web Audio tanpa aset eksternal.
- Panorama kerajaan langit 16-bit tersimpan lokal di `public/assets/langit-pecahan.png`, dengan parallax awan, partikel cahaya, dan fallback prosedural melalui `src/game/sky.ts`.
- Karakter, platform, musuh, dan efek digambar dengan Canvas 2D beresolusi rendah tanpa aset eksternal.
- Penyimpanan progres lokal melalui `localStorage`; data hanya berada di browser yang digunakan.

## Verifikasi

```bash
npm run build
CHROMIUM_PATH=/usr/bin/chromium node scripts/verify-game.mjs
```
