import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Globe, HardDrive, Copy, Check, Terminal } from 'lucide-react';

export const StealthGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const persistentSnippet = `import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';

chromium.use(stealthPlugin());

async function runWithPersistentProfile() {
  // Folder untuk menyimpan session, cache & cookies Chrome
  const userDataDir = path.join(process.cwd(), '.google-chrome-session');

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Wajib false saat pertama kali login
    channel: 'chrome', // Menggunakan Google Chrome asli jika terpasang
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check'
    ],
    viewport: { width: 1280, height: 800 }
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://accounts.google.com/ServiceLogin');

  console.log('Browser terbuka dengan profil persistent. Cookie & sesi tersimpan aman!');
}

runWithPersistentProfile();`;

  return (
    <div className="space-y-6">
      {/* Warning Box */}
      <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-semibold mb-1">
            Catatan Penting: Kebijakan Keamanan Google Account
          </strong>
          Google memiliki salah satu sistem deteksi bot tercanggih di dunia. Jika Anda menjalankan Playwright standar dengan opsi <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">headless: true</code> tanpa konfigurasi stealth, Google hampir pasti akan menampilkan halaman <strong>"This browser or app may not be secure"</strong> atau langsung memicu tantangan <strong>"Verifikasi bukan robot"</strong>.
        </div>
      </div>

      {/* 4 Pillars of Stealth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">1. Plugin Stealth</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gunakan paket <code className="text-cyan-300 font-mono">playwright-extra</code> bersama <code className="text-cyan-300 font-mono">puppeteer-extra-plugin-stealth</code>. Plugin ini memalsukan <code className="text-amber-300 font-mono">navigator.webdriver</code>, WebGL vendor, audio context, dan header browser sehingga terdeteksi sebagai browser manusia.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">2. Headless: False & SlowMo</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Google langsung menandai browser tanpa UI (headless default). Selalu gunakan <code className="text-cyan-300 font-mono">headless: false</code> saat mengetes login, serta tambahkan jeda ketik <code className="text-cyan-300 font-mono">slowMo: 50</code> ms agar gerakan keyboard mirip manusia.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">3. Persistent User Context</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Alih-alih membuat browser bersih setiap kali jalan, simpan session data di folder lokal menggunakan <code className="text-cyan-300 font-mono">launchPersistentContext()</code>. Setelah login sekali, sesi Anda akan tetap tersimpan dan tidak perlu login ulang berulang kali!
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">4. Reputasi IP Address</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            IP data center (VPS seperti AWS, GCP, DigitalOcean) memiliki reputasi bot tinggi di mata Google dan hampir selalu memicu CAPTCHA. Jika Anda menjalankan skrip di cloud, gunakan Residential Proxy berotasi atau koneksi internet rumah.
          </p>
        </div>
      </div>

      {/* Persistent Context Code Example */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span>Teknik Terbaik: launchPersistentContext (Simpan Sesi Google)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Skrip ini menyimpan sesi login ke folder lokal sehingga Anda tidak perlu terus-menerus menghadapi verifikasi robot.
            </p>
          </div>

          <button
            onClick={() => copySnippet(persistentSnippet, 'persistent')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            {copiedKey === 'persistent' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Script</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl overflow-x-auto font-mono text-xs text-slate-300 leading-relaxed border border-slate-800/80">
          <pre>{persistentSnippet}</pre>
        </div>
      </div>
    </div>
  );
};
