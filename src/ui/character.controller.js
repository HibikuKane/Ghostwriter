/**
 * Character Controller
 * Manages the Character List sidebar UI and Character CRUD modal.
 * Responsible for rendering, selecting, creating, editing, and deleting characters.
 */
import { characterService, isDefaultCharacter } from '../persona/character.service.js';
import { log } from '../utils/logger.js';
import { loadCharacterSession } from './session.controller.js';
import { showToast } from '../utils/toast.js';

// DOM Elements - Sidebar
const characterList = document.getElementById('character-list');
const addCharacterBtn = document.getElementById('add-character-btn');

// DOM Elements - Modal
const characterModal = document.getElementById('character-modal');
const characterModalTitle = document.getElementById('character-modal-title');
const closeCharacterModal = document.getElementById('close-character-modal');
const charNameInput = document.getElementById('char-name');
const charDescInput = document.getElementById('char-description');
const charPromptInput = document.getElementById('char-system-prompt');
const saveCharacterBtn = document.getElementById('save-character-btn');
const deleteCharacterBtn = document.getElementById('delete-character-btn');

// DOM Elements - Image
const charImageInput = document.getElementById('char-image-input');
const charImageUploadBtn = document.getElementById('char-image-upload-btn');
const charImageClearBtn = document.getElementById('char-image-clear-btn');
const charImagePreview = document.getElementById('char-image-preview');

// Callbacks for external integration
let onCharacterSelectCallback = null;

// Modal state
let editingCharacterId = null;  // null = create mode, string = edit mode
let editingDetails = [];        // working copy of detail entries in modal
let editingImageData = null;    // base64 data URL or null

/**
 * Initialize the character list UI.
 * Renders the default character list and sets up event listeners.
 */
export function initCharacterList() {
    renderCharacterList();

    // "+" button opens create modal
    if (addCharacterBtn) {
        addCharacterBtn.onclick = () => openCharacterModal('create');
    }

    // Modal close button
    if (closeCharacterModal) {
        closeCharacterModal.onclick = closeModal;
    }

    // Save button
    if (saveCharacterBtn) {
        saveCharacterBtn.onclick = saveCharacterFromModal;
    }

    // Delete button
    if (deleteCharacterBtn) {
        deleteCharacterBtn.onclick = deleteCharacterFromModal;
    }

    // Image upload button
    if (charImageUploadBtn) {
        charImageUploadBtn.onclick = () => charImageInput && charImageInput.click();
    }
    if (charImageInput) {
        charImageInput.onchange = onImageSelected;
    }
    if (charImageClearBtn) {
        charImageClearBtn.onclick = clearImage;
    }

    // Detail entry add button
    const addDetailBtn = document.getElementById('add-detail-btn');
    if (addDetailBtn) {
        addDetailBtn.onclick = addDetailEntry;
    }

    // Close modal on backdrop click
    if (characterModal) {
        characterModal.onclick = (e) => {
            if (e.target === characterModal) closeModal();
        };
    }

    log('Character list initialized', 'info');
}

/**
 * Show the character sidebar
 */
export function showCharacterSidebar() {
    const characterSidebar = document.getElementById('character-list-sidebar');
    if (characterSidebar) {
        characterSidebar.classList.remove('hidden');
    }
}

/**
 * Hide the character sidebar
 */
export function hideCharacterSidebar() {
    const characterSidebar = document.getElementById('character-list-sidebar');
    if (characterSidebar) {
        characterSidebar.classList.add('hidden');
    }
}

/**
 * Register a callback for when a character is selected.
 * @param {Function} callback - (characterId) => void
 */
export function onCharacterSelect(callback) {
    onCharacterSelectCallback = callback;
}

/**
 * Render the character list from CharacterService data.
 */
export function renderCharacterList() {
    if (!characterList) return;

    characterList.innerHTML = '';

    const characters = characterService.characters;
    const activeId = characterService.activeCharacterId;

    characters.forEach(character => {
        const li = document.createElement('li');
        li.className = 'character-item' + (character.id === activeId ? ' active' : '');
        li.dataset.characterId = character.id;

        // Avatar image (if set)
        if (character.imageData) {
            const img = document.createElement('img');
            img.className = 'character-avatar';
            img.src = character.imageData;
            img.alt = character.name;
            li.appendChild(img);
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'character-name';
        nameSpan.textContent = character.name;

        const descSpan = document.createElement('span');
        descSpan.className = 'character-desc';
        descSpan.textContent = character.description;

        li.appendChild(nameSpan);
        li.appendChild(descSpan);

        // Action buttons (edit/delete) - only for user-created characters
        if (!isDefaultCharacter(character.id)) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'character-actions';

            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️ 수정';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                openCharacterModal('edit', character.id);
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️ 삭제';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                confirmDeleteCharacter(character.id, character.name);
            };

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            li.appendChild(actionsDiv);
        }

        li.onclick = () => selectCharacter(character.id);

        characterList.appendChild(li);
    });
}

