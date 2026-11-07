import React, { useState, useMemo } from 'react';
import { 
  Code2, 
  PlayCircle, 
  Layers, 
  ShieldCheck, 
  SlidersHorizontal, 
  Sparkles, 
  Mail, 
  Clock, 
  Bot, 
  FileCode2, 
  ChevronRight, 
  Users, 
  Shuffle, 
  Timer,
  Smartphone,
  Laptop,
  Github,
  FolderGit2,
  Cloud
} from 'lucide-react';
import { ScriptConfig, ScriptLanguage, WaitStrategy, BatchExecutionMode, TargetEnvironment } from './types';
import { generatePlaywrightCode, generatePackageJson, generateRequirementsTxt } from './data/codeTemplates';
import { CodeViewer } from './components/CodeViewer';
import { InteractiveSimulator } from './components/InteractiveSimulator';
import { SelectorInspector } from './components/SelectorInspector';
import { StealthGuide } from './components/StealthGuide';
import { TermuxGuide } from './components/TermuxGuide';
import { GitHubDeployGuide } from './components/GitHubDeployGuide';
import { CloudLiveChecker } from './components/CloudLiveChecker';

const SAMPLE_EMAILS = [
  'marketing.team@gmail.com',
  'security.bot.test@gmail.com',
  'tidak.ditemukan.9912@gmail.com',
  'admin.workspace@gmail.com',
  'john.doe.personal@gmail.com'
].join('\n');

