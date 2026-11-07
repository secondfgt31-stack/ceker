#!/data/data/com.termux/files/usr/bin/bash
# ========================================================
# Script Perbaikan Error CANNOT LINK EXECUTABLE di Termux
# ========================================================

echo "🔧 Memperbaiki pustaka libc++ dan Node.js di Termux..."

# 1. Update paket dan sinkronkan pustaka C++ (libc++)
pkg update -y && pkg upgrade -y
pkg install libc++ -y

# 2. Reinstall Node.js agar tertaut ke libc++ yang baru
pkg reinstall nodejs-lts -y || pkg reinstall nodejs -y

echo ""
echo "✅ Perbaikan selesai! Coba ketik:"
echo "   node -v"
echo "Jika muncul v18/v20/v22, Anda sudah bisa menjalankan 'npm install' lagi!"
