import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { sanitizeJobPayload } from "../src/lib/jobSanitizer";
import { ensurePermanentImageUrl, isExpiringSocialCdnUrl } from "../src/lib/imageUtils";
import { extractLessonNumber, parseLessonTitle } from "../src/lib/courseUtils";

const LESSON_18_MARKDOWN_CONTENT = `# الدرس 18: Termine vereinbaren und Uhrzeiten (حجز المواعيد والتوقيت في الحياة اليومية)

الدرس 18: حجز المواعيد والتوقيت في الحياة اليومية (Termine vereinbaren und Uhrzeiten)

## المقدمة

مرحباً بكم في الدرس الثامن عشر من سلسلة تعلم اللغة الألمانية للمبتدئين مستوى A1.
في هذا الدرس، سنتعلم مهارة لا غنى عنها في الحياة اليومية في ألمانيا والدول الناطقة بالألمانية: كيفية السؤال عن الوقت والتعبير عن الساعات بدقة (Uhrzeiten)، وكيفية حجز المواعيد، تأكيدها، تأجيلها أو إلغائها (Termine vereinbaren, verschieben und absagen) سواء كان موعداً لدى الطبيب (beim Arzt)، في دائرة رسمية (beim Amt)، أو لقاء مع الأصدقاء.

## المفردات والنطق

فيما يلي أهم المفردات والعبارات المتعلقة بالوقت وحجز المواعيد، موضحة بالنطق العربي والترجمة:

1. der Termin [دير تِيغمِين] - الموعد
2. die Uhrzeit [دي أُوغا تْسَايْت] - التوقيت / الساعة
3. pünktlich [بُونكْتْلِش] - منضبط / في الموعد المحدد
4. die Verspätung [دي فيا شْبِيتُنغ] - التأخير
5. vereinbaren [فِيا آنْ بَاغَن] - يتفق على / يحجز (موعداً)
6. verschieben [فِيا شِيبَن] - يؤجل (موعداً)
7. absagen [أَبْ زَاغَن] - يلغي (موعداً)
8. der Vormittag [دير فُوغا مِيتَاغ] - قبل الظهر
9. der Nachmittag [دير نَاخْ مِيتَاغ] - بعد الظهر
10. die Öffnungszeiten [دي أُوفْنُنغْس تْسَايْتِن] - أوقات الدوام / الفتح
11. Wann? [فَانْ] - متى؟
12. Um wie viel Uhr? [أُم في فِييل أُوغا] - في أي ساعة؟
13. Wie spät ist es? [فِي شْبِيت إِسْت إِس] - كم الساعة؟

## التعبير عن الوقت في اللغة الألمانية (Die Uhrzeit)

هناك طريقتان للتعبير عن الوقت باللغة الألمانية:

### 1. التوقيت غير الرسمي (Inoffizielle Uhrzeit) - المستخدم في الحديث اليومي:
نستخدم كلمة **nach** (بعد / و) و **vor** (قبل / إلا):
* **08:00**: Es ist acht Uhr. (إنها الثامنة تماماً)
* **08:15**: Es ist Viertel nach acht. (الثامنة والربع)
* **08:30**: Es ist halb neun. (الثامنة والنصف - لاحظ أن الألمان يقولون نصف التاسعة!)
* **08:45**: Es ist Viertel vor neun. (التاسعة إلا ربع)
* **08:10**: Es ist zehn nach acht. (الثامنة وعشر دقائق)
* **08:50**: Es ist zehn vor neun. (التاسعة إلا عشر دقائق)

### 2. التوقيت الرسمي (Offizielle Uhrzeit) - المستخدم في المحطات والمطارات والمواعيد الرسمية (نظام 24 ساعة):
* **08:15**: Es ist acht Uhr fünfzehn.
* **14:30**: Es ist vierzehn Uhr dreißig.
* **20:45**: Es ist zwanzig Uhr fünfundvierzig.

## القواعد اللغوية وحروف الجر الزمنية (Temporale Präpositionen)

تُستخدم حروف الجر التالية مع الأوقات والمواعيد:
* **um**: تُستخدم مع الساعات المحددة:
  - *Der Film beginnt **um 20:00 Uhr**.* (يبدأ الفيلم في تمام الساعة 20:00).
* **am**: تُستخدم مع أيام الأسبوع وفترات اليوم (ما عدا الليل):
  - *Ich habe **am Montag** einen Termin.* (لدي موعد يوم الإثنين).
  - *Ich komme **am Nachmittag**.* (سآتي بعد الظهر).
* **im**: تُستخدم مع الأشهر وفصول السنة:
  - *Der Termin ist **im Mai**.* (الموعد في شهر مايو).
* **von ... bis ...**: من ... إلى ... :
  - *Die Praxis ist **von 8:00 bis 16:00 Uhr** geöffnet.* (العيادة مفتوحة من الساعة 8:00 حتى 16:00).

## عبارات شائعة لحجز المواعيد (Redemittel für Termine)

### طلب موعد:
* *Ich möchte bitte einen Termin vereinbaren.* (أود تحديد موعد من فضلك).
* *Haben Sie am Dienstag Zeit?* (هل لديك وقت يوم الثلاثاء؟).
* *Geht es am Mittwoch um 10 Uhr?* (هل يناسبك يوم الأربعاء في الساعة العاشرة؟).
* *Passt es Ihnen morgen?* (هل يناسبكم غداً؟).

### تأكيد الموعد والموافقة:
* *Ja, das passt mir sehr gut.* (نعم، هذا يناسبني جداً).
* *Dienstag um 10 Uhr geht in Ordnung.* (يوم الثلاثاء الساعة 10 مناسب تماماً).
* *Ich bin pünktlich da.* (سأكون هناك في الموعد).

### الاعتذار وتغيير الموعد أو إلغاؤه:
* *Leider habe ich am Freitag keine Zeit.* (للأسف ليس لدي وقت يوم الجمعة).
* *Können wir den Termin verschieben?* (هل يمكننا تأجيل الموعد؟).
* *Ich muss den Termin leider absagen.* (يجب علي للأسف إلغاء الموعد).

## حوارات من الحياة اليومية (Dialoge)

### الحوار الأول: موعد عند الطبيب (Beim Arzt)
* **المريض:** Guten Tag, Praxis Dr. Schmidt? Mein Name ist Ali Mansour. Ich möchte bitte einen Termin vereinbaren.
* **الموظفة:** Guten Tag, Herr Mansour. Was fehlt Ihnen denn?
* **المريض:** Ich habe seit gestern starke Halsschmerzen und Fieber.
* **الموظفة:** Haben Sie heute um 14:30 Uhr Zeit?
* **المريض:** Ja, 14:30 Uhr passt mir sehr gut. Vielen Dank!
* **الموظفة:** Bitte bringen Sie Ihre Krankenversicherungskarte mit. Bis später!

### الحوار الثاني: ترتيب موعد بين صديقين (Treffen mit einem Freund)
* **لوكا:** Hallo Jonas! Hast du am Samstag Zeit? Wir können zusammen ins Café gehen.
* **يوناس:** Hallo Luca! Am Samstag kann ich leider nicht, da muss ich arbeiten. Aber hast du am Sonntag Zeit?
* **لوكا:** Ja, Sonntag passt super. Um wie viel Uhr treffen wir uns?
* **يوناس:** Um 16:00 Uhr am Hauptbahnhof?
* **لوكا:** Perfekt! Bis Sonntag um 16:00 Uhr.

## تمارين تفاعلية (Übungen)

### التمرين الأول: اختر حرف الجر المناسب (um / am / im):
1. Der Deutschkurs beginnt _______ 18:00 Uhr.
2. Wir haben _______ Freitag eine Prüfung.
3. Mein Geburtstag ist _______ Juli.
4. Arztpraxis Dr. Weber hat _______ Vormittag geöffnet.

### التمرين الثاني: اكتب الساعة بالكلمات (غير رسمي):
1. 07:15 -> ________________________________________
2. 10:30 -> ________________________________________
3. 12:45 -> ________________________________________

## حلول التمارين (Lösungen)

### حل التمرين الأول:
1. um (الساعة 18:00)
2. am (يوم الجمعة)
3. im (شهر يوليو)
4. am (فترة قبل الظهر)

### حل التمرين الثاني:
1. Es ist Viertel nach sieben.
2. Es ist halb elf.
3. Es ist Viertel vor eins.

## نصيحة الدرس (Tipp)
في ألمانيا، يُعتبر الالتزام بالمواعيد (Pünktlichkeit) جزءاً أساسياً من الثقافة والاحترام المتبادل. إذا كنت ستتأخر أكثر من 5 إلى 10 دقائق عن أي موعد سواء كان رسمياً أو خاصاً، فمن اللباقة الاتصال هاتفياً وإبلاغ الطرف الآخر مسبقاً بقول: *"Entschuldigung, ich verspäte mich um 10 Minuten."*
`;

