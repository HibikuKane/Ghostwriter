/**
 * PromptConfigService Unit Tests
 * Tests the slot-based pipeline: buildMessages, addCustomSlot, deleteSlot.
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_PROMPT_CONFIG } from '../config.js';

// Mirror the service logic for isolated testing (avoids DOM/singleton coupling)
function makeService(config) {
    const cfg = config ?? JSON.parse(JSON.stringify(DEFAULT_PROMPT_CONFIG));
    return {
        _config: cfg,
        get config() { return this._config; },
        setConfig(c) { this._config = c; },

        addCustomSlot(label = '커스텀 블록') {
            const slot = { id: `custom_${Date.now()}`, type: 'custom', label, enabled: true, content: '', deletable: true };
            const slots = this._config.slots;
            const cmIdx = slots.findIndex(s => s.type === 'current_message');
            if (cmIdx !== -1) slots.splice(cmIdx, 0, slot);
            else slots.push(slot);
            return slot;
        },

        deleteSlot(id) {
            const idx = this._config.slots.findIndex(s => s.id === id);
            if (idx === -1 || !this._config.slots[idx].deletable) return false;
            this._config.slots.splice(idx, 1);
            return true;
        },

        buildMessages(userMsg, history, charSvc, pSvc, { skipCurrentMessage = false } = {}) {
            const msgs = [];
            const sep = this._config.separator || '\n\n';
            let sysParts = [];
            const flush = () => {
                if (!sysParts.length) return;
                msgs.push({ role: 'system', content: sysParts.join(sep) });
                sysParts = [];
            };
            for (const s of this._config.slots) {
                if (!s.enabled) continue;
                switch (s.type) {
                    case 'custom':            { const t = s.content?.trim(); if (t) sysParts.push(t); break; }
                    case 'character_system':  { const sp = charSvc.activeCharacter?.systemPrompt?.trim(); if (sp) sysParts.push(sp); break; }
                    case 'character_details': { const d = charSvc.getMatchedDetailText?.(userMsg); if (d) sysParts.push(d); break; }
                    case 'persona':           { const pp = pSvc.getPersonaPrompt?.(); if (pp) sysParts.push(pp); break; }
                    case 'history':           flush(); msgs.push(...history); break;
                    case 'current_message':   if (!skipCurrentMessage) { flush(); msgs.push({ role: 'user', content: userMsg }); } break;
                }
            }
            flush();
            return msgs;
        }
    };
}

const charStub = (sp = 'Sys', details = []) => ({
    activeCharacter: { systemPrompt: sp, details },
    getMatchedDetailText: (msg) => {
        if (!details.length || !msg) return null;
        const lower = msg.toLowerCase();
        const matched = details.filter(d => d.keywords.some(kw => lower.includes(kw.toLowerCase())));
        if (!matched.length) return null;
        return '[추가 설정]\n' + matched.map(d => `[${d.keywords.join('/')}]\n${d.content}`).join('\n\n');
    }
});
const personaStub = (p = '') => ({ getPersonaPrompt: () => p });
const hist = (n = 2) => Array.from({ length: n }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: `m${i}` }));

// ─────────────────────────────────────────
describe('buildMessages — default pipeline', () => {
    it('기본 순서: system → history → current_message', () => {
        const svc = makeService();
        const msgs = svc.buildMessages('hello', hist(2), charStub(), personaStub());
        expect(msgs[0].role).toBe('system');
        expect(msgs[1].content).toBe('m0'); // history[0]
        expect(msgs[2].content).toBe('m1'); // history[1]
        expect(msgs[3].role).toBe('user');
        expect(msgs[3].content).toBe('hello'); // current_message
    });

    it('인접 시스템 슬롯은 하나의 system 메시지로 합쳐진다', () => {
        const svc = makeService();
        const msgs = svc.buildMessages('hi', [], charStub('SysA'), personaStub('PersonaB'));
        const sysMsgs = msgs.filter(m => m.role === 'system');
        expect(sysMsgs).toHaveLength(1);
        expect(sysMsgs[0].content).toContain('SysA');
        expect(sysMsgs[0].content).toContain('PersonaB');
    });

    it('history가 없을 경우 system → current_message', () => {
        const svc = makeService();
        const msgs = svc.buildMessages('hi', [], charStub('S'), personaStub());
        expect(msgs[0].role).toBe('system');
        expect(msgs[1].content).toBe('hi');
    });

    it('skipCurrentMessage=true 시 현재 메시지 제외', () => {
        const svc = makeService();
        const h = hist(2);
        const msgs = svc.buildMessages('new', h, charStub(), personaStub(), { skipCurrentMessage: true });
        expect(msgs[msgs.length - 1].content).toBe('m1'); // ends with history
        expect(msgs.map(m => m.content)).not.toContain('new');
    });
});

describe('buildMessages — slot ordering', () => {
    it('history를 맨 앞으로 옮기면 history가 먼저', () => {
        const svc = makeService();
        const slots = svc._config.slots;
        const hIdx = slots.findIndex(s => s.type === 'history');
        const [hSlot] = slots.splice(hIdx, 1);
        slots.unshift(hSlot);

        const msgs = svc.buildMessages('new', [{ role: 'user', content: 'old' }], charStub('Sys'), personaStub());
        expect(msgs[0].content).toBe('old'); // history first
        expect(msgs[1].role).toBe('system'); // system after history
    });

    it('custom 슬롯을 history 뒤에 배치하면 post-history system 메시지 생성', () => {
        const svc = makeService();
        const slot = svc.addCustomSlot();
        slot.content = '개입 지시문';
        // Place custom slot right after history
        const slots = svc._config.slots;
        const custIdx = slots.findIndex(s => s.id === slot.id);
        const hIdx = slots.findIndex(s => s.type === 'history');
        const [cs] = slots.splice(custIdx, 1);
        slots.splice(hIdx + 1, 0, cs);

        const msgs = svc.buildMessages('hi', [{ role: 'user', content: 'past' }], charStub('S'), personaStub());
        const sysMsgs = msgs.filter(m => m.role === 'system');
        expect(sysMsgs).toHaveLength(2);
        expect(sysMsgs[1].content).toContain('개입 지시문');
    });

    it('character_details 키워드 매칭 결과가 포함된다', () => {
        const svc = makeService();
        const char = charStub('Sys', [{ keywords: ['마법'], content: '마법 세계관' }]);
        const msgs = svc.buildMessages('마법 써줘', [], char, personaStub());
        expect(msgs[0].content).toContain('마법 세계관');
    });
});

describe('buildMessages — disabled slots', () => {
    it('character_system 비활성화 시 해당 내용 제외', () => {
        const svc = makeService();
        svc._config.slots.find(s => s.type === 'character_system').enabled = false;
        const msgs = svc.buildMessages('hi', [], charStub('ShouldBeGone'), personaStub('Persona'));
        expect(msgs[0].content).not.toContain('ShouldBeGone');
        expect(msgs[0].content).toContain('Persona');
    });

    it('모든 system 슬롯 비활성화 시 system 메시지 없음', () => {
        const svc = makeService();
        ['custom', 'character_system', 'character_details', 'persona'].forEach(type => {
            svc._config.slots.filter(s => s.type === type).forEach(s => { s.enabled = false; });
        });
        const msgs = svc.buildMessages('hi', [], charStub(), personaStub());
        expect(msgs.every(m => m.role !== 'system')).toBe(true);
    });
});

describe('addCustomSlot / deleteSlot', () => {
    it('addCustomSlot — current_message 바로 앞에 삽입', () => {
        const svc = makeService();
        const slot = svc.addCustomSlot('내 블록');
        const slots = svc._config.slots;
        const slotIdx = slots.findIndex(s => s.id === slot.id);
        const cmIdx = slots.findIndex(s => s.type === 'current_message');
        expect(slotIdx).toBe(cmIdx - 1);
    });

    it('addCustomSlot — enabled, deletable, type=custom', () => {
        const svc = makeService();
        const slot = svc.addCustomSlot();
        expect(slot.enabled).toBe(true);
        expect(slot.deletable).toBe(true);
        expect(slot.type).toBe('custom');
    });

    it('deleteSlot — deletable 슬롯 삭제 성공', () => {
        const svc = makeService();
        const slot = svc.addCustomSlot();
        expect(svc.deleteSlot(slot.id)).toBe(true);
        expect(svc._config.slots.find(s => s.id === slot.id)).toBeUndefined();
    });

    it('deleteSlot — non-deletable 슬롯 삭제 실패', () => {
        const svc = makeService();
        expect(svc.deleteSlot('character_system')).toBe(false);
        expect(svc.deleteSlot('history')).toBe(false);
        expect(svc.deleteSlot('current_message')).toBe(false);
    });

    it('deleteSlot — 없는 ID는 false', () => {
        const svc = makeService();
        expect(svc.deleteSlot('nonexistent_id')).toBe(false);
    });

    it('커스텀 슬롯 content가 buildMessages에 반영된다', () => {
        const svc = makeService();
        const slot = svc.addCustomSlot();
        slot.content = '항상 친절하게 답변하세요';
        const msgs = svc.buildMessages('hi', [], charStub(''), personaStub(''));
        expect(msgs.some(m => m.role === 'system' && m.content.includes('항상 친절하게 답변하세요'))).toBe(true);
    });
});

describe('separator', () => {
    it('구분자가 시스템 블록 사이에 적용된다', () => {
        const svc = makeService();
        svc._config.separator = '\n---\n';
        const msgs = svc.buildMessages('hi', [], charStub('BlockA'), personaStub('BlockB'));
        expect(msgs[0].content).toContain('\n---\n');
    });
});

describe('DEFAULT_PROMPT_CONFIG 구조', () => {
    it('slots 배열에 history와 current_message가 포함된다', () => {
        const types = DEFAULT_PROMPT_CONFIG.slots.map(s => s.type);
        expect(types).toContain('history');
        expect(types).toContain('current_message');
    });

    it('history는 current_message보다 먼저 위치한다', () => {
        const types = DEFAULT_PROMPT_CONFIG.slots.map(s => s.type);
        expect(types.indexOf('history')).toBeLessThan(types.indexOf('current_message'));
    });

    it('non-deletable 슬롯: history, current_message, character_system, character_details, persona', () => {
        const nonDeletable = DEFAULT_PROMPT_CONFIG.slots.filter(s => !s.deletable).map(s => s.type);
        expect(nonDeletable).toContain('history');
        expect(nonDeletable).toContain('current_message');
        expect(nonDeletable).toContain('character_system');
    });
});
