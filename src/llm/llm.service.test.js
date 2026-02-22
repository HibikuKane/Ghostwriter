/**
 * LLMService Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock all provider modules using class syntax
vi.mock('./providers/gemini.provider.js', () => {
    return {
        GeminiProvider: class GeminiProvider {
            constructor(apiKey, model) {
                this.name = 'Gemini';
                this.apiKey = apiKey;
                this.model = model;
            }
            async generateResponse() { return 'mock response'; }
            async testConnection() { return true; }
            async listModels() { return []; }
        }
    };
});

vi.mock('./providers/openai.provider.js', () => {
    return {
        OpenAIProvider: class OpenAIProvider {
            constructor(apiKey, model, baseUrl) {
                this.name = baseUrl ? 'Custom (OpenAI)' : 'OpenAI';
                this.apiKey = apiKey;
                this.model = model;
            }
            async generateResponse() { return 'mock response'; }
            async testConnection() { return true; }
            async listModels() { return []; }
        }
    };
});

vi.mock('./providers/claude.provider.js', () => {
    return {
        ClaudeProvider: class ClaudeProvider {
            constructor(apiKey, model, baseUrl) {
                this.name = baseUrl ? 'Custom (Anthropic)' : 'Claude';
                this.apiKey = apiKey;
                this.model = model;
            }
            async generateResponse() { return 'mock response'; }
            async testConnection() { return true; }
            async listModels() { return []; }
        }
    };
});

vi.mock('../utils/logger.js', () => ({
    log: vi.fn()
}));

import { llmService } from './llm.service.js';

describe('LLMService', () => {

    beforeEach(() => {
        // Reset state before each test
        llmService.provider = null;
        llmService.listeners = {};
    });

    // ── 초기 상태 ──
    describe('초기 상태', () => {
        it('provider가 null이다', () => {
            expect(llmService.provider).toBeNull();
        });
    });

    // ── setProvider ──
    describe('setProvider', () => {
        it('gemini 프로바이더를 설정한다', () => {
            llmService.setProvider('gemini', 'test-key', 'gemini-2.0-flash');
            expect(llmService.provider).not.toBeNull();
            expect(llmService.provider.name).toBe('Gemini');
        });

        it('openai 프로바이더를 설정한다', () => {
            llmService.setProvider('openai', 'test-key', 'gpt-4');
            expect(llmService.provider).not.toBeNull();
        });

        it('claude 프로바이더를 설정한다', () => {
            llmService.setProvider('claude', 'test-key', 'claude-3');
            expect(llmService.provider).not.toBeNull();
        });

        it('알 수 없는 프로바이더명이면 provider가 설정되지 않는다', () => {
            llmService.setProvider('unknown', 'test-key', 'model');
            expect(llmService.provider).toBeNull();
        });

        it('custom 프로바이더 — baseUrl이 없으면 provider가 설정되지 않는다', () => {
            llmService.setProvider('custom', 'test-key', 'model', {});
            expect(llmService.provider).toBeNull();
        });

        it('custom 프로바이더 — openai format으로 설정된다', () => {
            llmService.setProvider('custom', 'test-key', 'model', {
                baseUrl: 'https://custom.api/v1',
                format: 'openai'
            });
            expect(llmService.provider).not.toBeNull();
            expect(llmService.provider.name).toBe('Custom (OpenAI)');
        });

        it('custom 프로바이더 — anthropic format으로 설정된다', () => {
            llmService.setProvider('custom', 'test-key', 'model', {
                baseUrl: 'https://custom.api/v1',
                format: 'anthropic'
            });
            expect(llmService.provider).not.toBeNull();
            expect(llmService.provider.name).toBe('Custom (Anthropic)');
        });
    });

    // ── generate ──
    describe('generate', () => {
        it('provider가 없을 때 에러를 throw한다', async () => {
            await expect(
                llmService.generate([{ role: 'user', content: 'hello' }])
            ).rejects.toThrow('No LLM Provider configured.');
        });

        it('provider가 설정된 후 응답을 반환한다', async () => {
            llmService.setProvider('gemini', 'test-key', 'gemini-2.0-flash');
            const result = await llmService.generate([
                { role: 'user', content: 'hello' }
            ]);
            expect(result).toBe('mock response');
        });

        it('generation_start 이벤트를 발생시킨다', async () => {
            llmService.setProvider('gemini', 'test-key', 'gemini-2.0-flash');

            const startCallback = vi.fn();
            llmService.on('generation_start', startCallback);

            await llmService.generate([{ role: 'user', content: 'hello' }]);

            expect(startCallback).toHaveBeenCalledOnce();
        });

        it('generation_end 이벤트에 duration과 tokenUsage가 포함된다', async () => {
            llmService.setProvider('gemini', 'test-key', 'gemini-2.0-flash');

            const endCallback = vi.fn();
            llmService.on('generation_end', endCallback);

            await llmService.generate([{ role: 'user', content: 'hello' }]);

            expect(endCallback).toHaveBeenCalledOnce();
            const eventData = endCallback.mock.calls[0][0];
            expect(eventData.duration).toBeDefined();
            expect(eventData.tokenUsage).toBeDefined();
        });
    });

    // ── 이벤트 시스템 ──
    describe('이벤트 시스템', () => {
        it('on()으로 리스너를 등록할 수 있다', () => {
            const callback = vi.fn();
            llmService.on('test_event', callback);

            llmService._emit('test_event', { data: 'test' });
            expect(callback).toHaveBeenCalledWith({ data: 'test' });
        });

        it('같은 이벤트에 여러 리스너를 등록할 수 있다', () => {
            const cb1 = vi.fn();
            const cb2 = vi.fn();
            llmService.on('test_event', cb1);
            llmService.on('test_event', cb2);

            llmService._emit('test_event', {});
            expect(cb1).toHaveBeenCalledOnce();
            expect(cb2).toHaveBeenCalledOnce();
        });
    });
});
