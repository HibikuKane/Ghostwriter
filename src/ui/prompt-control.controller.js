/**
 * Prompt Control Controller
 * Manages the "프롬프트" tab in the Settings modal.
 *
 * Features:
 * - Reorder all slots (including history & current_message) with ▲/▼
 * - Toggle enabled/disabled per slot
 * - Inline textarea + label input for custom slots
 * - Add new custom slot / delete existing custom slot
 * - Preview assembled pipeline
 * - Separator selector
 */
import { promptConfigService } from '../llm/prompt-config.service.js';
import { characterService } from '../persona/character.service.js';
import { personaService } from '../persona/persona.service.js';
import { DEFAULT_PROMPT_CONFIG } from '../config.js';
import { log } from '../utils/logger.js';

// DOM
const elementsList   = document.getElementById('prompt-elements-list');
const separatorSel   = document.getElementById('prompt-separator-select');
const previewBtn     = document.getElementById('preview-prompt-btn');
const previewPanel   = document.getElementById('prompt-preview');
const previewContent = document.getElementById('prompt-preview-content');
const resetBtn       = document.getElementById('reset-prompt-config-btn');
const saveBtn        = document.getElementById('save-prompt-config-btn');
const addSlotBtn     = document.getElementById('add-prompt-slot-btn');

// Slot types with editable textarea
const EDITABLE_TYPES = new Set(['custom']);
// Slot types that are structural markers in the pipeline
const STRUCTURAL_TYPES = new Set(['history', 'current_message']);

export function initPromptControl() {
    if (!elementsList) return;

    if (previewBtn)  previewBtn.onclick  = _showPreview;
    if (resetBtn)    resetBtn.onclick    = _resetConfig;
    if (saveBtn)     saveBtn.onclick     = _saveConfig;
    if (addSlotBtn)  addSlotBtn.onclick  = _addCustomSlot;

    if (separatorSel) {
        separatorSel.addEventListener('change', () => {
            promptConfigService.config.separator = separatorSel.value;
        });
    }

    _renderSlots();
    log('Prompt control initialized', 'info');
}

/**
 * Sync UI to current promptConfigService state.
 * Call this each time the settings modal opens.
 */
export function syncPromptControlUI() {
    if (!elementsList) return;
    _renderSlots();
    if (separatorSel) separatorSel.value = promptConfigService.config.separator || '\n\n';
    if (previewPanel) previewPanel.classList.add('hidden');
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function _renderSlots() {
    if (!elementsList) return;
    elementsList.innerHTML = '';
    const slots = promptConfigService.config.slots;
    slots.forEach((slot, idx) => {
        elementsList.appendChild(_buildSlotItem(slot, idx, slots.length));
    });
}

function _buildSlotItem(slot, idx, total) {
    const isStructural = STRUCTURAL_TYPES.has(slot.type);

    const li = document.createElement('li');
    li.className = 'prompt-element-item' + (isStructural ? ' pe-structural' : '');
    li.dataset.id = slot.id;

    // ── Row ──
    const row = document.createElement('div');
    row.className = 'pe-row';

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = slot.enabled;
    checkbox.id = `pe-chk-${slot.id}`;
    checkbox.addEventListener('change', () => {
        slot.enabled = checkbox.checked;
        const wrap = li.querySelector('.pe-content-wrap');
        if (wrap) wrap.classList.toggle('hidden', !slot.enabled);
    });

    // Label
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.className = 'pe-label' + (isStructural ? ' pe-label-structural' : '');
    label.textContent = slot.label;

    // Non-deletable badge
    if (!slot.deletable) {
        const badge = document.createElement('span');
        badge.className = 'pe-badge';
        badge.textContent = isStructural ? ' ◈' : ' ⊙';
        badge.title = isStructural ? '파이���라인 구조 슬롯' : '기본 슬롯 (삭제 불가)';
        label.appendChild(badge);
    }

    // Order + delete buttons
    const orderWrap = document.createElement('span');
    orderWrap.className = 'pe-order-btns';

    const upBtn = document.createElement('button');
    upBtn.type = 'button'; upBtn.className = 'pe-order-btn';
    upBtn.textContent = '▲'; upBtn.title = '위로';
    upBtn.disabled = idx === 0;
    upBtn.onclick = () => _moveSlot(idx, -1);

    const downBtn = document.createElement('button');
    downBtn.type = 'button'; downBtn.className = 'pe-order-btn';
    downBtn.textContent = '▼'; downBtn.title = '아래로';
    downBtn.disabled = idx === total - 1;
    downBtn.onclick = () => _moveSlot(idx, 1);

    orderWrap.append(upBtn, downBtn);

    if (slot.deletable) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button'; delBtn.className = 'pe-delete-btn';
        delBtn.textContent = '×'; delBtn.title = '슬롯 삭제';
        delBtn.onclick = () => {
            if (promptConfigService.deleteSlot(slot.id)) _renderSlots();
        };
        orderWrap.appendChild(delBtn);
    }

    row.append(checkbox, label, orderWrap);
    li.appendChild(row);

    // Editable content area (custom slots)
    if (EDITABLE_TYPES.has(slot.type)) {
        const wrap = document.createElement('div');
        wrap.className = 'pe-content-wrap' + (!slot.enabled ? ' hidden' : '');

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.className = 'pe-label-input';
        labelInput.placeholder = '슬롯 이름';
        labelInput.value = slot.label;
        labelInput.addEventListener('input', () => {
            slot.label = labelInput.value;
            // Reflect in the label element (preserve badge node)
            label.firstChild.textContent = labelInput.value;
        });

        const textarea = document.createElement('textarea');
        textarea.className = 'pe-content-textarea';
        textarea.rows = 3;
        textarea.placeholder = '이 위치에 삽입될 프롬프트 텍스트를 입력하세요.';
        textarea.value = slot.content || '';
        textarea.addEventListener('input', () => { slot.content = textarea.value; });

        wrap.append(labelInput, textarea);
        li.appendChild(wrap);
    }

    return li;
}

// ── Actions ───────────────────────────────────────────────────────────────────

function _moveSlot(idx, dir) {
    const slots = promptConfigService.config.slots;
    const target = idx + dir;
    if (target < 0 || target >= slots.length) return;
    [slots[idx], slots[target]] = [slots[target], slots[idx]];
    _renderSlots();
}

function _addCustomSlot() {
    promptConfigService.addCustomSlot();
    _renderSlots();
    // Scroll to the new slot (inserted before current_message)
    const items = elementsList.querySelectorAll('.prompt-element-item');
    const newItem = items[items.length - 2] ?? items[items.length - 1];
    newItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function _showPreview() {
    if (!previewPanel || !previewContent) return;
    if (!previewPanel.classList.contains('hidden')) {
        previewPanel.classList.add('hidden');
        return;
    }
    previewContent.textContent = promptConfigService.buildPreview(characterService, personaService);
    previewPanel.classList.remove('hidden');
    previewPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function _resetConfig() {
    promptConfigService.setConfig(JSON.parse(JSON.stringify(DEFAULT_PROMPT_CONFIG)));
    syncPromptControlUI();
}

function _saveConfig() {
    if (separatorSel) promptConfigService.config.separator = separatorSel.value;
    if (!saveBtn) return;
    const orig = saveBtn.textContent;
    saveBtn.textContent = '✓ 적용됨';
    saveBtn.disabled = true;
    setTimeout(() => { saveBtn.textContent = orig; saveBtn.disabled = false; }, 1500);
    log('Prompt config applied (persists on Settings save)', 'info');
}
