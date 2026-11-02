import { useLanguage, type Language } from '@/contexts/LanguageContext';

export type Tri = { ar: string; he: string; en: string };

/** Inline translations for new UI copy: tx({ ar, he, en }) */
export function useTx() {
  const { language } = useLanguage();
  return (s: Tri) => s[language as Language] ?? s.en;
}

export const pick = (s: Tri, lang: Language) => s[lang] ?? s.en;
