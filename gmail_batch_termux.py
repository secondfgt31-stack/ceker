#!/usr/bin/env python3
"""
Playwright Gmail Login Batch Checker - Python Termux Edition
Solusi alternatif jika Node.js di Termux mengalami error 'CANNOT LINK EXECUTABLE'.
"""

import asyncio
import csv
import os
import sys
import time
from playwright.async_api import async_playwright

# 1. Baca daftar email dari emails.txt
def load_emails():
    file_path = "emails.txt"
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            emails = [
                line.strip() for line in f.readlines()
                if line.strip() and not line.strip().startswith("#") and "@" in line
            ]
            if emails:
                return emails
    return [
        "marketing.team@gmail.com",
        "security.bot.test@gmail.com",
        "tidak.ditemukan.9912@gmail.com"
    ]

# 2. Lokasi Chromium Android Termux
def get_chromium_path():
    env_path = os.environ.get("CHROMIUM_PATH")
    if env_path and os.path.exists(env_path):
        return env_path
    termux_path = "/data/data/com.termux/files/usr/bin/chromium"
    if os.path.exists(termux_path):
        return termux_path
    linux_path = "/usr/bin/chromium-browser"
    if os.path.exists(linux_path):
        return linux_path
    return None

STORAGE_DIR = "/sdcard/Download" if os.path.exists("/sdcard/Download") else "."
EMAIL_LIST = load_emails()
TIMEOUT_MS = 20000
DELAY_SECONDS = 3.0

async def check_single_email(browser, email):
    start_time = time.time()
    print(f"\n📱 [Termux Python] Memeriksa akun: {email}...")

    # Buat context bersih per email
    context = await browser.new_context(
        locale="id-ID",
        user_agent="Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
        viewport={"width": 412, "height": 915}
    )
    page = await context.new_page()

    try:
        await page.goto("https://accounts.google.com/ServiceLogin?hl=id", timeout=30000)

        # 1. Isi input email
        email_input = page.locator('input[type="email"], #identifierId')
        await email_input.wait_for(state="visible", timeout=15000)
        await email_input.fill(email)

        # 2. Klik tombol Berikutnya (Next)
        next_btn = page.locator('#identifierNext button, #identifierNext')
        await next_btn.first.click()

        # 3. Locators target
        pwd_locator = page.locator('input[type="password"]:visible, input[name="Passwd"]')
        robot_locator = page.locator('#captchaimg, iframe[src*="recaptcha"], input[name="ca"]') \
            .or_(page.get_by_text("bukan robot", exact=False)) \
            .or_(page.get_by_text("not a robot", exact=False)) \
            .or_(page.get_by_text("verifikasi bahwa anda bukan robot", exact=False))
        notfound_locator = page.get_by_text("tidak dapat menemukan akun", exact=False) \
            .or_(page.get_by_text("couldn't find your google account", exact=False))

        # Balapan (race condition)
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
        duration_ms = round((time.time() - start_time) * 1000)

        if task_pwd in done and not task_pwd.cancelled() and not task_pwd.exception():
            outcome = "PASSWORD_FIELD_FOUND"
            print(f"✅ [{email}] -> KATA SANDI MUNCUL ({duration_ms}ms)")
        elif task_robot in done and not task_robot.cancelled() and not task_robot.exception():
            outcome = "ROBOT_VERIFICATION_FOUND"
            print(f"⚠️ [{email}] -> VERIFIKASI ROBOT / CAPTCHA MUNCUL ({duration_ms}ms)")
        elif task_notfound in done and not task_notfound.cancelled() and not task_notfound.exception():
            outcome = "EMAIL_NOT_FOUND"
            print(f"❌ [{email}] -> EMAIL TIDAK DITEMUKAN ({duration_ms}ms)")
        else:
            print(f"⏱️ [{email}] -> TIMEOUT ({duration_ms}ms)")

        # Simpan screenshot ke folder Download HP
        try:
            screenshot_dir = os.path.join(STORAGE_DIR, "gmail_screenshots")
            os.makedirs(screenshot_dir, exist_ok=True)
            safe_email = "".join([c if c.isalnum() else "_" for c in email])
            img_path = os.path.join(screenshot_dir, f"{safe_email}_{outcome}.png")
            await page.screenshot(path=img_path)
        except Exception:
            pass

        return {
            "email": email,
            "outcome": outcome,
            "duration_ms": duration_ms
        }
    finally:
        await context.close()

async def main():
    chromium_path = get_chromium_path()

    print("========================================================")
    print("📱 GMAIL BATCH CHECKER FOR ANDROID TERMUX (PYTHON)")
    print(f"📂 Path Chromium : {chromium_path or 'Default Playwright'}")
    print(f"📧 Total Email   : {len(EMAIL_LIST)} akun (dari emails.txt)")
    print(f"💾 Folder Simpan : {STORAGE_DIR}")
    print("========================================================")

    launch_args = [
        "--no-sandbox",
        "--disable-gpu",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
        "--disable-blink-features=AutomationControlled"
    ]

    async with async_playwright() as p:
        browser_kwargs = {
            "headless": True,
            "args": launch_args
        }
        if chromium_path:
            browser_kwargs["executable_path"] = chromium_path

        browser = await p.chromium.launch(**browser_kwargs)
        results = []

        for idx, email in enumerate(EMAIL_LIST):
            print(f"Progress: [{idx + 1}/{len(EMAIL_LIST)}]")
            res = await check_single_email(browser, email)
            results.append(res)

            if idx < len(EMAIL_LIST) - 1:
                print(f"⏳ Jeda anti-spam {DELAY_SECONDS} detik...")
                await asyncio.sleep(DELAY_SECONDS)

        await browser.close()

    # Simpan hasil CSV
    csv_path = os.path.join(STORAGE_DIR, "hasil_batch_gmail.csv")
    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["email", "outcome", "duration_ms"])
        writer.writeheader()
        writer.writerows(results)

    print("\n==================== REKAP HASIL AKHIR ====================")
    for r in results:
        print(f"  {r['email']:<30} => {r['outcome']} ({r['duration_ms']}ms)")
    print(f"\n📊 File CSV berhasil disimpan ke: {csv_path}")
    print("   Bisa langsung dibuka di File Manager / WPS Office / Excel HP Anda!")

if __name__ == "__main__":
    asyncio.run(main())
