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
import { renderMarkdown } from '../utils/markdown.js';

// DOM Elements
const chatSection = document.getElementById('chat-section');
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

let currentSessionId = null;
let messageHistory = [];
let lastAssistantMsgEl = null;
let isGenerating = false;

// Reroll history: all generated alternatives for the current last message slot.
// Resets when a new user message is sent or session changes.
let alternativeResponses = [];
let currentAltIndex = 0;

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
    lastAssistantMsgEl = null;
    alternativeResponses = [];
    currentAltIndex = 0;

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
    lastAssistantMsgEl = null;
    alternativeResponses = [];
    currentAltIndex = 0;

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
    if (!text || isGenerating) return;

    const activeCharacterId = characterService.activeCharacterId;

    // 1. Add User Message & reset reroll state for new message slot
    addMessageToUI('user', text);
    alternativeResponses = [];
    currentAltIndex = 0;

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

    await _generateAndAppend(fullHistory, activeCharacterId);
}

/**
 * Regenerate the last assistant response.
 * Saves the current response to reroll history and re-calls the LLM.
 */
async function reroll() {
    if (isGenerating) return;

    // Find the last assistant message in history
    let lastIdx = -1;
    for (let i = messageHistory.length - 1; i >= 0; i--) {
        if (messageHistory[i].role === 'assistant') {
            lastIdx = i;
            break;
        }
    }
    if (lastIdx === -1) return;

    // Remove from history and DOM
    messageHistory.splice(lastIdx, 1);
    if (lastAssistantMsgEl) {
        lastAssistantMsgEl.remove();
        lastAssistantMsgEl = null;
    }

    const activeCharacterId = characterService.activeCharacterId;
    const personaPrompt = personaService.getPersonaPrompt();
    const fullHistory = [
        characterService.getSystemMessage(),
        ...(personaPrompt ? [{ role: 'system', content: personaPrompt }] : []),
        ...messageHistory,
    ];

    log('Rerolling last assistant response', 'info');
    await _generateAndAppend(fullHistory, activeCharacterId);
}

/**
 * Navigate to a different alternative response.
 * @param {number} direction - -1 (prev) or +1 (next)
 */
async function navigateAlternative(direction) {
    const newIndex = currentAltIndex + direction;
    if (newIndex < 0 || newIndex >= alternativeResponses.length) return;

    currentAltIndex = newIndex;
    const selectedText = alternativeResponses[currentAltIndex];

    // Update messageHistory
    let lastIdx = -1;
    for (let i = messageHistory.length - 1; i >= 0; i--) {
        if (messageHistory[i].role === 'assistant') {
            lastIdx = i;
            break;
        }
    }
    if (lastIdx !== -1) messageHistory[lastIdx].content = selectedText;

    // Re-render the last assistant bubble
    if (lastAssistantMsgEl) {
        const bubble = lastAssistantMsgEl.querySelector('.bubble');
        if (bubble) {
            const html = renderMarkdown(selectedText);
            if (html !== null) {
                bubble.innerHTML = html;
            } else {
                bubble.innerText = selectedText;
            }
        }
        _updateAltNav(lastAssistantMsgEl);
    }

    // Auto-save the selected response
    const activeCharacterId = characterService.activeCharacterId;
    const savedId = await chatRepository.saveSession(currentSessionId, messageHistory, activeCharacterId);
    if (savedId) currentSessionId = savedId;
}

/**
 * Call LLM and append the response as an assistant message.
 * Shared by sendMessage() and reroll().
 */
async function _generateAndAppend(fullHistory, activeCharacterId) {
    isGenerating = true;
    const loadingId = addLoadingIndicator();

    try {
        const responseText = await llmService.generate(fullHistory);

        removeMessage(loadingId);
        alternativeResponses.push(responseText);
        currentAltIndex = alternativeResponses.length - 1;

        addMessageToUI('assistant', responseText);
        messageHistory.push({ role: 'assistant', content: responseText });

        const savedId = await chatRepository.saveSession(currentSessionId, messageHistory, activeCharacterId);
        if (savedId) currentSessionId = savedId;

    } catch (err) {
        removeMessage(loadingId);
        log('Error generating response: ' + err.message, 'error');
        showToast('응답 생성에 실패했습니다: ' + err.message, 'error');
    } finally {
        isGenerating = false;
    }
}

function addMessageToUI(role, text) {
    // Remove reroll actions from the previous last assistant message
    if (role === 'assistant' && lastAssistantMsgEl) {
        const prevActions = lastAssistantMsgEl.querySelector('.reroll-actions');
        if (prevActions) prevActions.remove();
    }

    const div = document.createElement('div');
    div.id = 'msg-' + Date.now();
    div.className = `message ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (role === 'assistant') {
        const html = renderMarkdown(text);
        if (html !== null) {
            bubble.innerHTML = html;
        } else {
            bubble.innerText = text;
        }

        div.appendChild(bubble);
        div.appendChild(_buildRerollActions());
        lastAssistantMsgEl = div;
    } else {
        bubble.innerText = text;
        div.appendChild(bubble);
    }

    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    return div.id;
}

/**
 * Build the reroll actions bar (navigator + reroll button).
 */
function _buildRerollActions() {
    const actions = document.createElement('div');
    actions.className = 'reroll-actions';

    if (alternativeResponses.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'alt-nav';
        prevBtn.textContent = '◀';
        prevBtn.disabled = currentAltIndex === 0;
        prevBtn.onclick = () => navigateAlternative(-1);

        const counter = document.createElement('span');
        counter.className = 'alt-counter';
        counter.textContent = `${currentAltIndex + 1}/${alternativeResponses.length}`;

        const nextBtn = document.createElement('button');
        nextBtn.className = 'alt-nav';
        nextBtn.textContent = '▶';
        nextBtn.disabled = currentAltIndex === alternativeResponses.length - 1;
        nextBtn.onclick = () => navigateAlternative(1);

        actions.appendChild(prevBtn);
        actions.appendChild(counter);
        actions.appendChild(nextBtn);
    }

    const rerollBtn = document.createElement('button');
    rerollBtn.className = 'reroll-btn';
    rerollBtn.title = '응답 재생성';
    rerollBtn.textContent = '↺ 재생성';
    rerollBtn.onclick = () => reroll();
    actions.appendChild(rerollBtn);

    return actions;
}

/**
 * Update the alt-nav counter and button states in-place.
 */
function _updateAltNav(msgEl) {
    const actions = msgEl.querySelector('.reroll-actions');
    if (!actions) return;
    actions.replaceWith(_buildRerollActions());
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
