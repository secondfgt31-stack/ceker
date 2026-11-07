// ========================================================
// 📱 GMAIL BATCH CHECKER UNLIMITED (TERMUX ANDROID EDITION)
// Mendukung ratusan hingga ribuan email tanpa batasan!
// Dilengkapi: Auto Memory Recycling, Resume, CSV & TXT Export
// ========================================================

// 1. Bypass proteksi platform Android Termux
Object.defineProperty(process, 'platform', {
  get: () => 'linux',
  configurable: true
});

import fs from 'fs';
import path from 'path';

// 2. Load Playwright Core secara dinamis
const { chromium } = await import('playwright-core');

// Baca email dari emails.txt (Mendukung ratusan / ribuan email!)
if (!fs.existsSync('emails.txt')) {
  console.log('⚠️ File emails.txt belum ditemukan.');
  console.log('📝 Membuat template emails.txt baru...');
  fs.writeFileSync('emails.txt', '# Masukkan daftar email di bawah ini (1 email per baris):\ncontoh1@gmail.com\ncontoh2@gmail.com\n');
}

const allEmails = fs.readFileSync('emails.txt', 'utf-8')
  .split('\n')
  .map((e) => e.trim())
  .filter((e) => e.length > 0 && !e.startsWith('#') && e.includes('@'));

if (allEmails.length === 0) {
  console.log('❌ emails.txt tidak memiliki email valid! Silakan isi emails.txt terlebih dahulu.');
  process.exit(1);
}

// Cek apakah ada riwayat sebelumnya untuk fitur Auto-Resume (Lanjut otomatis jika pernah berhenti)
const checkedSet = new Set();
if (fs.existsSync('hasil_ceker.csv')) {
  try {
    const prev = fs.readFileSync('hasil_ceker.csv', 'utf-8').split('\n');
    for (const line of prev) {
      const parts = line.split(',');
      if (parts.length > 0 && parts[0].includes('@')) {
        checkedSet.add(parts[0].replace(/"/g, '').trim());
      }
    }
  } catch (_) {}
}

const remainingEmails = allEmails.filter(e => !checkedSet.has(e));

console.log('========================================================');
console.log('📱 GMAIL CHECKER UNLIMITED - POCO X6 PRO');
console.log(`📊 Total email di file  : ${allEmails.length} email`);
console.log(`⏭️ Sudah pernah dicek   : ${checkedSet.size} email`);
console.log(`🎯 Target sekarang      : ${remainingEmails.length} email`);
console.log('🚀 Menyiapkan Browser Engine...');
console.log('========================================================');

if (remainingEmails.length === 0) {
  console.log('🎉 Semua email dalam emails.txt sudah pernah dicek!');
  console.log('📁 Lihat rekapnya di: hasil_ceker.txt atau hasil_ceker.csv');
  process.exit(0);
}

const candidates = [
  '/data/data/com.termux/files/usr/bin/chromium-browser',
  '/data/data/com.termux/files/usr/bin/chromium'
];

let chromiumPath = candidates.find((p) => fs.existsSync(p)) || 'chromium-browser';

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-gpu',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--no-zygote',
  '--disable-software-rasterizer',
  '--disable-features=Translate,OptimizationHints,MediaRouter',
  '--disable-blink-features=AutomationControlled'
];

let browser = null;

async function createBrowser() {
  if (browser) {
    try { await browser.close(); } catch (_) {}
  }
  browser = await chromium.launch({
    headless: true,
    executablePath: chromiumPath,
    args: BROWSER_ARGS,
  });
  return browser;
}

browser = await createBrowser();

let context = await browser.newContext({
  locale: 'id-ID',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
  viewport: { width: 412, height: 915 }
});

let page = await context.newPage();
await page.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
});

// Setup CSV header jika belum ada
if (!fs.existsSync('hasil_ceker.csv')) {
  fs.writeFileSync('hasil_ceker.csv', 'Email,Status,Kategori,DurasiMs,Waktu\n');
}