export default function App() {
  const [activeTab, setActiveTab] = useState<'cloud_checker' | 'code' | 'simulator' | 'termux_guide' | 'github_deploy' | 'selectors' | 'stealth'>('cloud_checker');

  const [config, setConfig] = useState<ScriptConfig>({
    email: 'contoh.email@gmail.com',
    emailsText: SAMPLE_EMAILS,
    isMultiEmail: true,
    batchMode: 'sequential',
    concurrencyLimit: 2,
    delayBetweenEmailsMs: 3000,
    freshContextPerEmail: true,
    timeoutMs: 15000,
    headless: false,
    slowMoMs: 50,
    useStealth: true,
    language: 'javascript',
    waitStrategy: 'promise_race',
    saveScreenshots: true,
    locale: 'id-ID',
    exportFormat: 'csv',
    targetEnvironment: 'termux', // Default to termux as user requested!
    termuxCustomChromiumPath: '/data/data/com.termux/files/usr/bin/chromium',
  });

  // Calculate number of emails in text
  const emailCount = useMemo(() => {
    return config.emailsText
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes('@')).length;
  }, [config.emailsText]);

  // Generated code
  const generatedCode = useMemo(() => {
    return generatePlaywrightCode(config);
  }, [config]);

  const packageJson = useMemo(() => generatePackageJson(config.targetEnvironment), [config.targetEnvironment]);
  const requirementsTxt = useMemo(() => generateRequirementsTxt(), []);

  const fileName = useMemo(() => {
    if (config.targetEnvironment === 'termux') {
      switch (config.language) {
        case 'typescript': return 'gmail_batch_termux.js';
        case 'javascript': return 'gmail_batch_termux.js';
        case 'python_async': return 'gmail_batch_termux_async.py';
        case 'python_sync': return 'gmail_batch_termux_sync.py';
      }
    }

    if (config.isMultiEmail) {
      switch (config.language) {
        case 'typescript': return 'gmail_batch_checker.ts';
        case 'javascript': return 'gmail_batch_checker.js';
        case 'python_async': return 'gmail_batch_async.py';
        case 'python_sync': return 'gmail_batch_sync.py';
      }
    } else {
      switch (config.language) {
        case 'typescript': return 'gmail_login.ts';
        case 'javascript': return 'gmail_login.js';
        case 'python_async': return 'gmail_login_async.py';
        case 'python_sync': return 'gmail_login_sync.py';
      }
    }
  }, [config.targetEnvironment, config.isMultiEmail, config.language]);

  const loadSampleEmails = () => {
    setConfig((prev) => ({ ...prev, emailsText: SAMPLE_EMAILS }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Playwright Gmail Batch Checker
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Termux HP Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pengecekan otomatis beberapa akun Gmail di HP Android Termux tanpa komputer
              </p>
            </div>
          </div>

          {/* Quick tab switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-x-auto">
            <button
              onClick={() => setActiveTab('cloud_checker')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === 'cloud_checker'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md ring-2 ring-blue-400'
                  : 'bg-blue-950/60 text-blue-300 hover:text-white hover:bg-blue-900/60 border border-blue-800/80'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-cyan-300" />
              <span>Cek Langsung di Cloud (Web App)</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-mono">Real Chromium</span>
            </button>

            <button
              onClick={() => setActiveTab('github_deploy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'github_deploy'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md ring-1 ring-blue-400'
                  : 'text-blue-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              <span>Deploy ke GitHub (Git Clone)</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Script Generator</span>
            </button>

            <button
              onClick={() => setActiveTab('termux_guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'termux_guide'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Panduan Termux HP</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === 'simulator'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Simulasi Batch ({emailCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('selectors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === 'selectors'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Daftar Selector</span>
            </button>

            <button
              onClick={() => setActiveTab('stealth')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === 'stealth'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-Bot Stealth</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Termux Alert Callout Banner */}
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-blue-950/70 border border-emerald-500/40 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Mode Termux HP Android Aktif
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-white">
                Bisa Berjalan di HP Android Menggunakan Termux + Chromium Native
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                Karena tidak ada PC, skrip ini otomatis dikonfigurasi menggunakan Chromium bawaan Android Termux (<code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">/data/data/com.termux/files/usr/bin/chromium</code>) dengan flag khusus memori HP (<code className="text-cyan-300 font-mono">--single-process --no-sandbox</code>). Hasil file CSV juga otomatis disimpan ke folder <strong>Download HP</strong> Anda (<code className="text-cyan-300 font-mono">/sdcard/Download/hasil_batch_gmail.csv</code>).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
              <button
                onClick={() => setActiveTab('github_deploy')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Deploy ke GitHub (Git Clone)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTab('termux_guide')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Panduan Termux</span>
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Konfigurasi Target & Perangkat</h3>
            </div>
            
            {/* Environment Toggle: PC vs Termux */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Target Perangkat:</span>
              <div className="p-0.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center">
                <button
                  onClick={() => setConfig({ ...config, targetEnvironment: 'termux', headless: true })}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    config.targetEnvironment === 'termux'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Termux (HP Android)</span>
                </button>
                <button
                  onClick={() => setConfig({ ...config, targetEnvironment: 'desktop', headless: false })}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    config.targetEnvironment === 'desktop'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Komputer / PC</span>
                </button>
              </div>
            </div>
          </div>

          {/* Multi-Email Textarea Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Daftar Email Target (Tempelkan email di sini, pisahkan per baris)</span>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                  {emailCount} Akun
                </span>
              </label>

              <button
                onClick={loadSampleEmails}
                className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
              >
                <Shuffle className="w-3 h-3" />
                <span>Muat Contoh Email</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={config.emailsText}
              onChange={(e) => setConfig({ ...config, emailsText: e.target.value })}
              placeholder="user1@gmail.com&#10;user2@gmail.com&#10;user3@gmail.com"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Grid Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Language Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Bahasa Pemrograman</span>
              </label>
              <select
                value={config.language}
                onChange={(e) => setConfig({ ...config, language: e.target.value as ScriptLanguage })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="javascript">JavaScript (Node.js - Rekomendasi Termux)</option>
                <option value="typescript">TypeScript</option>
                <option value="python_async">Python (Asyncio Termux)</option>
              </select>
            </div>

            {/* Delay between emails */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-slate-400" />
                <span>Jeda Antar Email (Anti-Spam)</span>
              </label>
              <select
                value={config.delayBetweenEmailsMs}
                onChange={(e) => setConfig({ ...config, delayBetweenEmailsMs: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value={2000}>2 Detik</option>
                <option value={3000}>3 Detik (Paling Aman untuk HP)</option>
                <option value={5000}>5 Detik</option>
              </select>
            </div>

            {/* Timeout (ms) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Timeout Deteksi</span>
              </label>
              <select
                value={config.timeoutMs}
                onChange={(e) => setConfig({ ...config, timeoutMs: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value={15000}>15 Detik (Standar)</option>
                <option value={25000}>25 Detik (Bagus jika sinyal HP lambat)</option>
                <option value={35000}>35 Detik</option>
              </select>
            </div>

            {/* Path Chromium Termux */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Path Chromium Termux</span>
              </label>
              <input
                type="text"
                value={config.termuxCustomChromiumPath}
                onChange={(e) => setConfig({ ...config, termuxCustomChromiumPath: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-200">Mode HP: Optimasi RAM <strong>--single-process</strong> aktif</span>
            </span>

            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-slate-200">Simpan otomatis ke: <strong>/sdcard/Download/hasil_batch_gmail.csv</strong></span>
            </span>

            {/* Screenshot Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.saveScreenshots}
                onChange={(e) => setConfig({ ...config, saveScreenshots: e.target.checked })}
                className="rounded accent-blue-600 w-4 h-4"
              />
              <span>Simpan Screenshot ke Galeri/Download HP</span>
            </label>
          </div>
        </div>

        {/* Tab View Content */}
        {activeTab === 'cloud_checker' && (
          <CloudLiveChecker />
        )}

        {activeTab === 'github_deploy' && (
          <GitHubDeployGuide />
        )}

        {activeTab === 'code' && (
          <div className="h-[660px]">
            <CodeViewer
              code={generatedCode}
              language={config.language}
              packageJson={packageJson}
              requirementsTxt={requirementsTxt}
              fileName={fileName}
              targetEnvironment={config.targetEnvironment}
            />
          </div>
        )}

        {activeTab === 'termux_guide' && (
          <TermuxGuide />
        )}

        {activeTab === 'simulator' && (
          <InteractiveSimulator
            emailsText={config.emailsText}
            timeoutMs={config.timeoutMs}
            locale={config.locale}
            batchMode={config.batchMode}
            concurrencyLimit={config.concurrencyLimit}
          />
        )}

        {activeTab === 'selectors' && (
          <SelectorInspector />
        )}

        {activeTab === 'stealth' && (
          <StealthGuide />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          Playwright Gmail Batch Checker &bull; Mendukung eksekusi di HP Android (Termux) & PC Desktop dengan ekspor CSV otomatis ke penyimpanan ponsel.
        </p>
      </footer>
    </div>
  );
}
