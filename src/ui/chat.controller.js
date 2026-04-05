/**
 * Chat Controller
 * Manages the Chat Interface.
 */
import { llmService } from '../llm/llm.service.js';
import { modeService, CHAT_MODES } from '../chat/mode.service.js';
import { promptConfigService } from '../llm/prompt-config.service.js';
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

// Stable ID per history entry — parallel to messageHistory.
// Used by delete/edit operations to find the correct history index.
let messageIds = [];

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

    _initModeToggle();
}

/**
 * Set up mode toggle buttons (Chat / Roleplay).
 */
function _initModeToggle() {
    const modeBtns = document.querySelectorAll('#chat-mode-bar .mode-btn');
    if (!modeBtns.length) return;

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newMode = btn.dataset.mode;
            modeService.setMode(newMode);

            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            _applyModeUI(newMode);
            log(`Chat mode: ${newMode}`, 'info');
        });
    });
}

/**
 * Apply visual changes based on the active mode.
 * @param {string} mode
 */
function _applyModeUI(mode) {
    const isRP = mode === CHAT_MODES.ROLEPLAY;
    const isNV = mode === CHAT_MODES.NOVELIST;
    if (chatInput) {
        if (isRP) chatInput.placeholder = '행동(*action*) 또는 대화를 입력하세요...';
        else if (isNV) chatInput.placeholder = '다음 플롯이나 장면 방향을 입력하세요...';
        else chatInput.placeholder = 'Type your message...';
    }
    if (chatSection) {
        chatSection.classList.toggle('roleplay-active', isRP);
        chatSection.classList.toggle('novelist-active', isNV);
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
    messageIds = messageHistory.map(() => crypto.randomUUID());
    currentSessionId = sessionId;
    lastAssistantMsgEl = null;
    alternativeResponses = [];
    currentAltIndex = 0;

    // Clear and re-render chat history
    if (chatHistory) {
        chatHistory.innerHTML = '';
        messageHistory.forEach((msg, i) => {
            addMessageToUI(msg.role, msg.content, messageIds[i]);
        });
    }

    log(`Chat loaded: ${messageHistory.length} messages`, 'info');
}

/**
 * Clear the chat and start a fresh session.
 */
export function clearChat() {
    messageHistory = [];
    messageIds = [];
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
    const userMsgId = crypto.randomUUID();
    addMessageToUI('user', text, userMsgId);
    alternativeResponses = [];
    currentAltIndex = 0;

    // Build full message pipeline via prompt config (order, enabled state, history position)
    const fullHistory = promptConfigService.buildMessages(
        text, messageHistory, characterService, personaService
    );
    if (modeService.isRoleplay) {
        const hint = modeService.getRoleplayHint(characterService.activeCharacter?.name);
        const firstSys = fullHistory.find(m => m.role === 'system');
        if (firstSys) firstSys.content += '\n\n' + hint;
        else fullHistory.unshift({ role: 'system', content: hint });
    } else if (modeService.isNovelist) {
        const hint = modeService.getNovelistHint(characterService.activeCharacter?.name);
        const firstSys = fullHistory.find(m => m.role === 'system');
        if (firstSys) firstSys.content += '\n\n' + hint;
        else fullHistory.unshift({ role: 'system', content: hint });
    }

    messageHistory.push({ role: 'user', content: text });
    messageIds.push(userMsgId);
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

    const currentResponse = messageHistory[lastIdx].content;

    // Ensure the current response is captured in alternativeResponses before discarding it.
    // This handles the case where the response was loaded from Drive (alternativeResponses is empty)
    // or the currentAltIndex has drifted from the actual content.
    if (alternativeResponses.length === 0 || alternativeResponses[currentAltIndex] !== currentResponse) {
        alternativeResponses = [currentResponse];
        currentAltIndex = 0;
    }

    // Remove from history and DOM
    messageHistory.splice(lastIdx, 1);
    if (lastAssistantMsgEl) {
        lastAssistantMsgEl.remove();
        lastAssistantMsgEl = null;
    }

    const activeCharacterId = characterService.activeCharacterId;
    // Use the last user message for keyword context; history already ends with it
    const lastUserMsg = [...messageHistory].reverse().find(m => m.role === 'user');
    const fullHistory = promptConfigService.buildMessages(
        lastUserMsg?.content || '', messageHistory, characterService, personaService,
        { skipCurrentMessage: true }
    );
    if (modeService.isRoleplay) {
        const hint = modeService.getRoleplayHint(characterService.activeCharacter?.name);
        const firstSys = fullHistory.find(m => m.role === 'system');
        if (firstSys) firstSys.content += '\n\n' + hint;
        else fullHistory.unshift({ role: 'system', content: hint });
    } else if (modeService.isNovelist) {
        const hint = modeService.getNovelistHint(characterService.activeCharacter?.name);
        const firstSys = fullHistory.find(m => m.role === 'system');
        if (firstSys) firstSys.content += '\n\n' + hint;
        else fullHistory.unshift({ role: 'system', content: hint });
    }

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

        const assistantMsgId = crypto.randomUUID();
        addMessageToUI('assistant', responseText, assistantMsgId);
        messageHistory.push({ role: 'assistant', content: responseText });
        messageIds.push(assistantMsgId);

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

function addMessageToUI(role, text, msgId) {
    // Remove reroll actions from the previous last assistant message
    if (role === 'assistant' && lastAssistantMsgEl) {
        const prevActions = lastAssistantMsgEl.querySelector('.reroll-actions');
        if (prevActions) prevActions.remove();
    }

    const div = document.createElement('div');
    div.id = 'msg-' + Date.now();
    div.className = `message ${role}`;
    if (msgId) div.dataset.msgid = msgId;

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
        div.appendChild(_buildMsgActions(role, div));
        div.appendChild(_buildRerollActions());
        lastAssistantMsgEl = div;
    } else {
        bubble.innerText = text;
        div.appendChild(bubble);
        div.appendChild(_buildMsgActions(role, div));
    }

    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    return div.id;
}

/**
 * Build the delete / edit action buttons for a message.
 */
function _buildMsgActions(role, msgEl) {
    const bar = document.createElement('div');
    bar.className = 'msg-actions';

    if (role === 'user') {
        const editBtn = document.createElement('button');
        editBtn.className = 'msg-action-btn';
        editBtn.title = '메시지 수정 후 재생성';
        editBtn.textContent = '✏';
        editBtn.onclick = () => _startEdit(msgEl);
        bar.appendChild(editBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'msg-action-btn msg-delete-btn';
    delBtn.title = '메시지 삭제';
    delBtn.textContent = '×';
    delBtn.onclick = () => _deleteMessage(msgEl);
    bar.appendChild(delBtn);

    return bar;
}

/**
 * Delete a single message from history and DOM.
 */
async function _deleteMessage(msgEl) {
    const msgId = msgEl.dataset.msgid;
    if (!msgId) return;
    const idx = messageIds.indexOf(msgId);
    if (idx === -1) return;

    messageHistory.splice(idx, 1);
    messageIds.splice(idx, 1);
    msgEl.remove();

    // If deleted msg was the last assistant msg, update lastAssistantMsgEl
    if (msgEl === lastAssistantMsgEl) {
        const allMsgs = chatHistory.querySelectorAll('.message.assistant:not(.loading)');
        lastAssistantMsgEl = allMsgs[allMsgs.length - 1] || null;
        alternativeResponses = [];
        currentAltIndex = 0;
    }

    const activeCharacterId = characterService.activeCharacterId;
    const savedId = await chatRepository.saveSession(currentSessionId, messageHistory, activeCharacterId);
    if (savedId) currentSessionId = savedId;

    log(`Message deleted (idx ${idx})`, 'info');
}

/**
 * Enter inline edit mode for a user message.
 */
function _startEdit(msgEl) {
    if (isGenerating) return;
    const bubble = msgEl.querySelector('.bubble');
    if (!bubble) return;

    const originalText = bubble.innerText;

    // Build inline edit UI
    const textarea = document.createElement('textarea');
    textarea.className = 'msg-edit-textarea';
    textarea.value = originalText;
    textarea.rows = Math.max(2, originalText.split('\n').length);

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn primary msg-edit-confirm';
    confirmBtn.textContent = '수정 & 재생성';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn text msg-edit-cancel';
    cancelBtn.textContent = '취소';

    const editBar = document.createElement('div');
    editBar.className = 'msg-edit-bar';
    editBar.append(confirmBtn, cancelBtn);

    bubble.classList.add('hidden');
    msgEl.querySelector('.msg-actions')?.classList.add('hidden');
    msgEl.appendChild(textarea);
    msgEl.appendChild(editBar);
    textarea.focus();

    const cleanup = () => {
        textarea.remove();
        editBar.remove();
        bubble.classList.remove('hidden');
        msgEl.querySelector('.msg-actions')?.classList.remove('hidden');
    };

    cancelBtn.onclick = cleanup;

    confirmBtn.onclick = async () => {
        const newText = textarea.value.trim();
        if (!newText) return;
        cleanup();

        const msgId = msgEl.dataset.msgid;
        const idx = msgId ? messageIds.indexOf(msgId) : -1;
        if (idx === -1) return;

        // Update the message text in history
        messageHistory[idx].content = newText;
        bubble.innerText = newText;

        // Remove all messages after this point (both history and DOM)
        const removed = messageHistory.splice(idx + 1);
        messageIds.splice(idx + 1);

        // Remove subsequent DOM elements
        const allMsgEls = Array.from(chatHistory.querySelectorAll('.message[data-msgid]'));
        allMsgEls.forEach(el => {
            if (!messageIds.includes(el.dataset.msgid) && el !== msgEl) el.remove();
        });

        lastAssistantMsgEl = null;
        alternativeResponses = [];
        currentAltIndex = 0;

        log(`Message edited at idx ${idx}, removed ${removed.length} subsequent messages`, 'info');

        // Regenerate from this point
        const fullHistory = promptConfigService.buildMessages(
            newText, messageHistory.slice(0, idx), characterService, personaService
        );
        if (modeService.isRoleplay) {
            const hint = modeService.getRoleplayHint(characterService.activeCharacter?.name);
            const sys = fullHistory.find(m => m.role === 'system');
            if (sys) sys.content += '\n\n' + hint;
            else fullHistory.unshift({ role: 'system', content: hint });
        } else if (modeService.isNovelist) {
            const hint = modeService.getNovelistHint(characterService.activeCharacter?.name);
            const sys = fullHistory.find(m => m.role === 'system');
            if (sys) sys.content += '\n\n' + hint;
            else fullHistory.unshift({ role: 'system', content: hint });
        }

        const activeCharacterId = characterService.activeCharacterId;
        await _generateAndAppend(fullHistory, activeCharacterId);
    };
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
