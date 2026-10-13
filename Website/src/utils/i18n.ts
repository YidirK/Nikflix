import en from '../i18n/en.json';
import fr from '../i18n/fr.json';
import es from '../i18n/es.json';
import ar from '../i18n/ar.json';

export const locales = ['fr', 'en', 'es', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ChangelogVersion {
  date: string;
  changes: string[];
}

export interface Translations {
  site: {
    title: string;
    description: string;
  };
  nav: {
    download: string;
    chromeStore: string;
    firefoxAddons: string;
    github: string;
    faq: string;
    changelog: string;
    contributors: string;
    donate: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    installChrome: string;
    installFirefox: string;
    sourceCode: string;
    activeUsers: string;
  };
  hero2: {
    title: string;
    titlespan: string;
    subtitle: string;
    subtitlespan: string;
    subtitle2: string;
  };
  features: {
    title: string;
    subtitle: string;
    legalTitle: string;
    legalDesc: string;
    openSourceTitle: string;
    openSourceDesc: string;
    universalTitle: string;
    universalDesc: string;
    instantTitle: string;
    instantDesc: string;
  };
  github: {
    title: string;
    subtitle: string;
    stars: string;
    contributors: string;
    viewRepo: string;
  };
  faq: {
    title: string;
    subtitle: string;
    items: FAQItem[];
  };
  changelog: {
    title: string;
    subtitle: string;
    check: string;
    notfond: string;
  };
  changelogVersions: Record<string, ChangelogVersion>;
  footer: {
    rights: string;
    disclaimer: string;
  };
}

interface LocaleMeta {
  ogLocale: string;
  hreflang: string;
  dir: 'ltr' | 'rtl';
  label: string;
}

const translations: Record<Locale, Translations> = { en, fr, es, ar };

const LOCALE_META: Record<Locale, LocaleMeta> = {
  fr: { ogLocale: 'fr_FR', hreflang: 'fr', dir: 'ltr', label: 'FR' },
  en: { ogLocale: 'en_US', hreflang: 'en', dir: 'ltr', label: 'EN' },
  es: { ogLocale: 'es_ES', hreflang: 'es', dir: 'ltr', label: 'ES' },
  ar: { ogLocale: 'ar_SA', hreflang: 'ar', dir: 'rtl', label: 'AR' },
};

export function getTranslations(locale: Locale = defaultLocale): Translations {
  return translations[locale] ?? translations[defaultLocale];
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getLocaleFromPathname(pathname: string): Locale {
  const first = pathname.split('/').filter(Boolean)[0];
  return first && isLocale(first) ? first : defaultLocale;
}

export function localeMeta(locale: Locale): LocaleMeta {
  return LOCALE_META[locale] ?? LOCALE_META[defaultLocale];
}


export function getLocalizedPath(pathname: string, targetLocale: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length && isLocale(segments[0])) {
    segments.shift();
  }
  const rest = segments.join('/');
  return rest ? `/${targetLocale}/${rest}/` : `/${targetLocale}/`;
}
