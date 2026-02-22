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
});
