/**
 * ModeService Unit Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ModeService, CHAT_MODES } from './mode.service.js';

describe('ModeService', () => {
    let svc;

    beforeEach(() => {
        svc = new ModeService();
    });

    it('초기 모드는 CHAT이다', () => {
        expect(svc.mode).toBe(CHAT_MODES.CHAT);
        expect(svc.isRoleplay).toBe(false);
    });

    it('ROLEPLAY로 전환하면 isRoleplay가 true가 된다', () => {
        svc.setMode(CHAT_MODES.ROLEPLAY);
        expect(svc.mode).toBe(CHAT_MODES.ROLEPLAY);
        expect(svc.isRoleplay).toBe(true);
    });

    it('다시 CHAT으로 전환하면 isRoleplay가 false가 된다', () => {
        svc.setMode(CHAT_MODES.ROLEPLAY);
        svc.setMode(CHAT_MODES.CHAT);
        expect(svc.isRoleplay).toBe(false);
    });

    it('잘못된 모드 값은 무시된다', () => {
        svc.setMode('invalid-mode');
        expect(svc.mode).toBe(CHAT_MODES.CHAT);
    });

    it('null / undefined 모드 값은 무시된다', () => {
        svc.setMode(null);
        svc.setMode(undefined);
        expect(svc.mode).toBe(CHAT_MODES.CHAT);
    });

    it('getRoleplayHint에 캐릭터 이름이 포함된다', () => {
        const hint = svc.getRoleplayHint('에리카');
        expect(hint).toContain('에리카');
        expect(hint).toContain('[롤플레잉 모드]');
    });

    it('getRoleplayHint — 이름 없이 호출 시 기본값 사용', () => {
        const hint = svc.getRoleplayHint();
        expect(hint).toContain('캐릭터');
    });

    it('getRoleplayHint — 빈 문자열 이름 시 기본값 사용', () => {
        const hint = svc.getRoleplayHint('');
        expect(hint).toContain('캐릭터');
    });

    it('getRoleplayHint 결과는 여러 줄로 구성된다', () => {
        const hint = svc.getRoleplayHint('테스트');
        expect(hint.split('\n').length).toBeGreaterThan(3);
    });

    it('ROLEPLAY 모드에서 getRoleplayHint에 롤플레잉 지시문이 포함된다', () => {
        const hint = svc.getRoleplayHint('Alice');
        expect(hint).toContain('롤플레잉');
        expect(hint).toContain('페르소나');
    });
});

describe('CHAT_MODES 상수', () => {
    it('CHAT과 ROLEPLAY 값이 정의되어 있다', () => {
        expect(CHAT_MODES.CHAT).toBeDefined();
        expect(CHAT_MODES.ROLEPLAY).toBeDefined();
    });

    it('CHAT과 ROLEPLAY는 서로 다른 값이다', () => {
        expect(CHAT_MODES.CHAT).not.toBe(CHAT_MODES.ROLEPLAY);
    });
});
