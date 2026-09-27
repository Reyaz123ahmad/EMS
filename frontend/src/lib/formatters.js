import dayjs from 'dayjs';

/**
 * Format a Date to readable string
 * @param {string|Date} date 
 * @param {string} format 
 */
export function formatDate(date, format = 'DD MMM YYYY') {
  if (!date) return '-';
  return dayjs(date).format(format);
}

/**
 * Format a Time string
 * @param {string|Date} date 
 * @param {string} format 
 */
export function formatTime(date, format = 'hh:mm A') {
  if (!date) return '-';
  return dayjs(date).format(format);
}

/**
 * Format currency in INR
 * @param {number|string} amount 
 * @param {string} currency 
 */
export function formatCurrency(amount, currency = 'INR') {
  if (amount === undefined || amount === null) return '₹0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Format total duration in hours and minutes
 * @param {number} minutes 
 */
export function formatDuration(minutes) {
  const mins = Number(minutes);
  
  if (!mins || isNaN(mins) || mins <= 0) {
    return '—';
  }
  
  const hours = (mins / 60).toFixed(2);
  return `${hours} hrs (${mins} mins)`;
}

export function formatMinutes(minutes) {
  const mins = Number(minutes);
  
  if (!mins || isNaN(mins) || mins <= 0) {
    return '0 min';
  }
  
  if (mins < 60) {
    return `${mins} min`;
  }
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  if (remainingMins === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMins} min`;
}

/**
 * Format distance in meters / kilometers
 * @param {number} meters 
 */
export function formatDistance(meters) {
  if (meters === undefined || meters === null) return '-';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}
