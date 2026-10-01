/**
 * M-Pesa Password Utility
 *
 * Safaricom's STK Push requires a password generated as:
 *   Base64(Shortcode + Passkey + Timestamp)
 */

/**
 * Generate the M-Pesa STK Push password.
 *
 * @param shortcode - M-Pesa business shortcode
 * @param passkey - Lipa Na M-Pesa passkey
 * @param timestamp - Timestamp in YYYYMMDDHHmmss format
 * @returns Base64-encoded password
 */
export function generateMpesaPassword(
  shortcode: string,
  passkey: string,
  timestamp: string
): string {
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString('base64');
}
