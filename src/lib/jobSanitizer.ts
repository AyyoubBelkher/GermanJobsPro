/**
 * Job Classification & Title Sanitizer
 * Automatically detects and fixes false healthcare/nursing classifications
 * originating from automated crawlers or n8n workflows.
 */

export interface JobSanitizerInput {
  title: string;
  category?: string | null;
  salary?: string | null;
  requirements?: string | null;
  descriptionRaw?: string | null;
  applyUrl?: string | null;
  contactEmail?: string | null;
  [key: string]: any;
}

/**
 * Matches true healthcare keywords, including compound nouns and stems:
 * e.g. Pflegefachkraft, Krankenpflege, Krankenschwester, Ärztin, Zahnarzt, Therapeut.
 */
export const TRUE_HEALTHCARE_REGEX =
  /(?:\b(pflege|kranken|medizin|arzt|ärzt|klinik|hospital|apotheke|therap|hebamme|sanitäter|betreuung|zahn|chirurg|nurse|nursing|medical|healthcare|clinic|caregiver)\b|\b(?:pflege|kranken|medizin|arzt|ärzt|klinik|hospital|apotheke|therap|hebamme|sanitäter|betreuung|zahn|chirurg)\w*|\w*pflege\w*)/i;

export const AUSBILDUNG_REGEX = /\b(ausbildung|azubi|duales)\b/i;
export const INTERN_REGEX = /\b(praktikant|praktikum|intern|internship|werkstudent|trainee)\b/i;
export const IT_REGEX = /\b(software|developer|entwickler|engineer|it|security|cyber|data|cloud|devops|frontend|backend|fullstack|admin|system|ki|ai|tech|product|scrum)\b/i;
export const ENGINEERING_REGEX = /\b(ingenieur|mechanik|elektro|mechatronik|bau|konstrukt|cnc|produktion|fertigung)\b/i;

interface Rule {
  regex: RegExp;
  prefix: string;
  category: string | ((target: string) => string);
}

const CLASSIFICATION_RULES: Rule[] = [
  {
    regex: AUSBILDUNG_REGEX,
    prefix: "عقد تدريب مهني",
    category: "Ausbildung",
  },
  {
    regex: INTERN_REGEX,
    prefix: "تدريب عملي",
    category: (target: string) => (IT_REGEX.test(target) ? "IT" : "General"),
  },
  {
    regex: IT_REGEX,
    prefix: "متخصص تقنية معلومات",
    category: "IT",
  },
  {
    regex: /\b(legal|counsel|jurist|anwalt|rechts|compliance)\b/i,
    prefix: "مستشار قانوني",
    category: "General",
  },
  {
    regex: /\b(operations|growth|marketing|sales|vertrieb|account|business|manager|management|hr|recruiter|finance|controller)\b/i,
    prefix: "إدارة الأعمال والعمليات",
    category: "General",
  },
  {
    regex: ENGINEERING_REGEX,
    prefix: "مهندس / تقني",
    category: "Engineering",
  },
];

/**
 * Extracts Latin/German text from inside parentheses or from raw title.
 */
export function extractLatinOrGermanTitle(title: string): string {
  if (!title) return "";
  const parenMatches = [...title.matchAll(/[\(（]([^\)）]+)[\)）]/g)];
  for (const match of parenMatches) {
    const inside = match[1].trim();
    if (/[a-zA-ZäöüÄÖÜß]/.test(inside)) {
      return inside;
    }
  }

  const latinMatch = title.match(/[a-zA-ZäöüÄÖÜß][a-zA-ZäöüÄÖÜß0-9\s\/\-_.,:()&+]*/);
  return latinMatch ? latinMatch[0].trim() : title.trim();
}

/**
 * Sanitizes job title, category, salary, requirements, and description
 * to rectify false healthcare / nursing classification.
 */