/**
 * Select a character by ID.
 * Updates CharacterService, UI highlight, and fires callback.
 * @param {string} id - Character ID to select
 */
export function selectCharacter(id) {
    characterService.setActiveCharacter(id);
    renderCharacterList(); // Re-render to update active state

    // Auto-load session for selected character (Step 4)
    loadCharacterSession(id);

    if (onCharacterSelectCallback) {
        onCharacterSelectCallback(id);
    }
}

// ========================================
// Modal Functions
// ========================================

/**
 * Open the character modal in create or edit mode.
 * @param {'create'|'edit'} mode
 * @param {string} [characterId] - Required for edit mode
 */
function openCharacterModal(mode, characterId = null) {
    if (!characterModal) return;

    editingCharacterId = null;
    editingDetails = [];
    editingImageData = null;

    if (mode === 'edit' && characterId) {
        const character = characterService.characters.find(c => c.id === characterId);
        if (!character) {
            log(`Character not found for edit: ${characterId}`, 'error');
            return;
        }

        editingCharacterId = characterId;
        characterModalTitle.textContent = '캐릭터 수정';
        charNameInput.value = character.name;
        charDescInput.value = character.description || '';
        charPromptInput.value = character.systemPrompt || '';
        editingDetails = (character.details || []).map(d => ({ ...d, keywords: [...d.keywords] }));
        editingImageData = character.imageData || null;
        deleteCharacterBtn.classList.remove('hidden');
    } else {
        characterModalTitle.textContent = '캐릭터 생성';
        charNameInput.value = '';
        charDescInput.value = '';
        charPromptInput.value = '';
        deleteCharacterBtn.classList.add('hidden');
    }

    _updateImagePreview();
    _renderDetailEntries();
    characterModal.classList.remove('hidden');
    charNameInput.focus();
}

/**
 * Close the character modal.
 */
function closeModal() {
    if (characterModal) {
        characterModal.classList.add('hidden');
    }
    editingCharacterId = null;
    editingDetails = [];
    editingImageData = null;
}

/**
 * Save character from modal (create or update).
 */
async function saveCharacterFromModal() {
    const name = charNameInput.value.trim();
    const description = charDescInput.value.trim();
    const systemPrompt = charPromptInput.value.trim();
    const details = _collectDetailEntries();

    if (!name) {
        showToast('캐릭터 이름을 입력해주세요.', 'warning');
        return;
    }

    saveCharacterBtn.disabled = true;
    saveCharacterBtn.textContent = '저장 중...';

    try {
        if (editingCharacterId) {
            // Update existing
            const updated = characterService.updateCharacter(editingCharacterId, {
                name, description, systemPrompt, details, imageData: editingImageData
            });
            if (updated) {
                await characterService.saveCharacterToDrive(updated);
                log(`✅ Character updated: ${name}`, 'success');
            }
        } else {
            // Create new
            log(`📝 Creating character: ${name}`, 'info');
            const newChar = characterService.addCharacter({
                name, description, systemPrompt, details, imageData: editingImageData
            });
            await characterService.saveCharacterToDrive(newChar);
            log(`✅ Character created: ${name}`, 'success');
        }

        renderCharacterList();
        closeModal();
    } catch (err) {
        log(`Error saving character: ${err.message}`, 'error');
        showToast('캐릭터 저장에 실패했습니다: ' + err.message, 'error');
    } finally {
        saveCharacterBtn.disabled = false;
        saveCharacterBtn.textContent = '저장';
    }
}

/**
 * Delete character from modal.
 */
async function deleteCharacterFromModal() {
    if (!editingCharacterId) return;
    const character = characterService.characters.find(c => c.id === editingCharacterId);
    if (!character) return;

    await confirmDeleteCharacter(editingCharacterId, character.name);
}

