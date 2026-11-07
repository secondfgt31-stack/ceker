import React, { useState } from 'react';
import { 
  Github, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  FolderGit2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  FileCode,
  Download
} from 'lucide-react';

export const GitHubDeployGuide: React.FC = () => {
  const [username, setUsername] = useState('mondrakers222');
  const [repoName, setRepoName] = useState('gmail-checker-termux');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const cleanUser = username.trim() || 'USERNAME';
  const cleanRepo = repoName.trim() || 'REPO_NAME';
  const repoUrl = `https://github.com/${cleanUser}/${cleanRepo}.git`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Commands
  const pushCommands = `# 1. Buka terminal proyek ini (atau folder hasil download)
git init
git add .
git commit -m "feat: setup Playwright Gmail checker untuk Termux HP"
git branch -M main

# 2. Hubungkan ke repositori GitHub Anda
git remote add origin ${repoUrl}

# 3. Upload / Push kode ke GitHub
git push -u origin main`;

  const termuxClone1Liner = `pkg install git nodejs-lts x11-repo chromium -y && git clone ${repoUrl} && cd ${cleanRepo} && bash setup_termux.sh`;

  const termuxManualCommands = `# 1. Install Git & Chromium di Termux
pkg update -y
pkg install git nodejs-lts x11-repo chromium -y
termux-setup-storage

# 2. Clone repositori dari GitHub Anda
git clone ${repoUrl}
cd ${cleanRepo}

# 3. Jalankan setup otomatis
bash setup_termux.sh

# 4. Edit daftar email jika ingin ganti
nano emails.txt

# 5. Jalankan pemeriksaan!
node gmail_batch_termux.js`;

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="p-5 bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/40 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Alur Git Clone Termux
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Tersinkronisasi
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Deploy ke GitHub & Cukup "git clone" di Termux HP
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Semua file yang dibutuhkan (<code className="text-cyan-300 font-mono">setup_termux.sh</code>, <code className="text-cyan-300 font-mono">gmail_batch_termux.js</code>, <code className="text-cyan-300 font-mono">emails.txt</code>, <code className="text-cyan-300 font-mono">README.md</code>) sudah disiapkan di root proyek ini. Anda tinggal memasukkan nama akun GitHub Anda di bawah ini!
            </p>
          </div>
        </div>
      </div>

      {/* GitHub Repository Form Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Github className="w-4 h-4 text-slate-300" />
          <span>Konfigurasi Link Repository GitHub Anda</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Username GitHub Anda:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="contoh: mondrakers222"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Nama Repository Baru:
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="contoh: gmail-checker-termux"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <span className="text-blue-400">URL Repo:</span>
            <span className="text-slate-200 truncate">{repoUrl}</span>
          </div>
          <button
            onClick={() => copyToClipboard(repoUrl, 'repoUrl')}
            className="text-[11px] text-blue-400 hover:text-blue-300 shrink-0 ml-2"
          >
            {copiedKey === 'repoUrl' ? 'Tersalin!' : 'Salin URL'}
          </button>
        </div>
      </div>

      {/* STEP 1: ONE LINER COMMAND FOR TERMUX */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
              ⚡
            </div>
            <h4 className="text-sm font-bold text-white">
              Perintah 1-Baris di Termux HP (Clone & Langsung Jalan)
            </h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
            Tinggal Tempel di Termux
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Setelah repo dibuat di GitHub, buka aplikasi <strong>Termux</strong> di HP Anda, salin perintah di bawah ini dan tekan <strong>Enter</strong>:
        </p>

        <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
          <code>{termuxClone1Liner}</code>
        </div>

        <button
          onClick={() => copyToClipboard(termuxClone1Liner, 'termux1line')}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
        >
          {copiedKey === 'termux1line' ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Perintah Termux Berhasil Disalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Perintah 1-Baris Termux</span>
            </>
          )}
        </button>
      </div>

      {/* STEP 2: HOW TO PUSH PROJECT TO GITHUB */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Push Instructions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h4 className="text-xs font-bold text-white">Cara Push Proyek Ini ke GitHub</h4>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Buat repository baru di <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">github.com/new</a> dengan nama <code className="text-amber-300 font-mono">{cleanRepo}</code>, lalu jalankan perintah ini:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[180px]">
              <pre>{pushCommands}</pre>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(pushCommands, 'push')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedKey === 'push' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Perintah Git Push</span>
              </>
            )}
          </button>
        </div>

        {/* Detailed Step on Termux */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <h4 className="text-xs font-bold text-white">Langkah Manual di Termux HP</h4>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Jika ingin menjalankan perintah satu per satu di aplikasi Termux HP:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[180px]">
              <pre>{termuxManualCommands}</pre>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(termuxManualCommands, 'manual')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedKey === 'manual' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Langkah Manual</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Files Included in Repository */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span>File Siap Pakai yang Sudah Disediakan di Repository Ini:</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="font-mono text-cyan-300 font-semibold mb-1">emails.txt</div>
            <p className="text-[11px] text-slate-400">
              Tempat menaruh daftar email Anda (1 email per baris).
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="font-mono text-emerald-300 font-semibold mb-1">gmail_batch_termux.js</div>
            <p className="text-[11px] text-slate-400">
              Skrip eksekusi Playwright + Chromium Termux.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="font-mono text-amber-300 font-semibold mb-1">setup_termux.sh</div>
            <p className="text-[11px] text-slate-400">
              Skrip otomatis menginstall Node.js, Chromium & permissions.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="font-mono text-purple-300 font-semibold mb-1">README.md</div>
            <p className="text-[11px] text-slate-400">
              Panduan lengkap di halaman depan GitHub Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
