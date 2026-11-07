import React, { useState } from 'react';
import { Copy, Check, Download, Terminal, FileCode, Package, Smartphone } from 'lucide-react';
import { ScriptLanguage, TargetEnvironment } from '../types';

interface CodeViewerProps {
  code: string;
  language: ScriptLanguage;
  packageJson: string;
  requirementsTxt: string;
  fileName: string;
  targetEnvironment?: TargetEnvironment;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language,
  packageJson,
  requirementsTxt,
  fileName,
  targetEnvironment = 'desktop',
}) => {
  const [activeTab, setActiveTab] = useState<'script' | 'config' | 'run'>('script');
  const [copied, setCopied] = useState(false);

  const isPython = language.startsWith('python');
  const isTermux = targetEnvironment === 'termux';
  const configFileName = isPython ? 'requirements.txt' : 'package.json';
  const configContent = isPython ? requirementsTxt : packageJson;

  const runCommandDesktopNode = `# 1. Inisialisasi & instalasi dependensi di PC
npm install playwright playwright-extra puppeteer-extra-plugin-stealth tsx

# 2. Download browser Chromium untuk Playwright
npx playwright install chromium

# 3. Jalankan skrip
npx tsx ${fileName}`;

  const runCommandTermuxNode = `# LANGKAH-LANGKAH DI TERMUX HP ANDROID:

# 1. Update paket & aktifkan repo x11
pkg update && pkg upgrade -y
pkg install nodejs-lts git x11-repo -y

# 2. Pasang Chromium native Android Termux
pkg install chromium -y

# 3. Beri izin penyimpanan HP agar hasil CSV tersimpan di folder Download
termux-setup-storage

# 4. Pasang library Playwright
mkdir -p ~/gmail-checker && cd ~/gmail-checker
npm init -y
npm install playwright playwright-extra puppeteer-extra-plugin-stealth

# 5. Jalankan skrip di Termux
node ${fileName}`;

  const runCommandPython = `# 1. Instalasi library Playwright
pip install playwright playwright-stealth

# 2. Download browser Chromium (PC) atau pkg install chromium (Termux)
${isTermux ? 'pkg install python x11-repo chromium -y' : 'playwright install chromium'}

# 3. Jalankan skrip
python ${fileName}`;

  const currentRunCommand = isPython
    ? runCommandPython
    : isTermux
    ? runCommandTermuxNode
    : runCommandDesktopNode;

  const currentContent = 
    activeTab === 'script' ? code :
    activeTab === 'config' ? configContent :
    currentRunCommand;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const targetName = 
      activeTab === 'script' ? fileName :
      activeTab === 'config' ? configFileName :
      isTermux ? 'run_termux.sh' : 'run.sh';
      
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = targetName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderHighlightedCode = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const isComment = line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('*') || line.trim().startsWith('/*');
              
              return (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="w-12 text-right pr-4 select-none text-slate-500 font-mono text-xs align-top py-0.5">
                    {idx + 1}
                  </td>
                  <td className="text-slate-200 whitespace-pre font-mono py-0.5">
                    {isComment ? (
                      <span className="text-emerald-400/80 italic">{line}</span>
                    ) : (
                      formatTokens(line)
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const formatTokens = (line: string) => {
    const parts = line.split(/('(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`[^`]*`)/g);

    return parts.map((part, pIdx) => {
      if (
        (part.startsWith('"') && part.endsWith('"')) ||
        (part.startsWith("'") && part.endsWith("'")) ||
        (part.startsWith('`') && part.endsWith('`'))
      ) {
        return (
          <span key={pIdx} className="text-amber-300">
            {part}
          </span>
        );
      }

      const tokens = part.split(/(\b(?:const|let|var|async|await|function|import|from|export|return|if|else|try|catch|finally|def|class|with|as|for|while|in)\b)/g);

      return tokens.map((token, tIdx) => {
        if (/^(?:const|let|var|async|await|function|import|from|export|return|if|else|try|catch|finally|def|class|with|as|for|while|in)$/.test(token)) {
          return (
            <span key={tIdx} className="text-cyan-400 font-semibold">
              {token}
            </span>
          );
        }
        if (/^(?:true|false|null|undefined|None|True|False)$/.test(token)) {
          return (
            <span key={tIdx} className="text-purple-400 font-semibold">
              {token}
            </span>
          );
        }
        if (/^(?:console|page|browser|context|chromium|Promise|asyncio|process|fs|path)$/.test(token)) {
          return (
            <span key={tIdx} className="text-blue-400">
              {token}
            </span>
          );
        }
        return <span key={tIdx}>{token}</span>;
      });
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Top Bar Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'script'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{fileName}</span>
            {isTermux && (
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-mono">
                Termux HP
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'config'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{configFileName}</span>
          </button>

          <button
            onClick={() => setActiveTab('run')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'run'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isTermux ? <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
            <span>{isTermux ? 'Perintah Termux HP' : 'Panduan Terminal'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all border border-slate-700/60"
            title="Salin ke clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Kode</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all border border-slate-700/60"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Code Editor View */}
      <div className="flex-1 overflow-auto p-4 bg-slate-900/90 selection:bg-blue-500/30 selection:text-blue-100">
        {renderHighlightedCode(currentContent)}
      </div>

      {/* Footer info bar */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isTermux ? 'bg-cyan-400' : 'bg-emerald-500'}`}></span>
            {isTermux ? 'Dikonfigurasi untuk Termux Android (ARM64)' : 'Siap Dijalankan di Node.js / Python'}
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">
            {activeTab === 'script' ? `Target: ${targetEnvironment.toUpperCase()}` : activeTab === 'config' ? 'Dependencies Manifest' : 'Shell'}
          </span>
        </div>
        <div className="text-slate-500 font-mono text-[10px]">
          {isTermux ? 'Chromium: /data/data/com.termux/files/usr/bin/chromium' : 'Playwright v1.40+ Compatible'}
        </div>
      </div>
    </div>
  );
};
