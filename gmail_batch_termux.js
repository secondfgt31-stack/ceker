/**
 * Playwright Gmail Login Checker - Termux Android Edition
 * 
 * Skrip otomasi untuk mengecek beberapa akun Gmail sekaligus:
 * Menentukan apakah email memicu form password, verifikasi robot / CAPTCHA,
 * atau akun tidak ditemukan.
 * 
 * Didesain khusus untuk berjalan langsung di HP Android (Termux) tanpa PC!
 */

import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

// Pasang plugin stealth anti-bot
chromium.use(stealthPlugin());

// Fungsi membaca daftar email dari emails.txt
function loadEmails() {
  const filePath = path.join(process.cwd(), 'emails.txt');
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#') && line.includes('@'));
    if (lines.length > 0) return lines;
  }
  // Default fallback jika emails.txt kosong
  return [
    'marketing.team@gmail.com',
    'security.bot.test@gmail.com',
    'tidak.ditemukan.9912@gmail.com'
  ];
}

// Deteksi binary Chromium di Android Termux
function getChromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const termuxPath = '/data/data/com.termux/files/usr/bin/chromium';
  if (fs.existsSync(termuxPath)) return termuxPath;
  const linuxPath = '/usr/bin/chromium-browser';
  if (fs.existsSync(linuxPath)) return linuxPath;
  return undefined; // Gunakan default Playwright jika dijalankan di PC
}

// Folder penyimpanan hasil (Folder Download HP)
const STORAGE_DIR = fs.existsSync('/sdcard/Download') ? '/sdcard/Download' : process.cwd();
const EMAIL_LIST = loadEmails();
const DELAY_BETWEEN_EMAILS_MS = 3000; // Jeda 3 detik antar akun untuk keamanan
const TIMEOUT_MS = 20000; // 20 detik batas tunggu

async function checkAccount(browser, email) {
  const start = Date.now();
  console.log(`\n📱 [Termux] Memeriksa akun: ${email}...`);

  // Buat context bersih per email (membersihkan cookies & riwayat sesi)
  const context = await browser.newContext({
    locale: 'id-ID',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 } // Viewport resolusi layar HP
  });
  const page = await context.newPage();

  try {
    await page.goto('https://accounts.google.com/ServiceLogin?hl=id', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // 1. Ketikkan Email
    const emailSelector = 'input[type="email"], #identifierId';
    await page.waitForSelector(emailSelector, { state: 'visible', timeout: 15000 });
    await page.fill(emailSelector, email);

    // 2. Klik tombol Berikutnya (Next)
    await page.click('#identifierNext button, #identifierNext');

    // 3. Menunggu Respons: Password vs Robot / Captcha
    const PWD_SELECTORS = 'input[type="password"]:visible, input[name="Passwd"]:visible';
    const ROBOT_SELECTORS = '#captchaimg, iframe[src*="recaptcha"], input[name="ca"], text=/bukan robot/i, text=/not a robot/i, text=/verifikasi bahwa anda bukan robot/i';
    const NOTFOUND_SELECTORS = 'text=/tidak dapat menemukan akun/i, text=/couldn\'t find your google account/i';
    const BLOCKED_SELECTORS = 'text=/browser atau aplikasi ini mungkin tidak aman/i, text=/browser or app may not be secure/i';

    const outcome = await Promise.race([
      page.waitForSelector(PWD_SELECTORS, { state: 'visible', timeout: TIMEOUT_MS }).then(() => 'PASSWORD_FIELD_FOUND'),
      page.waitForSelector(ROBOT_SELECTORS, { state: 'visible', timeout: TIMEOUT_MS }).then(() => 'ROBOT_VERIFICATION_FOUND'),
      page.waitForSelector(NOTFOUND_SELECTORS, { state: 'visible', timeout: TIMEOUT_MS }).then(() => 'EMAIL_NOT_FOUND'),
      page.waitForSelector(BLOCKED_SELECTORS, { state: 'visible', timeout: TIMEOUT_MS }).then(() => 'BROWSER_BLOCKED'),
    ]).catch(() => 'TIMEOUT');

    const durationMs = Date.now() - start;

    if (outcome === 'PASSWORD_FIELD_FOUND') {
      console.log(`✅ [${email}] -> KATA SANDI MUNCUL (${durationMs}ms)`);
    } else if (outcome === 'ROBOT_VERIFICATION_FOUND') {
      console.log(`⚠️ [${email}] -> VERIFIKASI ROBOT / CAPTCHA MUNCUL (${durationMs}ms)`);
    } else if (outcome === 'EMAIL_NOT_FOUND') {
      console.log(`❌ [${email}] -> EMAIL TIDAK DITEMUKAN (${durationMs}ms)`);
    } else if (outcome === 'BROWSER_BLOCKED') {
      console.log(`🚫 [${email}] -> GOOGLE MEMBLOKIR BROWSER ("Not Secure") (${durationMs}ms)`);
    } else {
      console.log(`⏱️ [${email}] -> TIMEOUT (${durationMs}ms)`);
    }

    // Simpan screenshot ke folder Download HP
    try {
      const screenshotDir = path.join(STORAGE_DIR, 'gmail_screenshots');
      if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
      const imgPath = path.join(screenshotDir, `${email.replace(/[^a-zA-Z0-9]/g, '_')}_${outcome}.png`);
      await page.screenshot({ path: imgPath });
    } catch (_) {}

    return { email, outcome, durationMs };
  } finally {
    await context.close();
  }
}

async function main() {
  const chromiumPath = getChromiumPath();

  console.log('========================================================');
  console.log('📱 GMAIL BATCH CHECKER FOR ANDROID TERMUX');
  console.log(`📂 Path Chromium : ${chromiumPath || 'Default Playwright'}`);
  console.log(`📧 Total Email   : ${EMAIL_LIST.length} akun (dari emails.txt)`);
  console.log(`💾 Folder Simpan : ${STORAGE_DIR}`);
  console.log('========================================================');

  const launchOptions = {
    headless: true, // Wajib true di Terminal Termux
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process', // Wajib di Android agar tidak kehabisan RAM
      '--disable-blink-features=AutomationControlled'
    ]
  };

  if (chromiumPath) {
    launchOptions.executablePath = chromiumPath;
  }

  const browser = await chromium.launch(launchOptions);
  const results = [];

  for (let i = 0; i < EMAIL_LIST.length; i++) {
    const email = EMAIL_LIST[i];
    console.log(`Progress: [${i + 1}/${EMAIL_LIST.length}]`);
    const res = await checkAccount(browser, email);
    results.push(res);

    if (i < EMAIL_LIST.length - 1) {
      console.log(`⏳ Jeda anti-spam ${DELAY_BETWEEN_EMAILS_MS / 1000} detik...`);
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_EMAILS_MS));
    }
  }

  await browser.close();

  // Simpan CSV ke folder Download HP
  const csvPath = path.join(STORAGE_DIR, 'hasil_batch_gmail.csv');
  const csvHeaders = 'Email,Outcome,DurationMs,Timestamp\n';
  const csvRows = results.map(r => `"${r.email}","${r.outcome}",${r.durationMs},"${new Date().toISOString()}"`).join('\n');
  fs.writeFileSync(csvPath, csvHeaders + csvRows, 'utf-8');

  console.log('\n==================== REKAP HASIL AKHIR ====================');
  console.table(results);
  console.log(`\n📊 File CSV berhasil disimpan ke: ${csvPath}`);
  console.log('   Bisa langsung dibuka di File Manager / WPS Office / Excel HP Anda!');
}

main();