// Statistik
const stats = {
  valid: 0,
  captcha: 0,
  notFound: 0,
  blocked: 0,
  timeout: 0,
  error: 0
};

// Fungsi simpan baris hasil secara aman ke disk
function recordResult(email, outcome, durationMs) {
  let category = 'LAINNYA';
  if (outcome === 'PASSWORD_FIELD_FOUND') {
    category = 'VALID_PASSWORD_MUNCUL';
    stats.valid++;
  } else if (outcome === 'ROBOT_VERIFICATION_FOUND') {
    category = 'VERIFIKASI_ROBOT_CAPTCHA';
    stats.captcha++;
  } else if (outcome === 'EMAIL_NOT_FOUND') {
    category = 'EMAIL_TIDAK_DITEMUKAN';
    stats.notFound++;
  } else if (outcome === 'BROWSER_BLOCKED') {
    category = 'BLOKIR_BROWSER_GOOGLE';
    stats.blocked++;
  } else if (outcome === 'TIMEOUT') {
    category = 'TIMEOUT';
    stats.timeout++;
  } else {
    category = 'ERROR';
    stats.error++;
  }

  const timeStr = new Date().toLocaleTimeString('id-ID');
  const csvRow = `"${email}","${outcome}","${category}",${durationMs},"${timeStr}"\n`;
  const txtRow = `[${timeStr}] ${email} => ${category} (${durationMs}ms)\n`;

  // Simpan append ke CSV & TXT di folder kerja
  fs.appendFileSync('hasil_ceker.csv', csvRow);
  fs.appendFileSync('hasil_ceker.txt', txtRow);

  // Jika folder Download HP ada, duplikasi agar mudah dibuka di aplikasi spreadsheet
  if (fs.existsSync('/sdcard/Download')) {
    try {
      if (!fs.existsSync('/sdcard/Download/hasil_ceker_gmail.csv')) {
        fs.writeFileSync('/sdcard/Download/hasil_ceker_gmail.csv', 'Email,Status,Kategori,DurasiMs,Waktu\n');
      }
      fs.appendFileSync('/sdcard/Download/hasil_ceker_gmail.csv', csvRow);
    } catch (_) {}
  }
}

const totalTarget = remainingEmails.length;

