#!/usr/bin/env node

/**
 * GermanJobsPro — Automated 1080p Full HD Demo Video Recording Pipeline (Arabic /ar)
 * 
 * Target: https://www.germanjobspro.com/ar
 * Viewport: 1920x1080 (Full HD, 16:9)
 * Output: scripts/demo-video/output/germanjobspro-demo-ar-1080p.mp4
 * Script: scripts/demo-video/output/voiceover-script-ar.md
 * 
 * Modes:
 *   1) node scripts/demo-video/record-demo-ar.mjs --login
 *      Opens visible browser for founder to log into Demo Pro account once and saves .auth-state.json
 * 
 *   2) node scripts/demo-video/record-demo-ar.mjs
 *      Automates the 7-scene choreography (~2.5 - 3 minutes), records video, converts to H.264 MP4 via FFmpeg,
 *      and generates timestamped Arabic voiceover script.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import readline from 'node:readline';

// --- Paths & Directories ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT_DIR = __dirname;
const AUTH_STATE_PATH = resolve(SCRIPT_DIR, '.auth-state.json');
const OUTPUT_DIR = resolve(SCRIPT_DIR, 'output');
const RAW_VIDEO_DIR = resolve(OUTPUT_DIR, 'raw');
const FINAL_MP4_PATH = resolve(OUTPUT_DIR, 'germanjobspro-demo-ar-1080p.mp4');
const VOICEOVER_SCRIPT_PATH = resolve(OUTPUT_DIR, 'voiceover-script-ar.md');
const BASE_URL = 'https://www.germanjobspro.com';

// --- Dynamic Playwright Import with Friendly Guard ---
let chromium;
try {
  const pw = await import('playwright');
  chromium = pw.chromium;
} catch (err) {
  console.error(`
================================================================================
❌ خطأ: مكتبة Playwright غير متوفرة في بيئة Node.js المحلية.
⚠️  Playwright is not installed in the local environment.

لتثبيتها بدون تعديل ملف package.json الرئيسي، يرجى تنفيذ الأمر التالي:
To install Playwright without modifying the root package.json:

  npm install --no-save playwright
  npx playwright install chromium

ثم أعد تشغيل السكربت.
================================================================================
`);
  process.exit(1);
}

// Ensure necessary output directories exist
mkdirSync(OUTPUT_DIR, { recursive: true });
mkdirSync(RAW_VIDEO_DIR, { recursive: true });

// Parse CLI flags
const isLoginMode = process.argv.includes('--login');
const isHeaded = process.argv.includes('--headed');

// --- Helper Functions for Timing & Logging ---
let recordingStartTime = Date.now();

function resetTimer() {
  recordingStartTime = Date.now();
}

function getElapsedSeconds() {
  return Math.floor((Date.now() - recordingStartTime) / 1000);
}

function formatTimestamp(seconds = getElapsedSeconds()) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function logScene(sceneNum, nameAr, nameEn) {
  const ts = formatTimestamp();
  console.log(`\n🎬 [${ts}] Scene ${sceneNum}: ${nameAr} (${nameEn})`);
  return ts;
}

// --- Mode A: Interactive One-Time Login Capture ---
async function runLoginMode() {
  console.log(`
================================================================================
🇩🇪 GermanJobsPro — التقاط جلسة تسجيل الدخول (One-Time Login Capture)
================================================================================
سَيتم الآن فتح متصفح Chromium بملء الشاشة على صفحة تسجيل الدخول:
${BASE_URL}/ar/auth/login

الخطوات المطلوبة:
1. قم بتسجيل الدخول إلى حسابك التجريبي (Demo Pro) بواسطة Google أو البريد الإلكتروني.
2. انتظر حتى تكتمل عملية الدخول وتصل إلى لوحة التحكم (/ar/dashboard).
3. ارجع إلى هذه النافذة في الطرفية واضغط على مفتاح [ENTER] لحفظ الجلسة.
================================================================================
`);

  const launchOptions = {
    headless: false,
    channel: 'chrome',
    args: [
      '--start-maximized',
      '--window-size=1920,1080',
      '--disable-quic',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  };

  let browser;
  try {
    browser = await chromium.launch(launchOptions);
  } catch (err) {
    console.warn(`⚠️ [Browser Launch] Could not launch system Chrome (${err.message}). Falling back to bundled Chromium...`);
    const { channel: _, ...fallbackOptions } = launchOptions;
    browser = await chromium.launch(fallbackOptions);
  }

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'ar-MA',
  });

  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);
  await page.goto(`${BASE_URL}/ar/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Terminal wait prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise((resolvePrompt) => {
    rl.question('\n👉 بمجرد اكتمال تسجيل الدخول وظهور لوحة التحكم، اضغط [ENTER] هنا: ', () => {
      rl.close();
      resolvePrompt();
    });
  });

  console.log('\n⏳ جاري حفظ بيانات الجلسة وملفات تعريف الارتباط...');
  await context.storageState({ path: AUTH_STATE_PATH });

  console.log(`
✅ تم حفظ بيانات الجلسة بنجاح في:
   ${AUTH_STATE_PATH}

🚀 يمكنك الآن بدء تسجيل الفيديو التوضيحي بالكامل عبر الأمر:
   node scripts/demo-video/record-demo-ar.mjs
================================================================================
`);

  await context.close();
  await browser.close();
  process.exit(0);
}

// --- Smooth Motion & Cursor Animation Script (Injected via CDP) ---
const CURSOR_INJECTION_SCRIPT = `
(() => {
  if (window.__playwright_cursor_initialized) return;
  window.__playwright_cursor_initialized = true;

  // Visual Cursor Container
  const cursor = document.createElement('div');
  cursor.id = '__playwright_custom_cursor';
  cursor.style.position = 'fixed';
  cursor.style.top = '0';
  cursor.style.left = '0';
  cursor.style.zIndex = '2147483647';
  cursor.style.pointerEvents = 'none';
  cursor.style.transform = 'translate3d(960px, 540px, 0)';
  cursor.style.transition = 'transform 0.08s ease-out';
  cursor.style.willChange = 'transform';

  cursor.innerHTML = \`
    <div style="position: relative; width: 32px; height: 32px; pointer-events: none;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5)); transform: rotate(-10deg);">
        <path d="M3 3L10.5 21L13.5 13.5L21 10.5L3 3Z" fill="#2563eb" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
      <div style="position: absolute; top: 1px; left: 1px; width: 6px; height: 6px; background: #60a5fa; border-radius: 50%; box-shadow: 0 0 8px #3b82f6;"></div>
    </div>
  \`;

  // Click Ripple Style & Inject
  const style = document.createElement('style');
  style.id = '__playwright_ripple_style';
  style.textContent = \`
    .__playwright_ripple_effect {
      position: fixed;
      border-radius: 50%;
      border: 2.5px solid rgba(37, 99, 235, 0.85);
      background: radial-gradient(circle, rgba(96, 165, 250, 0.35) 0%, rgba(37, 99, 235, 0) 70%);
      pointer-events: none;
      z-index: 2147483646;
      transform: translate(-50%, -50%) scale(0.2);
      animation: __pw_ripple_kf 0.65s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
    }
    @keyframes __pw_ripple_kf {
      0% {
        transform: translate(-50%, -50%) scale(0.2);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(2.4);
        opacity: 0;
      }
    }
  \`;

  const mount = () => {
    if (!document.getElementById('__playwright_ripple_style')) {
      (document.head || document.documentElement).appendChild(style);
    }
    if (!document.getElementById('__playwright_custom_cursor')) {
      (document.body || document.documentElement).appendChild(cursor);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  // Track Mouse Movements
  window.addEventListener('mousemove', (e) => {
    mount();
    cursor.style.transform = \`translate3d(\${e.clientX}px, \${e.clientY}px, 0)\`;
  }, { passive: true });

  // Track Mouse Clicks for Ripple
  window.addEventListener('mousedown', (e) => {
    mount();
    const ripple = document.createElement('div');
    ripple.className = '__playwright_ripple_effect';
    ripple.style.left = \`\${e.clientX}px\`;
    ripple.style.top = \`\${e.clientY}px\`;
    ripple.style.width = '42px';
    ripple.style.height = '42px';
    (document.body || document.documentElement).appendChild(ripple);
    setTimeout(() => {
      try { ripple.remove(); } catch (_) {}
    }, 700);
  }, { passive: true });
})();
`;

// --- Automation & Smooth Movement Helpers ---

/**
 * Smooth ease-in-out scrolling helper using requestAnimationFrame
 */
