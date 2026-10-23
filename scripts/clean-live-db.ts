import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { sanitizeJobPayload } from "../src/lib/jobSanitizer";
import { ensurePermanentImageUrl, isExpiringSocialCdnUrl } from "../src/lib/imageUtils";
import { extractLessonNumber, isCustomLessonImage } from "../src/lib/courseUtils";

const LESSON_18_MARKDOWN_CONTENT = `# الدرس 18: Termine vereinbaren und Uhrzeiten (حجز المواعيد والتوقيت في الحياة اليومية)

الدرس 18: حجز المواعيد والتوقيت في الحياة اليومية (Termine vereinbaren und Uhrzeiten)
المستوى: CEFR A1.2

## المقدمة

أهلاً بكم في الدرس الثامن عشر من سلسلة تعلم اللغة الألمانية للمبتدئين وفق الإطار الأوروبي المرجعي المشترك CEFR A1.
في هذا الدرس، سنتعلم مهارة حيوية لا غنى عنها في الحياة اليومية والمهنية داخل ألمانيا: كيفية السؤال عن الوقت والتعبير عن الساعات بدقة (Uhrzeiten)، وكيفية حجز المواعيد وتأكيدها أو تأجيلها أو إلغائها (Termine vereinbaren, verschieben und absagen) سواء كان موعداً لدى الطبيب (beim Arzt)، في دائرة حكومية رسمية (beim Amt)، أو لقاءً مع الأصدقاء.

## المفردات والنطق

فيما يلي أهم 15 مفردة وتعبير زمني لحجز المواعيد والتعبير عن الوقت باللغة الألمانية:

1. der Termin [دِيرْ تِيرْمِينْ] - الموعد
2. die Uhrzeit [دِي أُورْ تْسَايْتْ] - التوقيت / الوقت بالساعة
3. pünktlich [بُونكْتْلِشْ] - في الموعد المحدد / منضبط
4. die Verspätung [دِي فِيرْشْبِيتُونغْ] - التأخير
5. einen Termin vereinbaren [أَيْنَن تِيرْمِينْ فِيرْآيْنْ بَارَن] - حجز موعد / الاتفاق على موعد
6. den Termin verschieben [دِين تِيرْمِينْ فِيرْشِيبَن] - تأجيل الموعد إلى وقت لاحق
7. den Termin absagen [دِين تِيرْمِينْ أَبْ زَاغَن] - إلغاء الموعد تماماً
8. Wie spät ist es? [فِي شْبِيتْ إِسْتْ إِسْ؟] - كم الساعة الآن؟
9. Um wie viel Uhr? [أُم فِي فِيلْ أُورْ؟] - في أي ساعة؟
10. Es ist acht Uhr [إِسْ إِسْتْ أَخْتْ أُورْ] - إنها الساعة الثامنة تماماً
11. Viertel nach acht [فِيرْتَلْ نَاخْ أَخْتْ] - الثامنة والربع (توقيت غير رسمي)
12. halb neun [هَالْبْ نُويْنْ] - الثامنة والنصف (حرفياً: نصف التاسعة)
13. Viertel vor neun [فِيرْتَلْ فُورْ نُويْنْ] - التاسعة إلا ربع (توقيت غير رسمي)
14. acht Uhr fünfzehn [أَخْتْ أُورْ فُونْفْتْسِينْ] - الثامنة وخمس عشرة دقيقة (توقيت رسمي 24h)
15. die Öffnungszeiten [دِي أُوفْنُونغْسْ تْسَايْتِنْ] - مواعيد العمل / أوقات الدوام

## الشرح الصوتي

💡 الشرح الصوتي وإضاءات: في اللغة الألمانية، تختلف طريقة نطق مصطلحات الوقت والمواعيد وفق قواعد صوتية أساسية:
1. كلمة Uhr (الساعة): حرف (U) ينطق مضموماً ممدوداً [أُو]، وحرف (R) في نهايتها يلفظ كصوت ألف خفيفة مهواة [أُوغا].
2. كلمة Viertel (الربع): المقطع (V) في بداية الكلمة ينطق دائماً كحرف الفاء [فِيرْتَلْ] وليس كالفاء الإنجليزية (V).
3. كلمة halb (النصف): حرف (h) يخرج هاءً واضحة مهموسة [هَالْبْ]، واللام خفيفة مرققة.
4. كلمة der Termin (الموعد): يقع النبر الصوتي (Betonung) دائماً على المقطع الأخير الممدود [تِيرْمِينْ].

📌 ملاحظة أكاديمية: انتبه جيداً لنطق التوقيت غير الرسمي عند نصف الساعة؛ عندما يقول المتحدث الألماني "halb neun"، فهو يقصد أن الساعة الآن هي 08:30 (أي بقي نصف ساعة للوصول إلى التاسعة)، ولا تعني أبداً 09:30!

## الحوار والتطبيق

### الحوار الأول: حجز موعد في عيادة الطبيب (Termin in der Arztpraxis)

Herr Mansour: Guten Tag, Praxis Dr. Schmidt? Mein Name ist Ali Mansour. [غُوتْنْ تَاكْ، بْرَاكْسِيسْ دُوكْتُورْ شْمِيدْتْ؟ مَايْنْ نَامَ إِيسْتْ عَلِي مَانْصُورْ.] - نهارك سعيد، عيادة الدكتور شميت؟ اسمي علي منصور.
Frau Weber: Guten Tag, Herr Mansour. Was fehlt Ihnen denn? [غُوتْنْ تَاكْ، هِيرْ مَانْصُورْ. فَاسْ فِيلْتْ إِينَن دِينْ؟] - نهارك سعيد سيد منصور. مما تشكو؟
Herr Mansour: Ich habe seit gestern starke Halsschmerzen und Fieber. Ich brauche einen Termin. [إِخْ هَابَ زَايْتْ غِيسْتَرْنْ شْتَارْكَه هَالْسْ شْمِيرْتْسِنْ أُونْدْ فِيبَرْ. إِخْ بْرَاوخَ أَيْنَن تِيرْمِينْ.] - لدي ألم شديد في الحلق وحمى منذ أمس. أحتاج إلى موعد.
Frau Weber: Haben Sie heute um vierzehn Uhr dreißig Zeit? [هَابَن زِي هُويْتَ أُم فِيرْتْسِين أُور دْرَايْسِش تْسَايْت؟] - هل لديك وقت اليوم في تمام الساعة 14:30 (الثانية والنصف ظهراً)؟
Herr Mansour: Ja, um 14:30 Uhr passt mir sehr gut. Vielen Dank! [يَا، أُم فِيرْتْسِين أُور دْرَايْسِش بَاسْت مِير زِير غُوت. فِيلِن دَانْك!] - نعم، الساعة 14:30 تناسبني تماماً. شكراً جزيلاً!
Frau Weber: Bitte bringen Sie Ihre Krankenversicherungskarte mit. Bis später! [بِيتَ بْرِينغَن زِي إِيرَ كْرَانْكِن فِيرْزِيخِيرُونغْسْ كَارْتَ مِيت. بِيسْ شْبِيتَرْ!] - من فضلك أحضر بطاقة التأمين الصحي معك. إلى اللقاء لاحقاً!

### الحوار الثاني: ترتيب موعد بين صديقين في محطة القطار (Treffen am Bahnhof)

Luca: Hallo Jonas! Hast du am Samstag Zeit? [هَالُو يُونَاسْ! هَاسْتْ دُو أَمْ زَامْسْتَاكْ تْسَايْتْ؟] - مرحباً يوناس! هل لديك وقت يوم السبت؟
Jonas: Hallo Luca! Am Samstag kann ich leider nicht, da muss ich arbeiten. [هَالُو لُوكَا! أَمْ زَامْسْتَاكْ كَانْ إِخْ لَايْدَرْ نِيخْت، دَا مُوسْ إِخْ أَرْبَايْتِن.] - مرحباً لوكا! يوم السبت لا أستطيع للأسف، يجب أن أعمل حينها.
Luca: Schade! Passt es dir am Sonntag? [شَادَ! بَاسْتْ إِسْ دِيرْ أَمْ زُونْتَاكْ؟] - يا للخسارة! هل يناسبك يوم الأحد؟
Jonas: Ja, Sonntag passt super. Um wie viel Uhr treffen wir uns? [يَا، زُونْتَاكْ بَاسْتْ زُوبَرْ. أُم فِي فِيلْ أُورْ تْرِيفِن فِير أُونْسْ؟] - نعم، يوم الأحد ممتاز جداً. في أي ساعة نلتقي؟
Luca: Treffen wir uns um Viertel nach vier am Hauptbahnhof? [تْرِيفِن فِير أُونْس أُم فِيرْتَل نَاخ فِير أَم هَاوْبْت بَانْهُوف؟] - هل نلتقي في الساعة الرابعة والربع عند محطة القطار الرئيسية؟
Jonas: Perfekt! Also am Sonntag um 16:15 Uhr. Bis dann! [بِيرْفِيكْت! أَلْزُو أَم زُونْتَاك أُم زِيكْسْتْسِين أُور فُونْفْتْسِين. بِيس دَان!] - ممتاز! إذن يوم الأحد الساعة 16:15. إلى اللقاء حينها!

## القواعد

قاعدة: حروف الجر الزمنية مع الساعات والمواعيد (Temporale Präpositionen: um, am, im, von ... bis)
تُستخدم حروف الجر الزمنية لتحديد مواعيد الأنشطة بدقة؛ حيث تُستخدم um مع الساعات المحددة، و am مع أيام الأسبوع وفترات اليوم، و im مع الأشهر وفصول السنة، و von ... bis للتعبير عن بداية ونهاية فترة زمنية محددة.
مثال: Der Deutschkurs beginnt um 18:00 Uhr (um: حرف الجر الزمني مع الساعات, 18:00 Uhr: الساعة المحددة)

قاعدة: التعبير عن الوقت والتوقيت باللغة الألمانية (Die Uhrzeit: offiziell vs. inoffiziell)
يوجد نظامان للتعبير عن التوقيت؛ التوقيت غير الرسمي يستخدم في الحديث اليومي مع nach و vor و Viertel و halb (halb neun تعني الثامنة والنصف)، والتوقيت الرسمي المعتمد في المحطات والمواعيد الرسمية بنظام 24 ساعة.
مثال: Es ist Viertel vor neun (Viertel vor: إلا ربع, neun: التاسعة)

## تمارين

التمرين الأول: اختر حرف الجر الزمني المناسب مما بين القوسين (um / am / im / von ... bis):
1. Der Deutschkurs beginnt __________ 18:00 Uhr.
2. Wir haben __________ Freitag einen Arzttermin.
3. Mein Geburtstag ist __________ Juli.
4. Die Praxis ist __________ 08:00 __________ 16:00 Uhr geöffnet.

التمرين الثاني: اكتب التوقيت بالكلمات بالطريقة غير الرسمية (Inoffizielle Uhrzeit):
1. 07:15 -> ________________________________________
2. 08:30 -> ________________________________________
3. 11:45 -> ________________________________________

## حلول التمارين

حلول التمارين للتأكد من فهمك:

حل التمرين الأول:
1. um (تُستخدم مع الساعة المحددة 18:00)
2. am (تُستخدم مع أيام الأسبوع Freitag)
3. im (تُستخدم مع الأشهر Juli)
4. von ... bis (تُستخدم لتحديد البداية والنهاية من 08:00 إلى 16:00)

حل التمرين الثاني:
1. Es ist Viertel nach sieben.
2. Es ist halb neun.
3. Es ist Viertel vor zwölf.

---

### 🚀 هل تستعد للعمل في ألمانيا؟
- [فاحص السيرة الذاتية (ATS Analyzer)](https://germanjobspro.com/ar/dashboard/ats-analyzer)
- [توليد خطاب التغطية (Anschreiben DIN 5008)](https://germanjobspro.com/ar/dashboard/cover-letters/new)
`;

