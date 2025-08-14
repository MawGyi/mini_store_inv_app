import { derived } from 'svelte/store';
import { currentLanguage, translate } from './language';

/**
 * Creates a reactive translation function that automatically updates when language changes
 * @returns A store that provides a translation function
 */
export const t = derived(
  currentLanguage,
  ($currentLanguage) => (key: string) => translate(key, $currentLanguage)
);

/**
 * Helper function to get multiple translations at once
 * @param keys Array of translation keys
 * @returns Store containing object with translated values
 */
export function useTranslations(keys: string[]) {
  return derived(
    currentLanguage,
    ($currentLanguage) => {
      const translations = {};
      keys.forEach(key => {
        translations[key] = translate(key, $currentLanguage);
      });
      return translations;
    }
  );
}

/**
 * Helper for formatting currency values with proper locale
 */
export const formatCurrency = derived(
  currentLanguage,
  ($currentLanguage) => (amount: number) => {
    if ($currentLanguage === 'my') {
      return `${amount.toLocaleString('en-US')} ကျပ်`;
    } else {
      return `${amount.toLocaleString('en-US')} MMK`;
    }
  }
);

/**
 * Helper for formatting dates with proper locale
 */
export const formatDate = derived(
  currentLanguage,
  ($currentLanguage) => (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if ($currentLanguage === 'my') {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
);

/**
 * Helper for getting localized number formatting
 */
export const formatNumber = derived(
  currentLanguage,
  ($currentLanguage) => (num: number) => {
    return num.toLocaleString($currentLanguage === 'my' ? 'en-US' : 'en-US');
  }
);
