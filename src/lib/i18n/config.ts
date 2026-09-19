export const LOCALES = ['ar', 'en', 'fr', 'de'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ar';

export const LOCALE_METADATA: Record<
  Locale,
  {
    label: string;
    flag: string;
    dir: 'ltr' | 'rtl';
    lang: string;
  }
> = {
  ar: { label: 'العربية', flag: '🇸🇦', dir: 'rtl', lang: 'ar' },
  en: { label: 'English', flag: '🇬🇧', dir: 'ltr', lang: 'en' },
  fr: { label: 'Français', flag: '🇫🇷', dir: 'ltr', lang: 'fr' },
  de: { label: 'Deutsch', flag: '🇩🇪', dir: 'ltr', lang: 'de' },
};

export function isValidLocale(locale: string): locale is Locale {
  return (LOCALES as readonly string[]).includes(locale);
}
