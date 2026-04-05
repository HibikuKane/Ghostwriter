/**
 * CharacterService Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('../memory/storage.manager.js', () => ({
    storageManager: {
        saveItem: vi.fn().mockResolvedValue('fake-file-id'),
        loadItem: vi.fn(),
        listItems: vi.fn().mockResolvedValue([]),
        deleteItem: vi.fn().mockResolvedValue(true),
    }
}));

vi.mock('../utils/logger.js', () => ({
    log: vi.fn()
}));

import { CharacterService, isDefaultCharacter } from './character.service.js';

// ─── isDefaultCharacter helper ───
describe('isDefaultCharacter', () => {
    it('기본 캐릭터 ID는 true를 반환한다', () => {
        expect(isDefaultCharacter('ghostwriter')).toBe(true);
        expect(isDefaultCharacter('erika')).toBe(true);
        expect(isDefaultCharacter('shakespeare')).toBe(true);
    });

    it('사용자 생성 ID는 false를 반환한다', () => {
        expect(isDefaultCharacter('random-id')).toBe(false);
        expect(isDefaultCharacter('')).toBe(false);
    });
});

// ─── CharacterService ───
describe('CharacterService', () => {
    let service;

    beforeEach(() => {
        service = new CharacterService();
    });

    // ── 초기 상태 ──
    describe('초기 상태', () => {
        it('기본 캐릭터 3개가 로드된다', () => {
            expect(service.characters).toHaveLength(3);
        });

        it('activeCharacterId는 ghostwriter이다', () => {
            expect(service.activeCharacterId).toBe('ghostwriter');
        });

        it('activeCharacter는 Ghostwriter 객체를 반환한다', () => {
            expect(service.activeCharacter.name).toBe('Ghostwriter');
        });
    });

    // ── addCharacter ──
    describe('addCharacter', () => {
        it('캐릭터 추가 후 목록에 반영된다', () => {
            const newChar = service.addCharacter({
                name: '테스트 캐릭터',
                description: '테스트용',
                systemPrompt: 'You are a test.'
            });

            expect(service.characters).toHaveLength(4);
            expect(service.characters).toContain(newChar);
        });

        it('UUID가 자동 생성된다', () => {
            const newChar = service.addCharacter({ name: 'Test' });
            expect(newChar.id).toBeDefined();
            expect(typeof newChar.id).toBe('string');
            expect(newChar.id.length).toBeGreaterThan(0);
        });

        it('description과 systemPrompt가 없으면 빈 문자열이 설정된다', () => {
            const newChar = service.addCharacter({ name: 'Minimal' });
            expect(newChar.description).toBe('');
            expect(newChar.systemPrompt).toBe('');
        });
    });

    // ── updateCharacter ──
    describe('updateCharacter', () => {
        it('필드 업데이트가 반영된다', () => {
            const updated = service.updateCharacter('ghostwriter', {
                name: 'Updated Name',
                description: 'Updated Desc'
            });
            expect(updated.name).toBe('Updated Name');
            expect(updated.description).toBe('Updated Desc');
        });

        it('존재하지 않는 ID는 null을 반환한다', () => {
            const result = service.updateCharacter('nonexistent', { name: 'X' });
            expect(result).toBeNull();
        });

        it('일부 필드만 업데이트해도 나머지는 유지된다', () => {
            const original = service.activeCharacter;
            const originalPrompt = original.systemPrompt;

            service.updateCharacter('ghostwriter', { name: 'New Name' });

            expect(service.activeCharacter.name).toBe('New Name');
            expect(service.activeCharacter.systemPrompt).toBe(originalPrompt);
        });
    });

    // ── removeCharacter ──
    describe('removeCharacter', () => {
        it('기본 캐릭터(ghostwriter, erika, shakespeare)는 삭제가 차단된다', () => {
            expect(service.removeCharacter('ghostwriter')).toBe(false);
            expect(service.removeCharacter('erika')).toBe(false);
            expect(service.removeCharacter('shakespeare')).toBe(false);
            expect(service.characters).toHaveLength(3);
        });

        it('사용자 캐릭터 삭제 후 목록에서 제거된다', () => {
            const custom = service.addCharacter({ name: 'Custom' });
            expect(service.characters).toHaveLength(4);

            service.removeCharacter(custom.id);
            expect(service.characters).toHaveLength(3);
            expect(service.characters.find(c => c.id === custom.id)).toBeUndefined();
        });

        it('존재하지 않는 ID는 false를 반환한다', () => {
            expect(service.removeCharacter('nonexistent')).toBe(false);
        });

        it('활성 캐릭터 삭제 시 첫 번째 캐릭터로 자동 전환된다', () => {
            const custom = service.addCharacter({ name: 'Active Custom' });
            service.setActiveCharacter(custom.id);
            service.removeCharacter(custom.id);

            expect(service.activeCharacterId).toBe(service.characters[0].id);
        });

        it('삭제 성공 시 true를 반환한다', () => {
            const custom = service.addCharacter({ name: 'Deletable' });
            expect(service.removeCharacter(custom.id)).toBe(true);
        });
    });

    // ── setActiveCharacter ──
    describe('setActiveCharacter', () => {
        it('유효한 ID로 전환 성공', () => {
            service.setActiveCharacter('erika');
            expect(service.activeCharacterId).toBe('erika');
            expect(service.activeCharacter.name).toBe('Erika');
        });

        it('무효한 ID로 전환 시 기존 활성 캐릭터 유지', () => {
            service.setActiveCharacter('nonexistent');
            expect(service.activeCharacterId).toBe('ghostwriter');
        });
    });

    // ── getSystemMessage ──
    describe('getSystemMessage', () => {
        it('활성 캐릭터의 시스템 프롬프트를 올바른 형식으로 반환한다', () => {
            const msg = service.getSystemMessage();
            expect(msg).toEqual({
                role: 'system',
                content: expect.stringContaining('Ghostwriter')
            });
        });

        it('캐릭터 전환 후 해당 캐릭터의 프롬프트를 반환한다', () => {
            service.setActiveCharacter('shakespeare');
            const msg = service.getSystemMessage();
            expect(msg.content).toContain('Shakespeare');
        });
    });

    // ── addCharacter (details + imageData) ──
    describe('addCharacter — details/imageData 필드', () => {
        it('details 없이 생성 시 빈 배열이 기본값이다', () => {
            const c = service.addCharacter({ name: 'NoDetails' });
            expect(c.details).toEqual([]);
        });

        it('imageData 없이 생성 시 null이 기본값이다', () => {
            const c = service.addCharacter({ name: 'NoImage' });
            expect(c.imageData).toBeNull();
        });

        it('details를 전달하면 그대로 저장된다', () => {
            const details = [{ id: 'x1', keywords: ['호무라'], content: '아케미 호무라 설정' }];
            const c = service.addCharacter({ name: 'WithDetails', details });
            expect(c.details).toEqual(details);
        });
    });

    // ── updateCharacter (details + imageData) ──
    describe('updateCharacter — details/imageData 필드', () => {
        it('details 업데이트가 반영된다', () => {
            const details = [{ id: 'x2', keywords: ['아케미'], content: '추가 설정' }];
            service.updateCharacter('ghostwriter', { details });
            expect(service.activeCharacter.details).toEqual(details);
        });

        it('imageData 업데이트가 반영된다', () => {
            service.updateCharacter('ghostwriter', { imageData: 'data:image/png;base64,abc' });
            expect(service.activeCharacter.imageData).toBe('data:image/png;base64,abc');
        });
    });

    // ── getSystemMessageWithContext ──
    describe('getSystemMessageWithContext', () => {
        let charWithDetails;

        beforeEach(() => {
            charWithDetails = service.addCharacter({
                name: '호무라 캐릭터',
                systemPrompt: '기본 프롬프트입니다.',
                details: [
                    { id: 'd1', keywords: ['호무라', '아케미'], content: '아케미 호무라 세부 설정' },
                    { id: 'd2', keywords: ['마법소녀'], content: '마법소녀 관련 설정' },
                ]
            });
            service.setActiveCharacter(charWithDetails.id);
        });

        it('키워드가 없는 메시지에는 기본 프롬프트만 반환한다', () => {
            const msg = service.getSystemMessageWithContext('오늘 날씨가 좋네요');
            expect(msg.role).toBe('system');
            expect(msg.content).toBe('기본 프롬프트입니다.');
        });

        it('키워드 매칭 시 해당 detail 내용이 주입된다', () => {
            const msg = service.getSystemMessageWithContext('호무라에 대해 알려줘');
            expect(msg.content).toContain('기본 프롬프트입니다.');
            expect(msg.content).toContain('아케미 호무라 세부 설정');
            expect(msg.content).toContain('[추가 설정]');
        });

        it('키워드 매칭은 대소문자 무시(case-insensitive)다', () => {
            const msg = service.getSystemMessageWithContext('МАГИ PUELLA 마법소녀에 대해');
            expect(msg.content).toContain('마법소녀 관련 설정');
        });

        it('여러 항목이 동시에 매칭되면 모두 주입된다', () => {
            const msg = service.getSystemMessageWithContext('호무라와 마법소녀');
            expect(msg.content).toContain('아케미 호무라 세부 설정');
            expect(msg.content).toContain('마법소녀 관련 설정');
        });

        it('details가 없는 캐릭터는 기본 프롬프트만 반환한다', () => {
            service.setActiveCharacter('ghostwriter');
            const msg = service.getSystemMessageWithContext('호무라와 마법소녀');
            expect(msg.content).not.toContain('[추가 설정]');
        });

        it('빈 메시지에는 기본 프롬프트만 반환한다', () => {
            const msg = service.getSystemMessageWithContext('');
            expect(msg.content).toBe('기본 프롬프트입니다.');
        });
    });
});
