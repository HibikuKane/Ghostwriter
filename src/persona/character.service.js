/**
 * Character Service
 * Manages character personas and system prompts.
 * Supports CRUD operations with Google Drive persistence.
 */
import { log } from '../utils/logger.js';
import { storageManager } from '../memory/storage.manager.js';

const DEFAULT_CHARACTERS = [
    {
        id: 'ghostwriter',
        name: 'Ghostwriter',
        description: 'Your default AI writing partner.',
        systemPrompt: 'You are Ghostwriter, an expert AI writing assistant. You help the user with creative writing, coding, and brainstorming. You are helpful, concise, and professional.',
        details: [],
        imageData: null
    },
    {
        id: 'erika',
        name: 'Erika',
        description: 'A strict and efficient code reviewer.',
        systemPrompt: 'You are Erika, a senior software engineer. You are strict, efficient, and focus on clean code and best practices. You do not tolerate inefficient code. You speak in a direct and professional manner.',
        details: [],
        imageData: null
    },
    {
        id: 'shakespeare',
        name: 'William',
        description: 'A poetic and dramatic bard.',
        systemPrompt: 'You are William Shakespeare. You speak in Early Modern English. You are dramatic, poetic, and love using metaphors. You help the user write plays and sonnets.',
        details: [],
        imageData: null
    }
];

// IDs of built-in sample characters (read-only, cannot be saved/edited/deleted)
const DEFAULT_CHARACTER_IDS = new Set(DEFAULT_CHARACTERS.map(c => c.id));

/**
 * Check if a character is a built-in default (read-only).
 * @param {string} id - Character ID
 * @returns {boolean}
 */
export function isDefaultCharacter(id) {
    return DEFAULT_CHARACTER_IDS.has(id);
}

export class CharacterService {
    constructor() {
        this.characters = [...DEFAULT_CHARACTERS];
        this.activeCharacterId = 'ghostwriter';
    }

    get activeCharacter() {
        return this.characters.find(c => c.id === this.activeCharacterId);
    }

    setActiveCharacter(id) {
        if (this.characters.find(c => c.id === id)) {
            this.activeCharacterId = id;
            log(`Character switched to: ${this.activeCharacter.name}`, 'info');
        } else {
            log(`Character ID not found: ${id}`, 'error');
        }
    }

    getSystemMessage() {
        return {
            role: 'system',
            content: this.activeCharacter.systemPrompt
        };
    }

    /**
     * Build the system message, injecting detail entries whose keywords
     * appear in the latest user message.
     * @param {string} userMessage - The latest user input to match against
     * @returns {{ role: 'system', content: string }}
     */
    getSystemMessageWithContext(userMessage) {
        const character = this.activeCharacter;
        let content = character.systemPrompt || '';

        const details = character.details || [];
        if (details.length > 0 && userMessage) {
            const lower = userMessage.toLowerCase();
            const matched = details.filter(d =>
                Array.isArray(d.keywords) &&
                d.keywords.some(kw => kw && lower.includes(kw.toLowerCase()))
            );
            if (matched.length > 0) {
                const injected = matched
                    .map(d => `[${d.keywords.join('/')}]\n${d.content}`)
                    .join('\n\n');
                content += '\n\n[추가 설정]\n' + injected;
                log(`Keyword triggers matched: ${matched.length} entr${matched.length > 1 ? 'ies' : 'y'}`, 'info');
            }
        }

        return { role: 'system', content };
    }

    /**
     * Get just the keyword-triggered detail text for a given user message.
     * Returns only the matched detail block, without the base system prompt.
     * Used by promptConfigService when 'character_details' element is enabled separately.
     * @param {string} userMessage
     * @returns {string|null}
     */
    getMatchedDetailText(userMessage) {
        const details = this.activeCharacter?.details || [];
        if (!details.length || !userMessage) return null;

        const lower = userMessage.toLowerCase();
        const matched = details.filter(d =>
            Array.isArray(d.keywords) &&
            d.keywords.some(kw => kw && lower.includes(kw.toLowerCase()))
        );
        if (!matched.length) return null;

        const injected = matched
            .map(d => `[${d.keywords.join('/')}]\n${d.content}`)
            .join('\n\n');
        log(`Keyword triggers matched: ${matched.length} entr${matched.length > 1 ? 'ies' : 'y'}`, 'info');
        return '[추가 설정]\n' + injected;
    }

