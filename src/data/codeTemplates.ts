import { ScriptConfig } from '../types';

export function generatePlaywrightCode(config: ScriptConfig): string {
  const { isMultiEmail, targetEnvironment } = config;

  if (targetEnvironment === 'termux') {
    if (config.language === 'typescript') {
      return generateTypeScriptTermuxBatchCode(config);
    } else if (config.language === 'javascript') {
      return generateJavaScriptTermuxBatchCode(config);
    } else if (config.language === 'python_async') {
      return generatePythonAsyncTermuxBatchCode(config);
    } else {
      return generatePythonSyncTermuxBatchCode(config);
    }
  }

  if (isMultiEmail) {
    if (config.language === 'typescript') {
      return generateTypeScriptBatchCode(config);
    } else if (config.language === 'javascript') {
      return generateJavaScriptBatchCode(config);
    } else if (config.language === 'python_async') {
      return generatePythonAsyncBatchCode(config);
    } else {
      return generatePythonSyncBatchCode(config);
    }
  }

  // Single email fallback
  if (config.language === 'typescript') {
    return generateTypeScriptSingleCode(config);
  } else if (config.language === 'javascript') {
    return generateJavaScriptSingleCode(config);
  } else if (config.language === 'python_async') {
    return generatePythonAsyncSingleCode(config);
  } else {
    return generatePythonSyncSingleCode(config);
  }
}

function parseEmailList(raw: string): string[] {
  const list = raw
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && e.includes('@'));
  if (list.length === 0) {
    return ['user1@gmail.com', 'user2@gmail.com', 'user3@gmail.com'];
  }
  return list;
}

// ==========================================
// TERMUX SPECIALIZED CODE TEMPLATES (ANDROID HP)
// ==========================================

function generateJavaScriptTermuxBatchCode(config: ScriptConfig): string {
  const {
    emailsText,
    delayBetweenEmailsMs,
    timeoutMs,
    saveScreenshots,
    locale,
    termuxCustomChromiumPath,
  } = config;

  const emails = parseEmailList(emailsText);
  const emailArrayLiteral = JSON.stringify(emails, null, 2);
  const defaultChromiumPath = termuxCustomChromiumPath.trim() || '/data/data/com.termux/files/usr/bin/chromium';

  return `/**
 * Otomasi Batch Pengecekan Akun Gmail Khusus Termux (HP Android)
 * Disesuaikan untuk arsitektur ARM64 & Android tanpa PC.
 */
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

chromium.use(stealthPlugin());

// Daftar email yang akan dicek
const EMAIL_LIST = ${emailArrayLiteral};

// Lokasi binary Chromium bawaan Termux
const TERMUX_CHROMIUM_PATH = process.env.CHROMIUM_PATH || '${defaultChromiumPath}';

// Folder output penyimpanan HP (agar bisa dibuka langsung di File Manager/Galeri HP)
const STORAGE_DIR = fs.existsSync('/sdcard/Download') ? '/sdcard/Download' : process.cwd();

async function checkAccount(browser, email) {
  const start = Date.now();
  console.log(\`\\n📱 [Termux] Memeriksa: \${email}...\`);

  // Konteks baru per akun agar sesi tidak bocor
  const context = await browser.newContext({
    locale: '${locale}',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 } // Viewport standar layar HP
  });
  const page = await context.newPage();

  try {
    await page.goto('https://accounts.google.com/ServiceLogin?hl=${locale.startsWith('id') ? 'id' : 'en'}', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // 1. Masukkan Email
    const emailSelector = 'input[type="email"], #identifierId';
    await page.waitForSelector(emailSelector, { state: 'visible', timeout: 15000 });
    await page.fill(emailSelector, email);

    // 2. Klik tombol Berikutnya
    await page.click('#identifierNext button, #identifierNext');

    // 3. Menunggu Elemen Password vs Verifikasi Robot / Captcha
    const PWD_SELECTORS = 'input[type="password"]:visible, input[name="Passwd"]:visible';
    const ROBOT_SELECTORS = '#captchaimg, iframe[src*="recaptcha"], input[name="ca"], text=/bukan robot/i, text=/not a robot/i, text=/verifikasi bahwa anda bukan robot/i';
    const NOTFOUND_SELECTORS = 'text=/tidak dapat menemukan akun/i, text=/couldn\\'t find your google account/i';

    const outcome = await Promise.race([
      page.waitForSelector(PWD_SELECTORS, { state: 'visible', timeout: ${timeoutMs} }).then(() => 'PASSWORD_FIELD_FOUND'),
      page.waitForSelector(ROBOT_SELECTORS, { state: 'visible', timeout: ${timeoutMs} }).then(() => 'ROBOT_VERIFICATION_FOUND'),
      page.waitForSelector(NOTFOUND_SELECTORS, { state: 'visible', timeout: ${timeoutMs} }).then(() => 'EMAIL_NOT_FOUND'),
    ]).catch(() => 'TIMEOUT');

    const durationMs = Date.now() - start;

    if (outcome === 'PASSWORD_FIELD_FOUND') {
      console.log(\`✅ [\${email}] -> KATA SANDI MUNCUL (\${durationMs}ms)\`);
    } else if (outcome === 'ROBOT_VERIFICATION_FOUND') {
      console.log(\`⚠️ [\${email}] -> VERIFIKASI ROBOT / CAPTCHA MUNCUL (\${durationMs}ms)\`);
    } else if (outcome === 'EMAIL_NOT_FOUND') {
      console.log(\`❌ [\${email}] -> EMAIL TIDAK DITEMUKAN (\${durationMs}ms)\`);
    }

${saveScreenshots ? `    // Simpan screenshot ke folder Download HP
    const screenshotDir = path.join(STORAGE_DIR, 'gmail_screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const imgPath = path.join(screenshotDir, \`\${email.replace(/[^a-zA-Z0-9]/g, '_')}_\${outcome}.png\`);
    await page.screenshot({ path: imgPath });
    console.log(\`📸 Screenshot disimpan ke: \${imgPath}\`);` : ''}

    return { email, outcome, durationMs };
  } finally {
    await context.close();
  }
}

