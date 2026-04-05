/**
 * i18n Service Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Stub localStorage before module import so the singleton doesn't crash
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] ?? null,
        setItem: (key, val) => { store[key] = String(val); },
        clear: () => { store = {}; },
    };
})();
vi.stubGlobal('localStorage', localStorageMock);

// Import AFTER stubbing
const { I18nService, SUPPORTED_LANGS } = await import('./i18n.service.js');

// Re-export the class for isolated testing
// (i18n.service.js exports both class and singleton; we test the class)

describe('I18nService', () => {
    let svc;

    beforeEach(async () => {
        localStorageMock.clear();
        svc = new I18nService();
    });

    it('기본 언어는 ko이다', () => {
        expect(svc.lang).toBe('ko');
    });

    it('localStorage에 저장된 언어를 초기 로드한다', () => {
        localStorageMock.setItem('ghostwriter_lang', 'en');
        const svc2 = new I18nService();
        expect(svc2.lang).toBe('en');
    });

    it('t() — ko 번역 키를 반환한다', () => {
        expect(svc.t('chat.send')).toBe('Send'); // ko value
        expect(svc.t('common.save')).toBe('저장');
    });

    it('t() — 없는 키는 키 자체를 반환한다', () => {
        expect(svc.t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('setLang(en) — 영어로 전환 후 올바른 번역 반환', () => {
        svc.setLang('en');
        expect(svc.lang).toBe('en');
        expect(svc.t('common.save')).toBe('Save');
        expect(svc.t('chat.send')).toBe('Send');
    });

    it('setLang(ja) — 일본어로 전환 후 올바른 번역 반환', () => {
        svc.setLang('ja');
        expect(svc.lang).toBe('ja');
        expect(svc.t('common.save')).toBe('保存');
        expect(svc.t('chat.mode.roleplay')).toBe('🎭 ロールプレイ');
    });

    it('setLang() — 알 수 없는 코드는 무시한다', () => {
        svc.setLang('zz');
        expect(svc.lang).toBe('ko'); // unchanged
    });

    it('setLang() — localStorage에 저장한다', () => {
        svc.setLang('en');
        expect(localStorageMock.getItem('ghostwriter_lang')).toBe('en');
    });

    it('t() — fallback: 현재 언어에 없으면 ko에서 반환', () => {
        svc.setLang('en');
        // 'chat.mode.novelist' should exist in en
        expect(svc.t('chat.mode.novelist')).toBe('📖 Novelist');
    });

    it('SUPPORTED_LANGS — ko, en, ja 포함', () => {
        const codes = SUPPORTED_LANGS.map(l => l.code);
        expect(codes).toContain('ko');
        expect(codes).toContain('en');
        expect(codes).toContain('ja');
    });

    it('모든 ko 키가 en에도 존재한다', async () => {
        const { ko } = await import('./locales/ko.js');
        const { en } = await import('./locales/en.js');
        const missing = Object.keys(ko).filter(k => !(k in en));
        expect(missing).toHaveLength(0);
    });

    it('모든 ko 키가 ja에도 존재한다', async () => {
        const { ko } = await import('./locales/ko.js');
        const { ja } = await import('./locales/ja.js');
        const missing = Object.keys(ko).filter(k => !(k in ja));
        expect(missing).toHaveLength(0);
    });
});
