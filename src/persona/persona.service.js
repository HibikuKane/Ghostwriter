/**
 * Persona Service
 * Manages user personas — the "player character" that the user roleplays as.
 * Supports CRUD operations with Google Drive persistence.
 */
import { log } from '../utils/logger.js';
import { storageManager } from '../memory/storage.manager.js';

const DEFAULT_PERSONAS = [
    {
        id: 'default',
        name: 'User',
        description: '',
        note: ''
    }
];

// IDs of built-in default personas (read-only)
const DEFAULT_PERSONA_IDS = new Set(DEFAULT_PERSONAS.map(p => p.id));

/**
 * Check if a persona is a built-in default (read-only).
 * @param {string} id - Persona ID
 * @returns {boolean}
 */
export function isDefaultPersona(id) {
    return DEFAULT_PERSONA_IDS.has(id);
}

export class PersonaService {
    constructor() {
        this.personas = [...DEFAULT_PERSONAS];
        this.activePersonaId = 'default';
    }

    get activePersona() {
        return this.personas.find(p => p.id === this.activePersonaId);
    }

    /**
     * Set the active persona by ID.
     * @param {string} id - Persona ID
     */
    setActivePersona(id) {
        if (this.personas.find(p => p.id === id)) {
            this.activePersonaId = id;
            log(`Persona switched to: ${this.activePersona.name}`, 'info');
        } else {
            log(`Persona ID not found: ${id}`, 'error');
        }
    }

    /**
     * Get persona prompt text for LLM injection.
     * Returns empty string if no description is set (skips prompt injection).
     * @returns {string}
     */
    getPersonaPrompt() {
        const persona = this.activePersona;
        if (!persona || !persona.description.trim()) {
            return '';
        }
        return `[User Persona: ${persona.name}]\n${persona.description}`;
    }

    /**
     * Add a new persona to memory.
     * @param {Object} data - { name, description, note }
     * @returns {Object} The created persona with generated ID
     */
    addPersona(data) {
        const persona = {
            id: crypto.randomUUID(),
            name: data.name,
            description: data.description || '',
            note: data.note || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.personas.push(persona);
        log(`Persona added: ${persona.name} (${persona.id})`, 'info');
        return persona;
    }

    /**
     * Update an existing persona in memory.
     * @param {string} id - Persona ID
     * @param {Object} data - Fields to update { name?, description?, note? }
     * @returns {Object|null} Updated persona or null if not found
     */
    updatePersona(id, data) {
        const persona = this.personas.find(p => p.id === id);
        if (!persona) {
            log(`Cannot update: Persona ID not found: ${id}`, 'error');
            return null;
        }
        if (data.name !== undefined) persona.name = data.name;
        if (data.description !== undefined) persona.description = data.description;
        if (data.note !== undefined) persona.note = data.note;
        persona.updatedAt = new Date().toISOString();
        log(`Persona updated: ${persona.name}`, 'info');
        return persona;
    }

    /**
     * Remove a persona from memory.
     * @param {string} id - Persona ID
     * @returns {boolean} Whether removal was successful
     */
    removePersona(id) {
        if (isDefaultPersona(id)) {
            log('Cannot remove default persona', 'error');
            return false;
        }
        const index = this.personas.findIndex(p => p.id === id);
        if (index === -1) {
            log(`Cannot remove: Persona ID not found: ${id}`, 'error');
            return false;
        }
        const removed = this.personas.splice(index, 1)[0];
        log(`Persona removed: ${removed.name}`, 'info');

        // If active persona was removed, switch to default
        if (this.activePersonaId === id) {
            this.activePersonaId = 'default';
            log('Active persona auto-switched to: User (default)', 'info');
        }
        return true;
    }

    /**
     * Load personas from Google Drive.
     * Always keeps default personas and merges user-created ones from Drive.
     */
    async loadPersonasFromDrive() {
        try {
            log('Loading personas from Drive...', 'info');
            const files = await storageManager.listItems('persona');

            // Always start with defaults
            this.personas = [...DEFAULT_PERSONAS];

            if (files && files.length > 0) {
                let loadedCount = 0;
                for (const file of files) {
                    try {
                        const data = await storageManager.loadItem('persona', file.id);
                        if (data && !DEFAULT_PERSONA_IDS.has(data.id)) {
                            this.personas.push(data);
                            loadedCount++;
                        }
                    } catch (err) {
                        log(`Failed to load persona file ${file.name}: ${err.message}`, 'error');
                    }
                }
                log(`Loaded ${loadedCount} user personas from Drive (+ ${DEFAULT_PERSONAS.length} default)`, 'success');
            } else {
                log('No user personas in Drive, using default only', 'info');
            }

            // Ensure active persona is valid
            if (!this.personas.find(p => p.id === this.activePersonaId)) {
                this.activePersonaId = 'default';
            }
        } catch (err) {
            log('Error loading personas from Drive: ' + err.message, 'error');
            this.personas = [...DEFAULT_PERSONAS];
        }
    }

    /**
     * Save a persona to Google Drive.
     * @param {Object} persona - Persona data
     * @returns {Promise<string|null>} Drive file ID or null on error
     */
    async savePersonaToDrive(persona) {
        try {
            log(`📝 Saving persona to Drive: ${persona.name}`, 'info');
            const fileId = await storageManager.saveItem('persona', persona);
            log(`✅ Persona saved: ${persona.name}`, 'success');
            return fileId;
        } catch (err) {
            log(`Failed to save persona ${persona.name}: ${err.message}`, 'error');
            return null;
        }
    }

    /**
     * Delete a persona from Google Drive.
     * @param {string} fileId - Drive file ID
     * @returns {Promise<boolean>}
     */
    async deletePersonaFromDrive(fileId) {
        try {
            log(`🗑️ Deleting persona from Drive: ${fileId}`, 'info');
            await storageManager.deleteItem(fileId);
            log('✅ Persona deleted from Drive', 'success');
            return true;
        } catch (err) {
            log(`Failed to delete persona from Drive: ${err.message}`, 'error');
            return false;
        }
    }
}

export const personaService = new PersonaService();
