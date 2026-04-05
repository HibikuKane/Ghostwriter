/**
 * Prompt Config Service
 * Manages the full LLM message pipeline:
 * - Slot order (including history and current user message)
 * - Enabled/disabled state per slot
 * - Custom text blocks (addable/deletable)
 * - Separator between accumulated system content
 *
 * buildMessages() returns the complete messages array sent to the LLM.
 */
import { DEFAULT_PROMPT_CONFIG } from '../config.js';
import { log } from '../utils/logger.js';

class PromptConfigService {
    constructor() {
        this._config = _deepCopy(DEFAULT_PROMPT_CONFIG);
    }

    get config() {
        return this._config;
    }

    setConfig(config) {
        // Migrate old `elements` format to new `slots` format
        if (config && config.elements && !config.slots) {
            config = _migrateFromElements(config);
        }
        this._config = config;
        log('Prompt config updated', 'info');
    }

    /**
     * Add a new custom text slot.
     * Inserts before current_message if it exists, otherwise at end.
     * @param {string} [label]
     * @returns {object} the new slot
     */
    addCustomSlot(label = '커스텀 블록') {
        const slot = {
            id: `custom_${Date.now()}`,
            type: 'custom',
            label,
            enabled: true,
            content: '',
            deletable: true,
        };
        const slots = this._config.slots;
        const cmIdx = slots.findIndex(s => s.type === 'current_message');
        if (cmIdx !== -1) {
            slots.splice(cmIdx, 0, slot);
        } else {
            slots.push(slot);
        }
        log(`Custom slot added: ${slot.id}`, 'info');
        return slot;
    }

    /**
     * Delete a slot by ID. Only deletable slots can be removed.
     * @param {string} id
     * @returns {boolean}
     */
    deleteSlot(id) {
        const idx = this._config.slots.findIndex(s => s.id === id);
        if (idx === -1) return false;
        if (!this._config.slots[idx].deletable) return false;
        this._config.slots.splice(idx, 1);
        log(`Slot deleted: ${id}`, 'info');
        return true;
    }

    /**
     * Build the complete LLM messages array according to current config.
     *
     * Slots are processed in order:
     * - System-content slots (custom, character_system, character_details, persona)
     *   are accumulated and flushed as a single {role:'system'} message when a
     *   non-system slot (history / current_message) is encountered.
     * - history inserts the messageHistory array.
     * - current_message inserts {role:'user', content: userMessage}.
     *
     * @param {string}  userMessage    - current user input (for keyword matching)
     * @param {Array}   messageHistory - prior {role, content} messages
     * @param {object}  charService    - characterService instance
     * @param {object}  pService       - personaService instance
     * @param {object}  [opts]
     * @param {boolean} [opts.skipCurrentMessage=false] - skip current_message slot (for reroll)
     * @returns {Array<{role:string, content:string}>}
     */
    buildMessages(userMessage, messageHistory, charService, pService, { skipCurrentMessage = false } = {}) {
        const messages = [];
        const sep = this._config.separator || '\n\n';
        let systemParts = [];

        const flushSystem = () => {
            if (!systemParts.length) return;
            messages.push({ role: 'system', content: systemParts.join(sep) });
            systemParts = [];
        };

        for (const slot of this._config.slots) {
            if (!slot.enabled) continue;

            switch (slot.type) {
                case 'custom': {
                    const text = slot.content?.trim();
                    if (text) systemParts.push(text);
                    break;
                }
                case 'character_system': {
                    const sp = charService.activeCharacter?.systemPrompt?.trim();
                    if (sp) systemParts.push(sp);
                    break;
                }
                case 'character_details': {
                    const det = charService.getMatchedDetailText?.(userMessage) || null;
                    if (det) systemParts.push(det);
                    break;
                }
                case 'persona': {
                    const pp = pService.getPersonaPrompt?.() || null;
                    if (pp) systemParts.push(pp);
                    break;
                }
                case 'history': {
                    flushSystem();
                    messages.push(...messageHistory);
                    break;
                }
                case 'current_message': {
                    if (skipCurrentMessage) break;
                    flushSystem();
                    messages.push({ role: 'user', content: userMessage });
                    break;
                }
            }
        }

        flushSystem(); // trailing system content after last special slot
        return messages;
    }

    /**
     * Build a human-readable preview of the pipeline for the settings UI.
     * @param {object} charService
     * @param {object} pService
     * @returns {string}
     */
    buildPreview(charService, pService) {
        const lines = [];
        for (const slot of this._config.slots) {
            const badge = slot.enabled ? '✓' : '✗';
            switch (slot.type) {
                case 'custom':
                    lines.push(`${badge} [${slot.label}]\n${slot.content?.trim() || '(내용 없음)'}`);
                    break;
                case 'character_system': {
                    const sp = charService.activeCharacter?.systemPrompt?.trim();
                    lines.push(`${badge} [캐릭터 시스템 프롬프트]\n${sp || '(없음)'}`);
                    break;
                }
                case 'character_details': {
                    const details = charService.activeCharacter?.details || [];
                    const preview = details.length
                        ? details.map(d => `[${d.keywords.join('/')}] ${d.content.slice(0, 40)}...`).join('\n')
                        : '(없음)';
                    lines.push(`${badge} [키워드 트리거 (${details.length}개)]\n${preview}`);
                    break;
                }
                case 'persona': {
                    const pp = pService.getPersonaPrompt?.() || '(없음)';
                    lines.push(`${badge} [유저 페르소나]\n${pp}`);
                    break;
                }
                case 'history':
                    lines.push(`${badge} [── 대화 히스토리 ──]`);
                    break;
                case 'current_message':
                    lines.push(`${badge} [── 현재 유저 메시지 ──]`);
                    break;
            }
        }
        return lines.join('\n\n') || '(슬롯 없음)';
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function _deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Migrate old `elements`-based config (P3-2 v1) to new `slots`-based format.
 */
function _migrateFromElements(old) {
    const typeMap = {
        meta: 'custom',
        character_system: 'character_system',
        character_details: 'character_details',
        persona: 'persona',
        format_hint: 'custom',
    };
    const deletableIds = new Set(['meta', 'format_hint']);
    const slots = (old.elements || []).map(el => ({
        id: el.id,
        type: typeMap[el.id] || 'custom',
        label: el.label,
        enabled: el.enabled,
        content: el.content || '',
        deletable: deletableIds.has(el.id),
    }));
    if (!slots.find(s => s.type === 'history')) {
        slots.push({ id: 'history', type: 'history', label: '대화 히스토리', enabled: true, deletable: false });
    }
    if (!slots.find(s => s.type === 'current_message')) {
        slots.push({ id: 'current_message', type: 'current_message', label: '현재 유저 메시지', enabled: true, deletable: false });
    }
    return { separator: old.separator || '\n\n', slots };
}

export const promptConfigService = new PromptConfigService();
