/**
 * Playwright Gmail Login Checker - Termux Android Edition
 * 
 * Skrip otomasi untuk mengecek beberapa akun Gmail sekaligus:
 * Menentukan apakah email memicu form password, verifikasi robot / CAPTCHA,
 * atau akun tidak ditemukan.
 * 
 * Didesain khusus untuk berjalan langsung di HP Android (Termux) tanpa PC!
 */

// Patch platform agar Playwright tidak menolak Termux Android
Object.defineProperty(process, 'platform', {
  get: () => 'linux',
  configurable: true
});

import fs from 'fs';
import path from 'path';

// Dynamic import playwright-core setelah platform diubah ke linux
const { chromium: pwChromium } = await import('playwright-core');

// Pasang plugin stealth anti-bot secara aman jika tersedia
let chromium = pwChromium;
try {
  const { addExtra } = await import('playwright-extra');
  const stealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
  const extraChromium = addExtra(pwChromium);
  extraChromium.use(stealthPlugin());
  chromium = extraChromium;
} catch (_) {
  chromium = pwChromium;
}

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

// Deteksi binary Chromium di Android Termux secara dinamis
function getChromiumPath() {
  if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }
  
  // Cari otomatis menggunakan perintah which di sistem Termux
  try {
    const whichOut = execSync('which chromium-browser || which chromium', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (whichOut && fs.existsSync(whichOut)) return whichOut;
  } catch (_) {}

  const possiblePaths = [
    '/data/data/com.termux/files/usr/bin/chromium-browser',
    '/data/data/com.termux/files/usr/bin/chromium',
    '/data/data/com.termux/files/usr/lib/chromium/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
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
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 } // Viewport resolusi layar HP
  });
  const page = await context.newPage();

  // Mask webdriver
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

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
    await page.waitForTimeout(1200);

    // 3. Menunggu Respons: Password vs Robot / Captcha
    let outcome = 'TIMEOUT';
    const checkStartTime = Date.now();

    while (Date.now() - checkStartTime < TIMEOUT_MS) {
      const currentUrl = page.url();
      const bodyText = await page.innerText('body').catch(() => '');

      // Cek blokir keamanan Google
      if (
        currentUrl.includes('signin/rejected') ||
        currentUrl.includes('/rejected') ||
        bodyText.includes('mungkin tidak aman') ||
        bodyText.includes('may not be secure') ||
        bodyText.includes('Tidak dapat memproses login')
      ) {
        outcome = 'BROWSER_BLOCKED';
        break;
      }

      // Cek kolom password
      const pwdCount = await page.locator('input[type="password"]:visible, input[name="Passwd"]:visible').count().catch(() => 0);
      if (pwdCount > 0 || currentUrl.includes('challenge/pwd') || bodyText.includes('Masukkan sandi') || bodyText.includes('Enter your password')) {
        outcome = 'PASSWORD_FIELD_FOUND';
        break;
      }

      // Cek CAPTCHA visual nyata
      const visibleCaptchaImg = await page.locator('#captchaimg:visible, img#captchaimg:visible').count().catch(() => 0);
      const visibleCaptchaInput = await page.locator('input#ca:visible, input[name="ca"]:visible, input#captcha:visible').count().catch(() => 0);
      if (
        visibleCaptchaImg > 0 ||
        visibleCaptchaInput > 0 ||
        bodyText.includes('Ketik teks yang Anda dengar atau lihat') ||
        bodyText.includes('Type the text you hear or see') ||
        bodyText.includes('Buktikan bahwa Anda bukan robot') ||
        bodyText.includes('Verifikasi bahwa Anda bukan robot')
      ) {
        outcome = 'ROBOT_VERIFICATION_FOUND';
        break;
      }

      // Cek email tidak terdaftar
      if (
        bodyText.includes('tidak dapat menemukan') ||
        bodyText.includes("couldn't find your google account") ||
        bodyText.includes('Masukkan email atau nomor telepon yang valid')
      ) {
        outcome = 'EMAIL_NOT_FOUND';
        break;
      }

      await page.waitForTimeout(350);
    }

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
