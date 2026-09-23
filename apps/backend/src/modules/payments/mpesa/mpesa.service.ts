/**
 * M-Pesa Service
 *
 * Wrapper around Safaricom Daraja API.
 * Handles:
 *  - OAuth token retrieval (with in-memory caching)
 *  - STK Push initiation
 *
 * Uses axios for HTTP calls. All errors bubble up with clear messages.
 */

import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { generateMpesaPassword } from './utils/mpesa-password.util';
import { getMpesaTimestamp } from './utils/mpesa-timestamp.util';

interface CachedToken {
  token: string;
  expiresAt: number;
}

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly client: AxiosInstance;
  private cachedToken: CachedToken | null = null;

  constructor(private readonly configService: ConfigService) {
    const environment = this.configService.get<string>('MPESA_ENVIRONMENT', 'sandbox');
    const baseUrl =
      environment === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30s timeout
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Get an OAuth access token from Daraja.
   * Caches the token in memory until ~60s before expiry.
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60s safety margin)
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt - 60000) {
      return this.cachedToken.token;
    }

    const consumerKey = this.configService.get<string>('MPESA_CONSUMER_KEY');
    const consumerSecret = this.configService.get<string>('MPESA_CONSUMER_SECRET');

    if (!consumerKey || !consumerSecret) {
      throw new InternalServerErrorException(
        'MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET is not configured'
      );
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
      const response = await this.client.get('/oauth/v1/generate?grant_type=client_credentials', {
        headers: { Authorization: `Basic ${auth}` },
      });

      const token = response.data.access_token;
      const expiresIn = parseInt(response.data.expires_in, 10) || 3599;

      this.cachedToken = {
        token,
        expiresAt: Date.now() + expiresIn * 1000,
      };

      this.logger.log(`Daraja access token retrieved (expires in ${expiresIn}s)`);
      return token;
    } catch (error: any) {
      this.logger.error(
        `Daraja OAuth failed: ${error.response?.data?.errorMessage || error.message}`
      );
      throw new InternalServerErrorException(`Failed to get M-Pesa access token: ${error.message}`);
    }
  }

  /**
   * Initiate an STK Push (Lipa Na M-Pesa Online).
   *
   * @param phoneNumber - Kenyan phone number (254XXXXXXXXX)
   * @param amount - Amount in KES (integer, min 1)
   * @param accountReference - Short reference (e.g., order number)
   * @param transactionDesc - Description (e.g., "Payment for ORD-2026-001")
   */
  async initiateStkPush(
    phoneNumber: string,
    amount: number,
    accountReference: string,
    transactionDesc: string
  ) {
    const shortcode = this.configService.get<string>('MPESA_SHORTCODE');
    const passkey = this.configService.get<string>('MPESA_PASSKEY');
    const callbackUrl = this.configService.get<string>('MPESA_CALLBACK_URL');

    if (!shortcode || !passkey || !callbackUrl) {
      throw new InternalServerErrorException(
        'M-Pesa configuration is incomplete (shortcode, passkey, or callback URL missing)'
      );
    }

    if (amount < 1) {
      throw new BadRequestException('Amount must be at least KES 1');
    }

    const token = await this.getAccessToken();
    const timestamp = getMpesaTimestamp();
    const password = generateMpesaPassword(shortcode, passkey, timestamp);

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.floor(amount), // M-Pesa rejects decimals
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: accountReference.substring(0, 12), // 12 char max
      TransactionDesc: transactionDesc.substring(0, 13), // 13 char max
    };

    try {
      const response = await this.client.post('/mpesa/stkpush/v1/processrequest', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.logger.log(
        `STK Push initiated for ${phoneNumber}, amount ${amount} KES, ref ${accountReference}`
      );

      return response.data;
    } catch (error: any) {
      const errMsg =
        error.response?.data?.errorMessage ||
        error.response?.data?.ResponseDescription ||
        error.message;
      this.logger.error(`STK Push failed: ${errMsg}`);
      throw new InternalServerErrorException(`STK Push failed: ${errMsg}`);
    }
  }
}
