/**
 * Preset Service
 * Manages named snapshots of the prompt pipeline configuration.
 * Each preset stores the full promptConfig (separator + slots).
 *
 * Presets are saved to Google Drive under the `presets/` subfolder
 * via storageManager.
 */
import { log } from '../utils/logger.js';
import { storageManager } from '../memory/storage.manager.js';

export class PresetService {
    constructor() {
        /** @type {Array<{id, name, config, driveFileId?, createdAt}>} */
        this.presets = [];
    }

    // ── In-Memory CRUD ─────────────────────────────────────────────────────────

    /**
     * Add or overwrite a preset in memory.
     * @param {string} name
     * @param {object} config - deep-copied promptConfig
     * @returns {{ id, name, config, createdAt }}
     */
    addPreset(name, config) {
        const preset = {
            id: crypto.randomUUID(),
            name: name.trim() || '이름 없음',
            config: JSON.parse(JSON.stringify(config)),
            createdAt: new Date().toISOString(),
        };
        this.presets.push(preset);
        log(`Preset added: "${preset.name}"`, 'info');
        return preset;
    }

    /**
     * Get a preset by ID.
     * @param {string} id
     * @returns {object|null}
     */
    getPreset(id) {
        return this.presets.find(p => p.id === id) || null;
    }

    /**
     * Delete a preset from memory by ID.
     * @param {string} id
     * @returns {object|null} removed preset or null
     */
    removePreset(id) {
        const idx = this.presets.findIndex(p => p.id === id);
        if (idx === -1) return null;
        const [removed] = this.presets.splice(idx, 1);
        log(`Preset removed: "${removed.name}"`, 'info');
        return removed;
    }

    // ── Drive Persistence ──────────────────────────────────────────────────────

    /**
     * Load all presets from Google Drive.
     */
    async loadPresetsFromDrive() {
        try {
            log('Loading presets from Drive...', 'info');
            const files = await storageManager.listItems('preset');
            this.presets = [];

            if (files && files.length > 0) {
                for (const file of files) {
                    try {
                        const data = await storageManager.loadItem('preset', file.id);
                        if (data && data.id && data.name && data.config) {
                            data.driveFileId = file.id;
                            this.presets.push(data);
                        }
                    } catch (err) {
                        log(`Failed to load preset ${file.name}: ${err.message}`, 'error');
                    }
                }
                log(`Loaded ${this.presets.length} presets from Drive`, 'success');
            } else {
                log('No presets in Drive', 'info');
            }
        } catch (err) {
            log('Error loading presets from Drive: ' + err.message, 'error');
            this.presets = [];
        }
    }

    /**
     * Save a preset to Google Drive.
     * @param {object} preset
     * @returns {Promise<string|null>} Drive file ID
     */
    async savePresetToDrive(preset) {
        try {
            const fileId = await storageManager.saveItem('preset', preset);
            preset.driveFileId = fileId;
            log(`Preset saved to Drive: "${preset.name}"`, 'success');
            return fileId;
        } catch (err) {
            log(`Failed to save preset "${preset.name}": ${err.message}`, 'error');
            return null;
        }
    }

    /**
     * Delete a preset from Google Drive and memory.
     * @param {string} id - preset ID
     * @returns {Promise<boolean>}
     */
    async deletePreset(id) {
        const preset = this.getPreset(id);
        if (!preset) return false;

        if (preset.driveFileId) {
            try {
                await storageManager.deleteItem(preset.driveFileId);
                log(`Preset deleted from Drive: "${preset.name}"`, 'success');
            } catch (err) {
                log(`Failed to delete preset from Drive: ${err.message}`, 'error');
            }
        }
        this.removePreset(id);
        return true;
    }
}

export const presetService = new PresetService();
