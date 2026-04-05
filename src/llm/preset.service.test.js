/**
 * PresetService Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../memory/storage.manager.js', () => ({
    storageManager: {
        listItems: vi.fn(),
        loadItem: vi.fn(),
        saveItem: vi.fn(),
        deleteItem: vi.fn(),
    }
}));

vi.mock('../utils/logger.js', () => ({ log: vi.fn() }));

import { PresetService } from './preset.service.js';

const sampleConfig = {
    separator: '\n\n',
    slots: [
        { id: 'character_system', type: 'character_system', label: '캐릭터 시스템', enabled: true, deletable: false },
        { id: 'history',          type: 'history',          label: '히스토리',       enabled: true, deletable: false },
        { id: 'current_message',  type: 'current_message',  label: '현재 메시지',    enabled: true, deletable: false },
    ]
};

describe('PresetService', () => {
    let service;

    beforeEach(() => {
        service = new PresetService();
    });

    // ── addPreset ──────────────────────────────────────────────────────────────

    it('addPreset — creates preset with id, name, config snapshot', () => {
        const p = service.addPreset('기본 설정', sampleConfig);
        expect(p.id).toBeTruthy();
        expect(p.name).toBe('기본 설정');
        expect(p.config.separator).toBe('\n\n');
        expect(p.config.slots).toHaveLength(3);
    });

    it('addPreset — deep-copies config (mutations do not affect preset)', () => {
        const config = JSON.parse(JSON.stringify(sampleConfig));
        const p = service.addPreset('복사본', config);
        config.separator = '---';
        expect(p.config.separator).toBe('\n\n');
    });

    it('addPreset — trims and defaults empty name', () => {
        const p = service.addPreset('   ', sampleConfig);
        expect(p.name).toBe('이름 없음');
    });

    it('addPreset — adds to presets array', () => {
        service.addPreset('A', sampleConfig);
        service.addPreset('B', sampleConfig);
        expect(service.presets).toHaveLength(2);
    });

    // ── getPreset ──────────────────────────────────────────────────────────────

    it('getPreset — returns preset by id', () => {
        const p = service.addPreset('Test', sampleConfig);
        expect(service.getPreset(p.id)).toBe(p);
    });

    it('getPreset — returns null for unknown id', () => {
        expect(service.getPreset('nonexistent')).toBeNull();
    });

    // ── removePreset ───────────────────────────────────────────────────────────

    it('removePreset — removes and returns preset', () => {
        const p = service.addPreset('X', sampleConfig);
        const removed = service.removePreset(p.id);
        expect(removed).toBe(p);
        expect(service.presets).toHaveLength(0);
    });

    it('removePreset — returns null for unknown id', () => {
        expect(service.removePreset('ghost')).toBeNull();
    });

    it('removePreset — only removes the targeted preset', () => {
        service.addPreset('A', sampleConfig);
        const b = service.addPreset('B', sampleConfig);
        service.addPreset('C', sampleConfig);
        service.removePreset(b.id);
        expect(service.presets).toHaveLength(2);
        expect(service.presets.map(p => p.name)).toEqual(['A', 'C']);
    });

    // ── Drive integration ──────────────────────────────────────────────────────

    it('loadPresetsFromDrive — populates presets from drive files', async () => {
        const { storageManager } = await import('../memory/storage.manager.js');
        const drivePreset = { id: 'abc', name: '드라이브 프리셋', config: sampleConfig, createdAt: '2026-01-01' };
        storageManager.listItems.mockResolvedValue([{ id: 'file1', name: 'abc.json' }]);
        storageManager.loadItem.mockResolvedValue(drivePreset);

        await service.loadPresetsFromDrive();

        expect(service.presets).toHaveLength(1);
        expect(service.presets[0].name).toBe('드라이브 프리셋');
        expect(service.presets[0].driveFileId).toBe('file1');
    });

    it('loadPresetsFromDrive — handles empty drive', async () => {
        const { storageManager } = await import('../memory/storage.manager.js');
        storageManager.listItems.mockResolvedValue([]);

        await service.loadPresetsFromDrive();
        expect(service.presets).toHaveLength(0);
    });

    it('loadPresetsFromDrive — skips malformed file entries', async () => {
        const { storageManager } = await import('../memory/storage.manager.js');
        storageManager.listItems.mockResolvedValue([{ id: 'bad', name: 'bad.json' }]);
        storageManager.loadItem.mockResolvedValue({ id: 'bad' }); // missing name & config

        await service.loadPresetsFromDrive();
        expect(service.presets).toHaveLength(0);
    });

    it('savePresetToDrive — sets driveFileId on preset', async () => {
        const { storageManager } = await import('../memory/storage.manager.js');
        storageManager.saveItem.mockResolvedValue('drive-file-42');

        const p = service.addPreset('새 프리셋', sampleConfig);
        await service.savePresetToDrive(p);

        expect(p.driveFileId).toBe('drive-file-42');
    });

    it('deletePreset — removes from memory and calls drive deleteItem', async () => {
        const { storageManager } = await import('../memory/storage.manager.js');
        storageManager.deleteItem.mockResolvedValue(true);

        const p = service.addPreset('삭제될 것', sampleConfig);
        p.driveFileId = 'file-99';

        const result = await service.deletePreset(p.id);
        expect(result).toBe(true);
        expect(service.presets).toHaveLength(0);
        expect(storageManager.deleteItem).toHaveBeenCalledWith('file-99');
    });

    it('deletePreset — returns false for unknown id', async () => {
        const result = await service.deletePreset('ghost');
        expect(result).toBe(false);
    });
});
