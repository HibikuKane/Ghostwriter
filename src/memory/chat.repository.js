/**
 * Chat Repository
 * Manages storage and retrieval of chat sessions using StorageManager.
 */
import { storageManager } from './storage.manager.js';
import { log } from '../utils/logger.js';

export class ChatRepository {
    constructor() {
        // No local state needed, delegates to StorageManager
    }

    /**
     * Save a chat session
     * @param {string} sessionId - Unique ID for the session
     * @param {Array} messages 
     * @param {string} [characterId]
     * @param {string} [personaId]
     */
    async saveSession(sessionId, messages, characterId = 'unknown', personaId = 'user') {
        const sessionData = {
            id: sessionId,
            characterId: characterId,
            personaId: personaId,
            messages: messages,
        };

        try {
            const savedId = await storageManager.saveItem('session', sessionData);
            return savedId;
        } catch (err) {
            log(`Failed to save session ${sessionId}: ${err.message}`, 'error');
            return null;
        }
    }

    /**
     * Load a session by file ID.
     * @param {string} fileId - Google Drive file ID of the session
     * @returns {Promise<Object|null>} Session data or null on error
     */
    async loadSession(fileId) {
        try {
            log(`Loading session: ${fileId}`, 'info');
            const data = await storageManager.loadItem('session', fileId);
            log(`✅ Session loaded: ${fileId}`, 'success');
            return data;
        } catch (err) {
            log(`Failed to load session ${fileId}: ${err.message}`, 'error');
            return null;
        }
    }

    /**
     * List all saved sessions.
     * @returns {Promise<Array<{id: string, name: string}>>} List of session files
     */
    async listSessions() {
        try {
            log('Listing sessions from Drive...', 'info');
            const files = await storageManager.listItems('session');
            log(`Found ${files.length} sessions`, 'info');
            return files;
        } catch (err) {
            log(`Failed to list sessions: ${err.message}`, 'error');
            return [];
        }
    }

    /**
     * Delete a session by file ID.
     * @param {string} fileId - Google Drive file ID
     * @returns {Promise<boolean>}
     */
    async deleteSession(fileId) {
        try {
            log(`🗑️ Deleting session: ${fileId}`, 'info');
            await storageManager.deleteItem(fileId);
            log('✅ Session deleted', 'success');
            return true;
        } catch (err) {
            log(`Failed to delete session ${fileId}: ${err.message}`, 'error');
            return false;
        }
    }
}

export const chatRepository = new ChatRepository();
