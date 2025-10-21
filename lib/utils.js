/**
 * Format a date string to YYYY-MM-DD
 */
export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Map user role to dashboard route
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
 * Format currency to ZAR
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}