async function smoothScroll(page, deltaY, durationMs = 1500) {
  try {
    await page.evaluate(async ({ deltaY, durationMs }) => {
      const startY = window.scrollY;
      const startTime = performance.now();
      return new Promise((resolve) => {
        function step(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / durationMs, 1);
          // Cubic ease-in-out
          const ease = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          window.scrollTo(0, startY + deltaY * ease);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(step);
      });
    }, { deltaY, durationMs });
  } catch (err) {
    // Fallback to wheel
    await page.mouse.wheel(0, deltaY);
  }
}

/**
 * Smooth human-like mouse glide to (x, y)
 */
async function smoothMoveMouse(page, targetX, targetY, steps = 24, pauseAfter = 300) {
  try {
    await page.mouse.move(targetX, targetY, { steps });
    if (pauseAfter > 0) {
      await page.waitForTimeout(pauseAfter);
    }
  } catch (_) {}
}

/**
 * Smooth human-like mouse glide to a locator bounding box
 */
async function smoothMoveToLocator(page, locatorOrSelector, steps = 24, pauseAfter = 300) {
  try {
    const loc = typeof locatorOrSelector === 'string' ? page.locator(locatorOrSelector).first() : locatorOrSelector;
    const box = await loc.boundingBox({ timeout: 2500 });
    if (box) {
      const targetX = Math.round(box.x + box.width / 2);
      const targetY = Math.round(box.y + box.height / 2);
      await smoothMoveMouse(page, targetX, targetY, steps, pauseAfter);
      return { x: targetX, y: targetY };
    }
  } catch (_) {}
  return null;
}

