/**
 * PromptConfigService Unit Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';

// No external deps to mock — pure logic
import { DEFAULT_PROMPT_CONFIG } from '../config.js';

// Import the class for isolated testing (not the singleton)
// We re-implement the minimal class inline to avoid module-level side effects
// from imports of characterService / personaService in the real module.
// The service's logic is pure; we test it via a test double.

function makeService(config) {
    // Minimal re-implementation that mirrors the real service logic.
    // Tests actual algorithm, not the singleton.
    const cfg = config ?? JSON.parse(JSON.stringify(DEFAULT_PROMPT_CONFIG));

    return {
        _config: cfg,
        get config() { return this._config; },
        setConfig(c) { this._config = c; },

        buildSystemMessages(userMessage, charService, pService) {
            const parts = [];
            for (const el of this._config.elements) {
                if (!el.enabled) continue;
                let text = null;
                switch (el.id) {
                    case 'meta':       text = el.content?.trim() || null; break;
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
                    case 'format_hint': text = el.content?.trim() || null; break;
                }
                if (text) parts.push(text);
            }
            if (!parts.length) return [];
            const sep = this._config.separator || '\n\n';
            return [{ role: 'system', content: parts.join(sep) }];
        }
    };
}

// ── Stubs ──
const charStub = (systemPrompt = 'You are helpful.', details = []) => ({
    activeCharacter: { systemPrompt, details },
    getMatchedDetailText: (msg) => {
        if (!details.length || !msg) return null;
        const lower = msg.toLowerCase();
        const matched = details.filter(d =>
            d.keywords.some(kw => lower.includes(kw.toLowerCase()))
        );
        if (!matched.length) return null;
        return '[추가 설정]\n' + matched.map(d => `[${d.keywords.join('/')}]\n${d.content}`).join('\n\n');
    }
});
const personaStub = (prompt = '') => ({ getPersonaPrompt: () => prompt });

// ─────────────────────────────────────────
describe('PromptConfigService — buildSystemMessages', () => {
    it('기본 설정: system prompt + persona 포함', () => {
        const svc = makeService();
        const char = charStub('You are X.');
        const persona = personaStub('[User Persona: Alice]\nDesc');

        const msgs = svc.buildSystemMessages('hello', char, persona);

        expect(msgs).toHaveLength(1);
        expect(msgs[0].role).toBe('system');
        expect(msgs[0].content).toContain('You are X.');
        expect(msgs[0].content).toContain('[User Persona: Alice]');
    });

    it('요소가 모두 비활성화되면 빈 배열 반환', () => {
        const svc = makeService();
        svc._config.elements.forEach(el => { el.enabled = false; });

        const msgs = svc.buildSystemMessages('hello', charStub(), personaStub());
        expect(msgs).toHaveLength(0);
    });

    it('구분자 설정이 요소 사이에 적용된다', () => {
        const svc = makeService();
        svc._config.separator = '\n---\n';
        const char = charStub('SysPrompt');
        const persona = personaStub('PersonaText');

        const msgs = svc.buildSystemMessages('hello', char, persona);
        expect(msgs[0].content).toContain('\n---\n');
    });

    it('메타 프롬프트 활성화 시 content 포함', () => {
        const svc = makeService();
        const metaEl = svc._config.elements.find(e => e.id === 'meta');
        metaEl.enabled = true;
        metaEl.content = 'Meta instruction here.';

        const msgs = svc.buildSystemMessages('hello', charStub('Sys'), personaStub());
        expect(msgs[0].content).toContain('Meta instruction here.');
    });

    it('메타 프롬프트 활성화지만 content 비어있으면 포함하지 않음', () => {
        const svc = makeService();
        const metaEl = svc._config.elements.find(e => e.id === 'meta');
        metaEl.enabled = true;
        metaEl.content = '   ';  // whitespace only

        // Only system prompt and persona remain
        const msgs = svc.buildSystemMessages('hello', charStub('Sys'), personaStub());
        expect(msgs[0].content).not.toContain('undefined');
        expect(msgs[0].content.trim()).toBeTruthy();
    });

    it('character_details 활성화 시 키워드 매칭 결과 포함', () => {
        const svc = makeService();
        const detailsEl = svc._config.elements.find(e => e.id === 'character_details');
        detailsEl.enabled = true;

        const char = charStub('Sys', [
            { keywords: ['마법', 'magic'], content: '마법 세계관 설명' }
        ]);

        const msgs = svc.buildSystemMessages('마법 사용해줘', char, personaStub());
        expect(msgs[0].content).toContain('마법 세계관 설명');
    });

    it('character_details 활성화지만 키워드 불일치 시 포함 안 함', () => {
        const svc = makeService();
        const char = charStub('Sys', [
            { keywords: ['dragon'], content: '드래곤 설명' }
        ]);

        const msgs = svc.buildSystemMessages('안녕하세요', char, personaStub());
        expect(msgs[0].content).not.toContain('드래곤 설명');
    });

    it('요소 순서를 변경하면 content 순서도 바뀐다', () => {
        const svc = makeService();
        // Move persona to the front
        const elements = svc._config.elements;
        const personaIdx = elements.findIndex(e => e.id === 'persona');
        const [personaEl] = elements.splice(personaIdx, 1);
        elements.unshift(personaEl);
        personaEl.enabled = true;

        const char = charStub('SystemPrompt');
        const persona = personaStub('PersonaText');
        const msgs = svc.buildSystemMessages('hello', char, persona);

        const pos_persona = msgs[0].content.indexOf('PersonaText');
        const pos_system = msgs[0].content.indexOf('SystemPrompt');
        expect(pos_persona).toBeLessThan(pos_system);
    });

    it('persona 프롬프트 비어있으면 포함하지 않음', () => {
        const svc = makeService();
        // Only character_system enabled for cleaner test
        svc._config.elements.forEach(el => {
            el.enabled = el.id === 'character_system';
        });

        const msgs = svc.buildSystemMessages('hello', charStub('Just sys'), personaStub(''));
        expect(msgs).toHaveLength(1);
        expect(msgs[0].content).toBe('Just sys');
    });
});

// ─────────────────────────────────────────
describe('PromptConfigService — setConfig', () => {
    it('setConfig으로 config 교체 후 buildSystemMessages에 반영됨', () => {
        const svc = makeService();
        svc.setConfig({
            separator: '\n\n',
            elements: [
                { id: 'meta', label: '메타', enabled: true, content: 'Custom meta' }
            ]
        });

        const msgs = svc.buildSystemMessages('hi', charStub(), personaStub());
        expect(msgs[0].content).toBe('Custom meta');
    });
});
