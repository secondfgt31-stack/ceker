import React, { useState } from 'react';
import { 
  Smartphone, 
  Terminal, 
  Copy, 
  Check, 
  AlertTriangle, 
  Layers, 
  Download, 
  FolderDown, 
  Sparkles, 
  Cpu, 
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export const TermuxGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const nativeTermuxCommands = `# 1. Update paket Termux ke versi terbaru
pkg update && pkg upgrade -y

# 2. Beri izin akses penyimpanan HP (agar screenshot bisa dilihat di Galeri/Download)
termux-setup-storage

# 3. Install Node.js LTS, Git, dan repository X11
pkg install nodejs-lts git x11-repo -y

# 4. Install Chromium versi native Android Termux
pkg install chromium -y

# 5. Buat folder proyek dan pasang library Playwright
mkdir -p ~/gmail-checker && cd ~/gmail-checker
npm init -y
npm install playwright playwright-extra puppeteer-extra-plugin-stealth

# 6. Buat skrip (atau unduh file yang sudah dibuat)
# Lalu jalankan skrip:
node gmail_batch_termux.js`;

  const prootUbuntuCommands = `# METODE PROOT UBUNTU (Paling stabil, 100% mirip PC Linux)

# 1. Pasang proot-distro
pkg update -y && pkg install proot-distro -y

# 2. Pasang sistem operasi Ubuntu di dalam Termux
proot-distro install ubuntu

# 3. Masuk ke lingkungan Ubuntu
proot-distro login ubuntu

# 4. Di dalam Ubuntu, pasang Node.js & Chromium:
apt update && apt upgrade -y
apt install -y nodejs npm chromium-browser libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# 5. Siapkan proyek
mkdir -p ~/checker && cd ~/checker
npm init -y
npm install playwright playwright-extra puppeteer-extra-plugin-stealth

# 6. Jalankan skrip di dalam Ubuntu:
node gmail_batch_termux.js`;

  const oneClickScript = `#!/data/data/com.termux/files/usr/bin/bash
# Skrip Otomatisasi Setup Termux untuk Playwright Gmail Checker
set -e

echo "🚀 [1/5] Memperbarui paket Termux..."
pkg update -y && pkg upgrade -y

echo "📱 [2/5] Mengatur izin penyimpanan internal..."
termux-setup-storage || true

echo "📦 [3/5] Memasang Node.js, Git, X11 repo, dan Chromium..."
pkg install nodejs-lts git x11-repo -y
pkg install chromium -y

echo "📁 [4/5] Menyiapkan direktori proyek..."
mkdir -p ~/gmail-checker && cd ~/gmail-checker
npm init -y
npm install playwright playwright-extra puppeteer-extra-plugin-stealth

echo "✅ [5/5] Instalasi selesai!"
echo "Lokasi Chromium Anda: /data/data/com.termux/files/usr/bin/chromium"
echo "Ketik 'cd ~/gmail-checker && node gmail_batch_termux.js' untuk menjalankan!"`;

  return (
    <div className="space-y-6">
      {/* Hero Termux Alert */}
      <div className="p-5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-blue-950/60 border border-emerald-500/40 rounded-2xl shadow-xl flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
          <Smartphone className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Bisa Berjalan di HP Android (Termux)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Tanpa Perlu PC / Laptop
            </span>
          </div>
          <h3 className="text-base font-semibold text-white">
            Solusi Menjalankan Playwright di HP Menggunakan Chromium Termux
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Perintah standar <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">npx playwright install</code> biasanya gagal di Termux karena Playwright resmi hanya menyediakan binary untuk prosesor PC biasa. Di HP, kita menggunakan <strong>Chromium bawaan Android Termux</strong> (<code className="text-cyan-300 font-mono">/data/data/com.termux/files/usr/bin/chromium</code>) dengan flag khusus Android seperti <code className="text-amber-300 font-mono">--no-sandbox</code> dan <code className="text-amber-300 font-mono">--single-process</code>.
          </p>
        </div>
      </div>

      {/* SOLUSI ERROR: CANNOT LINK EXECUTABLE "node" */}
      <div className="p-5 bg-red-950/40 border border-red-500/50 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                Solusi Error Termux: CANNOT LINK EXECUTABLE "node"
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              Mengapa Muncul: <code className="text-red-300 text-xs font-mono font-normal">cannot locate symbol "_ZNSt6__ndk1..."</code>?
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Error ini terjadi karena pustaka C++ Android (<code className="text-amber-300 font-mono">libc++</code>) di Termux Anda belum sinkron dengan versi Node.js, atau Termux Anda diunduh dari <strong>Google Play Store</strong> (yang sudah usang sejak 2020). Berikut 2 cara cepat memperbaikinya:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Solusi A: Perbaiki Node.js di Termux */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-emerald-400 block">
              Opsi 1: Perbaiki Pustaka libc++ & Node.js
            </span>
            <p className="text-slate-400 text-[11px]">
              Jalankan perintah ini di Termux untuk memperbarui <code className="text-cyan-300 font-mono">libc++</code>:
            </p>
            <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] text-amber-300 overflow-x-auto">
              pkg update -y && pkg upgrade -y && pkg install libc++ -y && pkg reinstall nodejs-lts -y
            </div>
            <button
              onClick={() => copyToClipboard('pkg update -y && pkg upgrade -y && pkg install libc++ -y && pkg reinstall nodejs-lts -y', 'fixNode')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-[11px] flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copiedKey === 'fixNode' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Perintah Perbaikan</span>
                </>
              )}
            </button>
          </div>

          {/* Solusi B: Gunakan Python (Tanpa Node.js) */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-cyan-400 block">
              Opsi 2: Jalankan via Python (Paling Stabil!)
            </span>
            <p className="text-slate-400 text-[11px]">
              Jika Node.js tetap bermasalah, gunakan skrip Python kami (<code className="text-cyan-300 font-mono">gmail_batch_termux.py</code>):
            </p>
            <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto">
              pkg install python x11-repo chromium -y && pip install playwright && python gmail_batch_termux.py
            </div>
            <button
              onClick={() => copyToClipboard('pkg install python x11-repo chromium -y && pip install playwright && python gmail_batch_termux.py', 'fixPython')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-[11px] flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copiedKey === 'fixPython' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Perintah Python</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-xl text-[11px] text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Penting:</strong> Jika aplikasi Termux Anda diinstall dari Google Play Store, hapus dan pasang ulang dari <strong>F-Droid</strong> (<a href="https://f-droid.org/en/packages/com.termux/" target="_blank" rel="noreferrer" className="underline text-blue-400">f-droid.org</a>) karena versi Play Store sudah tidak menerima update repository sejak 2020.
          </span>
        </div>
      </div>

      {/* SOLUSI ERROR: FAILED TO FETCH 404 NOT FOUND (MIRROR RUSAK / ALBONY) */}
      <div className="p-5 bg-amber-950/40 border border-amber-500/50 rounded-2xl shadow-xl space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Solusi Error 404: Failed to fetch mirror.albony.in / Unable to fetch archives
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              Mirror Download Termux Sedang Down / Berubah Versi
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Mirror server <code className="text-red-300 font-mono">mirror.albony.in</code> yang digunakan Termux Anda saat ini sedang down atau file paketnya sudah diperbarui di server. Cukup ganti ke mirror resmi <strong>Grimler (Swedia)</strong> atau gunakan <code className="text-cyan-300 font-mono">termux-change-repo</code>:
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <span className="text-xs font-bold text-emerald-400 block">
            Jalankan 1 Baris Perintah Ini di Termux (Otomatis Ganti Mirror & Update):
          </span>
          <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] text-amber-300 overflow-x-auto">
            echo "deb https://grimler.se/termux/termux-main stable main" &gt; $PREFIX/etc/apt/sources.list && apt update -y
          </div>
          <button
            onClick={() => copyToClipboard('echo "deb https://grimler.se/termux/termux-main stable main" > $PREFIX/etc/apt/sources.list && apt update -y', 'fixMirror')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md"
          >
            {copiedKey === 'fixMirror' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Perintah Ganti Mirror Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Perintah Ganti Mirror</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2 Methods Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method 1: Native Termux */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h4 className="text-sm font-bold text-white">Cara 1: Termux Native (Paling Cepat)</h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                Hemat RAM & Penyimpanan
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Memasang Chromium langsung dari repositori resmi Termux (<code className="text-cyan-300 font-mono">pkg install chromium</code>). Sangat ringan dan tidak membebani memori HP.
            </p>

            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[260px]">
              <pre>{nativeTermuxCommands}</pre>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(nativeTermuxCommands, 'native')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {copiedKey === 'native' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-300">Perintah Termux Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Perintah Termux Native</span>
              </>
            )}
          </button>
        </div>

        {/* Method 2: PRoot Ubuntu */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h4 className="text-sm font-bold text-white">Cara 2: PRoot Ubuntu (Paling Stabil)</h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                Kompatibilitas 100%
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Menjalankan sistem Ubuntu virtual di dalam Termux menggunakan <code className="text-cyan-300 font-mono">proot-distro</code>. Sangat direkomendasikan jika Termux native Anda mengalami error pustaka C (bionic libc).
            </p>

            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[260px]">
              <pre>{prootUbuntuCommands}</pre>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(prootUbuntuCommands, 'proot')}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {copiedKey === 'proot' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-300">Perintah Ubuntu Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Perintah PRoot Ubuntu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Critical Flag Config for Android */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">Flag Wajib di Termux HP Android</h4>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Karena sistem operasi Android memiliki batasan perizinan sandbox dan memori RAM yang ketat pada ponsel, parameter berikut <strong>wajib</strong> disertakan saat menjalankan browser di skrip Playwright Termux:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <code className="text-amber-300 font-semibold font-mono block">--no-sandbox</code>
            <span className="text-slate-400 text-[11px]">Mencegah error permission sandbox Android.</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <code className="text-amber-300 font-semibold font-mono block">--disable-gpu</code>
            <span className="text-slate-400 text-[11px]">Mematikan hardware acceleration grafis HP.</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <code className="text-amber-300 font-semibold font-mono block">--single-process</code>
            <span className="text-slate-400 text-[11px]">Menghemat RAM HP agar Termux tidak crash (Force Close).</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <code className="text-amber-300 font-semibold font-mono block">--disable-dev-shm-usage</code>
            <span className="text-slate-400 text-[11px]">Menghindari crash shared memory /dev/shm di Android.</span>
          </div>
        </div>
      </div>

      {/* How to see results and screenshots on phone storage */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <FolderDown className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-bold text-white">Cara Melihat Hasil CSV & Screenshot di Galeri/File Manager HP</h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Skrip telah diatur untuk menyimpan hasil langsung ke folder <strong>Download</strong> di penyimpanan internal ponsel Anda:
        </p>
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 space-y-1">
          <div>📁 File CSV Hasil: <span className="text-slate-300">/sdcard/Download/hasil_batch_gmail.csv</span></div>
          <div>📸 File Screenshot: <span className="text-slate-300">/sdcard/Download/gmail_screenshots/</span></div>
        </div>
        <p className="text-[11px] text-slate-400">
          Cukup buka aplikasi <strong>File Manager</strong> bawaan HP Anda &gt; Buka folder <strong>Download</strong> &gt; File CSV dan gambar dapat langsung dibuka di aplikasi Excel / Galeri foto HP Anda!
        </p>
      </div>

      {/* 1-Click Setup Shell Script */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Skrip Otomatisasi 1-Klik (setup_termux.sh)</h4>
          </div>
          <button
            onClick={() => copyToClipboard(oneClickScript, 'oneclick')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {copiedKey === 'oneclick' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Script Bash</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[180px]">
          <pre>{oneClickScript}</pre>
        </div>
      </div>
    </div>
  );
};