for (let i = 0; i < totalTarget; i++) {
  const email = remainingEmails[i];
  const percent = Math.round(((i + 1) / totalTarget) * 100);
  console.log(`\n[${i + 1}/${totalTarget}] (${percent}%) 🔍 Memeriksa: ${email}...`);

  const t0 = Date.now();
  let outcome = 'TIMEOUT';

  try {
    // 🧹 DAUR ULANG MEMORI: Setiap 30 akun, perbarui page agar RAM POCO X6 Pro tidak bocor saat memproses ratusan email
    if (i > 0 && i % 30 === 0) {
      console.log('   🧹 [RAM Optimizer] Membersihkan cache halaman untuk kestabilan...');
      try {
        await page.close().catch(() => {});
        page = await context.newPage();
        await page.addInitScript(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });
      } catch (_) {
        browser = await createBrowser();
        context = await browser.newContext({
          locale: 'id-ID',
          userAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
          viewport: { width: 412, height: 915 }
        });
        page = await context.newPage();
      }
    }

    // Auto-recover jika browser sempat putus
    if (page.isClosed() || !browser.isConnected()) {
      console.log('   🔄 Menginisialisasi ulang browser engine...');
      browser = await createBrowser();
      context = await browser.newContext({
        locale: 'id-ID',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
        viewport: { width: 412, height: 915 }
      });
      page = await context.newPage();
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });
    }

    // Bersihkan sesi dan cookies
    await context.clearCookies().catch(() => {});

    // Navigasi ke login Google
    await page.goto('https://accounts.google.com/ServiceLogin?hl=id', {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    });

    // Isi email
    const emailInput = page.locator('input[type="email"], #identifierId');
    await emailInput.waitFor({ state: 'visible', timeout: 12000 });
    await emailInput.fill(email);

    // Klik tombol berikutnya
    await page.click('#identifierNext button, #identifierNext');
    await page.waitForTimeout(1400);

    // Cek respon elemen
    const checkStart = Date.now();
    while (Date.now() - checkStart < 15000) {
      const currentUrl = page.url();
      const body = await page.innerText('body').catch(() => '');

      const isPassword = (await page.locator('input[type="password"]:visible, input[name="Passwd"]:visible').count()) > 0;
      if (isPassword || currentUrl.includes('challenge/pwd') || body.includes('Masukkan sandi') || body.includes('Enter your password')) {
        outcome = 'PASSWORD_FIELD_FOUND';
        break;
      }

      const hasCaptchaImg = (await page.locator('#captchaimg:visible, img#captchaimg:visible').count()) > 0;
      const hasCaptchaInput = (await page.locator('input#ca:visible, input[name="ca"]:visible').count()) > 0;
      if (hasCaptchaImg || hasCaptchaInput || body.includes('Ketik teks yang Anda dengar') || body.includes('Buktikan bahwa Anda bukan robot')) {
        outcome = 'ROBOT_VERIFICATION_FOUND';
        break;
      }

      if (body.includes('tidak dapat menemukan') || body.includes("couldn't find your google account")) {
        outcome = 'EMAIL_NOT_FOUND';
        break;
      }

      if (currentUrl.includes('signin/rejected') || body.includes('mungkin tidak aman')) {
        outcome = 'BROWSER_BLOCKED';
        break;
      }

      await page.waitForTimeout(300);
    }
  } catch (err) {
    outcome = `ERROR: ${err.message}`;
  }

  const durationMs = Date.now() - t0;
  recordResult(email, outcome, durationMs);

  if (outcome === 'PASSWORD_FIELD_FOUND') {
    console.log(`   ✅ KATA SANDI MUNCUL! Akun Valid & Siap Login (${durationMs}ms)`);
  } else if (outcome === 'ROBOT_VERIFICATION_FOUND') {
    console.log(`   ⚠️ VERIFIKASI ROBOT / CAPTCHA MUNCUL (${durationMs}ms)`);
  } else if (outcome === 'EMAIL_NOT_FOUND') {
    console.log(`   ❌ EMAIL TIDAK DITEMUKAN (${durationMs}ms)`);
  } else if (outcome === 'BROWSER_BLOCKED') {
    console.log(`   🚫 BLOKIR KEAMANAN BROWSER (${durationMs}ms)`);
  } else {
    console.log(`   ⏱️ ${outcome} (${durationMs}ms)`);
  }

  // Jeda aman antar akun (1.5 detik agar cepat tapi natural)
  if (i < totalTarget - 1) {
    await new Promise((r) => setTimeout(r, 1500));
  }
}

try {
  await browser.close().catch(() => {});
} catch (_) {}

console.log('\n========================================================');
console.log('🎉 SEMUA AKUN SELESAI DIPERIKSA!');
console.log(`📈 Ringkasan Statistik:`);
console.log(`   ✅ Akun Valid (Sandi Muncul) : ${stats.valid}`);
console.log(`   ⚠️ Verifikasi Robot / CAPTCHA: ${stats.captcha}`);
console.log(`   ❌ Tidak Ditemukan           : ${stats.notFound}`);
console.log(`   🚫 Terblokir Browser Google  : ${stats.blocked}`);
console.log(`   ⏱️ Timeout/Error             : ${stats.timeout + stats.error}`);
console.log('📁 Rekap hasil tersimpan di:');
console.log('   - ~/ceker/hasil_ceker.txt');
console.log('   - ~/ceker/hasil_ceker.csv');
if (fs.existsSync('/sdcard/Download')) {
  console.log('   - /sdcard/Download/hasil_ceker_gmail.csv (Bisa langsung dibuka di Excel HP)');
}
console.log('========================================================');
