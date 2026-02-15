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
            // name: `Session ${sessionId.substring(0, 8)}...` // Optional: Generate a name if needed
        };

        try {
            const savedId = await storageManager.saveItem('session', sessionData);
            return savedId;
            // log(`Session saved: ${sessionId}`, 'info'); // Verbose logging handled by StorageManager
        } catch (err) {
            log(`Failed to save session ${sessionId}: ${err.message}`, 'error');
            return null;
        }
    }

    // Future: loadSession, listSessions, etc. can be added here wrapping storageManager
}

export const chatRepository = new ChatRepository();
