/**
 * Formatters utility module
 * Centralizes date and currency formatting functions
 */

/**
 * Format a date with locale-aware display
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale string (default: 'fr-FR')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export const formatDate = (date, locale = 'fr-FR', options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  return new Date(date).toLocaleDateString(locale, defaultOptions);
};

/**
 * Format a date without time
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale string (default: 'fr-FR')
 * @returns {string}
 */
export const formatDateShort = (date, locale = 'fr-FR') =>
  formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

/**
 * Format money with currency
 * @param {number} value - Amount to format
 * @param {string} currency - Currency code (default: 'EUR')
 * @param {string} locale - Locale string (default: 'fr-FR')
 * @returns {string}
 */
export const formatMoney = (value, currency = 'EUR', locale = 'fr-FR') =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(Number(value) || 0);

/**
 * Format price with simple euro display (e.g., "12.50 €")
 * @param {number} value - Amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string}
 */
export const formatPrice = (value, decimals = 2) =>
  `${(Number(value) || 0).toFixed(decimals)} €`;

/**
 * Get locale from i18n language code
 * @param {string} lang - Language code (fr, de, en, etc.)
 * @returns {string} - Full locale string
 */
export const getLocaleFromLang = (lang) => {
  const localeMap = {
    fr: 'fr-FR',
    de: 'de-DE',
    en: 'en-US',
  };
  return localeMap[lang] || 'fr-FR';
};