/**
 * Clean Live Database Script (Phase 3 - German A1 Strict 1..19 Curriculum Alignment)
 * Part A: Cleans Jobs (sanitizes false healthcare/nursing data, fixes misclassified Praktikant/Werkstudent jobs as General/IT/Engineering, updates titles, categories, salaries, requirements).
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
    const targetImg = isCustomLessonImage(lesson16Post.image_url)
      ? lesson16Post.image_url
      : "/images/lessons/german-a1-lesson-16.png";

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
    const targetImg = isCustomLessonImage(lesson17Post.image_url)
      ? lesson17Post.image_url
      : "/images/lessons/german-a1-lesson-17.png";

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
    const md18 = LESSON_18_MARKDOWN_CONTENT;

    const targetTitle = "الدرس 18: Termine vereinbaren und Uhrzeiten (حجز المواعيد والتوقيت في الحياة اليومية)";
    const targetSlug = "german-a1-lesson-18";
    // Never force wrong static image /images/lessons/german-a1-lesson-18.png.
    // If a custom image exists (data:image/ or https://), preserve it.
    // Otherwise, clear to null so the branded German A1 CSS cover renders.
    const targetImg18 = isCustomLessonImage(lesson18Post.image_url)
      ? lesson18Post.image_url
      : null;

    if (
      lesson18Post.slug !== targetSlug ||
      lesson18Post.title !== targetTitle ||
      lesson18Post.image_url !== targetImg18 ||
      lesson18Post.markdown_content !== md18 ||
      !lesson18Post.published
    ) {
      console.log(`   🔄 Updating existing Lesson 18 [ID: ${lesson18Post.id}]...`);
      await prisma.post.update({
        where: { id: lesson18Post.id },
        data: {
          title: targetTitle,
          slug: targetSlug,
          image_url: targetImg18,
          published: true,
          markdown_content: md18,
        },
      });
      console.log(`   ✅ Lesson 18 updated: slug="${targetSlug}", image=${targetImg18 ? `"${targetImg18}"` : "null (CSS cover fallback)"}`);
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
        image_url: null,
        published: true,
        markdown_content: LESSON_18_MARKDOWN_CONTENT,
      },
    });
    console.log(`   ✅ Lesson 18 created [ID: ${created18.id}]: slug="german-a1-lesson-18", image=null (CSS cover fallback)`);
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
    const targetImg = isCustomLessonImage(lesson19Post.image_url)
      ? lesson19Post.image_url
      : "/images/lessons/german-a1-lesson-19.png";

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
    const updatedSlug = post.slug;
    let updatedContent = post.markdown_content;
    let updatedImageUrl = post.image_url;
    const updatedPublished = post.published;

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
      const hasCustomImage = isCustomLessonImage(updatedImageUrl);

      if (hasCustomImage) {
        // Custom image set via Admin UI or Base64 ALWAYS takes priority and is NEVER overridden!
      } else if (currentLessonNum === 18 || updatedImageUrl === "/images/lessons/german-a1-lesson-18.png") {
        // Lesson 18 wrong static image was removed from disk. Fall back cleanly to null so CSS cover renders.
        if (updatedImageUrl !== null) {
          console.log(`🖼️  [A1 LESSON 18 IMAGE CLEARED] Lesson 18 (${updatedSlug}) -> null (CSS cover fallback)`);
          updatedImageUrl = null;
          imagesConvertedCount++;
        }
      } else if (currentLessonNum >= 1 && currentLessonNum <= 19) {
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

  if (lessonNumbers.length < 19) {
    throw new Error(`❌ Validation Failed: Expected at least 19 lessons, found ${lessonNumbers.length}`);
  }

  for (let i = 1; i <= lessonNumbers.length; i++) {
    if (!lessonNumbers.includes(i)) {
      throw new Error(`❌ Validation Failed: Gap detected! Missing Lesson ${i}`);
    }
  }

  console.log(`\n🎉 ALL CHECKS PASSED: German A1 curriculum is strictly contiguous from Lesson 1 to Lesson ${lessonNumbers.length} with 0 gaps and 0 duplicates!`);
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
