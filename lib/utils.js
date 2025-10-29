/**
 * Format a date string to YYYY-MM-DD (safe for SSR)
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Capitalize the first letter of a string
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Map user role to dashboard route
 * @param {string} role
 * @returns {string}
 */
export function getDashboardRoute(role) {
  switch (role) {
    case 'Fleet Manager':
      return '/dashboard';
    case 'Technician':
      return '/dashboard/services';
    case 'Admin Clerk':
      return '/dashboard/licenses';
    case 'Driver':
      return '/dashboard/vehicles';
    default:
      return '/dashboard';
  }
}

/**
 * Format number as currency (ZAR) safely
 * SSR-safe: avoids locale differences between server & client
 * @param {number|string} value
 * @returns {string}
 */
export function formatCurrency(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format number with thousands separator (SSR-safe)
 * @param {number|string} value
 * @returns {string}
 */
export function formatNumber(value) {
  const num = Number(value || 0);
  return num.toLocaleString('en-ZA');
}

/**
 * Format liters to 2 decimal places with thousands separator
 * @param {number|string} value
 * @returns {string}
 */
export function formatLiters(value) {
  const num = Number(value || 0);
  return num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Parse value to number safely
 * @param {string|number} value
 * @returns {number}
 */
export function parseNumber(value) {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}
