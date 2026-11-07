import React, { useState } from 'react';
import { 
  Cloud, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Camera, 
  FileSpreadsheet, 
  Download, 
  Terminal, 
  Cpu, 
  Mail, 
  Sparkles,
  Zap,
  Users
} from 'lucide-react';
import { DetectionOutcome } from '../types';

interface LiveCheckResult {
  email: string;
  outcome: DetectionOutcome;
  durationMs: number;
  screenshotBase64?: string;
  timestamp: string;
  logs?: Array<{ text: string; type: 'info' | 'success' | 'warn' | 'error' }>;
}

export const CloudLiveChecker: React.FC = () => {
  const [checkMode, setCheckMode] = useState<'single' | 'batch'>('single');
  const [singleEmail, setSingleEmail] = useState('');
  const [batchEmails, setBatchEmails] = useState(
    'marketing.team@gmail.com\nsecurity.test@gmail.com\ntidak.terdaftar.99128@gmail.com'
  );
  const [locale, setLocale] = useState<'id' | 'en'>('id');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCheckingEmail, setCurrentCheckingEmail] = useState('');

  // Proxy settings (vital for cloud datacenter IP bypass)
  const [useProxy, setUseProxy] = useState(false);
  const [proxyServer, setProxyServer] = useState('');
  const [proxyUser, setProxyUser] = useState('');
  const [proxyPass, setProxyPass] = useState('');

  // Auto parser jika user menempelkan format http://user:pass@host:port atau host:port:user:pass
  const handleProxyServerChange = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.includes('@')) {
      try {
        const urlToParse = trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('socks5://')
          ? trimmed
          : `http://${trimmed}`;
        const parsed = new URL(urlToParse);
        if (parsed.username) setProxyUser(decodeURIComponent(parsed.username));
        if (parsed.password) setProxyPass(decodeURIComponent(parsed.password));
        setProxyServer(`${parsed.protocol}//${parsed.host}`);
        return;
      } catch {
        // fallback
      }
    } else if (trimmed.includes(':') && trimmed.split(':').length === 4) {
      // Format host:port:user:pass
      const parts = trimmed.split(':');
      setProxyServer(`http://${parts[0]}:${parts[1]}`);
      setProxyUser(parts[2]);
      setProxyPass(parts[3]);
      return;
    }
    setProxyServer(val);
  };

  // Results
  const [singleResult, setSingleResult] = useState<LiveCheckResult | null>(null);
  const [batchResults, setBatchResults] = useState<LiveCheckResult[]>([]);
  const [logs, setLogs] = useState<Array<{ text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([]);
  const [serverStatus, setServerStatus] = useState<string>('Online');

  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogs((prev) => [...prev, { text, type }]);
  };

  // Run single email check against cloud backend
  const handleRunSingleCheck = async () => {
    const emailToTest = singleEmail.trim();
    if (!emailToTest || !emailToTest.includes('@')) {
      alert('Silakan masukkan alamat email yang valid.');
      return;
    }

    setIsLoading(true);
    setCurrentCheckingEmail(emailToTest);
    setSingleResult(null);
    setLogs([]);

    addLog(`[Client] Mengirim permintaan pengecekan ke Server Cloud...`, 'info');
    addLog(`[Client] Target: ${emailToTest}`, 'info');

    const proxyConfig = useProxy && proxyServer.trim() ? {
      server: proxyServer.trim(),
      username: proxyUser.trim() || undefined,
      password: proxyPass.trim() || undefined,
    } : undefined;

    try {
      const response = await fetch('/api/check-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToTest,
          locale,
          timeoutMs: 20000,
          proxy: proxyConfig
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memeriksa email di server.');
      }

      setSingleResult(data);
      if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err: any) {
      addLog(`[Error] ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
      setCurrentCheckingEmail('');
    }
  };

  // Run batch check
  const handleRunBatchCheck = async () => {
    const list = batchEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes('@'));

    if (list.length === 0) {
      alert('Silakan masukkan minimal 1 email target di kolom teks.');
      return;
    }

    setIsLoading(true);
    setBatchResults([]);
    setLogs([]);
    addLog(`[Batch Cloud] Memulai antrean ${list.length} email di Cloud Chromium...`, 'info');

    const tempResults: LiveCheckResult[] = [];

    const proxyConfig = useProxy && proxyServer.trim() ? {
      server: proxyServer.trim(),
      username: proxyUser.trim() || undefined,
      password: proxyPass.trim() || undefined,
    } : undefined;

    // Loop through each email so user gets real-time progress
    for (let i = 0; i < list.length; i++) {
      const email = list[i];
      setCurrentCheckingEmail(email);
      addLog(`[Batch] [${i + 1}/${list.length}] Membuka halaman Google untuk: ${email}...`, 'info');

      try {
        const response = await fetch('/api/check-single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, locale, timeoutMs: 15000, proxy: proxyConfig }),
        });

        const data = await response.json();
        const itemResult: LiveCheckResult = {
          email,
          outcome: data.outcome || 'TIMEOUT',
          durationMs: data.durationMs || 0,
          screenshotBase64: data.screenshotBase64,
          timestamp: new Date().toLocaleTimeString(),
        };

        tempResults.push(itemResult);
        setBatchResults([...tempResults]);

        if (data.outcome === 'PASSWORD_FIELD_FOUND') {
          addLog(`[Batch] ✅ [${email}] -> Kolom Password Muncul (${data.durationMs}ms)`, 'success');
        } else if (data.outcome === 'ROBOT_VERIFICATION_FOUND') {
          addLog(`[Batch] ⚠️ [${email}] -> Verifikasi Robot / CAPTCHA Muncul (${data.durationMs}ms)`, 'warn');
        } else if (data.outcome === 'EMAIL_NOT_FOUND') {
          addLog(`[Batch] ❌ [${email}] -> Email Tidak Ditemukan (${data.durationMs}ms)`, 'error');
        } else if (data.outcome === 'BROWSER_BLOCKED_INSECURE' || data.outcome === 'BROWSER_BLOCKED') {
          addLog(`[Batch] 🚫 [${email}] -> Google memblokir IP Cloud ("Browser mungkin tidak aman") (${data.durationMs}ms)`, 'warn');
        } else {
          addLog(`[Batch] ⏱️ [${email}] -> Timeout (${data.durationMs}ms)`, 'warn');
        }
      } catch (err: any) {
        addLog(`[Batch] Error pada ${email}: ${err.message}`, 'error');
      }

      if (i < list.length - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    setIsLoading(false);
    setCurrentCheckingEmail('');
    addLog(`[Batch Cloud] Selesai! Semua ${list.length} akun telah selesai diperiksa.`, 'success');
  };

  const exportCsv = () => {
    const headers = 'Email,Outcome,DurationMs,Timestamp\n';
    const rows = batchResults
      .map((item) => `"${item.email}","${item.outcome}",${item.durationMs},"${item.timestamp}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hasil_live_cloud_gmail.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Cloud Header Banner */}
      <div className="p-5 bg-gradient-to-r from-blue-900/60 via-indigo-950/70 to-slate-900 border border-blue-500/40 rounded-2xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Cloud Chromium Engine Aktif
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                100% Tanpa Termux / PC
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pengecekan Gmail Langsung di Cloud (Web App Asli)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Chromium dan Playwright telah dipasang langsung di server cloud ini. Anda cukup memasukkan email, klik <strong>"Mulai Cek di Cloud"</strong>, dan server kami yang akan membuka Google, mendeteksi kolom password vs robot captcha, serta menampilkan foto tangkapan layar aslinya secara langsung!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <div className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Server Playwright: <strong>Siap Eksekusi</strong></span>
          </div>
        </div>
      </div>

      {/* Mode Switcher & Inputs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Pilih Mode Pengecekan:</span>
            <div className="p-0.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center">
              <button
                onClick={() => setCheckMode('single')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  checkMode === 'single'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1 Email (Detail + Screenshot)
              </button>
              <button
                onClick={() => setCheckMode('batch')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  checkMode === 'batch'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Banyak Email (Batch)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Bahasa Google:</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'id' | 'en')}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Single Mode Form */}
        {checkMode === 'single' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Masukkan Email Gmail yang Ingin Dicek:</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={singleEmail}
                  onChange={(e) => setSingleEmail(e.target.value)}
                  placeholder="contoh: akun.target@gmail.com"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleRunSingleCheck}
                  disabled={isLoading}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isLoading
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-[0.98]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Mengecek di Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Mulai Cek di Cloud</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Batch Mode Form */}
        {checkMode === 'batch' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Daftar Email Target (Pisahkan per baris):</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {batchEmails.split('\n').filter((l) => l.trim().includes('@')).length} email terdeteksi
                  </span>
                  <span className="text-[11px] text-slate-400">Tanpa Limit (Ratusan Email)</span>
                </div>
              </div>
              <textarea
                rows={6}
                value={batchEmails}
                onChange={(e) => setBatchEmails(e.target.value)}
                disabled={isLoading}
                placeholder="email1@gmail.com&#10;email2@gmail.com&#10;email3@gmail.com&#10;... (bisa ratusan email)"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRunBatchCheck}
                disabled={isLoading}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isLoading
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Mengecek ({currentCheckingEmail})...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Jalankan Semua di Cloud</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Optional Proxy Settings */}
        <div className="pt-3 border-t border-slate-800/80">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300 select-none">
            <input
              type="checkbox"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
              className="rounded accent-blue-600 w-4 h-4"
            />
            <span>Gunakan Proxy Khusus (Opsional - Sangat Disarankan untuk Cloud Engine)</span>
          </label>

          {useProxy && (
            <div className="mt-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                <span>Google memblokir IP Data Center. Gunakan Proxy Residensial agar Google mengizinkan akses.</span>
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Mendukung auto-split jika paste format URL lengkap
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-medium">
                    Proxy Server (Host:Port / URL)
                  </label>
                  <input
                    type="text"
                    value={proxyServer}
                    onChange={(e) => handleProxyServerChange(e.target.value)}
                    placeholder="http://ip:port atau tempel URL lengkap"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[9px] text-slate-500 block">
                    Bisa tempel: <code>http://user:pass@ip:port</code>
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-medium">Username (Opsional)</label>
                  <input
                    type="text"
                    value={proxyUser}
                    onChange={(e) => setProxyUser(e.target.value)}
                    placeholder="username proxy"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-medium">Password (Opsional)</label>
                  <input
                    type="password"
                    value={proxyPass}
                    onChange={(e) => setProxyPass(e.target.value)}
                    placeholder="password proxy"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SINGLE RESULT VIEW */}
      {checkMode === 'single' && singleResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Outcome Result Card */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold text-white">Hasil Pengecekan Cloud</span>
              <span className="text-[11px] font-mono text-slate-400">{singleResult.durationMs}ms</span>
            </div>

            {/* Outcome Banner */}
            {singleResult.outcome === 'PASSWORD_FIELD_FOUND' && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>KOLOM PASSWORD / KATA SANDI MUNCUL!</span>
                </div>
                <p className="text-xs text-emerald-200/80">
                  Email <strong>{singleResult.email}</strong> terdaftar dan valid di Google. Form input kata sandi (<code>input[type="password"]</code>) berhasil muncul.
                </p>
              </div>
            )}

            {singleResult.outcome === 'ROBOT_VERIFICATION_FOUND' && (
              <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-xl text-amber-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <span>VERIFIKASI BUKAN ROBOT / CAPTCHA MUNCUL!</span>
                </div>
                <p className="text-xs text-amber-200/80">
                  Google meminta konfirmasi verifikasi robot (reCAPTCHA box atau tantangan keamanan akun) untuk email <strong>{singleResult.email}</strong>.
                </p>
              </div>
            )}

            {singleResult.outcome === 'EMAIL_NOT_FOUND' && (
              <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-xl text-red-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span>AKUN GOOGLE TIDAK DITEMUKAN</span>
                </div>
                <p className="text-xs text-red-200/80">
                  Google membalas pesan "Tidak dapat menemukan Akun Google Anda". Email tidak terdaftar.
                </p>
              </div>
            )}

            {(singleResult.outcome === 'BROWSER_BLOCKED' || singleResult.outcome === 'BROWSER_BLOCKED_INSECURE') && (
              <div className="p-4 bg-purple-950/40 border border-purple-500/50 rounded-xl text-purple-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-purple-300">
                  <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0" />
                  <span>DIBLOKIR GOOGLE: "Browser atau aplikasi ini mungkin tidak aman"</span>
                </div>
                <p className="text-xs text-purple-200/80 leading-relaxed">
                  Google mendeteksi bahwa permintaan login ini berasal dari server data center cloud (IP Cloud) dan secara otomatis mengarahkan ke <code>v3/signin/rejected</code>.
                </p>
                <div className="p-2.5 bg-slate-950 rounded-lg text-[11px] text-slate-300 border border-purple-800/40 space-y-1">
                  <div className="font-semibold text-amber-300">💡 Cara Mengatasi:</div>
                  <div>1. <strong>Gunakan Proxy Residensial</strong> di menu pengaturan proxy di bawah.</div>
                  <div>2. Atau jalankan skrip langsung di jaringan HP Anda (di mana IP adalah IP seluler asli pengguna, bukan IP data center).</div>
                </div>
              </div>
            )}

            {/* Quick Metadata */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
              <div>Email      : <span className="text-white font-bold">{singleResult.email}</span></div>
              <div>Outcome    : <span className="text-cyan-400 font-bold">{singleResult.outcome}</span></div>
              <div>Durasi Cek : <span className="text-amber-400">{singleResult.durationMs} ms</span></div>
              <div>Timestamp  : <span className="text-slate-400">{singleResult.timestamp}</span></div>
            </div>
          </div>

          {/* Real Live Screenshot from Chromium */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Screenshot Asli Halaman Google dari Cloud</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Real Chromium
              </span>
            </div>

            {singleResult.screenshotBase64 ? (
              <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg bg-black">
                <img
                  src={singleResult.screenshotBase64}
                  alt="Screenshot Hasil Google Login"
                  className="w-full h-auto object-contain max-h-[360px]"
                />
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center bg-slate-950 rounded-xl text-xs text-slate-500">
                Screenshot tidak tersedia
              </div>
            )}
          </div>
        </div>
      )}

      {/* BATCH RESULTS VIEW */}
      {checkMode === 'batch' && batchResults.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-semibold text-white">Tabel Hasil Pengecekan Batch Cloud</h4>
              <p className="text-xs text-slate-400 mt-0.5">{batchResults.length} akun selesai diperiksa</p>
            </div>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-md"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download CSV Hasil</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 w-10">#</th>
                  <th className="py-2.5 px-4">Alamat Email</th>
                  <th className="py-2.5 px-4">Hasil Pengecekan</th>
                  <th className="py-2.5 px-4">Waktu Respon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {batchResults.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-200 font-semibold">{item.email}</td>
                    <td className="py-2.5 px-4">
                      {item.outcome === 'PASSWORD_FIELD_FOUND' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Password Muncul
                        </span>
                      )}
                      {item.outcome === 'ROBOT_VERIFICATION_FOUND' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <ShieldAlert className="w-3 h-3 text-amber-400" />
                          Verifikasi Robot
                        </span>
                      )}
                      {item.outcome === 'EMAIL_NOT_FOUND' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          Email Tidak Ditemukan
                        </span>
                      )}
                      {item.outcome === 'TIMEOUT' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700 text-slate-300">
                          Timeout
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">{item.durationMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Real-time Server Log Console */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-mono font-semibold text-slate-300">Live Server Console Log</span>
          </div>
          {isLoading && (
            <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 animate-pulse">
              Playwright Executing
            </span>
          )}
        </div>

        <div className="min-h-[140px] max-h-[220px] overflow-y-auto space-y-1 font-mono text-[11px]">
          {logs.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center text-slate-600 text-center">
              <Terminal className="w-6 h-6 mb-1 opacity-40" />
              <span>Masukkan email di atas lalu klik "Mulai Cek di Cloud" untuk melihat eksekusi Playwright secara langsung.</span>
            </div>
          ) : (
            logs.map((l, i) => (
              <div 
                key={i} 
                className={`flex items-start gap-1.5 ${
                  l.type === 'success' ? 'text-emerald-400' :
                  l.type === 'warn' ? 'text-amber-400' :
                  l.type === 'error' ? 'text-red-400' :
                  'text-slate-300'
                }`}
              >
                <span className="text-slate-600 select-none">&gt;</span>
                <span className="break-all">{l.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
