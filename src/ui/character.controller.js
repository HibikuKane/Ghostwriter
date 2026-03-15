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

// Callbacks for external integration
let onCharacterSelectCallback = null;

// Modal state
let editingCharacterId = null; // null = create mode, string = edit mode

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
        deleteCharacterBtn.classList.remove('hidden');
    } else {
        characterModalTitle.textContent = '캐릭터 생성';
        charNameInput.value = '';
        charDescInput.value = '';
        charPromptInput.value = '';
        deleteCharacterBtn.classList.add('hidden');
    }

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
}

/**
 * Save character from modal (create or update).
 */
async function saveCharacterFromModal() {
    const name = charNameInput.value.trim();
    const description = charDescInput.value.trim();
    const systemPrompt = charPromptInput.value.trim();

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
                name, description, systemPrompt
            });
            if (updated) {
                await characterService.saveCharacterToDrive(updated);
                log(`✅ Character updated: ${name}`, 'success');
            }
        } else {
            // Create new
            log(`📝 Creating character: ${name}`, 'info');
            const newChar = characterService.addCharacter({
                name, description, systemPrompt
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