export function sanitizeJobPayload<T extends JobSanitizerInput>(input: T): T {
  if (!input || !input.title) {
    return input;
  }

  const rawTitle = input.title.trim();
  const latinTitle = extractLatinOrGermanTitle(rawTitle);
  const targetForCheck = `${latinTitle} ${rawTitle}`;

  const isTrueHealthcare = TRUE_HEALTHCARE_REGEX.test(targetForCheck);
  const hasNursingInTitle = /(?:أخصائي[ة]?\s*تمريض|ممرض[ة]?)/u.test(rawTitle);
  const isHealthcareCategory = (input.category || "").trim().toLowerCase() === "healthcare";
  const hasHealthcareSalary = Boolean(input.salary && /(?:لل|ال)?رعاية\s*الصحية/u.test(input.salary));
  const hasNursingRequirements = Boolean(
    input.requirements && /(?:تمريض|(?:لل|ال)?رعاية\s*الصحية)/u.test(input.requirements)
  );
  const hasNursingDescription = Boolean(
    input.descriptionRaw && /(?:تمريض|(?:لل|ال)?رعاية\s*الصحية)/u.test(input.descriptionRaw)
  );

  let result: T = input;

  // If NOT true healthcare and any false nursing/healthcare boilerplate is present, sanitize
  if (
    !isTrueHealthcare &&
    (hasNursingInTitle ||
      isHealthcareCategory ||
      hasHealthcareSalary ||
      hasNursingRequirements ||
      hasNursingDescription)
  ) {
    // a) Determine true category and Arabic prefix from Latin title
    let trueCategory = "General";
    let arabicPrefix = "فرصة عمل";

    for (const rule of CLASSIFICATION_RULES) {
      if (rule.regex.test(targetForCheck)) {
        trueCategory = typeof rule.category === "function" ? rule.category(targetForCheck) : rule.category;
        arabicPrefix = rule.prefix;
        break;
      }
    }

    // b) Replace false nursing prefix in title while preserving German title in parentheses
    let newTitle = rawTitle;
    if (hasNursingInTitle) {
      const falseNursingPrefixRegex =
        /^(?:أخصائي[ة]?\s*تمريض(?:\s*ورعاية\s*(?:صحية|كبار\s*السن))?|ممرض[ة]?(?:\s*متخصص[ة]?)?)\s*[:\-–—]?\s*/iu;

      if (falseNursingPrefixRegex.test(newTitle)) {
        newTitle = newTitle.replace(falseNursingPrefixRegex, `${arabicPrefix} `).trim();
      } else {
        newTitle = newTitle
          .replace(
            /(?:أخصائي[ة]?\s*تمريض(?:\s*ورعاية\s*(?:صحية|كبار\s*السن))?|ممرض[ة]?(?:\s*متخصص[ة]?)?)/gu,
            arabicPrefix
          )
          .trim();
      }
    }

    // Update category if it was false Healthcare or empty
    const newCategory = isHealthcareCategory || !input.category ? trueCategory : input.category;

    // c) Eliminate false healthcare or generic fallback salary boilerplate
    let newSalary = input.salary ?? null;
    if (
      newSalary &&
      (/(?:لل|ال)?رعاية\s*الصحية/u.test(newSalary) ||
        /(?:حسب\s*الخبرة\s*والاتفاق|Verhandlungsbasis|حسب\s*السلم\s*(?:المهني|المنظم)|Tarifvertrag)/i.test(newSalary))
    ) {
      newSalary = null;
    }

    // d) Clean requirements of false nursing boilerplate
    let newRequirements = input.requirements ?? null;
    if (newRequirements && /(?:تمريض|(?:لل|ال)?رعاية\s*الصحية)/u.test(newRequirements)) {
      newRequirements = newRequirements
        .split("\n")
        .map((line) => {
          if (/(?:تمريض|(?:لل|ال)?رعاية\s*الصحية)/u.test(line)) {
            if (trueCategory === "IT") {
              return "• مؤهل علمي أو خبرة عملية مناسبة في مجال تكنولوجيا المعلومات أو تخصص ذي صلة.";
            } else if (trueCategory === "Ausbildung") {
              return "• الرغبة والدافع للتعلم مع شهادة مدرسية أو تدريبية مناسبة.";
            } else if (trueCategory === "Engineering") {
              return "• مؤهل علمي في الهندسة أو المجال التقني ذي الصلة.";
            } else {
              return "• مؤهل علمي أو خبرة مهنية مناسبة في مجال التخصص.";
            }
          }
          return line;
        })
        .join("\n");

      newRequirements = newRequirements
        .replace(/في مجال التمريض والرعاية الصحية/gu, "في مجال التخصص المهني")
        .replace(/شهادة أو دبلوم في التمريض/gu, "مؤهل مهني أو جامعي ذو صلة")
        .trim();
    }

    // d) Clean descriptionRaw of false nursing boilerplate
    let newDescription = input.descriptionRaw ?? null;
    if (newDescription && /(?:تمريض|(?:لل|ال)?رعاية\s*الصحية)/u.test(newDescription)) {
      newDescription = newDescription
        .replace(/لأخصائي[\/،\s]*أخصائية\s*تمريض/gu, `لوظيفة ${arabicPrefix}`)
        .replace(/لأخصائي[ة]?\s*تمريض/gu, `لوظيفة ${arabicPrefix}`)
        .replace(/لممرض[ة]?\s*(?:متخصص[ة]?)?/gu, `لوظيفة ${arabicPrefix}`)
        .replace(/كأخصائي[ة]?\s*تمريض/gu, `في دور ${arabicPrefix}`)
        .replace(/كممرض[ة]?/gu, `في دور ${arabicPrefix}`)
        .replace(/في مجال التمريض والرعاية الصحية/gu, "في بيئة العمل المهنية بألمانيا")
        .replace(/في قطاع التمريض والرعاية/gu, "في قطاع العمل المتخصص")
        .replace(/شهادة أو دبلوم في التمريض/gu, "مؤهل مهني أو جامعي ذو صلة")
        .replace(/تقديم الرعاية التمريضية الشاملة/gu, "أداء المهام والمسؤوليات الوظيفية بكفاءة")
        .trim();
    }

    result = {
      ...input,
      title: newTitle,
      category: newCategory,
      salary: newSalary,
      requirements: newRequirements,
      descriptionRaw: newDescription,
    };
  }

  // 2. Separate Praktikum / Werkstudent from Ausbildung:
  // Check if category is "Ausbildung" while the title matches intern keywords
  // and does NOT match Ausbildung/Azubi/duales keywords — reclassify category to General / IT / Engineering
  const currentCategory = (result.category || "").trim();
  if (
    currentCategory.toLowerCase() === "ausbildung" &&
    INTERN_REGEX.test(targetForCheck) &&
    !AUSBILDUNG_REGEX.test(targetForCheck)
  ) {
    let reclassifiedCategory = "General";
    if (IT_REGEX.test(targetForCheck)) {
      reclassifiedCategory = "IT";
    } else if (ENGINEERING_REGEX.test(targetForCheck)) {
      reclassifiedCategory = "Engineering";
    }

    result = {
      ...result,
      category: reclassifiedCategory,
    };
  }

  // 3. Strict credibility & transparency: eliminate fake fallback salary boilerplate across all jobs
  if (
    result.salary &&
    (/(?:لل|ال)?رعاية\s*الصحية/u.test(result.salary) ||
      /(?:حسب\s*الخبرة\s*والاتفاق|Verhandlungsbasis|حسب\s*السلم\s*(?:المهني|المنظم)|Tarifvertrag)/i.test(
        result.salary
      ))
  ) {
    result = {
      ...result,
      salary: null,
    };
  }

  // 4. Strict credibility & transparency: eliminate guessed/fake HR emails
  if (result.contactEmail && result.applyUrl) {
    const rawUrl = String(result.applyUrl).toLowerCase().trim();
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      const emailLower = String(result.contactEmail).trim().toLowerCase();
      const textToScan = `${result.descriptionRaw || ""} ${result.requirements || ""}`.toLowerCase();
      if (!textToScan.includes(emailLower)) {
        result = {
          ...result,
          contactEmail: null,
        };
      }
    }
  }

  return result;
}
