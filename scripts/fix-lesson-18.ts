import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { isCustomLessonImage } from "../src/lib/courseUtils";

export const LESSON_18_MARKDOWN_CONTENT = `# الدرس 18: Termine vereinbaren und Uhrzeiten (حجز المواعيد والتوقيت في الحياة اليومية)

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

async function main() {
  console.log("================================================================================");
  console.log("🚀 FIX & SYNC GERMAN A1 LESSON 18 (STRUCTURE & INTERACTIVE RENDERING)");
  console.log("================================================================================\n");

  const targetTitle = "الدرس 18: Termine vereinbaren und Uhrzeiten (حجز المواعيد والتوقيت في الحياة اليومية)";
  const targetSlug = "german-a1-lesson-18";
  const targetCategory = "German A1";

  // Find Lesson 18 in database
  const existingPost = await prisma.post.findFirst({
    where: {
      OR: [
        { slug: targetSlug },
        { AND: [{ title: { contains: "Termine vereinbaren" } }, { published: true }] },
        { AND: [{ title: { contains: "حجز المواعيد والتوقيت" } }, { published: true }] },
        { AND: [{ title: { contains: "الدرس 18" } }, { published: true }] },
      ],
    },
  });

  if (existingPost) {
    console.log(`📌 Found existing Lesson 18 post [ID: ${existingPost.id}, Slug: ${existingPost.slug}]`);

    const imageToUse = isCustomLessonImage(existingPost.image_url) ? existingPost.image_url : null;

    const updated = await prisma.post.update({
      where: { id: existingPost.id },
      data: {
        title: targetTitle,
        slug: targetSlug,
        category: targetCategory,
        image_url: imageToUse,
        published: true,
        markdown_content: LESSON_18_MARKDOWN_CONTENT,
      },
    });

    console.log(`✅ Successfully updated Lesson 18:`);
    console.log(`   ID: ${updated.id}`);
    console.log(`   Title: ${updated.title}`);
    console.log(`   Slug: ${updated.slug}`);
    console.log(`   Category: ${updated.category}`);
    console.log(`   Published: ${updated.published}`);
    console.log(`   Image URL: ${updated.image_url || "null (CSS cover fallback)"}`);
    console.log(`   Content Length: ${updated.markdown_content.length} chars`);
  } else {
    console.log("✨ No existing Lesson 18 found. Creating new post...");
    const created = await prisma.post.create({
      data: {
        title: targetTitle,
        slug: targetSlug,
        category: targetCategory,
        image_url: null,
        published: true,
        markdown_content: LESSON_18_MARKDOWN_CONTENT,
      },
    });

    console.log(`✅ Successfully created Lesson 18:`);
    console.log(`   ID: ${created.id}`);
    console.log(`   Title: ${created.title}`);
    console.log(`   Slug: ${created.slug}`);
    console.log(`   Content Length: ${created.markdown_content.length} chars`);
  }

  // Verification query
  const verified = await prisma.post.findUnique({
    where: { slug: targetSlug },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      published: true,
      markdown_content: true,
    },
  });

  if (verified && verified.markdown_content.includes("Herr Mansour") && verified.markdown_content.includes("15. die Öffnungszeiten")) {
    console.log("\n🎉 Verification succeeded: German A1 Lesson 18 is active and fully synchronized with interactive structure!");
  } else {
    console.error("\n❌ Verification failed!");
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("❌ Error executing fix-lesson-18 script:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
