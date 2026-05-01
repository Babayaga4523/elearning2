# Seeder Kursus IPA (Ilmu Pengetahuan Alam)

## Deskripsi
Seeder ini membuat kursus lengkap tentang Dasar-Dasar Ilmu Pengetahuan Alam dengan:
- **5 Modul Pembelajaran** (Video)
- **Pre-Test** dengan 5 soal
- **Post-Test** dengan 10 soal
- Semua jawaban benar sudah ditandai dengan `isCorrect: true`

## Konten Kursus

### Modul Pembelajaran
1. **Pengenalan Fisika Dasar** (30 menit)
   - Konsep gerak, gaya, dan energi

2. **Konsep Kimia Fundamental** (35 menit)
   - Struktur atom, tabel periodik, ikatan kimia

3. **Biologi dan Kehidupan** (40 menit)
   - Sel, jaringan, sistem organ

4. **Ekosistem dan Lingkungan** (25 menit)
   - Hubungan makhluk hidup dengan lingkungan

5. **Energi dan Perubahannya** (30 menit)
   - Berbagai bentuk energi dan konversi

**Total Durasi:** 160 menit (2 jam 40 menit)

### Pre-Test (5 Soal)
1. Apa yang dimaksud dengan gaya dalam fisika?
   - ✅ **Tarikan atau dorongan yang dapat mengubah keadaan gerak benda**
   - ❌ Kecepatan benda yang bergerak
   - ❌ Massa benda dikali percepatannya
   - ❌ Energi yang dimiliki benda

2. Unsur kimia dengan simbol 'O' adalah?
   - ✅ **Oksigen**
   - ❌ Osmium
   - ❌ Emas (Gold)
   - ❌ Ozon

3. Bagian terkecil dari makhluk hidup yang masih dapat menjalankan fungsi kehidupan adalah?
   - ✅ **Sel**
   - ❌ Jaringan
   - ❌ Organ
   - ❌ Molekul

4. Proses fotosintesis pada tumbuhan menghasilkan?
   - ✅ **Glukosa dan Oksigen**
   - ❌ Karbon dioksida dan Air
   - ❌ Protein dan Lemak
   - ❌ Nitrogen dan Hidrogen

5. Satuan Internasional (SI) untuk massa adalah?
   - ✅ **Kilogram (kg)**
   - ❌ Gram (g)
   - ❌ Newton (N)
   - ❌ Pound (lb)

**Pengaturan Pre-Test:**
- Durasi: 15 menit
- Passing Score: 60%
- Max Attempts: 2 kali
- Randomize Questions: Ya
- Randomize Options: Ya

### Post-Test (10 Soal)
1. Hukum Newton I menyatakan bahwa benda akan tetap diam atau bergerak lurus beraturan jika?
   - ✅ **Tidak ada gaya yang bekerja atau resultan gaya sama dengan nol**
   - ❌ Ada gaya yang bekerja pada benda
   - ❌ Benda memiliki massa yang besar
   - ❌ Benda bergerak dengan kecepatan tinggi

2. Ikatan kimia yang terjadi karena serah terima elektron disebut?
   - ✅ **Ikatan ion**
   - ❌ Ikatan kovalen
   - ❌ Ikatan hidrogen
   - ❌ Ikatan logam

3. Organel sel yang berfungsi sebagai pusat pengendali seluruh kegiatan sel adalah?
   - ✅ **Nukleus (inti sel)**
   - ❌ Mitokondria
   - ❌ Ribosom
   - ❌ Lisosom

4. Dalam ekosistem, organisme yang dapat membuat makanan sendiri disebut?
   - ✅ **Produsen (autotrof)**
   - ❌ Konsumen (heterotrof)
   - ❌ Dekomposer
   - ❌ Predator

5. Energi yang dimiliki benda karena kedudukannya (ketinggian) disebut?
   - ✅ **Energi potensial**
   - ❌ Energi kinetik
   - ❌ Energi mekanik
   - ❌ Energi panas