async function main() {
  console.log('========================================================');
  console.log('📱 MEMULAI CHECKER GMAIL DI TERMUX HP ANDROID');
  console.log(\`📂 Menggunakan Chromium: \${TERMUX_CHROMIUM_PATH}\`);
  console.log('========================================================');

  // Validasi binary chromium di HP
  if (!fs.existsSync(TERMUX_CHROMIUM_PATH) && !process.env.CHROMIUM_PATH) {
    console.warn(\`⚠️ PERINGATAN: Chromium tidak ditemukan di \${TERMUX_CHROMIUM_PATH}\`);
    console.warn('   Pastikan Anda sudah menginstall chromium di Termux dengan: pkg install chromium -y');
  }

  // Parameter wajib untuk Android Termux agar tidak crash
  const browser = await chromium.launch({
    executablePath: TERMUX_CHROMIUM_PATH,
    headless: true, // Headless wajib di Termux terminal
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process', // Menghemat RAM HP Android
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check'
    ]
  });

  const results = [];

  for (let i = 0; i < EMAIL_LIST.length; i++) {
    const email = EMAIL_LIST[i];
    console.log(\`Progress: [\${i + 1}/\${EMAIL_LIST.length}]\`);
    const res = await checkAccount(browser, email);
    results.push(res);

    if (i < EMAIL_LIST.length - 1) {
      console.log('⏳ Jeda anti-spam 3 detik...');
      await new Promise(r => setTimeout(r, ${delayBetweenEmailsMs}));
    }
  }

  await browser.close();

  // Simpan CSV ke folder Download internal HP
  const csvPath = path.join(STORAGE_DIR, 'hasil_batch_gmail.csv');
  const csvHeaders = 'Email,Outcome,DurationMs\\n';
  const csvRows = results.map(r => \`"\${r.email}","\${r.outcome}",\${r.durationMs}\`).join('\\n');
  fs.writeFileSync(csvPath, csvHeaders + csvRows, 'utf-8');

  console.log('\\n==================== HASIL AKHIR ====================');
  console.table(results);
  console.log(\`📊 File CSV berhasil disimpan ke: \${csvPath}\`);
  console.log('Bisa langsung dibuka di File Manager HP Anda!');
}

main();
`;
}

function generateTypeScriptTermuxBatchCode(config: ScriptConfig): string {
  return generateJavaScriptTermuxBatchCode(config);
}

function generatePythonAsyncTermuxBatchCode(config: ScriptConfig): string {
  const {
    emailsText,
    delayBetweenEmailsMs,
    timeoutMs,
    termuxCustomChromiumPath,
  } = config;

  const emails = parseEmailList(emailsText);
  const emailListRepr = JSON.stringify(emails, null, 4);
  const defaultChromiumPath = termuxCustomChromiumPath.trim() || '/data/data/com.termux/files/usr/bin/chromium';

  return `"""
Otomasi Batch Gmail Checker di Termux HP Android (Python Asyncio)
"""
import asyncio
import csv
import os
import time
from playwright.async_api import async_playwright

EMAIL_LIST = ${emailListRepr}

CHROMIUM_PATH = os.environ.get("CHROMIUM_PATH", "${defaultChromiumPath}")
TIMEOUT_MS = ${timeoutMs}
DELAY_SECONDS = ${delayBetweenEmailsMs / 1000}

# Folder Download di HP Android
DOWNLOAD_DIR = "/sdcard/Download" if os.path.exists("/sdcard/Download") else "."

async def check_single_email(browser, email):
    start_time = time.time()
    print(f"\\n📱 [Termux] Memeriksa: {email}...")

    context = await browser.new_context(
        locale="id-ID",
        user_agent="Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
    )
    page = await context.new_page()

    try:
        await page.goto("https://accounts.google.com/ServiceLogin?hl=id", timeout=30000)

        # 1. Isi input email
        email_input = page.locator('input[type="email"], #identifierId')
        await email_input.wait_for(state="visible", timeout=15000)
        await email_input.fill(email)

        # 2. Klik tombol Berikutnya
        next_btn = page.locator('#identifierNext button, #identifierNext')
        await next_btn.first.click()

        # 3. Locators
        pwd = page.locator('input[type="password"]:visible, input[name="Passwd"]')
        robot = page.locator('#captchaimg, iframe[src*="recaptcha"]') \\
            .or_(page.get_by_text("bukan robot", exact=False))
        notfound = page.get_by_text("tidak dapat menemukan akun", exact=False)

        task_pwd = asyncio.create_task(pwd.first.wait_for(state="visible", timeout=TIMEOUT_MS))
        task_robot = asyncio.create_task(robot.first.wait_for(state="visible", timeout=TIMEOUT_MS))
        task_notfound = asyncio.create_task(notfound.first.wait_for(state="visible", timeout=TIMEOUT_MS))

        done, pending = await asyncio.wait([task_pwd, task_robot, task_notfound], return_when=asyncio.FIRST_COMPLETED)
        for t in pending:
            t.cancel()

        outcome = "TIMEOUT"
        if task_pwd in done and not task_pwd.cancelled():
            outcome = "PASSWORD_FIELD_FOUND"
            print(f"✅ [{email}] -> Form Kata Sandi Muncul")
        elif task_robot in done and not task_robot.cancelled():
            outcome = "ROBOT_VERIFICATION_FOUND"
            print(f"⚠️ [{email}] -> Verifikasi Robot / Captcha Muncul")
        elif task_notfound in done and not task_notfound.cancelled():
            outcome = "EMAIL_NOT_FOUND"
            print(f"❌ [{email}] -> Email Tidak Ditemukan")

        duration = round((time.time() - start_time) * 1000)
        await asyncio.sleep(DELAY_SECONDS)
        return {"email": email, "outcome": outcome, "duration_ms": duration}
    finally:
        await context.close()

async def main():
    print("==================================================")
    print("📱 MENJALANKAN GMAIL CHECKER DI TERMUX ANDROID")
    print(f"Chromium Path: {CHROMIUM_PATH}")
    print("==================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROMIUM_PATH,
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-gpu",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--single-process",
                "--disable-blink-features=AutomationControlled"
            ]
        )

        results = []
        for idx, email in enumerate(EMAIL_LIST):
            print(f"[{idx+1}/{len(EMAIL_LIST)}]")
            res = await check_single_email(browser, email)
            results.append(res)

        await browser.close()

    csv_path = os.path.join(DOWNLOAD_DIR, "hasil_termux_gmail.csv")
    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["email", "outcome", "duration_ms"])
        writer.writeheader()
        writer.writerows(results)

    print(f"\\n📊 Hasil tersimpan di: {csv_path}")

if __name__ == "__main__":
    asyncio.run(main())
`;
}

function generatePythonSyncTermuxBatchCode(config: ScriptConfig): string {
  return generatePythonAsyncTermuxBatchCode(config);
}

// ==========================================
// 1. DESKTOP TYPESCRIPT BATCH CHECKER
// ==========================================
function generateTypeScriptBatchCode(config: ScriptConfig): string {
  const {
    emailsText,
    batchMode,
    concurrencyLimit,
    delayBetweenEmailsMs,
    timeoutMs,
    headless,
    slowMoMs,
    useStealth,
    saveScreenshots,
    locale,
  } = config;

  const emails = parseEmailList(emailsText);
  const emailArrayLiteral = JSON.stringify(emails, null, 2);

  return `/**
 * Otomasi Pengecekan Batch Multi-Email Gmail dengan Playwright
 */
import { chromium, Browser } from '${useStealth ? 'playwright-extra' : 'playwright'}';
${useStealth ? "import stealthPlugin from 'puppeteer-extra-plugin-stealth';\nchromium.use(stealthPlugin());" : ''}
import * as fs from 'fs';
import * as path from 'path';

const EMAIL_LIST: string[] = ${emailArrayLiteral};

interface CheckResult {
  email: string;
  status: 'PASSWORD_FIELD_FOUND' | 'ROBOT_VERIFICATION_FOUND' | 'EMAIL_NOT_FOUND' | 'BROWSER_BLOCKED' | 'TIMEOUT_OR_ERROR';
  description: string;
  durationMs: number;
  timestamp: string;
}

async function checkSingleGmail(browser: Browser, email: string): Promise<CheckResult> {
  const startTime = Date.now();
  console.log(\`\\n[START] Memeriksa akun: \${email}...\`);

  const context = await browser.newContext({
    locale: '${locale}',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {
    await page.goto('https://accounts.google.com/ServiceLogin?hl=${locale.startsWith('id') ? 'id' : 'en'}', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    const emailSelector = 'input[type="email"], #identifierId, input[name="identifier"]';
    await page.waitForSelector(emailSelector, { state: 'visible', timeout: 15000 });
    await page.fill(emailSelector, email);
    await page.waitForTimeout(400);

    const nextBtnSelector = '#identifierNext button, #identifierNext, button:has-text("Berikutnya"), button:has-text("Next")';
    await page.click(nextBtnSelector);

    const PASSWORD_SELECTORS = [
      'input[type="password"]:visible',
      'input[name="Passwd"]:visible',
      '#password input:visible',
      'div[id="password"] input'
    ].join(', ');

    const ROBOT_SELECTORS = [
      '#captchaimg',
      'iframe[src*="recaptcha"]',
      'input[name="ca"]',
      'text=/bukan robot/i',
      'text=/not a robot/i',
      'text=/verifikasi bahwa anda bukan robot/i',
      'text=/verifikasi bahwa ini memang anda/i'
    ].join(', ');

    const ERROR_SELECTORS = 'text=/couldn\\'t find your google account/i, text=/tidak dapat menemukan akun/i';
    const BLOCKED_SELECTORS = 'text=/browser or app may not be secure/i, text=/browser atau aplikasi ini mungkin tidak aman/i';

    const result = await Promise.race([
      page.waitForSelector(PASSWORD_SELECTORS, { state: 'visible', timeout: ${timeoutMs} }).then(() => 'PASSWORD_FIELD_FOUND' as const),
      page.waitForSelector(ROBOT_SELECTORS, { state: 'visible', timeout: ${timeoutMs} }).then(() => 'ROBOT_VERIFICATION_FOUND' as const),
      page.waitForSelector(ERROR_SELECTORS, { state: 'visible', timeout: ${timeoutMs} }).then(() => 'EMAIL_NOT_FOUND' as const),
      page.waitForSelector(BLOCKED_SELECTORS, { state: 'visible', timeout: ${timeoutMs} }).then(() => 'BROWSER_BLOCKED' as const),
    ]).catch(() => 'TIMEOUT_OR_ERROR' as const);

    const durationMs = Date.now() - startTime;
    let desc = '';

    if (result === 'PASSWORD_FIELD_FOUND') {
      desc = 'Form password muncul';
      console.log(\`✅ [\${email}] -> KATA SANDI MUNCUL (\${durationMs}ms)\`);
    } else if (result === 'ROBOT_VERIFICATION_FOUND') {
      desc = 'Verifikasi Robot / CAPTCHA muncul';
      console.log(\`⚠️ [\${email}] -> ROBOT / CAPTCHA TERDETEKSI (\${durationMs}ms)\`);
    } else if (result === 'EMAIL_NOT_FOUND') {
      desc = 'Akun Google tidak ditemukan';
      console.log(\`❌ [\${email}] -> EMAIL TIDAK DITEMUKAN (\${durationMs}ms)\`);
    } else {
      desc = 'Timeout';
      console.log(\`⏱️ [\${email}] -> TIMEOUT (\${durationMs}ms)\`);
    }

${saveScreenshots ? `    const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    await page.screenshot({ path: \`screenshot_\${safeEmail}_\${result}.png\` });` : ''}

    return {
      email,
      status: result,
      description: desc,
      durationMs,
      timestamp: new Date().toISOString()
    };
  } finally {
    await context.close();
  }
}

async function runBatchGmailChecker() {
  const browser = await chromium.launch({
    headless: ${headless},
    slowMo: ${slowMoMs},
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const results: CheckResult[] = [];

${batchMode === 'concurrent' ? `  const CONCURRENCY_LIMIT = ${concurrencyLimit};
  let index = 0;

  async function worker() {
    while (index < EMAIL_LIST.length) {
      const emailToProcess = EMAIL_LIST[index++];
      const res = await checkSingleGmail(browser, emailToProcess);
      results.push(res);
      await new Promise(r => setTimeout(r, ${delayBetweenEmailsMs}));
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, EMAIL_LIST.length) }, () => worker());
  await Promise.all(workers);` : `  for (let i = 0; i < EMAIL_LIST.length; i++) {
    const emailToProcess = EMAIL_LIST[i];
    const res = await checkSingleGmail(browser, emailToProcess);
    results.push(res);

    if (i < EMAIL_LIST.length - 1) {
      await new Promise(r => setTimeout(r, ${delayBetweenEmailsMs}));
    }
  }`}

  await browser.close();

  const csvHeaders = 'Email,Status,Keterangan,DurasiMs,Timestamp\\n';
  const csvRows = results.map(r => \`"\${r.email}","\${r.status}","\${r.description}",\${r.durationMs},"\${r.timestamp}"\`).join('\\n');
  fs.writeFileSync('hasil_batch_gmail.csv', csvHeaders + csvRows, 'utf-8');
  console.log('\\nHasil CSV tersimpan di: hasil_batch_gmail.csv');
  console.table(results);
}

runBatchGmailChecker();
`;
}

// ==========================================
// 2. DESKTOP JAVASCRIPT BATCH CHECKER
// ==========================================
function generateJavaScriptBatchCode(config: ScriptConfig): string {
  const { emailsText, delayBetweenEmailsMs, timeoutMs, headless, slowMoMs, locale } = config;
  const emails = parseEmailList(emailsText);
  const emailArrayLiteral = JSON.stringify(emails, null, 2);

  return `/**
 * Otomasi Batch Pengecekan Akun Gmail dengan Node.js Playwright
 */
import { chromium } from 'playwright';
import fs from 'fs';

const EMAIL_LIST = ${emailArrayLiteral};

async function checkAccount(browser, email) {
  const start = Date.now();
  console.log(\`Memeriksa: \${email}...\`);

  const context = await browser.newContext({
    locale: '${locale}',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    await page.goto('https://accounts.google.com/ServiceLogin?hl=${locale.startsWith('id') ? 'id' : 'en'}');
    await page.waitForSelector('input[type="email"], #identifierId', { state: 'visible', timeout: 15000 });
    await page.fill('input[type="email"], #identifierId', email);
    await page.click('#identifierNext button, #identifierNext');

    const PWD_SELECTORS = 'input[type="password"]:visible, input[name="Passwd"]';
    const ROBOT_SELECTORS = '#captchaimg, iframe[src*="recaptcha"], input[name="ca"], text=/bukan robot/i, text=/not a robot/i';
    const NOTFOUND_SELECTORS = 'text=/tidak dapat menemukan akun/i, text=/couldn\\'t find your google account/i';

    const outcome = await Promise.race([
      page.waitForSelector(PWD_SELECTORS, { state: 'visible', timeout: ${timeoutMs} }).then(() => 'PASSWORD_FIELD_FOUND'),
      page.waitForSelector(ROBOT_SELECTORS, { state: 'visible', timeout: ${timeoutMs} }).then(() => 'ROBOT_VERIFICATION_FOUND'),
      page.waitForSelector(NOTFOUND_SELECTORS, { state: 'visible', timeout: ${timeoutMs} }).then(() => 'EMAIL_NOT_FOUND'),
    ]).catch(() => 'TIMEOUT');

    return {
      email,
      outcome,
      durationMs: Date.now() - start
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: ${headless},
    slowMo: ${slowMoMs},
    args: ['--disable-blink-features=AutomationControlled']
  });

  const results = [];

  for (let i = 0; i < EMAIL_LIST.length; i++) {
    const email = EMAIL_LIST[i];
    const res = await checkAccount(browser, email);
    console.log(\`Hasil \${email}: \${res.outcome} (\${res.durationMs}ms)\`);
    results.push(res);

    if (i < EMAIL_LIST.length - 1) {
      await new Promise(r => setTimeout(r, ${delayBetweenEmailsMs}));
    }
  }

  await browser.close();

  const csvContent = 'Email,Outcome,DurationMs\\n' + results.map(r => \`"\${r.email}","\${r.outcome}",\${r.durationMs}\`).join('\\n');
  fs.writeFileSync('batch_results.csv', csvContent);
  console.log('\\nHasil tersimpan di batch_results.csv');
  console.table(results);
}

main();
`;
}

function generatePythonAsyncBatchCode(config: ScriptConfig): string {
  const { emailsText, concurrencyLimit, delayBetweenEmailsMs, timeoutMs, headless, slowMoMs, locale } = config;
  const emails = parseEmailList(emailsText);
  const emailListRepr = JSON.stringify(emails, null, 4);

  return `"""
Otomasi Pengecekan Batch Akun Gmail dengan Python Asyncio & Playwright
"""
import asyncio
import csv
import time
from playwright.async_api import async_playwright

EMAIL_LIST = ${emailListRepr}

CONCURRENCY_LIMIT = ${concurrencyLimit}
TIMEOUT_MS = ${timeoutMs}
DELAY_SECONDS = ${delayBetweenEmailsMs / 1000}

async def check_single_email(semaphore, browser, email):
    async with semaphore:
        start_time = time.time()
        print(f"🚀 Memeriksa: {email}...")
        
        context = await browser.new_context(
            locale="${locale}",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        try:
            await page.goto("https://accounts.google.com/ServiceLogin?hl=${locale.startsWith('id') ? 'id' : 'en'}", timeout=30000)

            email_input = page.locator('input[type="email"], #identifierId')
            await email_input.wait_for(state="visible", timeout=15000)
            await email_input.fill(email)

            next_btn = page.locator('#identifierNext button, #identifierNext')
            await next_btn.first.click()

            pwd_locator = page.locator('input[type="password"]:visible, input[name="Passwd"]')
            robot_locator = page.locator('#captchaimg, iframe[src*="recaptcha"]') \\
                .or_(page.get_by_text("bukan robot", exact=False))
            notfound_locator = page.get_by_text("tidak dapat menemukan akun", exact=False)

            task_pwd = asyncio.create_task(pwd_locator.first.wait_for(state="visible", timeout=TIMEOUT_MS))
            task_robot = asyncio.create_task(robot_locator.first.wait_for(state="visible", timeout=TIMEOUT_MS))
            task_notfound = asyncio.create_task(notfound_locator.first.wait_for(state="visible", timeout=TIMEOUT_MS))

            done, pending = await asyncio.wait(
                [task_pwd, task_robot, task_notfound],
                return_when=asyncio.FIRST_COMPLETED
            )

            for task in pending:
                task.cancel()

            outcome = "TIMEOUT"
            if task_pwd in done and not task_pwd.cancelled():
                outcome = "PASSWORD_FIELD_FOUND"
            elif task_robot in done and not task_robot.cancelled():
                outcome = "ROBOT_VERIFICATION_FOUND"
            elif task_notfound in done and not task_notfound.cancelled():
                outcome = "EMAIL_NOT_FOUND"

            duration = round((time.time() - start_time) * 1000)
            await asyncio.sleep(DELAY_SECONDS)

            return {"email": email, "outcome": outcome, "duration_ms": duration}
        finally:
            await context.close()

async def main():
    semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=${headless ? 'True' : 'False'},
            slow_mo=${slowMoMs},
            args=["--disable-blink-features=AutomationControlled"]
        )

        tasks = [check_single_email(semaphore, browser, email) for email in EMAIL_LIST]
        results = await asyncio.gather(*tasks)
        await browser.close()

    with open("hasil_gmail_batch.csv", mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["email", "outcome", "duration_ms"])
        writer.writeheader()
        writer.writerows(results)

    print("\\nHasil lengkap disimpan di: hasil_gmail_batch.csv")

if __name__ == "__main__":
    asyncio.run(main())
`;
}

function generatePythonSyncBatchCode(config: ScriptConfig): string {
  return generatePythonAsyncBatchCode(config);
}

function generateTypeScriptSingleCode(config: ScriptConfig): string {
  const { email, timeoutMs, headless, slowMoMs, useStealth, locale } = config;
  const targetEmail = email || 'user@gmail.com';

  return `/**
 * Otomasi Login Gmail Single Email
 */
import { chromium } from '${useStealth ? 'playwright-extra' : 'playwright'}';
${useStealth ? "import stealthPlugin from 'puppeteer-extra-plugin-stealth';\nchromium.use(stealthPlugin());" : ''}

async function checkSingle() {
  const browser = await chromium.launch({
    headless: ${headless},
    slowMo: ${slowMoMs},
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({ locale: '${locale}' });
  const page = await context.newPage();

  try {
    await page.goto('https://accounts.google.com/ServiceLogin?hl=${locale.startsWith('id') ? 'id' : 'en'}');
    await page.waitForSelector('input[type="email"], #identifierId', { state: 'visible' });
    await page.fill('input[type="email"], #identifierId', '${targetEmail}');
    await page.click('#identifierNext button, #identifierNext');

    const result = await Promise.race([
      page.waitForSelector('input[type="password"]:visible, input[name="Passwd"]', { state: 'visible', timeout: ${timeoutMs} }).then(() => 'PASSWORD_APPEARED'),
      page.waitForSelector('#captchaimg, iframe[src*="recaptcha"], text=/bukan robot/i, text=/not a robot/i', { state: 'visible', timeout: ${timeoutMs} }).then(() => 'ROBOT_VERIFICATION'),
      page.waitForSelector('text=/couldn\\'t find your google account/i, text=/tidak dapat menemukan akun/i', { state: 'visible', timeout: ${timeoutMs} }).then(() => 'NOT_FOUND'),
    ]).catch(() => 'TIMEOUT');

    console.log('Hasil:', result);
  } finally {
    await browser.close();
  }
}

checkSingle();
`;
}

function generateJavaScriptSingleCode(config: ScriptConfig): string {
  return generateJavaScriptBatchCode({ ...config, emailsText: config.email || 'user@gmail.com' });
}

function generatePythonAsyncSingleCode(config: ScriptConfig): string {
  return generatePythonAsyncBatchCode({ ...config, emailsText: config.email || 'user@gmail.com', concurrencyLimit: 1 });
}

function generatePythonSyncSingleCode(config: ScriptConfig): string {
  return generatePythonSyncBatchCode({ ...config, emailsText: config.email || 'user@gmail.com' });
}

export function generatePackageJson(targetEnvironment: 'desktop' | 'termux' = 'desktop'): string {
  return JSON.stringify(
    {
      name: targetEnvironment === 'termux' ? "gmail-termux-batch-checker" : "gmail-playwright-batch-automation",
      version: "1.2.0",
      description: "Batch Playwright automation for Gmail login detection",
      type: "module",
      scripts: {
        "start": targetEnvironment === 'termux' ? "node gmail_batch_termux.js" : "tsx gmail_batch_checker.ts",
        "install:browsers": targetEnvironment === 'termux' ? "pkg install chromium -y" : "npx playwright install chromium"
      },
      dependencies: {
        "playwright": "^1.49.0",
        "playwright-extra": "^4.3.6",
        "puppeteer-extra-plugin-stealth": "^2.11.2",
        "tsx": "^4.19.0"
      }
    },
    null,
    2
  );
}

export function generateRequirementsTxt(): string {
  return `playwright>=1.49.0
playwright-stealth>=1.0.6
`;
}
