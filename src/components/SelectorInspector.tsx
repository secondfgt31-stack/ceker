import React, { useState } from 'react';
import { Layers, Copy, Check, ShieldCheck, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';

export const SelectorInspector: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const selectorGroups = [
    {
      id: 'email',
      title: '1. Input Email / Telepon',
      desc: 'Element pertama di halaman login Google',
      stability: 'Tinggi (Sangat Stabil)',
      color: 'blue',
      selectors: [
        {
          code: '#identifierId',
          role: 'Primary ID',
          explanation: 'ID permanen Google untuk input akun sejak dulu.'
        },
        {
          code: 'input[type="email"]',
          role: 'HTML5 Semantic',
          explanation: 'Sangat andal karena hanya ada 1 input tipe email di form login.'
        },
        {
          code: 'input[name="identifier"]',
          role: 'Name Attribute',
          explanation: 'Atribut nama baku yang dikirim saat form submit.'
        }
      ]
    },
    {
      id: 'next',
      title: '2. Tombol Berikutnya (Next)',
      desc: 'Tombol untuk men-submit email dan memicu pengecekan Google',
      stability: 'Tinggi',
      color: 'indigo',
      selectors: [
        {
          code: '#identifierNext button, #identifierNext',
          role: 'Container & Button',
          explanation: 'Google sering membungkus button di dalam div #identifierNext.'
        },
        {
          code: 'button:has-text("Berikutnya"), button:has-text("Next")',
          role: 'Text Matcher',
          explanation: 'Mencocokkan teks tombol dalam Bahasa Indonesia maupun Inggris.'
        }
      ]
    },
    {
      id: 'password',
      title: '3. Input Sandi / Password (Kondisi A)',
      desc: 'Muncul jika email valid dan tidak ada kecurigaan aktivitas bot',
      stability: 'Sangat Tinggi',
      color: 'emerald',
      selectors: [
        {
          code: 'input[type="password"]:visible',
          role: 'Recommended',
          explanation: 'Mendeteksi input password yang benar-benar tampil (visible) di layar.'
        },
        {
          code: 'input[name="Passwd"]',
          role: 'Standard Attribute',
          explanation: 'Atribut baku input kata sandi akun Google.'
        },
        {
          code: '#password input',
          role: 'Container Child',
          explanation: 'Elemen input yang berada di dalam wrapper div #password.'
        }
      ]
    },
    {
      id: 'robot',
      title: '4. Verifikasi Bukan Robot / CAPTCHA (Kondisi B)',
      desc: 'Muncul jika Google mendeteksi automasi, IP mencurigakan, atau tantangan keamanan',
      stability: 'Multi-Variasi (Diperlukan Selector Jamak)',
      color: 'amber',
      selectors: [
        {
          code: '#captchaimg',
          role: 'Image CAPTCHA',
          explanation: 'ID gambar teks terdistorsi jika Google meminta memasukkan teks dari gambar.'
        },
        {
          code: 'iframe[src*="recaptcha"], iframe[title*="reCAPTCHA" i]',
          role: 'reCAPTCHA v2/v3 Box',
          explanation: 'Iframe widget "Saya bukan robot" dengan checkbox atau puzzle.'
        },
        {
          code: 'input[name="ca"]',
          role: 'CAPTCHA Input',
          explanation: 'Kolom teks tempat memasukkan jawaban captcha gambar.'
        },
        {
          code: 'text=/bukan robot/i, text=/not a robot/i',
          role: 'Regex Text (Bilingual)',
          explanation: 'Menangkap tulisan "Verifikasi bahwa Anda bukan robot" dalam Bahasa Indonesia atau English.'
        },
        {
          code: 'text=/verifikasi bahwa ini memang anda/i, text=/verify it\'s you/i',
          role: 'Security Challenge',
          explanation: 'Tantangan keamanan 2FA / verifikasi ponsel atau notifikasi perangkat.'
        }
      ]
    },
    {
      id: 'blocked',
      title: '5. Google Anti-Bot Block ("Browser Tidak Aman")',
      desc: 'Terjadi jika Playwright terdeteksi sebagai otomasi browser tanpa stealth',
      stability: 'Deteksi Otomasi',
      color: 'red',
      selectors: [
        {
          code: 'text=/browser or app may not be secure/i',
          role: 'English Block Banner',
          explanation: 'Peringatan resmi Google bahwa browser menggunakan driver otomasi.'
        },
        {
          code: 'text=/browser atau aplikasi ini mungkin tidak aman/i',
          role: 'Indonesian Block Banner',
          explanation: 'Versi Bahasa Indonesia dari peringatan proteksi Google.'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Intro Note */}
      <div className="p-4 bg-blue-950/40 border border-blue-800/80 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-blue-200">
        <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-semibold mb-1">
            Mengapa Memilih Selector Ini?
          </strong>
          Google secara berkala mengacak nama CSS class (seperti <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">.VfPpkd-LgbsSe</code>). Jika Anda menggunakan class acak tersebut, skrip Anda akan rusak saat Google memperbarui UI. Kami merekomendasikan penggunaan kombinasi <strong>ID permanen (#identifierId)</strong>, <strong>semantic attributes (input[type="password"])</strong>, dan <strong>regex text matching</strong> yang selalu bertahan.
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-5">
        {selectorGroups.map((group) => (
          <div 
            key={group.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{group.title}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{group.desc}</p>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 self-start sm:self-auto">
                Stabilitas: {group.stability}
              </span>
            </div>

            <div className="space-y-2">
              {group.selectors.map((item, idx) => {
                const copyId = `${group.id}-${idx}`;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs font-mono font-semibold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {item.code}
                        </code>
                        <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 bg-slate-800/60 rounded">
                          {item.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{item.explanation}</p>
                    </div>

                    <button
                      onClick={() => copyToClipboard(item.code, copyId)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 self-end sm:self-center shrink-0"
                    >
                      {copiedIndex === copyId ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="text-[11px]">Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
