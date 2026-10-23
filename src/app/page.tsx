import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n";

export default async function RootPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("preferred_locale")?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    redirect(`/${cookieLocale}`);
  }

  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  if (acceptLanguage) {
    const candidates = acceptLanguage
      .split(",")
      .map((part) => {
        const [lang, qPart] = part.trim().split(";");
        let q = 1.0;
        if (qPart) {
          const match = qPart.match(/q=([0-9.]+)/);
          if (match) {
            const parsed = parseFloat(match[1]);
            if (!isNaN(parsed)) q = parsed;
          }
        }
        const baseCode = lang.split("-")[0].toLowerCase().trim();
        return { code: baseCode, q };
      })
      .sort((a, b) => b.q - a.q)
      .map((item) => item.code);

    for (const code of candidates) {
      if (isValidLocale(code)) {
        redirect(`/${code}`);
      }
    }
  }

  redirect(`/${DEFAULT_LOCALE}`);
}
