import os

html_content = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 portrait; margin: 15mm; }
  body {
    font-family: 'DejaVu Sans', 'Arial', sans-serif;
    color: #111827;
    line-height: 1.5;
    background: #ffffff;
    font-size: 11px;
  }
  .header {
    border-bottom: 2px solid #2563eb;
    padding-bottom: 10px;
    margin-bottom: 15px;
  }
  .title { font-size: 18px; font-weight: bold; color: #1e3a8a; }
  .subtitle { font-size: 10px; color: #4b5563; margin-top: 4px; }
  .meta-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 15px;
    font-size: 10px;
  }
  .section-title {
    font-size: 12px;
    font-weight: bold;
    color: #1e40af;
    background: #eff6ff;
    padding: 5px 8px;
    border-right: 4px solid #2563eb;
    margin-top: 15px;
    margin-bottom: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  th {
    background: #f1f5f9;
    color: #1e293b;
    text-align: right;
    padding: 6px 8px;
    font-size: 10px;
    border: 1px solid #cbd5e1;
  }
  td {
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
    font-size: 9.5px;
    vertical-align: top;
  }
  .badge-done { color: #059669; font-weight: bold; }
  .badge-next { color: #d97706; font-weight: bold; }
  .badge-future { color: #7c3aed; font-weight: bold; }
  .footer {
    text-align: center;
    font-size: 8px;
    color: #94a3b8;
    margin-top: 20px;
    border-top: 1px solid #e2e8f0;
    padding-top: 5px;
  }
</style>
</head>
<body>

<div class="header">
  <div class="title">GermanJobsPro — تقرير المتابعة والتنفيذ المعماري</div>
  <div class="subtitle">مقارنة شاملة بين الإنجازات المكتملة وخارطة التوسع الاستراتيجي • 2026</div>
</div>

<div class="meta-box">
  <strong>صاحب المشروع:</strong> أيوب بلخير (Ayyoub Belkher) | <strong>الحالة:</strong> جاهز للإنتاج (Production Ready DIN 5008) | <strong>الاستضافة:</strong> CapRover VPS + Neon PG
</div>

<div class="section-title">1. ما تم إنجازه وتطويره (Completed Milestones)</div>
<table>
  <tr>
    <th style="width: 25%;">المجال / المرحلة</th>
    <th style="width: 60%;">ما تم إنجازه وتطويره</th>
    <th style="width: 15%;">الحالة</th>
  </tr>
  <tr>
    <td><strong>أدوات التوظيف والمستندات</strong></td>
    <td>
      • منشئ السيرة الذاتية DIN 5008 CV Builder مع ترتيب زمني عكسي وتصدير PDF متوافق مع RFC 5987.<br>
      • الاستيراد السحري (1-Click PDF) بالصياغة الاسمية الألمانية (Substantivstil).<br>
      • فاحص السيرة الذاتية (ATS Analyzer) ومجمع ملف الترشيح الكامل (Bewerbungsmappe).
    </td>
    <td><span class="badge-done">مكتملة 100%</span></td>
  </tr>
  <tr>
    <td><strong>البنية السحابية والاشتراكات</strong></td>
    <td>
      • نشر الحاويات على سيرفر CapRover VPS مع شهادات SSL الإجبارية وتأمين الجلسات.<br>
      • ربط قاعدة بيانات Neon PostgreSQL عبر Connection Pooler للحماية أثناء الضغط و DIRECT_URL للترحيلات.<br>
      • ربط بوابة الدفع Lemon Squeezy لتجديد الاشتراكات والأرصدة بالـ Webhooks.
    </td>
    <td><span class="badge-done">مكتملة 100%</span></td>
  </tr>
  <tr>
    <td><strong>منظومة الأتمتة والنشر الذكي</strong></td>
    <td>
      • خط n8n لتوليد وتدقيق دروس A1 بالذكاء الاصطناعي مع معالجة النطق الصوتي للمبتدئين.<br>
      • أرشفة الدروس آلياً في Google Docs و Google Sheets.<br>
      • نشر البوسترات والمنشورات التعليمية بالتوازي على فيسبوك ومدونة الموقع دون تواريخ زائدة.
    </td>
    <td><span class="badge-done">مكتملة 100%</span></td>
  </tr>
</table>

<div class="section-title">2. خطة العمل والمهام القادمة (Strategic Roadmap)</div>
<table>
  <tr>
    <th style="width: 25%;">المرحلة / الأفق</th>
    <th style="width: 60%;">المخرجات المحددة والمهام التنفيذية</th>
    <th style="width: 15%;">الأولوية</th>
  </tr>
  <tr>
    <td><strong>المرحلة 1: النمو والتسويق</strong></td>
    <td>
      • تفعيل الـ Daily Trigger في n8n للنشر اليومي الآلي وجلب الزوار من فيسبوك للموقع.<br>
      • إطلاق النشرة البريدية للمسجلين وإرسال فرص العمل الألمانية وتلخيصات الدروس.
    </td>
    <td><span class="badge-next">عاجل / إطلاق</span></td>
  </tr>
  <tr>
    <td><strong>المرحلة 2: النطق التفاعلي و A2/B1</strong></td>
    <td>
      • دمج الصوت التفاعلي للكلمات والحوارات (Text-to-Speech) في بطاقات المفردات.<br>
      • التوسع في نشر منهاج المستوى A2 و B1 المخصص لمقابلات العمل والتواصل المهني.
    </td>
    <td><span class="badge-next">قيد التخطيط</span></td>
  </tr>
  <tr>
    <td><strong>المرحلة 3: سوق العمل والشراكات</strong></td>
    <td>
      • دعم التقديم المباشر بنقرة واحدة (1-Click Apply) مع الشركات الألمانية الشريكة.<br>
      • توفير اشتراكات وباقات مخصصة لمراكز اللغات والتكوين المهني (Ausbildung).
    </td>
    <td><span class="badge-future">مستقبلية</span></td>
  </tr>
</table>

<div class="footer">
  GermanJobsPro.com — وثيقة متابعة وتنفيذ رسمية لخريطة الطريق — إعداد أيوب بلخير @ 2026
</div>

</body>
</html>
"""

with open("roadmap_report.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("HTML generated successfully.")
