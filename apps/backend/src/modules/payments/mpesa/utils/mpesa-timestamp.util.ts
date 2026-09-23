/**
 * M-Pesa Timestamp Utility
 *
 * Safaricom's STK Push requires a timestamp in format YYYYMMDDHHmmss.
 * This is used for both the request timestamp and password generation.
 */

/**
 * Generate current timestamp in YYYYMMDDHHmmss format.
 */
export function getMpesaTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
