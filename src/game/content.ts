export type VisualKind = 'pizza' | 'bars' | 'kpk' | 'ribbon' | 'recipe' | 'bottle' | 'candy'

export type Question = {
  prompt: string
  context?: string
  options: string[]
  answer: number
  hint: string
  explanation: string
  visual: VisualKind
  fraction?: [number, number]
  compare?: [number, number]
  operation?: '=' | '+' | '−' | '×' | '÷'
}

export type Level = {
  id: number
  name: string
  short: string
  icon: string
  color: string
  skill: string
  story: string
  questions: Question[]
}

export const levels: Level[] = [
  {
    id: 0, name: 'Desa Potongan', short: 'Konsep Dasar', icon: '◕', color: '#ff8a70', skill: 'Pembilang & penyebut',
    story: 'Bantu Nara membagi bekal secara adil. Kenali bagian yang diambil dan keseluruhan bagian!',
    questions: [
      { prompt: 'Tiga potong pizza diambil dari 8 potong sama besar. Pecahan yang menyatakan bagian tersebut adalah…', options: ['1/8', '3/8', '5/8', '8/3'], answer: 1, hint: 'Hitung bagian yang diarsir untuk pembilang, lalu seluruh bagian untuk penyebut.', explanation: 'Ada 3 bagian yang diambil dari total 8 bagian sama besar, jadi pecahannya 3/8.', visual: 'pizza', fraction: [3, 8] },
      { prompt: 'Pada pecahan 5/9, angka 9 disebut…', options: ['Pembilang', 'Penyebut', 'Faktor', 'Kelipatan'], answer: 1, hint: 'Angka di bawah garis menunjukkan banyak seluruh bagian.', explanation: 'Angka 9 berada di bawah garis pecahan dan menyatakan total bagian. Angka ini disebut penyebut.', visual: 'bars', fraction: [5, 9] },
      { prompt: 'Bentuk paling sederhana dari 6/12 adalah…', options: ['1/2', '1/3', '2/3', '3/4'], answer: 0, hint: 'FPB dari 6 dan 12 adalah 6. Bagi pembilang dan penyebut dengan 6.', explanation: '(6 ÷ 6)/(12 ÷ 6) = 1/2. Pembilang dan penyebut dibagi dengan bilangan yang sama.', visual: 'candy', fraction: [6, 12] },
    ],
  },
  {
    id: 1, name: 'Hutan Cermin', short: 'Pecahan Senilai', icon: '◇', color: '#9b8cff', skill: 'Mengali atau membagi sama rata',
    story: 'Pohon Cermin menggandakan potongan tanpa mengubah bagian. Temukan pasangan pecahan yang nilainya sama!',
    questions: [
      { prompt: 'Budi makan 1/2 pizza, Siti makan 2/4 pizza dengan ukuran sama. Siapa yang makan lebih banyak?', context: 'Pizza Budi dan Siti', options: ['Budi', 'Siti', 'Sama banyak', 'Tidak dapat ditentukan'], answer: 2, hint: 'Perhatikan luas daerah yang diarsir, bukan banyak potongannya.', explanation: '1/2 = 2/4 karena pembilang dan penyebut sama-sama dikali 2. Luas bagiannya sama.', visual: 'pizza', fraction: [1, 2], compare: [2, 4], operation: '=' },
      { prompt: 'Mengapa 1/3 senilai dengan 2/6?', options: ['Karena keduanya ditambah 1', 'Pembilang dan penyebut sama-sama dikali 2', 'Karena penyebutnya selalu genap', 'Karena pembilangnya berbeda'], answer: 1, hint: 'Coba kalikan 1 dan 3 dengan bilangan yang sama.', explanation: '1/3 × 2/2 = 2/6. Mengali pembilang dan penyebut dengan bilangan bukan nol yang sama tidak mengubah nilai.', visual: 'bars', fraction: [1, 3], compare: [2, 6], operation: '=' },
      { prompt: 'Pecahan yang senilai dengan 3/4 adalah…', options: ['4/5', '6/8', '6/12', '9/16'], answer: 1, hint: 'Cari hasil perkalian pembilang dan penyebut dengan faktor yang sama.', explanation: '3/4 × 2/2 = 6/8. Jadi 3/4 dan 6/8 senilai.', visual: 'bars', fraction: [3, 4], compare: [6, 8], operation: '=' },
    ],
  },
  {
    id: 2, name: 'Jembatan KPK', short: 'Tambah & Kurang', icon: '+', color: '#42c8b5', skill: 'Menyamakan penyebut',
    story: 'Jembatan hanya kuat jika penyebutnya sama. Gunakan KPK untuk menyatukan potongan!',
    questions: [
      { prompt: 'KPK dari 4 dan 6 adalah…', options: ['8', '12', '16', '24'], answer: 1, hint: 'Kelipatan 4: 4, 8, 12, … Kelipatan 6: 6, 12, …', explanation: 'Kelipatan persekutuan terkecil dari 4 dan 6 adalah 12.', visual: 'kpk' },
      { prompt: 'Hasil dari 1/4 + 2/3 adalah…', options: ['3/7', '11/12', '8/12', '3/12'], answer: 1, hint: 'Samakan penyebut menjadi 12 terlebih dahulu.', explanation: '1/4 = 3/12 dan 2/3 = 8/12. Jadi 3/12 + 8/12 = 11/12.', visual: 'bars', fraction: [1, 4], compare: [2, 3], operation: '+' },
      { prompt: 'Rian punya pita 3/4 m, lalu memakai 1/2 m. Sisa pita Rian adalah…', options: ['1/4 m', '2/4 m', '1/2 m', '1/8 m'], answer: 0, hint: 'Ubah 1/2 menjadi pecahan berpenyebut 4.', explanation: '3/4 − 1/2 = 3/4 − 2/4 = 1/4 meter.', visual: 'ribbon', fraction: [3, 4], compare: [1, 2] },
    ],
  },
  {
    id: 3, name: 'Dapur Ajaib', short: 'Kali & Bagi', icon: '×', color: '#ffbf47', skill: 'Operasi langsung & kebalikan',
    story: 'Racik ramuan dengan takaran tepat. Kalikan langsung, dan balik pecahan kedua saat membagi!',
    questions: [
      { prompt: 'Hasil dari 2/3 × 3/5 adalah…', options: ['6/8', '2/5', '5/8', '9/10'], answer: 1, hint: 'Kalikan pembilang dengan pembilang, penyebut dengan penyebut.', explanation: '2/3 × 3/5 = (2×3)/(3×5) = 6/15 = 2/5.', visual: 'recipe', fraction: [2, 3], compare: [3, 5], operation: '×' },
      { prompt: 'Hasil dari 2/3 ÷ 4/5 adalah…', options: ['8/15', '5/6', '6/5', '3/10'], answer: 1, hint: 'Ubah pembagian menjadi perkalian dengan kebalikan 4/5.', explanation: '2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6.', visual: 'recipe', fraction: [2, 3], compare: [4, 5], operation: '÷' },
      { prompt: 'Ibu perlu 2/3 cangkir gula untuk 1 resep. Untuk 3/4 resep, gula yang diperlukan adalah…', options: ['5/7 cangkir', '1/2 cangkir', '8/9 cangkir', '1 cangkir'], answer: 1, hint: 'Bagian dari resep berarti operasi perkalian: 2/3 × 3/4.', explanation: '2/3 × 3/4 = 6/12 = 1/2 cangkir gula.', visual: 'recipe', fraction: [2, 3], compare: [3, 4], operation: '×' },
    ],
  },
  {
    id: 4, name: 'Menara Penjaga', short: 'Misi Campuran', icon: '★', color: '#63a9ff', skill: 'Masalah kontekstual',
    story: 'Ujian terakhir menanti! Pilih operasi yang tepat dan pulihkan Kristal Pecahan.',
    questions: [
      { prompt: 'Sebuah wadah berisi 4½ liter air. Setiap botol memuat 3/4 liter. Berapa botol yang terisi penuh?', options: ['5 botol', '6 botol', '7 botol', '8 botol'], answer: 1, hint: 'Ubah 4½ menjadi 9/2, lalu bagi dengan 3/4.', explanation: '4½ ÷ 3/4 = 9/2 × 4/3 = 36/6 = 6 botol.', visual: 'bottle' },
      { prompt: 'Lani membaca 2/5 buku pada pagi hari dan 1/3 buku pada sore hari. Bagian yang sudah dibaca adalah…', options: ['3/8', '5/8', '11/15', '2/15'], answer: 2, hint: 'Jumlahkan dengan penyebut 15.', explanation: '2/5 + 1/3 = 6/15 + 5/15 = 11/15 bagian buku.', visual: 'bars', fraction: [2, 5], compare: [1, 3], operation: '+' },
      { prompt: 'Sebuah taman seluas 5/6 bagian telah ditanami. Sebanyak 3/5 dari bagian yang ditanami adalah bunga. Bagian seluruh taman yang berbunga adalah…', options: ['1/2', '2/5', '8/11', '5/11'], answer: 0, hint: '“3/5 dari 5/6” berarti 3/5 × 5/6.', explanation: '3/5 × 5/6 = 15/30 = 1/2 bagian seluruh taman.', visual: 'candy', fraction: [3, 5], compare: [5, 6], operation: '×' },
    ],
  },
]

export const lessons = [
  { title: 'Pembilang & Penyebut', formula: 'a/b', text: 'Pembilang (a) adalah bagian yang diambil. Penyebut (b) adalah seluruh bagian sama besar; b ≠ 0.' },
  { title: 'Pecahan Senilai', formula: 'a/b = (a×m)/(b×m)', text: 'Kalikan atau bagi pembilang dan penyebut dengan bilangan bukan nol yang sama.' },
  { title: 'Tambah & Kurang', formula: 'a/b + c/d = (a×d + c×b)/(b×d)', text: 'Samakan penyebut dengan KPK. Setelah itu, jumlahkan atau kurangkan pembilangnya.' },
  { title: 'Perkalian', formula: 'a/b × c/d = (a×c)/(b×d)', text: 'Kalikan pembilang dengan pembilang dan penyebut dengan penyebut. Sederhanakan hasilnya.' },
  { title: 'Pembagian', formula: 'a/b ÷ c/d = a/b × d/c', text: 'Pertahankan pecahan pertama, ubah bagi menjadi kali, lalu balik pecahan kedua.' },
]
