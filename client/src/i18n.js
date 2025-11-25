import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de/translation.json';
import fr from './locales/fr/translation.json';

const storedLang = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
const browserLang = typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : null;
const initialLang = storedLang || (browserLang === 'fr' ? 'fr' : 'de');

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      fr: { translation: fr },
    },
    lng: initialLang,
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

i18n.on('languageChanged', lng => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lang', lng);
  }
});

export default i18n;
