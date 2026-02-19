/**
 * Session Controller
 * Manages the session toolbar UI: listing, loading, and creating chat sessions.
 */
import { chatRepository } from '../memory/chat.repository.js';
import { log } from '../utils/logger.js';
import { loadSessionMessages, clearChat } from './chat.controller.js';

// DOM Elements
const sessionSelect = document.getElementById('session-select');
const newSessionBtn = document.getElementById('new-session-btn');

// Internal session metadata cache
let sessionCache = [];

/**
 * Initialize session toolbar event listeners.
 */
export function initSessionToolbar() {
    if (sessionSelect) {
        sessionSelect.onchange = onSessionSelected;
    }
    if (newSessionBtn) {
        newSessionBtn.onclick = startNewSession;
    }
    log('Session toolbar initialized', 'info');
}

/**
 * Refresh the session dropdown with sessions from Drive.
 * Optionally filters by characterId.
 * @param {string} [characterId] - If provided, only show sessions for this character
 */
export async function refreshSessionList(characterId = null) {
    if (!sessionSelect) return;

    try {
        const files = await chatRepository.listSessions();
        sessionCache = [];

        // Load metadata for each session to get characterId info
        const sessionsWithMeta = [];
        for (const file of files) {
            try {
                const data = await chatRepository.loadSession(file.id);
                if (data) {
                    sessionsWithMeta.push({
                        fileId: file.id,
                        fileName: file.name,
                        characterId: data.characterId || 'unknown',
                        messageCount: data.messages ? data.messages.length : 0,
                        updatedAt: data.updatedAt || ''
                    });
                }
            } catch (err) {
                // Skip sessions that fail to load
                log(`Skipping session ${file.name}: ${err.message}`, 'error');
            }
        }

        // Filter by characterId if provided
        let filtered = sessionsWithMeta;
        if (characterId) {
            filtered = sessionsWithMeta.filter(s => s.characterId === characterId);
        }

        // Sort by updatedAt descending (newest first)
        filtered.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

        sessionCache = filtered;

        // Update dropdown
        sessionSelect.innerHTML = '<option value="">새 세션</option>';
        filtered.forEach(session => {
            const opt = document.createElement('option');
            opt.value = session.fileId;
            const label = session.fileName.replace('.json', '');
            opt.textContent = `${label} (${session.messageCount}개 메시지)`;
            sessionSelect.add(opt);
        });

        log(`Session list refreshed: ${filtered.length} sessions`, 'info');
    } catch (err) {
        log(`Error refreshing session list: ${err.message}`, 'error');
    }
}

/**
 * Handle session dropdown selection change.
 */
async function onSessionSelected() {
    const fileId = sessionSelect.value;
    if (!fileId) {
        // "새 세션" selected
        startNewSession();
        return;
    }

    try {
        log(`Loading selected session: ${fileId}`, 'info');
        const sessionData = await chatRepository.loadSession(fileId);
        if (sessionData && sessionData.messages) {
            loadSessionMessages(sessionData.messages, sessionData.id || fileId);
        } else {
            log('Session data is empty or invalid', 'error');
        }
    } catch (err) {
        log(`Error loading session: ${err.message}`, 'error');
    }
}

/**
 * Start a new chat session.
 */
function startNewSession() {
    clearChat();
    if (sessionSelect) {
        sessionSelect.value = '';
    }
    log('New session started', 'info');
}

/**
 * Load the most recent session for a specific character.
 * If no session exists, starts a new one.
 * @param {string} characterId
 */
export async function loadCharacterSession(characterId) {
    try {
        log(`Loading session for character: ${characterId}`, 'info');
        await refreshSessionList(characterId);

        if (sessionCache.length > 0) {
            // Load the most recent session
            const latest = sessionCache[0];
            const sessionData = await chatRepository.loadSession(latest.fileId);
            if (sessionData && sessionData.messages) {
                loadSessionMessages(sessionData.messages, sessionData.id || latest.fileId);
                if (sessionSelect) sessionSelect.value = latest.fileId;
                log(`Auto-loaded latest session for character ${characterId}`, 'success');
                return;
            }
        }

        // No session found, start fresh
        clearChat();
        log(`No existing session for character ${characterId}, starting new`, 'info');
    } catch (err) {
        log(`Error loading character session: ${err.message}`, 'error');
        clearChat();
    }
}
