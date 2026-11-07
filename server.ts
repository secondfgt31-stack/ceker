import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { chromium } from 'playwright-extra';
import type { Browser } from 'playwright';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import { fileURLToPath } from 'url';

// Aktifkan stealth plugin
chromium.use(stealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper untuk memparsing URL proxy dalam berbagai format (termasuk user:pass@host:port)
function parseProxyConfig(rawProxy: any) {
  if (!rawProxy || !rawProxy.server) return undefined;
  let rawServer = String(rawProxy.server).trim();
  let username = rawProxy.username ? String(rawProxy.username).trim() : undefined;
  let password = rawProxy.password ? String(rawProxy.password).trim() : undefined;

  try {
    if (rawServer.includes('@')) {
      const urlToParse = rawServer.startsWith('http://') || rawServer.startsWith('https://') || rawServer.startsWith('socks5://')
        ? rawServer
        : `http://${rawServer}`;
      const parsedUrl = new URL(urlToParse);
      if (parsedUrl.username) username = decodeURIComponent(parsedUrl.username);
      if (parsedUrl.password) password = decodeURIComponent(parsedUrl.password);
      rawServer = `${parsedUrl.protocol}//${parsedUrl.host}`;
    } else if (!rawServer.startsWith('http://') && !rawServer.startsWith('https://') && !rawServer.startsWith('socks5://')) {
      rawServer = `http://${rawServer}`;
    }
  } catch {
    // fallback
  }

  return {
    server: rawServer,
    username: username || undefined,
    password: password || undefined,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/status', async (req: Request, res: Response) => {
    res.json({
      status: 'online',
      service: 'Playwright Cloud Gmail Checker',
      environment: 'Server-Side Cloud Chromium (No Termux needed)',
      timestamp: new Date().toISOString(),
    });
  });

  // API: Live Check Single Email dengan Real Chromium di Cloud
  app.post('/api/check-single', async (req: Request, res: Response) => {
    const { email, timeoutMs = 25000, locale = 'id', proxy } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }

    const logs: Array<{ text: string; type: 'info' | 'success' | 'warn' | 'error' }> = [];
    const startTime = Date.now();

    logs.push({ text: `[Server] Memulai browser Chromium (Cloud Engine)...`, type: 'info' });
    logs.push({ text: `[Server] Memeriksa akun: ${email}`, type: 'info' });

    let browser: Browser | null = null;

    try {
      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
        ],
      };

      const parsedProxy = parseProxyConfig(proxy);
      if (parsedProxy) {
        launchOptions.proxy = parsedProxy;
        logs.push({
          text: `[Proxy] Menggunakan proxy: ${parsedProxy.server}${parsedProxy.username ? ` (User: ${parsedProxy.username})` : ''}`,
          type: 'info',
        });
      }

      browser = await chromium.launch(launchOptions);

      const context = await browser.newContext({
        locale: locale === 'en' ? 'en-US' : 'id-ID',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
      });

      const page = await context.newPage();

      // Jika menggunakan proxy, optimasi koneksi dengan mengabaikan media/gambar berat agar tidak timeout
      if (parsedProxy) {
        await page.route('**/*', (route) => {
          const type = route.request().resourceType();
          if (type === 'image' || type === 'media' || type === 'font') {
            return route.abort();
          }
          return route.continue();
        });
      }

      // Mask webdriver
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      logs.push({ text: `[Playwright] Mengakses Google Accounts sign-in...`, type: 'info' });
      await page.goto(`https://accounts.google.com/ServiceLogin?hl=${locale === 'en' ? 'en' : 'id'}`, {
        waitUntil: 'domcontentloaded',
        timeout: parsedProxy ? 35000 : 25000,
      });

      // 1. Input Email
      const emailSelector = 'input[type="email"], #identifierId';
      await page.waitForSelector(emailSelector, { state: 'visible', timeout: 15000 });
      logs.push({ text: `[Playwright] Mengetik email: ${email}`, type: 'info' });
      await page.fill(emailSelector, email);
      await page.waitForTimeout(400);

      // 2. Klik tombol Berikutnya / Next
      const nextBtnSelector = '#identifierNext button, #identifierNext, button:has-text("Berikutnya"), button:has-text("Next")';
      logs.push({ text: `[Playwright] Mengklik tombol Berikutnya...`, type: 'info' });
      await page.click(nextBtnSelector);

      // Tunggu respons transisi Google (minimal 1.2 detik agar form selesai submit)
      await page.waitForTimeout(1200);

      // 3. Menunggu respons dengan loop aktif (menghindari deteksi dini atau timeout palsu)
      logs.push({ text: `[Playwright] Menganalisis respon Google (Password vs Robot vs Error)...`, type: 'info' });

      let outcome: 'PASSWORD_FIELD_FOUND' | 'ROBOT_VERIFICATION_FOUND' | 'EMAIL_NOT_FOUND' | 'BROWSER_BLOCKED_INSECURE' | 'TIMEOUT' = 'TIMEOUT';
      const checkStartTime = Date.now();

      while (Date.now() - checkStartTime < timeoutMs) {
        const currentUrl = page.url();
        const bodyText = await page.innerText('body').catch(() => '');

        // Cek 1: Apakah Google memblokir karena deteksi otomasi / IP Cloud ("Browser mungkin tidak aman")
        if (
          currentUrl.includes('signin/rejected') ||
          currentUrl.includes('/rejected') ||
          bodyText.includes('mungkin tidak aman') ||
          bodyText.includes('may not be secure') ||
          bodyText.includes('Tidak dapat memproses login') ||
          bodyText.includes("Couldn't sign you in")
        ) {
          outcome = 'BROWSER_BLOCKED_INSECURE';
          break;
        }

        // Cek 2: Apakah form input password sudah muncul
        const pwdCount = await page.locator('input[type="password"]:visible, input[name="Passwd"]:visible, input[name="password"]:visible').count().catch(() => 0);
        if (pwdCount > 0 || currentUrl.includes('challenge/pwd') || bodyText.includes('Masukkan sandi') || bodyText.includes('Enter your password')) {
          outcome = 'PASSWORD_FIELD_FOUND';
          break;
        }

        // Cek 3: Apakah verifikasi robot / CAPTCHA BENAR-BENAR muncul (elemen visual nyata, bukan iframe background)
        const visibleCaptchaImg = await page.locator('#captchaimg:visible, img#captchaimg:visible').count().catch(() => 0);
        const visibleCaptchaInput = await page.locator('input#ca:visible, input[name="ca"]:visible, input#captcha:visible').count().catch(() => 0);
        const visibleRecaptchaFrame = await page.locator('iframe[title*="recaptcha challenge"]:visible, iframe[title*="Tantangan reCAPTCHA"]:visible').count().catch(() => 0);

        if (
          visibleCaptchaImg > 0 ||
          visibleCaptchaInput > 0 ||
          visibleRecaptchaFrame > 0 ||
          bodyText.includes('Ketik teks yang Anda dengar atau lihat') ||
          bodyText.includes('Type the text you hear or see') ||
          bodyText.includes('Buktikan bahwa Anda bukan robot') ||
          bodyText.includes('Verifikasi bahwa Anda bukan robot') ||
          bodyText.includes('Ketik karakter yang Anda lihat')
        ) {
          outcome = 'ROBOT_VERIFICATION_FOUND';
          break;
        }

        // Cek 4: Apakah email tidak terdaftar
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

      const durationMs = Date.now() - startTime;

      if (outcome === 'PASSWORD_FIELD_FOUND') {
        logs.push({ text: `[Hasil] ✅ Kolom Password muncul! Akun valid & siap login (${durationMs}ms)`, type: 'success' });
      } else if (outcome === 'ROBOT_VERIFICATION_FOUND') {
        logs.push({ text: `[Hasil] ⚠️ Verifikasi Robot / CAPTCHA muncul! (${durationMs}ms)`, type: 'warn' });
      } else if (outcome === 'EMAIL_NOT_FOUND') {
        logs.push({ text: `[Hasil] ❌ Akun Google tidak ditemukan (${durationMs}ms)`, type: 'error' });
      } else if (outcome === 'BROWSER_BLOCKED_INSECURE') {
        logs.push({ text: `[Hasil] 🚫 Google memblokir: "Browser atau aplikasi ini mungkin tidak aman" (${durationMs}ms)`, type: 'warn' });
        logs.push({ text: `[Penyebab] Google mendeteksi IP Cloud Data Center. Solusi: Gunakan Proxy atau jalankan di jaringan lokal.`, type: 'info' });
      } else {
        logs.push({ text: `[Hasil] ⏱️ Timeout (${durationMs}ms)`, type: 'warn' });
      }

      // Ambil screenshot hasil halaman Google
      let screenshotBase64 = '';
      try {
        const buffer = await page.screenshot({ type: 'jpeg', quality: 75 });
        screenshotBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      } catch (screenshotErr) {
        console.warn('Gagal mengambil screenshot:', screenshotErr);
      }

      await context.close();
      await browser.close();
      browser = null;

      res.json({
        email,
        outcome,
        durationMs,
        screenshotBase64,
        timestamp: new Date().toISOString(),
        logs,
      });
    } catch (err: any) {
      if (browser) await browser.close();
      logs.push({ text: `[Error] ${err.message || 'Terjadi kesalahan eksekusi di server'}`, type: 'error' });
      res.status(500).json({
        email,
        outcome: 'ERROR',
        durationMs: Date.now() - startTime,
        error: err.message,
        logs,
      });
    }
  });

  // API: Live Batch Check Multiple Emails
  app.post('/api/check-batch', async (req: Request, res: Response) => {
    const { emails, delayMs = 2000, timeoutMs = 15000, locale = 'id', proxy } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Daftar email kosong atau tidak valid.' });
    }

    const cleanEmails = emails
      .map((e: string) => (typeof e === 'string' ? e.trim() : ''))
      .filter((e: string) => e.length > 0 && e.includes('@'))
      .slice(0, 1000); // Mendukung hingga 1000 email sekaligus!

    let browser: Browser | null = null;
    const results = [];

    try {
      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
        ],
      };

      const parsedProxy = parseProxyConfig(proxy);
      if (parsedProxy) {
        launchOptions.proxy = parsedProxy;
      }

      browser = await chromium.launch(launchOptions);

      for (let i = 0; i < cleanEmails.length; i++) {
        const email = cleanEmails[i];
        const start = Date.now();

        const context = await browser.newContext({
          locale: locale === 'en' ? 'en-US' : 'id-ID',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          viewport: { width: 1280, height: 800 },
        });
        const page = await context.newPage();

        // Jika menggunakan proxy, optimasi koneksi dengan mengabaikan media/gambar berat agar tidak timeout
        if (parsedProxy) {
          await page.route('**/*', (route) => {
            const type = route.request().resourceType();
            if (type === 'image' || type === 'media' || type === 'font') {
              return route.abort();
            }
            return route.continue();
          });
        }

        try {
          await page.goto(`https://accounts.google.com/ServiceLogin?hl=${locale === 'en' ? 'en' : 'id'}`, {
            waitUntil: 'domcontentloaded',
            timeout: parsedProxy ? 35000 : 25000,
          });

          await page.waitForSelector('input[type="email"], #identifierId', { state: 'visible', timeout: 15000 });
          await page.fill('input[type="email"], #identifierId', email);
          await page.click('#identifierNext button, #identifierNext');

          // Tunggu respons transisi Google (minimal 1.2 detik agar form selesai submit)
          await page.waitForTimeout(1200);

          let outcome: string = 'TIMEOUT';
          const itemStart = Date.now();

          while (Date.now() - itemStart < timeoutMs) {
            const currentUrl = page.url();
            const bodyText = await page.innerText('body').catch(() => '');

            // Cek 1: Blokir browser oleh Google
            if (
              currentUrl.includes('signin/rejected') ||
              currentUrl.includes('/rejected') ||
              bodyText.includes('mungkin tidak aman') ||
              bodyText.includes('may not be secure') ||
              bodyText.includes('Tidak dapat memproses login') ||
              bodyText.includes("Couldn't sign you in")
            ) {
              outcome = 'BROWSER_BLOCKED_INSECURE';
              break;
            }

            // Cek 2: Kolom input password muncul
            const pwdCount = await page.locator('input[type="password"]:visible, input[name="Passwd"]:visible, input[name="password"]:visible').count().catch(() => 0);
            if (pwdCount > 0 || currentUrl.includes('challenge/pwd') || bodyText.includes('Masukkan sandi') || bodyText.includes('Enter your password')) {
              outcome = 'PASSWORD_FIELD_FOUND';
              break;
            }

            // Cek 3: CAPTCHA / Robot nyata yang terlihat
            const visibleCaptchaImg = await page.locator('#captchaimg:visible, img#captchaimg:visible').count().catch(() => 0);
            const visibleCaptchaInput = await page.locator('input#ca:visible, input[name="ca"]:visible, input#captcha:visible').count().catch(() => 0);
            const visibleRecaptchaFrame = await page.locator('iframe[title*="recaptcha challenge"]:visible, iframe[title*="Tantangan reCAPTCHA"]:visible').count().catch(() => 0);

            if (
              visibleCaptchaImg > 0 ||
              visibleCaptchaInput > 0 ||
              visibleRecaptchaFrame > 0 ||
              bodyText.includes('Ketik teks yang Anda dengar atau lihat') ||
              bodyText.includes('Type the text you hear or see') ||
              bodyText.includes('Buktikan bahwa Anda bukan robot') ||
              bodyText.includes('Verifikasi bahwa Anda bukan robot') ||
              bodyText.includes('Ketik karakter yang Anda lihat')
            ) {
              outcome = 'ROBOT_VERIFICATION_FOUND';
              break;
            }

            // Cek 4: Email tidak terdaftar
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

          results.push({
            email,
            outcome,
            durationMs: Date.now() - start,
            timestamp: new Date().toLocaleTimeString(),
          });
        } catch (itemErr: any) {
          results.push({
            email,
            outcome: 'ERROR',
            durationMs: Date.now() - start,
            details: itemErr.message,
            timestamp: new Date().toLocaleTimeString(),
          });
        } finally {
          await context.close();
        }

        if (i < cleanEmails.length - 1) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      await browser.close();
      res.json({ results });
    } catch (err: any) {
      if (browser) await browser.close();
      res.status(500).json({ error: err.message, results });
    }
  });

  // Mount Vite dev server atau static files
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Playwright Cloud WebApp running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