/**
 * Smoothly move and click on an element with safe fallback
 */
async function smoothClick(page, locatorOrSelector, pauseAfter = 1200) {
  try {
    const loc = typeof locatorOrSelector === 'string' ? page.locator(locatorOrSelector).first() : locatorOrSelector;
    if (await loc.count() > 0) {
      await loc.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => {});
      const pos = await smoothMoveToLocator(page, loc, 20, 200);
      if (pos) {
        await page.mouse.click(pos.x, pos.y);
      } else {
        await loc.click({ timeout: 2500 }).catch(() => {});
      }
      if (pauseAfter > 0) {
        await page.waitForTimeout(pauseAfter);
      }
      return true;
    }
  } catch (err) {
    console.log(`[Safe Skip] Could not click ${locatorOrSelector}: ${err.message}`);
  }
  return false;
}

// --- Voiceover Script Generator ---
function generateVoiceoverMarkdown(scenesData, totalDurationSec) {
  const totalMin = Math.floor(totalDurationSec / 60);
  const totalSec = totalDurationSec % 60;
  const durationStr = `${totalMin}:${totalSec.toString().padStart(2, '0')}`;

  return `# سكريبت التعليق الصوتي الرسمي — GermanJobsPro 🇩🇪
## فيديو العرض التوضيحي باللغة العربية (Full HD 1080p Walkthrough Demo)

> **المواصفات التقنية للفيديو:**
> - **الدقة:** 1920×1080 (Full HD, 16:9)
> - **معدل الإطارات:** 30 FPS
> - **ترميز الفيديو:** H.264 / AVC (High Profile) متوافق مع كافة برامج المونتاج ومنصات النشر (CapCut, Premiere, YouTube, LinkedIn)
> - **المدة الإجمالية المسجلة:** **${durationStr}** دقيقة
> - **مسار الفيديو المولد:** \`scripts/demo-video/output/germanjobspro-demo-ar-1080p.mp4\`

---

### جدول التوقيت الزمني للمشاهد (Timestamp Index)

| المشهد | التوقيت المسجل | المدة التقريبية | عنوان المشهد والمسار |
|:---|:---:|:---:|:---|
| **المشهد 1** | \`${scenesData[0]?.start || '00:00'} - ${scenesData[0]?.end || '00:20'}\` | ~20 ثانية | الصفحة الرئيسية وعرض القيمة (\`/ar\`) |
| **المشهد 2** | \`${scenesData[1]?.start || '00:20'} - ${scenesData[1]?.end || '00:46'}\` | ~25 ثانية | منصة الوظائف الألمانية الحية (\`/ar/jobs\`) |
| **المشهد 3** | \`${scenesData[2]?.start || '00:46'} - ${scenesData[2]?.end || '01:07'}\` | ~20 ثانية | لوحة التحكم المتكاملة Pro (\`/ar/dashboard\`) |
| **المشهد 4** | \`${scenesData[3]?.start || '01:07'} - ${scenesData[3]?.end || '01:38'}\` | ~30 ثانية | منشئ السيرة الذاتية DIN 5008 (\`/ar/dashboard/cv\`) |
| **المشهد 5** | \`${scenesData[4]?.start || '01:38'} - ${scenesData[4]?.end || '02:04'}\` | ~25 ثانية | فاحص السيرة الذاتية الذكي ATS & DIN 5008 (\`/ar/dashboard/ats-analyzer\`) |
| **المشهد 6** | \`${scenesData[5]?.start || '02:04'} - ${scenesData[5]?.end || '02:30'}\` | ~25 ثانية | مولد خطاب التغطية Anschreiben الذكي (\`/ar/dashboard/cover-letters\`) |
| **المشهد 7** | \`${scenesData[6]?.start || '02:30'} - ${scenesData[6]?.end || '02:55'}\` | ~25 ثانية | تجميع ملف الترشيح الكامل Bewerbungsmappe وخاتمة التسجيل |

---

## نصوص التعليق الصوتي المفصلة (Scene-by-Scene Narration)

### المشهد 1: الصفحة الرئيسية وعرض القيمة (\`/ar\`)
⏱️ **التوقيت:** \`${scenesData[0]?.start || '00:00'} - ${scenesData[0]?.end || '00:20'}\`
💡 **نبرة الإلقاء:** واثقة، حماسية، واضحة ومرحبة.

> **نص التعليق الصوتي:**  
> "مرحباً بكم في **GermanJobsPro** — المنصة الأولى المتكاملة المصممة خصيصاً لمرافقة الكفاءات والطلبة في المغرب والعالم العربي للوصول إلى سوق العمل وعقود التدريب المهني في ألمانيا.  
> نبتكر حلولاً رقمية تضمن مطابقة ملف ترشيحك بنسبة 100% لمعايير التوظيف الألمانية الرسمية **DIN 5008** — من السيرة الذاتية، إلى خطابات التغطية، وحتى تجميع ملف التقديم الشامل."

*📌 دليل نطق المصطلحات:*
- **DIN 5008:** تُنطق: *«دِينْ خمسة آلاف وثمانية»* أو بالألمانية *«دِينْ فُونْفْ تُوزِنْدْ أُونْدْ آخْتْ»*.
- **GermanJobsPro:** *«جِيرْمَانْ جُوبْسْ بْرُو»*.

---

### المشهد 2: منصة الوظائف الألمانية الحية (\`/ar/jobs\`)
⏱️ **التوقيت:** \`${scenesData[1]?.start || '00:20'} - ${scenesData[1]?.end || '00:46'}\`
💡 **نبرة الإلقاء:** عملية، تفاعلية وسلسة.

> **نص التعليق الصوتي:**  
> "هنا في منصة الوظائف الحية، نوفر لكم آلاف الشواغر المحدثة يومياً في مختلف مدن ألمانيا.  
> بفضل الفلترة الذكية، يمكنك تصفح الفرص حسب مجالك المهني كالهندسة وتكنولوجيا المعلومات أو قطاع الرعاية الصحية، مع توضيح متطلبات اللغة — سواء بالإنجليزية أو الألمانية — وفرص دعم تأشيرة العمل (Visa Sponsorship)."

*📌 دليل نطق المصطلحات:*
- **Visa Sponsorship:** *«فِيزَا سْبُونْسُرْشِيبْ»* (دعم ورعاية التأشيرة).

---

### المشهد 3: لوحة التحكم المتكاملة Pro (\`/ar/dashboard\`)
⏱️ **التوقيت:** \`${scenesData[2]?.start || '00:46'} - ${scenesData[2]?.end || '01:07'}\`
💡 **نبرة الإلقاء:** هادئة ومنظمة، تبرز سهولة الاستخدام.

> **نص التعليق الصوتي:**  
> "عند تسجيل الدخول إلى حسابك، تستقبلك لوحة تحكم عصرية تدعم اللغة العربية بالكامل وباتجاه راست إلى يسار (RTL).  
> تمنحك اللوحة وصولاً فورياً لكافة أدوات الذكاء الاصطناعي، ومتابعة ملفاتك وسيرك الذاتية المحفوظة وحالة طلباتك بمرونة وسرعة فائقة."

---

### المشهد 4: منشئ السيرة الذاتية الألماني DIN 5008 (\`/ar/dashboard/cv\`)
⏱️ **التوقيت:** \`${scenesData[3]?.start || '01:07'} - ${scenesData[3]?.end || '01:38'}\`
💡 **نبرة الإلقاء:** احترافية وتقنية مركزة على المعيار الألماني.

> **نص التعليق الصوتي:**  
> "أداة بناء السيرة الذاتية تضمن لك احترام المعيار الألماني الصارم **Tabellarischer Lebenslauf**.  
> محرر بديهي يرشدك خطوة بخطوة: من الصورة المهنية وتوزيع الهوامش، إلى صياغة الخبرات والمهارات ومستويات اللغات الأوروبية.  
> وبضغطة زر واحدة، تستخرج سيرة ذاتية بصيغة PDF نقية ومطابقة لمعيار **DIN 5008** جاهزة للتقديم المباشر."

*📌 دليل نطق المصطلحات:*
- **Tabellarischer Lebenslauf:** *«تَابِيلَارِيشَرْ لِيبِنْسْ لَاوْفْ»* (السيرة الذاتية الجدولية الألمانية).
- **1-Click PDF:** *«وَنْ كْلِيكْ بِي دِي إِفْ»*.

---

### المشهد 5: فاحص السيرة الذاتية الذكي ATS & DIN 5008 (\`/ar/dashboard/ats-analyzer\`)
⏱️ **التوقيت:** \`${scenesData[4]?.start || '01:38'} - ${scenesData[4]?.end || '02:04'}\`
💡 **نبرة الإلقاء:** إرشادية وتثقيفية، تبرز الميزة التنافسية.

> **نص التعليق الصوتي:**  
> "هل تعلم أن أكثر من 70% من السير الذاتية تُستبعد بواسطة أنظمة الفرز الآلي ATS في الشركات الألمانية؟  
> فاحصنا الذكي يقوم بتحليل سيرتك الذاتية مقابل متطلبات الوظيفة والمعايير الألمانية، ويقدم لك تقريراً دقيقاً بنقاط القوة وخطة عمل فورية لسد الثغرات ورفع نسبة قبولك."

*📌 دليل نطق المصطلحات:*
- **ATS:** *«إِي تِي إِسْ»* (Applicant Tracking System / أنظمة تتبع المتقدمين).

---

### المشهد 6: مولد خطاب التغطية Anschreiben الذكي (\`/ar/dashboard/cover-letters\`)
⏱️ **التوقيت:** \`${scenesData[5]?.start || '02:04'} - ${scenesData[5]?.end || '02:30'}\`
💡 **نبرة الإلقاء:** تشجيعية، توضح القوة والسرعة.

> **نص التعليق الصوتي:**  
> "كتابة خطاب التغطية أو **Anschreiben** بالألمانية لم تعد عائقاً بعد اليوم.  
> من خلال الذكاء الاصطناعي، يتم توليد خطاب مخصص واحترافي يربط مؤهلاتك بدقة بمتطلبات الشركة، بصياغة ألمانية رفيعة المستوى وتنسيق رسمي يراعي رأس ومحتوى الخطاب المؤسسي."

*📌 دليل نطق المصطلحات:*
- **Anschreiben:** *«آنْ شْرَايْبِنْ»* (خطاب التغطية / رسالة الدافع).

---

### المشهد 7: تجميع ملف الترشيح الكامل Bewerbungsmappe وخاتمة التسجيل
⏱️ **التوقيت:** \`${scenesData[6]?.start || '02:30'} - ${scenesData[6]?.end || '02:55'}\`
💡 **نبرة الإلقاء:** قوية، حاسمة ومحفزة على اتخاذ القرار (Call to Action).

> **نص التعليق الصوتي:**  
> "وفي النهاية، يمنحك ستوديو ملف الترشيح **Bewerbungsmappe** إمكانية جمع الغلاف التنفيذي Deckblatt، خطاب التغطية، السيرة الذاتية، والشهادات في ملف PDF واحد متناسق يحترم أعلى معايير الشركات في ألمانيا.  
> انضموا اليوم إلى المشتركين في **GermanJobsPro** واجعلوا حلم العمل في ألمانيا حقيقة ملموسة.  
> سجل الآن وابدأ صناعة مستقبلك!"

*📌 دليل نطق المصطلحات:*
- **Bewerbungsmappe:** *«بِيفِيرْبُونْغْسْ مَابِه»* (ملف التقديم المتكامل).
- **Deckblatt:** *«دِيكْ بْلَاتْ»* (صفحة الغلاف التقديمية).

---
*تم إنشاء هذا السكريبت وتنسيقه تلقائياً ليتطابق مع المشاهد المسجلة في \`germanjobspro-demo-ar-1080p.mp4\`.*
`;
}

