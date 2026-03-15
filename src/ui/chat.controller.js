/**
 * Chat Controller
 * Manages the Chat Interface.
 */
import { llmService } from '../llm/llm.service.js';
import { log } from '../utils/logger.js';
import { chatRepository } from '../memory/chat.repository.js';
import { characterService } from '../persona/character.service.js';
import { personaService } from '../persona/persona.service.js';
import { showToast } from '../utils/toast.js';

// DOM Elements
const chatSection = document.getElementById('chat-section');
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

let currentSessionId = null;
let messageHistory = [];

export function initChat() {
    if (sendBtn) sendBtn.onclick = sendMessage;
    if (chatInput) {
        chatInput.onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };
    }

    // Initialize session ID if not exists
    if (!currentSessionId) {
        currentSessionId = `chat_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    }
}

/**
 * Show the chat interface (and its parent layout)
 */
export function showChat() {
    const layoutMain = document.getElementById('layout-main');
    if (layoutMain) layoutMain.classList.remove('hidden');
    if (chatSection) chatSection.classList.remove('hidden');
}

/**
 * Get the current session ID.
 * @returns {string|null}
 */
export function getCurrentSessionId() {
    return currentSessionId;
}

/**
 * Set the current session ID.
 * @param {string} id
 */
export function setCurrentSessionId(id) {
    currentSessionId = id;
}

/**
 * Load a session's messages into the chat UI.
 * Replaces current message history and re-renders all messages.
 * @param {Array} messages - Array of { role, content } objects
 * @param {string} sessionId - The session ID to set as current
 */
export function loadSessionMessages(messages, sessionId) {
    messageHistory = messages || [];
    currentSessionId = sessionId;

    // Clear and re-render chat history
    if (chatHistory) {
        chatHistory.innerHTML = '';
        messageHistory.forEach(msg => {
            addMessageToUI(msg.role, msg.content);
        });
    }

    log(`Chat loaded: ${messageHistory.length} messages`, 'info');
}

/**
 * Clear the chat and start a fresh session.
 */
export function clearChat() {
    messageHistory = [];
    currentSessionId = `chat_${new Date().toISOString().replace(/[:.]/g, '-')}`;

    if (chatHistory) {
        chatHistory.innerHTML = '';
        // Show default greeting
        const character = characterService.activeCharacter;
        const greeting = `Hello! I am ${character.name}. How can I help you today?`;
        addMessageToUI('assistant', greeting);
    }

    log('Chat cleared, new session started', 'info');
}

/**
 * Send a message
 */
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    const activeCharacterId = characterService.activeCharacterId;

    // 1. Add User Message
    addMessageToUI('user', text);

    // Construct full history with system prompt + persona
    const personaPrompt = personaService.getPersonaPrompt();
    const fullHistory = [
        characterService.getSystemMessage(),
        ...(personaPrompt ? [{ role: 'system', content: personaPrompt }] : []),
        ...messageHistory,
        { role: 'user', content: text }
    ];

    messageHistory.push({ role: 'user', content: text });
    chatInput.value = '';

    // Auto-save user message (with characterId)
    const savedId = await chatRepository.saveSession(currentSessionId, messageHistory, activeCharacterId);
    if (savedId) currentSessionId = savedId;

    // 2. Loading State
    const loadingId = addLoadingIndicator();

    try {
        // 3. Call LLM
        const responseText = await llmService.generate(fullHistory);

        // 4. Remove Loading & Add AI Message
        removeMessage(loadingId);
        addMessageToUI('assistant', responseText);
        messageHistory.push({ role: 'assistant', content: responseText });

        // Auto-save assistant message (with characterId)
        const savedId2 = await chatRepository.saveSession(currentSessionId, messageHistory, activeCharacterId);
        if (savedId2) currentSessionId = savedId2;

    } catch (err) {
        removeMessage(loadingId);
        log('Error generating response: ' + err.message, 'error');
        showToast('응답 생성에 실패했습니다: ' + err.message, 'error');
    }
}

function addMessageToUI(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerText = text;

    div.appendChild(bubble);
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    return div.id = 'msg-' + Date.now();
}

function addLoadingIndicator() {
    const div = document.createElement('div');
    div.className = 'message assistant loading';
    div.innerHTML = '<div class="bubble">...</div>';
    div.id = 'loading-' + Date.now();
    chatHistory.appendChild(div);
    return div.id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