/**
 * Clean Live Database Script (Phase 3 - German A1 Strict 1..19 Curriculum Alignment)
 * Part A: Cleans Jobs (sanitizes false healthcare/nursing data, updates titles, categories, salaries, requirements).
 * Part B: Cleans Posts:
 *   1. Permanently deletes duplicate/unpublished posts above Lesson 15 so slugs are freed.
 *   2. Renumbers valid lessons 16 to 19 sequentially (Modalverben, Dativ, Termine, Familie).
 *   3. Normalizes titles and removes leaked date metadata.
 *   4. Ensures local permanent cover image assets (/images/lessons/german-a1-lesson-X.png).
 *   5. Verifies and displays the final contiguous sequence from Lesson 1 to Lesson 19.
 */
async function cleanLiveDatabase() {
  console.log("================================================================================");
  console.log("🚀 STARTING NEON DATABASE LIVE CLEANUP SCRIPT (A1 STRICT 1..19 ALIGNMENT)");
  console.log("================================================================================\n");

  // ============================================================================
  // PART A: JOBS CLEANUP
  // ============================================================================
  console.log("📦 [PART A] Fetching all Jobs from database...");
  const allJobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
  });
  console.log(`Found ${allJobs.length} total jobs in database.\n`);

  let jobsUpdatedCount = 0;

  for (const job of allJobs) {
    const sanitized = sanitizeJobPayload({
      title: job.title,
      category: job.category,
      salary: job.salary,
      requirements: job.requirements,
      descriptionRaw: job.descriptionRaw,
    });

    const titleChanged = sanitized.title !== job.title;
    const categoryChanged = sanitized.category !== job.category;
    const salaryChanged = (sanitized.salary ?? null) !== (job.salary ?? null);
    const reqChanged = (sanitized.requirements ?? null) !== (job.requirements ?? null);
    const descChanged = (sanitized.descriptionRaw ?? null) !== (job.descriptionRaw ?? null);

    if (titleChanged || categoryChanged || salaryChanged || reqChanged || descChanged) {
      console.log(`🛠️  [FIXING JOB] ID: ${job.id}`);
      if (titleChanged) console.log(`   - Title:       "${job.title}" -> "${sanitized.title}"`);
      if (categoryChanged) console.log(`   - Category:    "${job.category}" -> "${sanitized.category}"`);
      if (salaryChanged) console.log(`   - Salary:      "${job.salary}" -> "${sanitized.salary}"`);
      if (reqChanged) console.log(`   - Requirements updated (stripped false nursing boilerplate)`);
      if (descChanged) console.log(`   - Description updated (cleaned false nursing boilerplate)`);

      await prisma.job.update({
        where: { id: job.id },
        data: {
          title: sanitized.title,
          category: sanitized.category ?? job.category,
          salary: sanitized.salary,
          requirements: sanitized.requirements,
          descriptionRaw: sanitized.descriptionRaw,
        },
      });

      jobsUpdatedCount++;
      console.log(`   ✅ Job ${job.id} updated successfully.\n`);
    }
  }

  console.log(`📊 Part A Summary: Updated ${jobsUpdatedCount} / ${allJobs.length} jobs.\n`);

  // ============================================================================
  // PART B: POSTS CLEANUP & CURRICULUM ALIGNMENT
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("📚 [PART B] German A1 Curriculum Synchronization & Posts Cleanup");
  console.log("--------------------------------------------------------------------------------\n");

  // Step 1: Permanently delete duplicate/unpublished posts above Lesson 15
  console.log("🗑️  [Step 1] Permanently deleting duplicate and unpublished posts above Lesson 15...");
  const duplicateIdsToDelete = [
    "cmujkamyr00090hnzbmvp40cc", // duplicate old Lesson 16 Restaurant post
    "cmulml5dd00040hqxuo26mhlv", // duplicate old Lesson 17 Separable Verbs post
    "cmv48v0sl00080hmrpo9wq0vr", // duplicate unpublished Lesson 21 Tagesablauf post
    "cmv5gxp9m00000ioh9358r0s5", // duplicate unpublished Lesson 22 Modalverben post
  ];

  let deletedDuplicatesCount = 0;
  for (const dupId of duplicateIdsToDelete) {
    const postToDelete = await prisma.post.findUnique({ where: { id: dupId } });
    if (postToDelete) {
      console.log(`   ❌ Deleting duplicate post [ID: ${dupId}] "${postToDelete.title}" (slug: ${postToDelete.slug})`);
      await prisma.post.delete({ where: { id: dupId } });
      deletedDuplicatesCount++;
    }
  }

  // Also permanently delete any remaining duplicate unpublished posts matching those topics above lesson 15
  const extraUnpublishedDuplicates = await prisma.post.findMany({
    where: {
      published: false,
      OR: [
        { title: { contains: "Tagesablauf und trennbare Verben" } },
        { title: { contains: "Modalverben: können und müssen" } },
        { title: { contains: "Im Restaurant - Bestellen und Wunsch ausdrücken" } },
        { title: { contains: "Trennbare Verben und Alltagsleben" } },
      ],
    },
  });

  for (const extraDup of extraUnpublishedDuplicates) {
    console.log(`   ❌ Deleting leftover duplicate post [ID: ${extraDup.id}] "${extraDup.title}" (slug: ${extraDup.slug})`);
    await prisma.post.delete({ where: { id: extraDup.id } });
    deletedDuplicatesCount++;
  }

  console.log(`   ✅ Total duplicate posts permanently deleted: ${deletedDuplicatesCount}\n`);

  // Step 2: Renumber valid lessons 16, 17, 18, 19
  console.log("📝 [Step 2] Renumbering and synchronizing Lessons 16 to 19...");

  // Lesson 16 (Modalverben: können und müssen)
  const lesson16Post = await prisma.post.findFirst({
    where: {
      OR: [
        { id: "cmuoi22bm00050hpsqjdnb421" },
        { slug: "german-a1-lesson-16" },
        { AND: [{ title: { contains: "Modalverben: können und müssen" } }, { published: true }] },
      ],
    },
  });

  if (lesson16Post) {
    let md16 = lesson16Post.markdown_content;
    md16 = md16.replace(/#\s*الدرس\s*18\s*:/gu, "# الدرس 16:");
    md16 = md16.replace(/الدرس\s*18\s*:/gu, "الدرس 16:");
    md16 = md16.replace(/الدرس\s*18\b/gu, "الدرس 16");
    md16 = md16.replace(/الدرس الثامن عشر/gu, "الدرس السادس عشر");

    const targetTitle = "الدرس 16: Modalverben: können und müssen (التعبير عن القدرة والالتزام باستخدام الأفعال الناقصة können و müssen)";
    const targetSlug = "german-a1-lesson-16";
    const targetImg = "/images/lessons/german-a1-lesson-16.png";

    if (
      lesson16Post.slug !== targetSlug ||
      lesson16Post.title !== targetTitle ||
      lesson16Post.image_url !== targetImg ||
      lesson16Post.markdown_content !== md16 ||
      !lesson16Post.published
    ) {
      console.log(`   🔄 Updating Lesson 16 [ID: ${lesson16Post.id}]...`);
      await prisma.post.update({
        where: { id: lesson16Post.id },
        data: {
          title: targetTitle,
          slug: targetSlug,
          image_url: targetImg,
          published: true,
          markdown_content: md16,
        },
      });
      console.log(`   ✅ Lesson 16 synchronized: slug="${targetSlug}", image="${targetImg}"`);
    } else {
      console.log(`   ✅ Lesson 16 is already up to date.`);
    }
  } else {
    console.warn(`   ⚠️ Warning: Lesson 16 source post not found!`);
  }

  // Lesson 17 (Dativ mit Präpositionen)
  const lesson17Post = await prisma.post.findFirst({
    where: {
      OR: [
        { id: "cmuqsvodi00020hp66tuc1vbm" },
        { slug: "german-a1-lesson-17" },
        { AND: [{ title: { contains: "Dativ mit Präpositionen" } }, { published: true }] },
      ],
    },
  });

  if (lesson17Post) {
    let md17 = lesson17Post.markdown_content;
    md17 = md17.replace(/#\s*الدرس\s*19\s*:/gu, "# الدرس 17:");
    md17 = md17.replace(/الدرس\s*19\s*:/gu, "الدرس 17:");
    md17 = md17.replace(/الدرس\s*19\b/gu, "الدرس 17");
    md17 = md17.replace(/الدرس التاسع عشر/gu, "الدرس السابع عشر");

    const targetTitle = "الدرس 17: Dativ mit Präpositionen (حروف الجر مع حالة المجرور ووسائل النقل)";
    const targetSlug = "german-a1-lesson-17";
    const targetImg = "/images/lessons/german-a1-lesson-17.png";

    if (
      lesson17Post.slug !== targetSlug ||
      lesson17Post.title !== targetTitle ||
      lesson17Post.image_url !== targetImg ||
      lesson17Post.markdown_content !== md17 ||
      !lesson17Post.published
    ) {
      console.log(`   🔄 Updating Lesson 17 [ID: ${lesson17Post.id}]...`);
      await prisma.post.update({
        where: { id: lesson17Post.id },
        data: {
          title: targetTitle,
          slug: targetSlug,
          image_url: targetImg,
          published: true,
          markdown_content: md17,
        },
      });
      console.log(`   ✅ Lesson 17 synchronized: slug="${targetSlug}", image="${targetImg}"`);
    } else {
      console.log(`   ✅ Lesson 17 is already up to date.`);
    }
  } else {
    console.warn(`   ⚠️ Warning: Lesson 17 source post not found!`);
  }

  // Lesson 18 (Termine vereinbaren und Uhrzeiten)
  const lesson18Post = await prisma.post.findFirst({
    where: {
      OR: [
        { slug: "german-a1-lesson-18" },
        { AND: [{ title: { contains: "Termine vereinbaren" } }, { published: true }] },
        { AND: [{ title: { contains: "حجز المواعيد والتوقيت" } }, { published: true }] },
      ],
    },
  });

  if (lesson18Post) {
    let md18 = lesson18Post.markdown_content || LESSON_18_MARKDOWN_CONTENT;
    if (md18.length < 500 || !md18.includes("Termine vereinbaren")) {
      md18 = LESSON_18_MARKDOWN_CONTENT;
    } else {
      md18 = md18.replace(/#\s*الدرس\s*20\s*:/gu, "# الدرس 18:");
      md18 = md18.replace(/الدرس\s*20\s*:/gu, "الدرس 18:");
      md18 = md18.replace(/الدرس\s*20\b/gu, "الدرس 18");
      md18 = md18.replace(/الدرس العشرين/gu, "الدرس الثامن عشر");
    }

    const targetTitle = "الدرس 18: Termine vereinbaren und Uhrzeiten (حجز المواعيد والتوقيت في الحياة اليومية)";
    const targetSlug = "german-a1-lesson-18";
    const targetImg = "/images/lessons/german-a1-lesson-18.png";

    if (
      lesson18Post.slug !== targetSlug ||
      lesson18Post.title !== targetTitle ||
      lesson18Post.image_url !== targetImg ||
      lesson18Post.markdown_content !== md18 ||
      !lesson18Post.published
    ) {
      console.log(`   🔄 Updating existing Lesson 18 [ID: ${lesson18Post.id}]...`);
      await prisma.post.update({
        where: { id: lesson18Post.id },
        data: {
          title: targetTitle,
          slug: targetSlug,
          image_url: targetImg,
          published: true,
          markdown_content: md18,
        },
      });
      console.log(`   ✅ Lesson 18 updated: slug="${targetSlug}", image="${targetImg}"`);
    } else {
      console.log(`   ✅ Lesson 18 is already up to date.`);
    }
  } else {
    console.log(`   ✨ Creating new Lesson 18 post in database...`);
    const created18 = await prisma.post.create({
      data: {
        title: "الدرس 18: Termine vereinbaren und Uhrzeiten (حجز المواعيد والتوقيت في الحياة اليومية)",
        slug: "german-a1-lesson-18",
        category: "German A1",
        image_url: "/images/lessons/german-a1-lesson-18.png",
        published: true,
        markdown_content: LESSON_18_MARKDOWN_CONTENT,
      },
    });
    console.log(`   ✅ Lesson 18 created [ID: ${created18.id}]: slug="german-a1-lesson-18", image="/images/lessons/german-a1-lesson-18.png"`);
  }

  // Lesson 19 (Die Familie und Verwandte)
  const lesson19Post = await prisma.post.findFirst({
    where: {
      OR: [
        { id: "cmv75d4cx00020ilqhq25at5m" },
        { slug: "german-a1-lesson-19" },
        { AND: [{ title: { contains: "Die Familie und Verwandte" } }, { published: true }] },
      ],
    },
  });

  if (lesson19Post) {
    let md19 = lesson19Post.markdown_content;
    md19 = md19.replace(/#\s*الدرس\s*(?:21|23)\s*:/gu, "# الدرس 19:");
    md19 = md19.replace(/الدرس\s*(?:21|23)\s*:/gu, "الدرس 19:");
    md19 = md19.replace(/الدرس\s*(?:21|23)\b/gu, "الدرس 19");
    md19 = md19.replace(/الدرس (?:الحادي|الثالث) والعشرين/gu, "الدرس التاسع عشر");

    const targetTitle = "الدرس 19: Die Familie und Verwandte (العائلة والأقارب في اللغة الألمانية)";
    const targetSlug = "german-a1-lesson-19";
    const targetImg = "/images/lessons/german-a1-lesson-19.png";

    if (
      lesson19Post.slug !== targetSlug ||
      lesson19Post.title !== targetTitle ||
      lesson19Post.image_url !== targetImg ||
      lesson19Post.markdown_content !== md19 ||
      !lesson19Post.published
    ) {
      console.log(`   🔄 Updating Lesson 19 [ID: ${lesson19Post.id}]...`);
      await prisma.post.update({
        where: { id: lesson19Post.id },
        data: {
          title: targetTitle,
          slug: targetSlug,
          image_url: targetImg,
          published: true,
          markdown_content: md19,
        },
      });
      console.log(`   ✅ Lesson 19 synchronized: slug="${targetSlug}", image="${targetImg}"`);
    } else {
      console.log(`   ✅ Lesson 19 is already up to date.`);
    }
  } else {
    console.warn(`   ⚠️ Warning: Lesson 19 source post not found!`);
  }

  console.log("");

  // Step 3: Global Post Content Normalization & Image Integrity Check
  console.log("🧹 [Step 3] Global Post Content Normalization & Image Asset Verification...");
  const allPosts = await prisma.post.findMany({
    orderBy: { createdAt: "asc" },
  });

  let postsUpdatedCount = 0;
  let imagesConvertedCount = 0;

  for (const post of allPosts) {
    const isA1 =
      post.category.toLowerCase().includes("a1") ||
      post.slug.includes("a1-lesson") ||
      post.title.includes("الدرس");

    let updatedTitle = post.title;
    let updatedSlug = post.slug;
    let updatedContent = post.markdown_content;
    let updatedImageUrl = post.image_url;
    let updatedPublished = post.published;

    // 1. Strip duplicated "الدرس X: الدرس X:" -> "الدرس X:"
    const normalizedTitle = updatedTitle.replace(
      /^((?:الدرس|Lesson|Lektion)\s*\d+)\s*[:\-–—]?\s*(?:(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*)+/iu,
      "$1: "
    ).trim();

    if (normalizedTitle !== updatedTitle) {
      console.log(`📝 [POST TITLE NORMALIZED] ID: ${post.id} (${post.slug})`);
      console.log(`   - Old Title: "${updatedTitle}"`);
      console.log(`   - New Title: "${normalizedTitle}"`);
      updatedTitle = normalizedTitle;
    }

    // 2. Strip leaked date lines and standalone 202\d{5} numbers from markdown_content
    const originalContent = updatedContent;

    // Strip lines starting with تاريخ الدرس / تاريخ النشر / التاريخ
    updatedContent = updatedContent.replace(
      /^[\s\uFEFF]*(?:تاريخ\s*(?:الدرس|النشر)|التاريخ)\s*:[^\r\n]*(\r?\n)*/gmiu,
      ""
    );

    // Strip lines starting with standalone date tokens like 202\d{5}
    updatedContent = updatedContent.replace(
      /^[\s\uFEFF]*\b202\d{5}\b[^\r\n]*(\r?\n)*/gmu,
      ""
    );

    // Strip inline standalone 202\d{5}
    updatedContent = updatedContent.replace(/\b202\d{5}\b/g, "");

    // Normalize duplicated "الدرس X: الدرس X:" inside markdown headings if present
    updatedContent = updatedContent.replace(
      /^((?:#+\s*)?(?:الدرس|Lesson|Lektion)\s*\d+)\s*[:\-–—]?\s*(?:(?:الدرس|Lesson|Lektion)\s*\d+\s*[:\-–—]?\s*)+/gmiu,
      "$1: "
    );

    // Normalize excessive newlines
    updatedContent = updatedContent.replace(/\n{3,}/g, "\n\n").trim();

    const contentChanged = updatedContent !== originalContent;
    if (contentChanged) {
      console.log(`🧹 [POST MARKDOWN CLEANED] ID: ${post.id} (${post.slug})`);
      console.log(`   - Stripped leaked date metadata from markdown_content.`);
    }

    // 3. Check permanent local assets for A1 lessons 1 to 19
    if (isA1) {
      const currentLessonNum = extractLessonNumber(updatedTitle, updatedSlug, updatedContent);

      if (currentLessonNum >= 1 && currentLessonNum <= 19) {
        const expectedImagePath = `/images/lessons/german-a1-lesson-${currentLessonNum}.png`;
        const localFileExists = fs.existsSync(path.resolve(process.cwd(), `public${expectedImagePath}`));
        if (localFileExists && updatedImageUrl !== expectedImagePath) {
          console.log(`🖼️  [A1 LESSON IMAGE RESTORED] Lesson ${currentLessonNum} (${updatedSlug})`);
          console.log(`   - Old: "${post.image_url?.slice(0, 30)}..."`);
          console.log(`   - New: "${expectedImagePath}"`);
          updatedImageUrl = expectedImagePath;
          imagesConvertedCount++;
        }
      } else if (currentLessonNum > 19) {
        if (post.image_url && isExpiringSocialCdnUrl(post.image_url)) {
          console.log(`🔄 [CONVERTING SOCIAL CDN IMAGE] Post ${currentLessonNum} (${post.slug})...`);
          const permanentUrl = await ensurePermanentImageUrl(post.image_url);
          if (permanentUrl && permanentUrl !== post.image_url) {
            console.log(`   ✅ Converted to permanent Base64 Data URL (length: ${permanentUrl.length})`);
            updatedImageUrl = permanentUrl;
            imagesConvertedCount++;
          }
        }
      }
    }

    // Save changes if any field changed
    const titleChanged = updatedTitle !== post.title;
    const slugChanged = updatedSlug !== post.slug;
    const imageChanged = updatedImageUrl !== post.image_url;
    const publishedChanged = updatedPublished !== post.published;

    if (titleChanged || slugChanged || contentChanged || imageChanged || publishedChanged) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          title: updatedTitle,
          slug: updatedSlug,
          markdown_content: updatedContent,
          image_url: updatedImageUrl,
          published: updatedPublished,
        },
      });

      postsUpdatedCount++;
      console.log(`   ✅ Post ${post.id} updated in database.\n`);
    }
  }

  console.log(`📊 Part B Summary: Updated ${postsUpdatedCount} posts (Images restored/converted: ${imagesConvertedCount})\n`);

  // ============================================================================
  // PART C: FINAL CURRICULUM VERIFICATION & REPORT
  // ============================================================================
  console.log("================================================================================");
  console.log("🏁 FINAL VERIFICATION: GERMAN A1 LESSONS SEQUENCE (STRICT 1..19)");
  console.log("================================================================================\n");

  const publishedA1Posts = await prisma.post.findMany({
    where: {
      published: true,
      OR: [
        { category: { contains: "A1", mode: "insensitive" } },
        { slug: { startsWith: "german-a1-lesson" } },
        { title: { contains: "الدرس" } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      image_url: true,
      published: true,
      markdown_content: true,
    },
  });

  const structuredLessons = publishedA1Posts.map((post) => {
    const num = extractLessonNumber(post.title, post.slug, post.markdown_content);
    return {
      num,
      id: post.id,
      slug: post.slug,
      imageUrl: post.image_url,
      title: post.title,
    };
  });

  structuredLessons.sort((a, b) => a.num - b.num);

  console.log("Lesson # | Slug                             | Image Path                              | Title");
  console.log("---------+----------------------------------+-----------------------------------------+--------------------------------------------------");
  for (const l of structuredLessons) {
    const numStr = String(l.num).padStart(8, " ");
    const slugStr = (l.slug || "").padEnd(32, " ");
    const imgStr = (l.imageUrl || "").padEnd(39, " ");
    console.log(`${numStr} | ${slugStr} | ${imgStr} | ${l.title}`);
  }
  console.log("--------------------------------------------------------------------------------------------------------------------------------");

  // Validate strict sequence
  const lessonNumbers = structuredLessons.map((l) => l.num);
  console.log(`\nTotal Published German A1 Lessons: ${lessonNumbers.length}`);
  console.log(`Lesson Sequence: [${lessonNumbers.join(", ")}]`);

  const duplicates = lessonNumbers.filter((item, index) => lessonNumbers.indexOf(item) !== index);
  if (duplicates.length > 0) {
    throw new Error(`❌ Validation Failed: Duplicate lesson numbers found: ${duplicates.join(", ")}`);
  }

  if (lessonNumbers.length !== 19) {
    throw new Error(`❌ Validation Failed: Expected exactly 19 lessons, found ${lessonNumbers.length}`);
  }

  for (let i = 1; i <= 19; i++) {
    if (!lessonNumbers.includes(i)) {
      throw new Error(`❌ Validation Failed: Gap detected! Missing Lesson ${i}`);
    }
  }

  console.log("\n🎉 ALL CHECKS PASSED: German A1 curriculum is strictly contiguous from Lesson 1 to Lesson 19 with 0 gaps and 0 duplicates!");
  console.log("================================================================================\n");
}

cleanLiveDatabase()
  .catch((err) => {
    console.error("❌ Cleanup failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
