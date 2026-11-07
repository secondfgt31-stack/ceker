# 📱 Playwright Gmail Checker - Termux Android Edition

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-v1.49%2B-blue.svg)](https://playwright.dev/)
[![Platform](https://img.shields.io/badge/Platform-Termux%20Android%20%7C%20Linux%20%7C%20PC-orange.svg)]()

Skrip otomasi untuk mengecek beberapa akun Gmail sekaligus langsung dari **HP Android (Termux)** tanpa memerlukan PC atau laptop!

Skrip ini akan memasukkan email, mengklik tombol Berikutnya (*Next*), lalu mendeteksi elemen apa yang muncul:
- ✅ **Form Masukkan Kata Sandi (Password):** Akun valid dan siap login.
- ⚠️ **Verifikasi Bukan Robot / CAPTCHA:** Google meminta konfirmasi manusia.
- ❌ **Akun Tidak Ditemukan:** Email salah atau belum terdaftar di Google.

---

## ⚡ Cara Menjalankan di Termux (Hanya 1 Baris Perintah)

Buka aplikasi **Termux** di HP Android Anda, lalu salin dan tempel perintah berikut:

```bash
pkg install git nodejs-lts x11-repo chromium -y && git clone https://github.com/USERNAME/REPO_NAME.git && cd REPO_NAME && bash setup_termux.sh
```
*(Ganti `USERNAME/REPO_NAME` dengan link repository GitHub Anda)*

---

## 📝 Cara Manual Langkah Demi Langkah di Termux

Jika Anda ingin menjalankan langkah demi langkah:

### 1. Persiapkan Termux
```bash
# Update sistem Termux
pkg update && pkg upgrade -y

# Beri izin akses penyimpanan HP (Klik 'Izinkan' saat pop-up muncul di layar HP)
termux-setup-storage

# Install Git, Node.js, dan Chromium native Termux
pkg install git nodejs-lts x11-repo chromium -y
```

### 2. Clone Repository Ini
```bash
git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME
npm install
```

### 3. Edit Daftar Email
Buka file `emails.txt` dan masukkan daftar email yang ingin dicek:
```bash
nano emails.txt
```
*(Ketik email Anda 1 per baris, lalu simpan dengan menekan tombol `CTRL + O`, `Enter`, lalu `CTRL + X`)*

### 4. Jalankan Skrip
```bash
node gmail_batch_termux.js
```
atau cukup:
```bash
bash run.sh
```

---

## 📊 Di Mana Hasil Pengecekan Disimpan?

Setelah skrip selesai berjalan di Termux:
- 📁 **File CSV Hasil:** `/sdcard/Download/hasil_batch_gmail.csv`
- 📸 **Folder Screenshot:** `/sdcard/Download/gmail_screenshots/`

Anda bisa langsung membuka aplikasi **File Manager / Pengelola File** bawaan HP Anda > Buka folder **Download** > File `hasil_batch_gmail.csv` bisa langsung dibuka dengan aplikasi **Excel**, **WPS Office**, atau **Google Spreadsheet** di HP Anda!

---

## ⚙️ Mengapa Menggunakan Chromium Termux?
Playwright standar mengunduh browser Chromium versi PC (x86_64) yang tidak bisa berjalan di prosesor HP (ARM64 / aarch64). Proyek ini otomatis mendeteksi binary Chromium Termux di `/data/data/com.termux/files/usr/bin/chromium` dan mengaktifkan flag penghemat RAM Android:
- `--no-sandbox`
- `--disable-gpu`
- `--single-process` (mencegah Termux kehabisan memori RAM)

---

## 📜 Lisensi
MIT License. Dibuat untuk tujuan edukasi dan testing otomasi.