// --- Mode B: Main Automated Recording Pipeline ---
async function runRecordingMode() {
  console.log(`
================================================================================
🎥 GermanJobsPro — بدء تسجيل الفيديو التوضيحي 1080p (Full HD Walkthrough)
================================================================================
`);

  // Verify authentication state file exists
  if (!existsSync(AUTH_STATE_PATH)) {
    console.error(`
❌ خطأ: ملف جلسة المصادقة غير موجود:
   ${AUTH_STATE_PATH}

👉 يرجى أولاً تشغيل وضع تسجيل الدخول لمرة واحدة:
   node scripts/demo-video/record-demo-ar.mjs --login
`);
    process.exit(1);
  }

  console.log('✅ تم العثور على ملف جلسة الدخول (.auth-state.json)');
  console.log('🚀 جاري إطلاق متصفح Chromium بدقة 1920x1080 مع التقاط الفيديو...');

  const launchOptions = {
    headless: !isHeaded,
    channel: 'chrome',
    args: [
      '--window-size=1920,1080',
      '--disable-quic',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  };

  let browser;
  try {
    browser = await chromium.launch(launchOptions);
  } catch (err) {
    console.warn(`⚠️ [Browser Launch] Could not launch system Chrome (${err.message}). Falling back to bundled Chromium...`);
    const { channel: _, ...fallbackOptions } = launchOptions;
    browser = await chromium.launch(fallbackOptions);
  }

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    locale: 'ar-MA',
    storageState: AUTH_STATE_PATH,
    recordVideo: {
      dir: RAW_VIDEO_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  // Inject Visual Mouse Pointer & Click-Ripple overlay
  await context.addInitScript(CURSOR_INJECTION_SCRIPT);

  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);
  resetTimer();

  const scenes = [];

  // =========================================================================
  // SCENE 1: Homepage & Value Proposition (/ar, ~20s)
  // =========================================================================
  const s1Start = formatTimestamp();
  logScene(1, 'الصفحة الرئيسية وعرض القيمة', 'Homepage & Value Proposition');

  await page.goto(`${BASE_URL}/ar`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Pause on Hero headline
  await page.waitForTimeout(3500);

  // Smooth mouse glide towards Hero CTA
  await smoothMoveMouse(page, 960, 480, 24, 600);

  // Smooth scroll down to 6-card tools hub (#tools-hub)
  await smoothScroll(page, 700, 1800);
  await page.waitForTimeout(3500);

  // Move mouse smoothly over key tool hub cards
  await smoothMoveMouse(page, 520, 420, 20, 400);
  await smoothMoveMouse(page, 960, 420, 20, 400);
  await smoothMoveMouse(page, 1400, 420, 20, 600);

  // Smooth scroll down to DIN 5008 German standard comparison section
  await smoothScroll(page, 750, 1800);
  await page.waitForTimeout(3800);

  const s1End = formatTimestamp();
  scenes.push({ id: 1, start: s1Start, end: s1End, nameAr: 'الصفحة الرئيسية وعرض القيمة' });

  // =========================================================================
  // SCENE 2: Live German Job Board (/ar/jobs, ~25s)
  // =========================================================================
  const s2Start = formatTimestamp();
  logScene(2, 'منصة الوظائف الألمانية الحية', 'Live German Job Board');

  await page.goto(`${BASE_URL}/ar/jobs`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // Pause on initial job listings
  await page.waitForTimeout(3000);

  // Move cursor smoothly to category pills / filter area
  await smoothMoveMouse(page, 960, 290, 20, 400);

  // Safe click on a category filter (e.g. IT, Healthcare, or first filter button)
  const categoryPill = page.locator('button:has-text("IT"), button:has-text("تكنولوجيا"), button:has-text("معلومات")').first();
  if (await categoryPill.count() > 0) {
    await smoothClick(page, categoryPill, 2000);
  } else {
    // Try clicking any category button if available
    const anyPill = page.locator('button[class*="rounded-full"], button[class*="rounded-xl"]').first();
    await smoothClick(page, anyPill, 1500);
  }

  // Smooth scroll down to examine matching German job cards
  await smoothScroll(page, 550, 1600);
  await page.waitForTimeout(3500);

  // Hover over badges on a job card (Visa sponsorship, language requirements)
  const jobCard = page.locator('article, div[class*="rounded-2xl border"]').first();
  if (await jobCard.count() > 0) {
    await smoothMoveToLocator(page, jobCard, 24, 1500);
  }

  // Scroll down a bit further
  await smoothScroll(page, 450, 1500);
  await page.waitForTimeout(3000);

  const s2End = formatTimestamp();
  scenes.push({ id: 2, start: s2Start, end: s2End, nameAr: 'منصة الوظائف الألمانية الحية' });

  // =========================================================================
  // SCENE 3: Authenticated Dashboard Hub (/ar/dashboard, ~20s)
  // =========================================================================
  const s3Start = formatTimestamp();
  logScene(3, 'لوحة التحكم المتكاملة Pro', 'Authenticated Dashboard Hub');

  await page.goto(`${BASE_URL}/ar/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // Pause on clean RTL Arabic dashboard header & user profile
  await page.waitForTimeout(3500);

  // Move cursor smoothly across quick-launch tool cards
  await smoothMoveMouse(page, 380, 420, 22, 600);
  await smoothMoveMouse(page, 760, 420, 22, 600);
  await smoothMoveMouse(page, 1140, 420, 22, 600);

  // Gentle scroll down to showcase saved documents / applications area
  await smoothScroll(page, 400, 1400);
  await page.waitForTimeout(3500);

  const s3End = formatTimestamp();
  scenes.push({ id: 3, start: s3Start, end: s3End, nameAr: 'لوحة التحكم المتكاملة Pro' });

  // =========================================================================
  // SCENE 4: DIN 5008 German CV Builder (/ar/dashboard/cv, ~30s)
  // =========================================================================
  const s4Start = formatTimestamp();
  logScene(4, 'منشئ السيرة الذاتية DIN 5008', 'DIN 5008 German CV Builder');

  await page.goto(`${BASE_URL}/ar/dashboard/cv`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // Check for existing CV card, click into it, or fallback to /cv/new
  const existingCvLink = page.locator('a[href*="/dashboard/cv/"]:not([href$="/new"])').first();
  if (await existingCvLink.count() > 0) {
    await smoothClick(page, existingCvLink, 2500);
  } else {
    await page.goto(`${BASE_URL}/ar/dashboard/cv/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // Pause to showcase editor layout & DIN 5008 guidelines
  await page.waitForTimeout(3000);

  // Smooth scroll through editor sections (Personal Info, Experience, Skills)
  await smoothScroll(page, 450, 1500);
  await page.waitForTimeout(3000);

  await smoothScroll(page, 450, 1500);
  await page.waitForTimeout(3000);

  // Try clicking or hovering over DIN 5008 preview tab
  const previewTab = page.locator('button:has-text("معاينة"), button:has-text("Preview"), button:has-text("DIN 5008")').first();
  if (await previewTab.count() > 0) {
    await smoothClick(page, previewTab, 2000);
  }

  // Smoothly hover over 1-Click PDF button without clicking (avoids native download dialog)
  const downloadBtn = page.locator('button:has-text("PDF"), a:has-text("PDF")').first();
  if (await downloadBtn.count() > 0) {
    await smoothMoveToLocator(page, downloadBtn, 24, 1500);
  }

  // Pause on formatted CV sheet
  await page.waitForTimeout(4000);

  const s4End = formatTimestamp();
  scenes.push({ id: 4, start: s4Start, end: s4End, nameAr: 'منشئ السيرة الذاتية DIN 5008' });

  // =========================================================================
  // SCENE 5: AI ATS DIN 5008 Analyzer (/ar/dashboard/ats-analyzer, ~25s)
  // =========================================================================
  const s5Start = formatTimestamp();
  logScene(5, 'فاحص السيرة الذاتية الذكي ATS & DIN 5008', 'AI ATS DIN 5008 Analyzer');

  await page.goto(`${BASE_URL}/ar/dashboard/ats-analyzer`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // Pause on ATS scanner interface
  await page.waitForTimeout(3000);

  // Smooth mouse glide over upload dropzone / CV selector
  await smoothMoveMouse(page, 960, 400, 24, 1200);

  // Smooth scroll down to DIN 5008 checklist & criteria
  await smoothScroll(page, 550, 1600);
  await page.waitForTimeout(3500);

  // Hover over evaluation metrics
  await smoothMoveMouse(page, 720, 480, 20, 1000);

  // Smooth scroll down to Action Plan area
  await smoothScroll(page, 450, 1500);
  await page.waitForTimeout(3500);

  const s5End = formatTimestamp();
  scenes.push({ id: 5, start: s5Start, end: s5End, nameAr: 'فاحص السيرة الذاتية الذكي ATS & DIN 5008' });

  // =========================================================================
  // SCENE 6: AI Cover Letter Generator (/ar/dashboard/cover-letters, ~25s)
  // =========================================================================
  const s6Start = formatTimestamp();
  logScene(6, 'مولد خطاب التغطية Anschreiben الذكي', 'AI Cover Letter Generator');

  await page.goto(`${BASE_URL}/ar/dashboard/cover-letters`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // Check for existing cover letter or fallback to /cover-letters/new
  const existingLetterLink = page.locator('a[href*="/dashboard/cover-letters/"]:not([href$="/new"])').first();
  if (await existingLetterLink.count() > 0) {
    await smoothClick(page, existingLetterLink, 2500);
  } else {
    await page.goto(`${BASE_URL}/ar/dashboard/cover-letters/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // Pause on letter view (showing ✓ محفوظ badge & DIN 5008 header)
  await page.waitForTimeout(3000);

  // Hover over download PDF button
  const letterPdfBtn = page.locator('button:has-text("PDF"), a:has-text("PDF")').first();
  if (await letterPdfBtn.count() > 0) {
    await smoothMoveToLocator(page, letterPdfBtn, 24, 1200);
  }

  // Smooth scroll through formatted German DIN 5008 business letter
  await smoothScroll(page, 550, 1600);
  await page.waitForTimeout(4000);

  const s6End = formatTimestamp();
  scenes.push({ id: 6, start: s6Start, end: s6End, nameAr: 'مولد خطاب التغطية Anschreiben الذكي' });

  // =========================================================================
  // SCENE 7: Complete Application Dossier & Closing CTA (~25s)
  // =========================================================================
  const s7Start = formatTimestamp();
  logScene(7, 'تجميع ملف الترشيح الكامل Bewerbungsmappe وخاتمة التسجيل', 'Dossier Studio & Closing CTA');

  await page.goto(`${BASE_URL}/ar/dashboard/dossier`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // Pause on unified Bewerbungsmappe Studio compiler
  await page.waitForTimeout(3500);

  // Smooth mouse glide across steps (CV selector, Cover Letter selector, Attachments)
  await smoothMoveMouse(page, 480, 420, 20, 800);
  await smoothMoveMouse(page, 960, 420, 20, 800);

  // Smooth scroll down to dossier preview action
  await smoothScroll(page, 450, 1500);
  await page.waitForTimeout(3000);

  // Clean transition to pricing page for closing call-to-action
  await page.goto(`${BASE_URL}/ar/pricing`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Smooth glide over Pro Plan subscription card and 4-second closing CTA hold
  await smoothMoveMouse(page, 960, 520, 24, 4500);

  const s7End = formatTimestamp();
  scenes.push({ id: 7, start: s7Start, end: s7End, nameAr: 'تجميع ملف الترشيح الكامل Bewerbungsmappe وخاتمة التسجيل' });

  const totalDurationSec = getElapsedSeconds();
  console.log(`\n🎉 اكتمل تسجيل كافة المشاهد السبعة! المدة الإجمالية: ${formatTimestamp(totalDurationSec)} (${totalDurationSec} ثانية)`);

  // Close page to flush video stream
  await page.close();
  const video = page.video();
  const rawVideoPath = await video.path();

  await context.close();
  await browser.close();

  console.log(`\n📹 تم حفظ الفيديو الخام (WebM) في:\n   ${rawVideoPath}`);

  // =========================================================================
  // Generate Timestamped Arabic Voiceover Script
  // =========================================================================
  console.log('\n📝 جاري إنشاء سكريبت التعليق الصوتي الموثق بالتوقيت الفعلي...');
  const voiceoverMarkdown = generateVoiceoverMarkdown(scenes, totalDurationSec);
  writeFileSync(VOICEOVER_SCRIPT_PATH, voiceoverMarkdown, 'utf8');
  console.log(`✅ تم حفظ سكريبت التعليق الصوتي في:\n   ${VOICEOVER_SCRIPT_PATH}`);

  // =========================================================================
  // Convert WebM to Universal Full HD H.264 MP4 via FFmpeg
  // =========================================================================
  console.log('\n🎞️  جاري تحويل الفيديو إلى صيغة MP4 عالمية متوافقة (H.264 / 1080p / 30fps)...');

  // Check if ffmpeg is available
  let hasFfmpeg = false;
  try {
    const ffCheck = spawnSync('ffmpeg', ['-version']);
    if (ffCheck.status === 0) {
      hasFfmpeg = true;
    }
  } catch (_) {}

  if (hasFfmpeg) {
    try {
      // YouTube / CapCut / Premiere / Mobile compliant encoding settings:
      // -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 -movflags +faststart -an
      const ffmpegArgs = [
        '-y',
        '-i', rawVideoPath,
        '-c:v', 'libx264',
        '-preset', 'slow',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-r', '30',
        '-movflags', '+faststart',
        '-an',
        FINAL_MP4_PATH,
      ];

      console.log(`⚙️  تنفيذ أمر FFmpeg: ffmpeg ${ffmpegArgs.join(' ')}`);
      execFileSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

      console.log(`
================================================================================
🎉 مبروك! اكتمل إنتاج الفيديو بنجاح:
📁 مسار الفيديو النهائي (1080p MP4):
   ${FINAL_MP4_PATH}

📝 مسار سكريبت التعليق الصوتي الموثق بالتوقيت:
   ${VOICEOVER_SCRIPT_PATH}
================================================================================
`);
    } catch (ffErr) {
      console.error(`\n⚠️ حدث خطأ أثناء تحويل FFmpeg: ${ffErr.message}`);
      console.log(`احتفظنا بملف الفيديو الخام بصيغة WebM في: ${rawVideoPath}`);
      printFfmpegManualInstruction(rawVideoPath);
    }
  } else {
    console.warn(`
⚠️  FFmpeg غير مثبت على نظامك.
يمكنك تثبيته على Fedora عبر الأمر:
   sudo dnf install -y ffmpeg
`);
    printFfmpegManualInstruction(rawVideoPath);
  }
}

function printFfmpegManualInstruction(rawPath) {
  console.log(`
👉 للتحويل اليدوي إلى MP4 عالي الجودة متوافق مع كافة برامج المونتاج:
ffmpeg -y -i "${rawPath}" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 -movflags +faststart -an "${FINAL_MP4_PATH}"
`);
}

// --- Entry Point ---
if (isLoginMode) {
  runLoginMode().catch((err) => {
    console.error('\n❌ خطأ غير متوقع أثناء وضع تسجيل الدخول:', err);
    process.exit(1);
  });
} else {
  runRecordingMode().catch((err) => {
    console.error('\n❌ خطأ غير متوقع أثناء تسجيل الفيديو:', err);
    process.exit(1);
  });
}
