/**
 * Currency formatting utilities
 */

/**
 * Format currency amount in Myanmar Kyat
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 ကျပ်';
  }
  return amount.toLocaleString("en-US") + " ကျပ်";
}

/**
 * Parse currency string to number
 * @param {string} currencyStr - Currency string to parse
 * @returns {number} Parsed amount
 */
export function parseCurrency(currencyStr) {
  if (typeof currencyStr !== 'string') {
    return 0;
  }
  return parseFloat(currencyStr.replace(/[^0-9.-]+/g, '')) || 0;
}

/**
 * Format currency for input fields
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string for inputs
 */
export function formatCurrencyInput(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '';
  }
  return amount.toString();
}
