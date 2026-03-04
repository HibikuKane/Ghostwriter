/**
 * classifyApiError Unit Tests
 */
import { describe, it, expect } from 'vitest';
import { classifyApiError } from './base-provider.js';

describe('classifyApiError', () => {
    describe('HTTP status code classification', () => {
        it('should return auth error for 401', () => {
            const result = classifyApiError({ status: 401 });
            expect(result).toBeInstanceOf(Error);
            expect(result.message).toContain('API 키가 유효하지 않습니다');
        });

        it('should return permission error for 403', () => {
            const result = classifyApiError({ status: 403 });
            expect(result.message).toContain('접근 권한이 없습니다');
        });

        it('should return rate limit error for 429', () => {
            const result = classifyApiError({ status: 429 });
            expect(result.message).toContain('요청 한도 초과');
        });

        it('should return server error for 500', () => {
            const result = classifyApiError({ status: 500 });
            expect(result.message).toContain('일시적 문제');
        });

        it('should return server error for 502', () => {
            const result = classifyApiError({ status: 502 });
            expect(result.message).toContain('일시적 문제');
        });

        it('should return server error for 503', () => {
            const result = classifyApiError({ status: 503 });
            expect(result.message).toContain('일시적 문제');
        });

        it('should return rawError for unknown status codes', () => {
            const raw = new Error('Something weird');
            const result = classifyApiError({ status: 418 }, raw);
            expect(result).toBe(raw);
        });

        it('should return generic error for unknown status without rawError', () => {
            const result = classifyApiError({ status: 418 });
            expect(result.message).toContain('API 오류 (418)');
        });
    });

    describe('network error classification', () => {
        it('should detect "Failed to fetch" as network error', () => {
            const raw = new Error('Failed to fetch');
            const result = classifyApiError(null, raw);
            expect(result.message).toContain('인터넷 연결');
        });

        it('should detect TypeError as network error', () => {
            const raw = new TypeError('NetworkError when attempting to fetch resource');
            const result = classifyApiError(null, raw);
            expect(result.message).toContain('인터넷 연결');
        });

        it('should pass through non-network errors', () => {
            const raw = new Error('Some other error');
            const result = classifyApiError(null, raw);
            expect(result).toBe(raw);
        });

        it('should return unknown error when no response and no rawError', () => {
            const result = classifyApiError(null, null);
            expect(result.message).toContain('알 수 없는 오류');
        });
    });
});
