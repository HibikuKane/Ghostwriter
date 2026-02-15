/**
 * Chat Controller
 * Manages the Chat Interface.
 */
import { llmService } from '../llm/llm.service.js';
import { log } from '../utils/logger.js';
import { chatRepository } from '../memory/chat.repository.js';
import { characterService } from '../persona/character.service.js';

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
 * Show the chat interface
 */
export function showChat() {
    if (chatSection) chatSection.classList.remove('hidden');
}

/**
 * Send a message
 */
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // 1. Add User Message
    addMessageToUI('user', text);

    // Construct full history with system prompt
    const fullHistory = [
        characterService.getSystemMessage(),
        ...messageHistory,
        { role: 'user', content: text }
    ];

    messageHistory.push({ role: 'user', content: text });
    chatInput.value = '';

    // Auto-save user message
    const savedId = await chatRepository.saveSession(currentSessionId, messageHistory);
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

        // Auto-save assistant message
        const savedId = await chatRepository.saveSession(currentSessionId, messageHistory);
        if (savedId) currentSessionId = savedId;

    } catch (err) {
        removeMessage(loadingId);
        log('Error generating response: ' + err.message, 'error');
        addMessageToUI('system', 'Error: ' + err.message);
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
