/**
 * Prompt Inspector Controller
 * Shows the final assembled messages array that will be sent to the LLM,
 * with per-role token estimates and slot breakdown.
 */
import { promptConfigService } from '../llm/prompt-config.service.js';
import { modeService, CHAT_MODES } from '../chat/mode.service.js';
import { characterService } from '../persona/character.service.js';
import { personaService } from '../persona/persona.service.js';
import { log } from '../utils/logger.js';

// Rough token estimate: 1 token ≈ 3.5 chars (Korean/English mixed)
const CHARS_PER_TOKEN = 3.5;

/**
 * Initialize the prompt inspector button and modal.
 * @param {Function} getMessageHistory - returns current messageHistory array
 * @param {HTMLInputElement} chatInputEl  - chat input DOM element
 */
export function initInspector(getMessageHistory, chatInputEl) {
    const btn    = document.getElementById('inspector-btn');
    const modal  = document.getElementById('inspector-modal');
    const closeBtn = document.getElementById('close-inspector-btn');

    if (!btn || !modal) return;

    btn.onclick = () => {
        _buildAndShow(modal, getMessageHistory(), chatInputEl?.value || '');
    };
    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    log('Inspector initialized', 'info');
}

// ── Internal ──────────────────────────────────────────────────────────────────

function _buildAndShow(modal, messageHistory, currentInput) {
    const previewInput = currentInput.trim() || '(현재 입력 없음)';

    // Build full message pipeline using current config
    const messages = promptConfigService.buildMessages(
        previewInput, messageHistory, characterService, personaService
    );

    // Inject mode hint if active
    if (modeService.isRoleplay) {
        const hint = modeService.getRoleplayHint(characterService.activeCharacter?.name);
        const sys = messages.find(m => m.role === 'system');
        if (sys) sys.content += '\n\n' + hint;
        else messages.unshift({ role: 'system', content: hint });
    } else if (modeService.isNovelist) {
        const hint = modeService.getNovelistHint(characterService.activeCharacter?.name);
        const sys = messages.find(m => m.role === 'system');
        if (sys) sys.content += '\n\n' + hint;
        else messages.unshift({ role: 'system', content: hint });
    }

    // Render
    const container = modal.querySelector('#inspector-content');
    if (!container) return;

    container.innerHTML = '';

    // Token summary
    const totalChars = messages.reduce((acc, m) => acc + (m.content || '').length, 0);
    const totalTokens = Math.ceil(totalChars / CHARS_PER_TOKEN);
    const systemTokens = Math.ceil(
        messages.filter(m => m.role === 'system').reduce((a, m) => a + m.content.length, 0) / CHARS_PER_TOKEN
    );
    const historyTokens = Math.ceil(
        messages.filter(m => m.role !== 'system').reduce((a, m) => a + (m.content || '').length, 0) / CHARS_PER_TOKEN
    );

    const summary = document.createElement('div');
    summary.className = 'inspector-summary';
    summary.innerHTML = `
        <span class="inspector-token-total">~${totalTokens.toLocaleString()} 토큰</span>
        <span class="inspector-token-breakdown">시스템 ~${systemTokens} · 대화 ~${historyTokens}</span>
        <span class="inspector-msg-count">${messages.length}개 메시지</span>
    `;
    container.appendChild(summary);

    // Message blocks
    for (const msg of messages) {
        const block = _buildMessageBlock(msg);
        container.appendChild(block);
    }

    modal.classList.remove('hidden');
}

function _buildMessageBlock(msg) {
    const block = document.createElement('div');
    block.className = `inspector-msg inspector-msg-${msg.role}`;

    const roleLabel = document.createElement('div');
    roleLabel.className = 'inspector-msg-role';
    const tokens = Math.ceil((msg.content || '').length / CHARS_PER_TOKEN);
    roleLabel.textContent = `[${msg.role.toUpperCase()}]  ~${tokens} 토큰`;

    const content = document.createElement('pre');
    content.className = 'inspector-msg-content';
    content.textContent = msg.content || '(empty)';

    block.appendChild(roleLabel);
    block.appendChild(content);
    return block;
}
