/**
 * PersonaService Unit Tests
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

import { PersonaService, isDefaultPersona } from './persona.service.js';

// ─── isDefaultPersona helper ───
describe('isDefaultPersona', () => {
    it('기본 페르소나 ID(default)는 true를 반환한다', () => {
        expect(isDefaultPersona('default')).toBe(true);
    });

    it('사용자 생성 ID는 false를 반환한다', () => {
        expect(isDefaultPersona('random-id')).toBe(false);
        expect(isDefaultPersona('')).toBe(false);
    });
});

// ─── PersonaService ───
describe('PersonaService', () => {
    let service;

    beforeEach(() => {
        service = new PersonaService();
    });

    // ── 초기 상태 ──
    describe('초기 상태', () => {
        it('기본 페르소나 1개가 로드된다', () => {
            expect(service.personas).toHaveLength(1);
        });

        it('activePersonaId는 default이다', () => {
            expect(service.activePersonaId).toBe('default');
        });

        it('activePersona는 User 객체를 반환한다', () => {
            expect(service.activePersona.name).toBe('User');
        });
    });

    // ── addPersona ──
    describe('addPersona', () => {
        it('페르소나 추가 후 목록에 반영된다', () => {
            const persona = service.addPersona({
                name: '테스트 페르소나',
                description: '테스트용 설명',
                note: '메모'
            });

            expect(service.personas).toHaveLength(2);
            expect(persona.name).toBe('테스트 페르소나');
            expect(persona.id).toBeDefined();
        });

        it('description과 note가 없으면 빈 문자열이 설정된다', () => {
            const persona = service.addPersona({ name: 'Minimal' });
            expect(persona.description).toBe('');
            expect(persona.note).toBe('');
        });

        it('createdAt과 updatedAt 타임스탬프가 생성된다', () => {
            const persona = service.addPersona({ name: 'Timestamped' });
            expect(persona.createdAt).toBeDefined();
            expect(persona.updatedAt).toBeDefined();
        });
    });

    // ── updatePersona ──
    describe('updatePersona', () => {
        it('필드 업데이트가 반영된다', () => {
            const persona = service.addPersona({ name: 'Original' });
            const updated = service.updatePersona(persona.id, {
                name: 'Updated',
                description: 'New Desc'
            });

            expect(updated.name).toBe('Updated');
            expect(updated.description).toBe('New Desc');
        });

        it('존재하지 않는 ID는 null을 반환한다', () => {
            const result = service.updatePersona('nonexistent', { name: 'X' });
            expect(result).toBeNull();
        });

        it('updatedAt이 갱신된다', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

            const persona = service.addPersona({ name: 'Test' });
            const originalUpdatedAt = persona.updatedAt;
            expect(originalUpdatedAt).toBe('2026-01-01T00:00:00.000Z');

            // Advance time by 1 hour
            vi.setSystemTime(new Date('2026-01-01T01:00:00Z'));
            const updated = service.updatePersona(persona.id, { name: 'Changed' });

            expect(updated.updatedAt).toBe('2026-01-01T01:00:00.000Z');
            expect(updated.updatedAt).not.toBe(originalUpdatedAt);

            vi.useRealTimers();
        });
    });

    // ── removePersona ──
    describe('removePersona', () => {
        it('기본 페르소나(default)는 삭제가 차단된다', () => {
            expect(service.removePersona('default')).toBe(false);
            expect(service.personas).toHaveLength(1);
        });

        it('사용자 페르소나는 삭제 가능하다', () => {
            const persona = service.addPersona({ name: 'Deletable' });
            expect(service.removePersona(persona.id)).toBe(true);
            expect(service.personas).toHaveLength(1); // default만 남음
        });

        it('존재하지 않는 ID는 false를 반환한다', () => {
            expect(service.removePersona('nonexistent')).toBe(false);
        });

        it('활성 페르소나 삭제 시 default로 복귀한다', () => {
            const persona = service.addPersona({ name: 'Active' });
            service.setActivePersona(persona.id);

            service.removePersona(persona.id);
            expect(service.activePersonaId).toBe('default');
        });
    });

    // ── setActivePersona ──
    describe('setActivePersona', () => {
        it('유효한 ID로 전환 성공', () => {
            const persona = service.addPersona({ name: 'Other' });
            service.setActivePersona(persona.id);
            expect(service.activePersonaId).toBe(persona.id);
        });

        it('무효한 ID로 전환 시 기존 활성 페르소나 유지', () => {
            service.setActivePersona('nonexistent');
            expect(service.activePersonaId).toBe('default');
        });
    });

    // ── getPersonaPrompt ──
    describe('getPersonaPrompt', () => {
        it('description이 있을 때 프롬프트를 생성한다', () => {
            const persona = service.addPersona({
                name: 'Hero',
                description: 'A brave warrior'
            });
            service.setActivePersona(persona.id);

            const prompt = service.getPersonaPrompt();
            expect(prompt).toContain('Hero');
            expect(prompt).toContain('A brave warrior');
        });

        it('description이 없을 때 빈 문자열을 반환한다', () => {
            // Default persona has empty description
            const prompt = service.getPersonaPrompt();
            expect(prompt).toBe('');
        });

        it('description이 공백만 있을 때도 빈 문자열을 반환한다', () => {
            const persona = service.addPersona({
                name: 'Blank',
                description: '   '
            });
            service.setActivePersona(persona.id);

            expect(service.getPersonaPrompt()).toBe('');
        });
    });
});
