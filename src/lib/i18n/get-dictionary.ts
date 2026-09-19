import type { Locale } from './config';
import { DEFAULT_LOCALE, isValidLocale } from './config';
import { ar } from './dictionaries/ar';
import { en } from './dictionaries/en';
import { de } from './dictionaries/de';
import { fr } from './dictionaries/fr';

const dictionaries = { ar, en, de, fr };

export function getDictionary(locale: string) {
  const activeLocale: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  return dictionaries[activeLocale] || dictionaries[DEFAULT_LOCALE];
}
