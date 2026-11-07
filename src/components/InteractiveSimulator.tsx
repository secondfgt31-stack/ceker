import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  ShieldAlert, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
  Download,
  Users,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import { DetectionOutcome, BatchResultItem } from '../types';

interface SimulatorProps {
  emailsText: string;
  timeoutMs: number;
  locale: 'id-ID' | 'en-US';
  batchMode: 'sequential' | 'concurrent';
  concurrencyLimit: number;
}

export const InteractiveSimulator: React.FC<SimulatorProps> = ({
  emailsText,
  timeoutMs,
  locale,
  batchMode,
  concurrencyLimit,
}) => {
  const [mode, setMode] = useState<'batch' | 'visual_single'>('batch');
  
  // Single mode states
  const [selectedScenario, setSelectedScenario] = useState<DetectionOutcome>('PASSWORD_FIELD_FOUND');
  const [isSingleRunning, setIsSingleRunning] = useState(false);
  const [singleStep, setSingleStep] = useState<number>(0);
  const [typedEmail, setTypedEmail] = useState('');
  const [singleLogs, setSingleLogs] = useState<Array<{ text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([]);

  // Batch mode states
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchResultItem[]>([]);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
  const [batchLogs, setBatchLogs] = useState<Array<{ text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([]);

  const isIndo = locale.startsWith('id');

  // Parse email list from text input
  const emailList = React.useMemo(() => {
    const list = emailsText
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes('@'));
    if (list.length === 0) {
      return [
        'marketing.team@gmail.com',
        'tester.robot.alert@gmail.com',
        'tidak.terdaftar.99128@gmail.com',
        'sales.admin@gmail.com'
      ];
    }
    return list;
  }, [emailsText]);

  // Sync batchItems when emailList changes
  useEffect(() => {
    if (!isBatchRunning) {
      setBatchItems(
        emailList.map((email, idx) => ({
          id: `email-${idx}`,
          email,
          status: 'pending',
        }))
      );
    }
  }, [emailList, isBatchRunning]);

  const addBatchLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setBatchLogs((prev) => [...prev, { text, type }]);
  };

  const addSingleLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setSingleLogs((prev) => [...prev, { text, type }]);
  };

  // Run Batch Simulation
  const runBatchSimulation = async () => {
    if (isBatchRunning) return;
    setIsBatchRunning(true);
    setBatchLogs([]);
    setCurrentProcessingIndex(0);

    const initialItems: BatchResultItem[] = emailList.map((email, idx) => ({
      id: `email-${idx}`,
      email,
      status: 'pending',
    }));
    setBatchItems(initialItems);

    addBatchLog(`[Playwright Batch] Meluncurkan browser Chromium (Stealth: Aktif)...`, 'info');
    addBatchLog(`[Playwright Batch] Total antrean email: ${emailList.length} akun. Mode: ${batchMode.toUpperCase()}...`, 'info');

    for (let i = 0; i < emailList.length; i++) {
      setCurrentProcessingIndex(i);
      const email = emailList[i];

      // Mark current as processing
      setBatchItems((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'processing' } : item))
      );
      addBatchLog(`[Worker] Membuka context baru & mengarahkan ke Google Sign-in untuk: ${email}`, 'info');

      // Random delay simulating network & Playwright action
      const delayMs = 1200 + Math.floor(Math.random() * 800);
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Determine outcome (heuristics for realistic demonstration)
      let outcome: DetectionOutcome = 'PASSWORD_FIELD_FOUND';
      let details = 'Kolom password ditemukan (input[type="password"])';

      if (email.toLowerCase().includes('robot') || email.toLowerCase().includes('bot') || i === 1) {
        outcome = 'ROBOT_VERIFICATION_FOUND';
        details = 'Terdeteksi #captchaimg / text="bukan robot"';
        addBatchLog(`[Worker] ⚠️ [${email}] -> Terdeteksi Verifikasi Robot / Captcha!`, 'warn');
      } else if (email.toLowerCase().includes('tidak') || email.toLowerCase().includes('invalid') || i === 2) {
        outcome = 'EMAIL_NOT_FOUND';
        details = 'Akun Google tidak ditemukan';
        addBatchLog(`[Worker] ❌ [${email}] -> Email tidak terdaftar di Google.`, 'error');
      } else {
        outcome = 'PASSWORD_FIELD_FOUND';
        details = 'Kolom kata sandi muncul normal';
        addBatchLog(`[Worker] ✅ [${email}] -> Kolom password berhasil muncul.`, 'success');
      }

      setBatchItems((prev) =>
        prev.map((item, idx) =>
          idx === i
            ? {
                ...item,
                status: 'done',
                outcome,
                durationMs: delayMs,
                timestamp: new Date().toLocaleTimeString(),
                details,
              }
            : item
        )
      );

      // Brief inter-email delay
      if (i < emailList.length - 1) {
        addBatchLog(`[Scheduler] Jeda jeda anti-spam sebelum akun berikutnya...`, 'info');
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    setCurrentProcessingIndex(-1);
    setIsBatchRunning(false);
    addBatchLog(`[Playwright Batch] Selesai! Semua ${emailList.length} akun telah diperiksa.`, 'success');
  };

  // Run Single Visual Simulation
  const runSingleSimulation = () => {
    setIsSingleRunning(true);
    setSingleStep(0);
    setTypedEmail('');
    setSingleLogs([]);

    const emailToUse = emailList[0] || 'user.testing@gmail.com';

    addSingleLog(`[Playwright] Launching Chromium with args: ['--disable-blink-features=AutomationControlled']`, 'info');
    addSingleLog(`[Playwright] page.goto("https://accounts.google.com/ServiceLogin?hl=${isIndo ? 'id' : 'en'}")`, 'info');

    setTimeout(() => {
      setSingleStep(1);
      addSingleLog(`[Playwright] page.waitForSelector('input[type="email"], #identifierId') -> Element visible!`, 'info');

      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx <= emailToUse.length) {
          setTypedEmail(emailToUse.slice(0, currentIdx));
          currentIdx++;
        } else {
          clearInterval(interval);
          addSingleLog(`[Playwright] page.fill('#identifierId', '${emailToUse}')`, 'info');
          
          setTimeout(() => {
            setSingleStep(2);
            addSingleLog(`[Playwright] page.click('#identifierNext button') -> Request sent`, 'info');
            addSingleLog(`[Playwright] Initializing Promise.race([waitForSelector(PASSWORD), waitForSelector(ROBOT_CAPTCHA), ...])`, 'info');

            setTimeout(() => {
              setSingleStep(3);
              setIsSingleRunning(false);

              if (selectedScenario === 'PASSWORD_FIELD_FOUND') {
                addSingleLog(`[Match] waitForSelector('input[type="password"]:visible') resolved in 1.1s!`, 'success');
                addSingleLog(`[Result] >> PASSWORD_FIELD_FOUND << User boleh memasukkan kata sandi.`, 'success');
              } else if (selectedScenario === 'ROBOT_VERIFICATION_FOUND') {
                addSingleLog(`[Match] waitForSelector('#captchaimg, text=/bukan robot/i') resolved in 1.3s!`, 'warn');
                addSingleLog(`[Result] >> ROBOT_VERIFICATION_FOUND << Terdeteksi tantangan CAPTCHA / Robot!`, 'warn');
              } else if (selectedScenario === 'EMAIL_NOT_FOUND') {
                addSingleLog(`[Match] waitForSelector('text=/tidak dapat menemukan akun/i') resolved in 0.8s!`, 'error');
                addSingleLog(`[Result] >> EMAIL_NOT_FOUND << Email tidak terdaftar di Google.`, 'error');
              } else if (selectedScenario === 'BROWSER_BLOCKED_INSECURE') {
                addSingleLog(`[Match] waitForSelector('text=/mungkin tidak aman/i') resolved in 0.7s!`, 'error');
                addSingleLog(`[Result] >> BROWSER_BLOCKED_INSECURE << Google memblokir browser otomatis.`, 'error');
              }
            }, 1400);
          }, 600);
        }
      }, 35);
    }, 600);
  };

  // Export results to CSV
  const exportCsv = () => {
    const headers = 'Email,Hasil,Keterangan,DurasiMs,Waktu\n';
    const rows = batchItems
      .map((item) => `"${item.email}","${item.outcome || 'PENDING'}","${item.details || ''}",${item.durationMs || 0},"${item.timestamp || ''}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hasil_batch_gmail.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export results to JSON
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(batchItems, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hasil_batch_gmail.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Stats calculation
  const completedCount = batchItems.filter((i) => i.status === 'done').length;
  const passwordCount = batchItems.filter((i) => i.outcome === 'PASSWORD_FIELD_FOUND').length;
  const robotCount = batchItems.filter((i) => i.outcome === 'ROBOT_VERIFICATION_FOUND').length;
  const notFoundCount = batchItems.filter((i) => i.outcome === 'EMAIL_NOT_FOUND').length;

  return (
    <div className="space-y-6">
      {/* Top Bar Switcher between Batch Simulator & Single Visual Simulator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'batch'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Simulasi Batch ({emailList.length} Email)</span>
            </button>
            <button
              onClick={() => setMode('visual_single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'visual_single'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Inspeksi Visual Layar Google</span>
            </button>
          </div>
          <span className="text-xs text-slate-400 hidden md:inline">
            {mode === 'batch' ? 'Memeriksa banyak akun secara otomatis' : 'Melihat animasi interaksi per elemen'}
          </span>
        </div>

        {mode === 'batch' && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={completedCount === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                completedCount > 0
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title="Download CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={exportJson}
              disabled={completedCount === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                completedCount > 0
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title="Download JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* MODE 1: BATCH SIMULATOR */}
      {mode === 'batch' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] text-slate-400 font-medium">Total Akun Target</span>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">{emailList.length}</div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {completedCount}/{emailList.length} Selesai ({Math.round((completedCount / (emailList.length || 1)) * 100)}%)
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] text-emerald-400 font-medium">Password Muncul</span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">{passwordCount}</div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Akun valid & siap login</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] text-amber-400 font-medium">Verifikasi Robot / Captcha</span>
              <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">{robotCount}</div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Membutuhkan penyelesaian</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] text-red-400 font-medium">Akun Tidak Ada</span>
              <div className="text-xl sm:text-2xl font-bold text-red-400 mt-1">{notFoundCount}</div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Email tidak terdaftar</span>
            </div>
          </div>

          {/* Batch Progress Bar & Control Action */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>Eksekusi Batch Otomatis ({emailList.length} Akun)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Playwright akan membuka browser, mengisolasi konteks per email, dan mencatat status masing-masing.
                </p>
              </div>

              <button
                onClick={runBatchSimulation}
                disabled={isBatchRunning}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isBatchRunning
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98]'
                }`}
              >
                {isBatchRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sedang Memeriksa ({completedCount}/{emailList.length})...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Jalankan Pemeriksaan Batch</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Progress Antrean</span>
                <span className="font-mono">{completedCount} dari {emailList.length} selesai</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${(completedCount / (emailList.length || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Results Table & Terminal Log Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Table of Batch Results */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Tabel Hasil Deteksi Email</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {batchMode === 'concurrent' ? `Paralel (${concurrencyLimit} tab)` : 'Sekuensial'}
                </span>
              </div>

              <div className="overflow-x-auto flex-1 max-h-[380px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950/60 text-slate-400 font-medium border-b border-slate-800 sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="py-2.5 px-4 w-10">#</th>
                      <th className="py-2.5 px-4">Alamat Email</th>
                      <th className="py-2.5 px-4">Hasil Pengecekan</th>
                      <th className="py-2.5 px-4">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {batchItems.map((item, idx) => {
                      const isCurrent = currentProcessingIndex === idx;

                      return (
                        <tr 
                          key={item.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isCurrent ? 'bg-blue-950/30 ring-1 ring-inset ring-blue-500/50' : ''
                          }`}
                        >
                          <td className="py-2.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-200 font-medium">
                            <div className="flex items-center gap-2">
                              <span>{item.email}</span>
                              {isCurrent && (
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            {item.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                <Clock className="w-3 h-3" />
                                Menunggu giliran
                              </span>
                            )}
                            {item.status === 'processing' && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Sedang mengecek...
                              </span>
                            )}
                            {item.status === 'done' && (
                              <div>
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
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                            {item.durationMs ? `${item.durationMs}ms` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Live Terminal Log for Batch */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[380px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-mono font-semibold text-slate-300">Terminal Output (Playwright Batch)</span>
                </div>
                {isBatchRunning && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 animate-pulse">
                    Running
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {batchLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-4">
                    <Terminal className="w-7 h-7 mb-2 opacity-40" />
                    <span>Klik "Jalankan Pemeriksaan Batch" untuk memulai pengecekan otomatis semua email di daftar.</span>
                  </div>
                ) : (
                  batchLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className={`flex items-start gap-1.5 ${
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'warn' ? 'text-amber-400' :
                        log.type === 'error' ? 'text-red-400' :
                        'text-slate-300'
                      }`}
                    >
                      <span className="text-slate-600 select-none">&gt;</span>
                      <span className="break-all">{log.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: VISUAL SINGLE SCREEN SIMULATOR */}
      {mode === 'visual_single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Simulated Browser Viewport */}
          <div className="lg:col-span-7 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                </div>
                <span className="text-xs font-mono text-slate-500 ml-2">Chromium Tab</span>
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-md mx-4">
                <div className="flex items-center gap-1.5 w-full bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs text-slate-300">
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">accounts.google.com/ServiceLogin?service=mail</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsSingleRunning(false);
                  setSingleStep(0);
                  setTypedEmail('');
                  setSingleLogs([]);
                }}
                disabled={isSingleRunning}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Browser Content */}
            <div className="min-h-[440px] p-6 sm:p-10 flex items-center justify-center bg-slate-950/60 relative">
              <div className="w-full max-w-[400px] bg-white text-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 relative">
                {/* Google Logo */}
                <div className="flex justify-center mb-4">
                  <svg className="w-10 h-10" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                </div>

                {singleStep < 3 && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-normal text-slate-800">
                        {isIndo ? 'Login' : 'Sign in'}
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">
                        {isIndo ? 'menggunakan Akun Google Anda' : 'with your Google Account'}
                      </p>
                    </div>

                    <div className="relative pt-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {isIndo ? 'Email atau ponsel' : 'Email or phone'}
                      </label>
                      <div className={`relative flex items-center border rounded-lg px-3.5 py-2.5 transition-all ${
                        singleStep >= 1 ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-300'
                      }`}>
                        <input
                          type="email"
                          readOnly
                          value={typedEmail}
                          placeholder={singleStep === 0 ? 'Email target...' : ''}
                          className="w-full text-sm outline-none text-slate-800 font-mono bg-transparent"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                        Selector: #identifierId | input[type="email"]
                      </span>
                    </div>

                    <div className="pt-6 flex justify-between items-center">
                      <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                        {isIndo ? 'Lupa email?' : 'Forgot email?'}
                      </span>
                      <button
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                          singleStep === 2 
                            ? 'bg-blue-700 text-white ring-4 ring-blue-300/60' 
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {singleStep === 2 && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isIndo ? 'Berikutnya' : 'Next'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {singleStep === 3 && (
                  <div>
                    {selectedScenario === 'PASSWORD_FIELD_FOUND' && (
                      <div className="space-y-4">
                        <div className="text-center mb-4">
                          <h2 className="text-2xl font-normal text-slate-800">
                            {isIndo ? 'Selamat datang' : 'Welcome'}
                          </h2>
                        </div>
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Kolom password ditemukan! (input[type="password"])</span>
                        </div>
                      </div>
                    )}

                    {selectedScenario === 'ROBOT_VERIFICATION_FOUND' && (
                      <div className="space-y-4">
                        <div className="text-center mb-4">
                          <h2 className="text-xl font-medium text-slate-800">
                            {isIndo ? 'Verifikasi bahwa Anda bukan robot' : "Verify it's you"}
                          </h2>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700">
                            {isIndo ? 'Saya bukan robot' : "I'm not a robot"}
                          </span>
                          <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="w-6 h-6 opacity-60" />
                        </div>
                      </div>
                    )}

                    {selectedScenario === 'EMAIL_NOT_FOUND' && (
                      <div className="space-y-3">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Tidak dapat menemukan Akun Google Anda</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls for Single Simulation */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-white">Pilih Skenario Respon</h3>
              <div className="space-y-2">
                <label 
                  onClick={() => setSelectedScenario('PASSWORD_FIELD_FOUND')}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${
                    selectedScenario === 'PASSWORD_FIELD_FOUND' ? 'bg-blue-950/40 border-blue-500' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <input type="radio" checked={selectedScenario === 'PASSWORD_FIELD_FOUND'} onChange={() => {}} className="mt-1" />
                  <div>
                    <span className="text-xs font-semibold text-emerald-400">1. Form Password Muncul</span>
                    <p className="text-[11px] text-slate-400">Email valid & siap input kata sandi.</p>
                  </div>
                </label>

                <label 
                  onClick={() => setSelectedScenario('ROBOT_VERIFICATION_FOUND')}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${
                    selectedScenario === 'ROBOT_VERIFICATION_FOUND' ? 'bg-amber-950/40 border-amber-500' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <input type="radio" checked={selectedScenario === 'ROBOT_VERIFICATION_FOUND'} onChange={() => {}} className="mt-1" />
                  <div>
                    <span className="text-xs font-semibold text-amber-400">2. Verifikasi Robot / CAPTCHA</span>
                    <p className="text-[11px] text-slate-400">Tantangan keamanan Google muncul.</p>
                  </div>
                </label>

                <label 
                  onClick={() => setSelectedScenario('EMAIL_NOT_FOUND')}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${
                    selectedScenario === 'EMAIL_NOT_FOUND' ? 'bg-red-950/40 border-red-500' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <input type="radio" checked={selectedScenario === 'EMAIL_NOT_FOUND'} onChange={() => {}} className="mt-1" />
                  <div>
                    <span className="text-xs font-semibold text-red-400">3. Email Tidak Ditemukan</span>
                    <p className="text-[11px] text-slate-400">Akun tidak terdaftar.</p>
                  </div>
                </label>
              </div>

              <button
                onClick={runSingleSimulation}
                disabled={isSingleRunning}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Jalankan Simulasi Tunggal</span>
              </button>
            </div>

            {/* Single Terminal */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-2">Single Execution Log</span>
              <div className="h-[140px] overflow-y-auto font-mono text-[11px] space-y-1">
                {singleLogs.map((l, i) => (
                  <div key={i} className={l.type === 'success' ? 'text-emerald-400' : l.type === 'warn' ? 'text-amber-400' : l.type === 'error' ? 'text-red-400' : 'text-slate-300'}>
                    &gt; {l.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