/**
 * Confirm and delete a character.
 * @param {string} id - Character ID
 * @param {string} name - Character name (for confirmation message)
 */
async function confirmDeleteCharacter(id, name) {
    if (characterService.characters.length <= 1) {
        showToast('최소 1개의 캐릭터가 필요합니다.', 'warning');
        return;
    }

    const confirmed = confirm(`"${name}" 캐릭터를 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
        log(`🗑️ Deleting character: ${name}`, 'info');
        // Try to delete from Drive (id might be a Drive file ID)
        await characterService.deleteCharacterFromDrive(id);
        characterService.removeCharacter(id);
        renderCharacterList();
        closeModal();
        log(`✅ Character deleted: ${name}`, 'success');
    } catch (err) {
        log(`Error deleting character: ${err.message}`, 'error');
        showToast('캐릭터 삭제에 실패했습니다: ' + err.message, 'error');
    }
}

// ========================================
// Image Handling
// ========================================

function onImageSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        editingImageData = ev.target.result;
        _updateImagePreview();
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
}

function clearImage() {
    editingImageData = null;
    _updateImagePreview();
}

function _updateImagePreview() {
    if (!charImagePreview || !charImageClearBtn) return;

    if (editingImageData) {
        charImagePreview.innerHTML = `<img src="${editingImageData}" alt="아바타 미리보기">`;
        charImagePreview.classList.remove('hidden');
        charImageClearBtn.classList.remove('hidden');
    } else {
        charImagePreview.innerHTML = '';
        charImagePreview.classList.add('hidden');
        charImageClearBtn.classList.add('hidden');
    }
}

// ========================================
// Detail Entries (Keyword Triggers)
// ========================================

function addDetailEntry() {
    editingDetails.push({ id: crypto.randomUUID(), keywords: [], content: '' });
    _renderDetailEntries();
    // Focus the keywords input of the new entry
    const list = document.getElementById('detail-entries-list');
    const lastInput = list.querySelector('.detail-entry:last-child .detail-keywords-input');
    if (lastInput) lastInput.focus();
}

function _renderDetailEntries() {
    const list = document.getElementById('detail-entries-list');
    if (!list) return;

    list.innerHTML = '';

    editingDetails.forEach((entry, idx) => {
        const item = document.createElement('div');
        item.className = 'detail-entry';

        const header = document.createElement('div');
        header.className = 'detail-entry-header';
        header.innerHTML = `<span>항목 ${idx + 1}</span>`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn text detail-remove-btn';
        removeBtn.textContent = '✕ 삭제';
        removeBtn.onclick = () => {
            editingDetails.splice(idx, 1);
            _renderDetailEntries();
        };
        header.appendChild(removeBtn);

        const keywordsLabel = document.createElement('label');
        keywordsLabel.textContent = '키워드 (쉼표로 구분)';
        keywordsLabel.className = 'detail-label';

        const keywordsInput = document.createElement('input');
        keywordsInput.type = 'text';
        keywordsInput.className = 'detail-keywords-input';
        keywordsInput.placeholder = '호무라, 아케미 호무라';
        keywordsInput.value = entry.keywords.join(', ');

        const contentLabel = document.createElement('label');
        contentLabel.textContent = '주입할 내용';
        contentLabel.className = 'detail-label';

        const contentInput = document.createElement('textarea');
        contentInput.className = 'detail-content-input';
        contentInput.rows = 3;
        contentInput.placeholder = '키워드 등장 시 시스템 프롬프트에 추가할 설정을 입력하세요.';
        contentInput.value = entry.content;

        item.appendChild(header);
        item.appendChild(keywordsLabel);
        item.appendChild(keywordsInput);
        item.appendChild(contentLabel);
        item.appendChild(contentInput);
        list.appendChild(item);
    });
}

function _collectDetailEntries() {
    const list = document.getElementById('detail-entries-list');
    if (!list) return [];

    const entries = [];
    list.querySelectorAll('.detail-entry').forEach((entryEl, idx) => {
        const keywordsInput = entryEl.querySelector('.detail-keywords-input');
        const contentInput = entryEl.querySelector('.detail-content-input');
        const keywords = keywordsInput.value.split(',').map(k => k.trim()).filter(k => k);
        const content = contentInput.value.trim();
        if (keywords.length > 0 || content) {
            entries.push({
                id: editingDetails[idx]?.id || crypto.randomUUID(),
                keywords,
                content
            });
        }
    });
    return entries;
}
