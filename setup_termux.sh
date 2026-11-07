#!/data/data/com.termux/files/usr/bin/bash
# ===================================================================
# Skrip Otomatisasi Instalasi Playwright Gmail Checker di Termux HP
# ===================================================================

set -e

echo ""
echo "🚀 [1/5] Memperbarui sistem Termux..."
pkg update -y && pkg upgrade -y

echo ""
echo "📱 [2/5] Mengatur izin akses penyimpanan internal HP..."
termux-setup-storage || true

echo ""
echo "📦 [3/5] Memasang Node.js LTS, Git, x11-repo, dan Chromium..."
pkg install nodejs-lts git x11-repo -y
pkg install chromium -y

echo ""
echo "📚 [4/5] Memasang dependensi npm (Playwright + Stealth)..."
npm install --production

echo ""
echo "==================================================================="
echo "✅ [5/5] INSTALASI SELESAI & SIAP DIGUNAKAN!"
echo "==================================================================="
echo "1. Edit daftar email di file emails.txt:  nano emails.txt"
echo "2. Jalankan pengecekan:                  node gmail_batch_termux.js"
echo "   atau cukup ketik:                     bash run.sh"
echo "==================================================================="