    /**
     * Add a new character to memory.
     * @param {Object} characterData - { name, description, systemPrompt }
     * @returns {Object} The created character with generated ID
     */
    addCharacter(characterData) {
        const character = {
            id: crypto.randomUUID(),
            name: characterData.name,
            description: characterData.description || '',
            systemPrompt: characterData.systemPrompt || '',
            details: characterData.details || [],
            imageData: characterData.imageData || null
        };
        this.characters.push(character);
        log(`Character added: ${character.name} (${character.id})`, 'info');
        return character;
    }

    /**
     * Update an existing character in memory.
     * @param {string} id - Character ID
     * @param {Object} data - Fields to update { name?, description?, systemPrompt? }
     * @returns {Object|null} Updated character or null if not found
     */
    updateCharacter(id, data) {
        const character = this.characters.find(c => c.id === id);
        if (!character) {
            log(`Cannot update: Character ID not found: ${id}`, 'error');
            return null;
        }
        if (data.name !== undefined) character.name = data.name;
        if (data.description !== undefined) character.description = data.description;
        if (data.systemPrompt !== undefined) character.systemPrompt = data.systemPrompt;
        if (data.details !== undefined) character.details = data.details;
        if (data.imageData !== undefined) character.imageData = data.imageData;
        log(`Character updated: ${character.name}`, 'info');
        return character;
    }

    /**
     * Remove a character from memory.
     * @param {string} id - Character ID
     * @returns {boolean} Whether removal was successful
     */
    removeCharacter(id) {
        if (isDefaultCharacter(id)) {
            log('Cannot remove default character', 'error');
            return false;
        }
        const index = this.characters.findIndex(c => c.id === id);
        if (index === -1) {
            log(`Cannot remove: Character ID not found: ${id}`, 'error');
            return false;
        }
        const removed = this.characters.splice(index, 1)[0];
        log(`Character removed: ${removed.name}`, 'info');

        // If active character was removed, switch to first available
        if (this.activeCharacterId === id && this.characters.length > 0) {
            this.activeCharacterId = this.characters[0].id;
            log(`Active character auto-switched to: ${this.activeCharacter.name}`, 'info');
        }
        return true;
    }

    /**
     * Load characters from Google Drive.
     * Always keeps default characters and merges user-created ones from Drive.
     */
    async loadCharactersFromDrive() {
        try {
            log('Loading characters from Drive...', 'info');
            const files = await storageManager.listItems('character');

            // Always start with defaults
            this.characters = [...DEFAULT_CHARACTERS];

            if (files && files.length > 0) {
                let loadedCount = 0;
                for (const file of files) {
                    try {
                        const data = await storageManager.loadItem('character', file.id);
                        // Skip if it conflicts with a default character ID
                        if (data && !DEFAULT_CHARACTER_IDS.has(data.id)) {
                            this.characters.push(data);
                            loadedCount++;
                        }
                    } catch (err) {
                        log(`Failed to load character file ${file.name}: ${err.message}`, 'error');
                    }
                }
                log(`Loaded ${loadedCount} user characters from Drive (+ ${DEFAULT_CHARACTERS.length} defaults)`, 'success');
            } else {
                log('No user characters in Drive, using defaults only', 'info');
            }

            // Ensure active character is valid
            if (!this.characters.find(c => c.id === this.activeCharacterId)) {
                this.activeCharacterId = this.characters[0].id;
            }
        } catch (err) {
            log('Error loading characters from Drive: ' + err.message, 'error');
            this.characters = [...DEFAULT_CHARACTERS];
        }
    }

    /**
     * Save a character to Google Drive.
     * @param {Object} character - Character data
     * @returns {Promise<string|null>} Drive file ID or null on error
     */
    async saveCharacterToDrive(character) {
        try {
            log(`📝 Saving character to Drive: ${character.name}`, 'info');
            const fileId = await storageManager.saveItem('character', character);
            log(`✅ Character saved: ${character.name}`, 'success');
            return fileId;
        } catch (err) {
            log(`Failed to save character ${character.name}: ${err.message}`, 'error');
            return null;
        }
    }

    /**
     * Delete a character from Google Drive.
     * @param {string} fileId - Drive file ID
     * @returns {Promise<boolean>}
     */
    async deleteCharacterFromDrive(fileId) {
        try {
            log(`🗑️ Deleting character from Drive: ${fileId}`, 'info');
            await storageManager.deleteItem(fileId);
            log('✅ Character deleted from Drive', 'success');
            return true;
        } catch (err) {
            log(`Failed to delete character from Drive: ${err.message}`, 'error');
            return false;
        }
    }
}

export const characterService = new CharacterService();
