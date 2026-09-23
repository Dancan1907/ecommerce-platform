/**
 * MpesaService Tests
 *
 * Unit tests for the Daraja API wrapper.
 * Mocks axios and ConfigService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { MpesaService } from './mpesa.service';
import axios from 'axios';

jest.mock('axios');

describe('MpesaService', () => {
  let service: MpesaService;

  const mockConfig: Record<string, string> = {
    MPESA_ENVIRONMENT: 'sandbox',
    MPESA_CONSUMER_KEY: 'test-key',
    MPESA_CONSUMER_SECRET: 'test-secret',
    MPESA_SHORTCODE: '174379',
    MPESA_PASSKEY: 'test-passkey',
    MPESA_CALLBACK_URL: 'https://example.com/callback',
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => mockConfig[key] ?? defaultValue),
  };

  let mockAxiosInstance: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock axios.create to return a fake client
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
    };
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [MpesaService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<MpesaService>(MpesaService);
  });

  describe('getAccessToken (via initiateStkPush)', () => {
    it('should retrieve and cache a token, then reuse it', async () => {
      // First call: OAuth returns a token
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { access_token: 'test-token-1', expires_in: '3599' },
      });
      // STK Push for first call
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { CheckoutRequestID: 'ws_CO_1', ResponseCode: '0' },
      });

      await service.initiateStkPush('254708374149', 100, 'ORD-001', 'Test');

      // Second call: should reuse cached token (no new OAuth call)
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { CheckoutRequestID: 'ws_CO_2', ResponseCode: '0' },
      });
      await service.initiateStkPush('254708374149', 100, 'ORD-002', 'Test');

      // OAuth should have been called only ONCE
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });

    it('should throw if OAuth fails', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { data: { errorMessage: 'Invalid credentials' } },
        message: 'Unauthorized',
      });

      await expect(service.initiateStkPush('254708374149', 100, 'ORD-001', 'Test')).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('initiateStkPush', () => {
    beforeEach(() => {
      // Set up OAuth success for all tests
      mockAxiosInstance.get.mockResolvedValue({
        data: { access_token: 'test-token', expires_in: '3599' },
      });
    });

    it('should initiate STK Push with correct payload', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          MerchantRequestID: 'merchant-123',
          CheckoutRequestID: 'ws_CO_test',
          ResponseCode: '0',
          ResponseDescription: 'Success',
        },
      });

      const result = await service.initiateStkPush('254708374149', 100, 'ORD-001', 'Test');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/mpesa/stkpush/v1/processrequest',
        expect.objectContaining({
          BusinessShortCode: '174379',
          TransactionType: 'CustomerPayBillOnline',
          Amount: 100,
          PartyA: '254708374149',
          PhoneNumber: '254708374149',
          AccountReference: 'ORD-001',
        }),
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        })
      );
      expect(result.CheckoutRequestID).toBe('ws_CO_test');
    });

    it('should throw if amount is less than 1', async () => {
      await expect(service.initiateStkPush('254708374149', 0, 'ORD-001', 'Test')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw if STK Push fails on Daraja side', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce({
        response: { data: { errorMessage: 'Insufficient balance' } },
        message: 'Bad Request',
      });

      await expect(service.initiateStkPush('254708374149', 100, 'ORD-001', 'Test')).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('should truncate AccountReference to 12 characters', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { CheckoutRequestID: 'ws_CO_test', ResponseCode: '0' },
      });

      await service.initiateStkPush('254708374149', 100, 'ORD-2026-VERY-LONG-REFERENCE', 'Test');

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      expect(callArgs.AccountReference.length).toBeLessThanOrEqual(12);
    });

    it('should truncate TransactionDesc to 13 characters', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { CheckoutRequestID: 'ws_CO_test', ResponseCode: '0' },
      });

      await service.initiateStkPush(
        '254708374149',
        100,
        'ORD-001',
        'A very long transaction description'
      );

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      expect(callArgs.TransactionDesc.length).toBeLessThanOrEqual(13);
    });
  });
});
