/**
 * Prompt Control Controller
 * Manages the "프롬프트" tab in the Settings modal.
 * Allows reordering, toggling, and editing prompt elements.
 */
import { promptConfigService } from '../llm/prompt-config.service.js';
import { characterService } from '../persona/character.service.js';
import { personaService } from '../persona/persona.service.js';
import { DEFAULT_PROMPT_CONFIG } from '../config.js';
import { log } from '../utils/logger.js';

// DOM Elements
const elementsList = document.getElementById('prompt-elements-list');
const separatorSelect = document.getElementById('prompt-separator-select');
const previewBtn = document.getElementById('preview-prompt-btn');
const previewPanel = document.getElementById('prompt-preview');
const previewContent = document.getElementById('prompt-preview-content');
const resetConfigBtn = document.getElementById('reset-prompt-config-btn');
const saveConfigBtn = document.getElementById('save-prompt-config-btn');

// IDs of elements that have editable content fields
const EDITABLE_IDS = new Set(['meta', 'format_hint']);

/**
 * Initialize the Prompt Control UI.
 * Call this from boot.js after other inits.
 */
export function initPromptControl() {
    if (!elementsList) return;

    if (previewBtn) previewBtn.onclick = _showPreview;
    if (resetConfigBtn) resetConfigBtn.onclick = _resetConfig;
    if (saveConfigBtn) saveConfigBtn.onclick = _saveConfig;

    if (separatorSelect) {
        separatorSelect.addEventListener('change', () => {
            promptConfigService.config.separator = separatorSelect.value;
        });
    }

    _renderElements();
    log('Prompt control initialized', 'info');
}

/**
 * Sync the UI to the current promptConfigService state.
 * Call this when opening the settings modal.
 */
export function syncPromptControlUI() {
    if (!elementsList) return;
    _renderElements();
    if (separatorSelect) separatorSelect.value = promptConfigService.config.separator || '\n\n';
    if (previewPanel) previewPanel.classList.add('hidden');
}

// -----------------------------------------------------------------------
// Internal: render / reorder / edit
// -----------------------------------------------------------------------

function _renderElements() {
    if (!elementsList) return;
    elementsList.innerHTML = '';

    const elements = promptConfigService.config.elements;
    elements.forEach((el, idx) => {
        const li = _buildElementItem(el, idx, elements.length);
        elementsList.appendChild(li);
    });
}

function _buildElementItem(el, idx, total) {
    const li = document.createElement('li');
    li.className = 'prompt-element-item';
    li.dataset.id = el.id;

    // ── Checkbox ──
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = el.enabled;
    checkbox.id = `pe-check-${el.id}`;
    checkbox.addEventListener('change', () => {
        el.enabled = checkbox.checked;
        // Toggle content editor visibility
        const editor = li.querySelector('.pe-content-wrap');
        if (editor) editor.classList.toggle('hidden', !el.enabled || !EDITABLE_IDS.has(el.id));
    });

    // ── Label ──
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.className = 'pe-label';
    label.textContent = el.label;

    // ── Order buttons ──
    const orderWrap = document.createElement('span');
    orderWrap.className = 'pe-order-btns';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'pe-order-btn';
    upBtn.textContent = '▲';
    upBtn.title = '위로';
    upBtn.disabled = idx === 0;
    upBtn.onclick = () => _moveElement(idx, -1);

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'pe-order-btn';
    downBtn.textContent = '▼';
    downBtn.title = '아래로';
    downBtn.disabled = idx === total - 1;
    downBtn.onclick = () => _moveElement(idx, 1);

    orderWrap.appendChild(upBtn);
    orderWrap.appendChild(downBtn);

    // ── Row assembly ──
    const row = document.createElement('div');
    row.className = 'pe-row';
    row.appendChild(checkbox);
    row.appendChild(label);
    row.appendChild(orderWrap);
    li.appendChild(row);

    // ── Editable content (only for meta / format_hint) ──
    if (EDITABLE_IDS.has(el.id)) {
        const wrap = document.createElement('div');
        wrap.className = 'pe-content-wrap' + ((!el.enabled) ? ' hidden' : '');

        const textarea = document.createElement('textarea');
        textarea.className = 'pe-content-textarea';
        textarea.rows = 3;
        textarea.placeholder = el.id === 'meta'
            ? '시스템 프롬프트 앞에 삽입될 메타 지시문을 입력하세요.'
            : '대화 형식 힌트 (예: "다음은 롤플레잉 형식의 대화입니다.")';
        textarea.value = el.content || '';
        textarea.addEventListener('input', () => { el.content = textarea.value; });

        wrap.appendChild(textarea);
        li.appendChild(wrap);
    }

    return li;
}

function _moveElement(idx, dir) {
    const elements = promptConfigService.config.elements;
    const target = idx + dir;
    if (target < 0 || target >= elements.length) return;
    [elements[idx], elements[target]] = [elements[target], elements[idx]];
    _renderElements();
}

function _showPreview() {
    if (!previewPanel || !previewContent) return;
    const text = promptConfigService.buildPreview(characterService, personaService);
    previewContent.textContent = text;
    previewPanel.classList.remove('hidden');
    previewPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function _resetConfig() {
    promptConfigService.setConfig(JSON.parse(JSON.stringify(DEFAULT_PROMPT_CONFIG)));
    syncPromptControlUI();
    log('Prompt config reset to defaults', 'info');
}

function _saveConfig() {
    // Persist separator from select
    if (separatorSelect) {
        promptConfigService.config.separator = separatorSelect.value;
    }
    log('Prompt config saved (in-memory — persists via Settings save)', 'info');
    // Actual Drive persist happens when the user clicks "Save & Close" in Settings tab.
    // Show a brief visual confirmation.
    if (saveConfigBtn) {
        const orig = saveConfigBtn.textContent;
        saveConfigBtn.textContent = '✓ 적용됨';
        saveConfigBtn.disabled = true;
        setTimeout(() => {
            saveConfigBtn.textContent = orig;
            saveConfigBtn.disabled = false;
        }, 1500);
    }
}
