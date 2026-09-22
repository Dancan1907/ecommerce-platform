/**
 * Currency Utilities
 *
 * Handles currency conversion between KES (our pricing currency) and USD
 * (what Stripe supports for our target region).
 *
 * For MVP, we use a fixed conversion rate. In production, this should be
 * replaced with a real-time exchange rate API (e.g., exchangerate-api.com).
 */

import { BadRequestException } from '@nestjs/common';

/**
 * Convert KES to USD using a fixed rate from env.
 * Throws if the rate is misconfigured.
 */
export function kesToUsd(kesAmount: number, rate: number): number {
  if (rate <= 0) {
    throw new BadRequestException('Invalid KES-to-USD conversion rate');
  }
  // Round to 2 decimal places — Stripe requires cents precision
  return Math.round(kesAmount * rate * 100) / 100;
}

/**
 * Convert USD back to KES (for display purposes, if needed).
 */
export function usdToKes(usdAmount: number, rate: number): number {
  if (rate <= 0) {
    throw new BadRequestException('Invalid KES-to-USD conversion rate');
  }
  return Math.round(usdAmount / rate);
}

/**
 * Convert a KES amount to Stripe's smallest unit (cents).
 * Stripe expects amounts in the smallest currency unit — e.g., USD 10.50 → 1050.
 */
export function kesToStripeCents(kesAmount: number, rate: number): number {
  const usd = kesToUsd(kesAmount, rate);
  return Math.round(usd * 100);
}
