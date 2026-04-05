/**
 * Prompt Config Service
 * Manages prompt assembly: element order, enabled state, editable content.
 * Used by chat.controller to build the messages array sent to LLM.
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
        this._config = config;
        log('Prompt config updated', 'info');
    }

    /**
     * Build system messages array according to current config.
     * @param {string} userMessage - current user input (for keyword matching)
     * @param {object} charService - characterService instance
     * @param {object} pService - personaService instance
     * @returns {Array<{role: string, content: string}>} zero or one system message
     */
    buildSystemMessages(userMessage, charService, pService) {
        const parts = [];

        for (const el of this._config.elements) {
            if (!el.enabled) continue;

            let text = null;
            switch (el.id) {
                case 'meta':
                    text = el.content?.trim() || null;
                    break;
                case 'character_system': {
                    const sp = charService.activeCharacter?.systemPrompt?.trim();
                    text = sp || null;
                    break;
                }
                case 'character_details':
                    text = charService.getMatchedDetailText(userMessage) || null;
                    break;
                case 'persona':
                    text = pService.getPersonaPrompt() || null;
                    break;
                case 'format_hint':
                    text = el.content?.trim() || null;
                    break;
            }

            if (text) parts.push(text);
        }

        if (!parts.length) return [];

        const sep = this._config.separator || '\n\n';
        return [{ role: 'system', content: parts.join(sep) }];
    }

    /**
     * Build a human-readable preview of the assembled system prompt.
     * Includes all enabled elements with section headers for legibility.
     * @param {object} charService - characterService instance
     * @param {object} pService - personaService instance
     * @returns {string}
     */
    buildPreview(charService, pService) {
        const sections = [];

        for (const el of this._config.elements) {
            if (!el.enabled) continue;

            let text = null;
            switch (el.id) {
                case 'meta':
                    if (el.content?.trim())
                        text = `▶ 메타 프롬프트\n${el.content.trim()}`;
                    break;
                case 'character_system': {
                    const sp = charService.activeCharacter?.systemPrompt?.trim();
                    if (sp) text = `▶ 캐릭터 시스템 프롬프트\n${sp}`;
                    break;
                }
                case 'character_details': {
                    const details = charService.activeCharacter?.details || [];
                    if (details.length) {
                        const lines = details
                            .map(d => `[${d.keywords.join('/')}]\n${d.content}`)
                            .join('\n\n');
                        text = `▶ 키워드 트리거 (${details.length}개)\n${lines}`;
                    }
                    break;
                }
                case 'persona': {
                    const pp = pService.getPersonaPrompt();
                    if (pp) text = `▶ 유저 페르소나\n${pp}`;
                    break;
                }
                case 'format_hint':
                    if (el.content?.trim())
                        text = `▶ 대화 형식 지정자\n${el.content.trim()}`;
                    break;
            }

            if (text) sections.push(text);
        }

        if (!sections.length) return '(활성화된 프롬프트 요소가 없습니다)';

        const sep = this._config.separator || '\n\n';
        return sections.join(sep);
    }
}

function _deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export const promptConfigService = new PromptConfigService();