6. Rumus kimia untuk air adalah?
   - ✅ **H₂O**
   - ❌ CO₂
   - ❌ O₂
   - ❌ H₂SO₄

7. Proses pernapasan sel yang menghasilkan energi (ATP) terjadi di?
   - ✅ **Mitokondria**
   - ❌ Kloroplas
   - ❌ Nukleus
   - ❌ Retikulum endoplasma

8. Perpindahan panas tanpa melalui zat perantara disebut?
   - ✅ **Radiasi**
   - ❌ Konduksi
   - ❌ Konveksi
   - ❌ Isolasi

9. Rantai makanan dimulai dari?
   - ✅ **Produsen (tumbuhan hijau)**
   - ❌ Konsumen tingkat I (herbivora)
   - ❌ Konsumen tingkat II (karnivora)
   - ❌ Dekomposer

10. Perubahan wujud dari padat menjadi gas disebut?
    - ✅ **Sublimasi**
    - ❌ Penguapan
    - ❌ Pencairan
    - ❌ Pembekuan

**Pengaturan Post-Test:**
- Durasi: 20 menit
- Passing Score: 70%
- Max Attempts: 3 kali
- Randomize Questions: Ya
- Randomize Options: Ya

## Cara Menjalankan Seeder

### 1. Pastikan Database Sudah Siap
```bash
npx prisma migrate dev
```

### 2. Jalankan Seeder Utama Terlebih Dahulu (jika belum)
```bash
npx prisma db seed
```

### 3. Jalankan Seeder IPA
```bash
npm run seed:ipa
```

Atau menggunakan npx:
```bash
npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed-ipa.ts
```

## Output yang Diharapkan
```
Creating IPA Course...
✅ IPA Course created successfully!
Course ID: [generated-id]
Title: Dasar-Dasar Ilmu Pengetahuan Alam
Modules: 5 modules created
Pre-Test: 5 questions
Post-Test: 10 questions

Jawaban yang benar sudah ditandai dengan isCorrect: true
```

## Catatan Penting
- Seeder ini memerlukan user dengan role ADMIN yang sudah ada di database
- Jika belum ada admin, jalankan seeder utama terlebih dahulu: `npx prisma db seed`
- Kursus akan dibuat dengan status `isPublished: true` dan `isVisible: true`
- Deadline duration: 14 hari setelah enrollment
- Semua modul sudah dalam status published
- Pre-Test dan Post-Test sudah dikonfigurasi dengan pengacakan soal dan opsi

## Troubleshooting

### Error: "Admin user not found"
**Solusi:** Jalankan seeder utama terlebih dahulu
```bash
npx prisma db seed
```

### Error: "Category already exists"
**Solusi:** Ini normal, seeder akan menggunakan kategori yang sudah ada

### Error: "Module compilation failed"
**Solusi:** Pastikan ts-node sudah terinstall
```bash
npm install -D ts-node
```

## Struktur Data yang Dibuat

```
Course: Dasar-Dasar Ilmu Pengetahuan Alam
├── Category: Ilmu Pengetahuan Alam
├── Modules (5)
│   ├── Pengenalan Fisika Dasar
│   ├── Konsep Kimia Fundamental
│   ├── Biologi dan Kehidupan
│   ├── Ekosistem dan Lingkungan
│   └── Energi dan Perubahannya
└── Tests (2)
    ├── Pre-Test (5 questions, 4 options each)
    └── Post-Test (10 questions, 4 options each)
```

## Penggunaan Setelah Seeding
1. Login sebagai Admin di `/admin`
2. Lihat kursus IPA di daftar kursus
3. Enroll karyawan ke kursus
4. Karyawan dapat mengakses modul dan mengerjakan test
5. Sistem akan otomatis menilai jawaban berdasarkan `isCorrect: true`
