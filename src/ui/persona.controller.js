/**
 * Persona Controller
 * Manages the Persona tab UI within the Settings modal.
 * Handles persona selection, creation, editing, and deletion.
 */
import { personaService, isDefaultPersona } from '../persona/persona.service.js';
import { log } from '../utils/logger.js';
import { STORAGE_KEYS } from '../config.js';
import { readStatusFile, updateSettings } from '../drive/drive.service.js';

// DOM Elements — Tab
const tabBtns = document.querySelectorAll('.modal-tabs .tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

// DOM Elements — Persona Tab
const personaSelect = document.getElementById('persona-select');
const personaName = document.getElementById('persona-name');
const personaDescription = document.getElementById('persona-description');
const personaNote = document.getElementById('persona-note');
const newPersonaBtn = document.getElementById('new-persona-btn');
const savePersonaBtn = document.getElementById('save-persona-btn');
const deletePersonaBtn = document.getElementById('delete-persona-btn');
const personaForm = document.getElementById('persona-form');

// State
let editingPersonaId = null; // null = create mode, string = edit mode

/**
 * Initialize the Persona UI.
 * Sets up tab switching and persona CRUD event listeners.
 */
export function initPersonaUI() {
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Update tab buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update tab panels
            tabPanels.forEach(panel => {
                if (panel.id === targetTab) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            });
        });
    });

    // Persona dropdown change — auto-persist selection
    if (personaSelect) {
        personaSelect.addEventListener('change', () => {
            const selectedId = personaSelect.value;
            personaService.setActivePersona(selectedId);
            loadPersonaIntoForm(selectedId);
            persistActivePersona(selectedId);
        });
    }

    // New persona button
    if (newPersonaBtn) {
        newPersonaBtn.addEventListener('click', () => {
            clearPersonaForm();
        });
    }

    // Save persona button
    if (savePersonaBtn) {
        savePersonaBtn.addEventListener('click', () => {
            savePersonaFromForm();
        });
    }

    // Delete persona button
    if (deletePersonaBtn) {
        deletePersonaBtn.addEventListener('click', () => {
            deletePersona();
        });
    }

    log('Persona UI initialized', 'info');
}

/**
 * Render the persona dropdown from PersonaService data.
 * Called after loading personas from Drive.
 */
export function renderPersonaDropdown() {
    if (!personaSelect) return;

    personaSelect.innerHTML = '';
    personaService.personas.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = isDefaultPersona(p.id)
            ? `${p.name} (기본)`
            : p.name;
        personaSelect.appendChild(option);
    });

    // Set active persona as selected
    personaSelect.value = personaService.activePersonaId;

    // Load active persona into form
    loadPersonaIntoForm(personaService.activePersonaId);
}

/**
 * Load a persona's data into the form fields.
 * @param {string} id - Persona ID
 */
function loadPersonaIntoForm(id) {
    const persona = personaService.personas.find(p => p.id === id);
    if (!persona) return;

    editingPersonaId = id;
    personaName.value = persona.name;
    personaDescription.value = persona.description;
    personaNote.value = persona.note || '';

    // Remove existing notice if present
    removeDefaultNotice();

    // Show/hide delete button (can't delete default)
    if (isDefaultPersona(id)) {
        deletePersonaBtn.classList.add('hidden');
        // Disable form fields for default persona
        personaName.disabled = true;
        personaDescription.disabled = true;
        personaNote.disabled = true;
        savePersonaBtn.disabled = true;
        // Show guidance notice
        showDefaultNotice();
    } else {
        deletePersonaBtn.classList.remove('hidden');
        personaName.disabled = false;
        personaDescription.disabled = false;
        personaNote.disabled = false;
        savePersonaBtn.disabled = false;
    }
}

/**
 * Clear the form for creating a new persona.
 */
function clearPersonaForm() {
    editingPersonaId = null;
    personaName.value = '';
    personaDescription.value = '';
    personaNote.value = '';
    personaName.disabled = false;
    personaDescription.disabled = false;
    personaNote.disabled = false;
    savePersonaBtn.disabled = false;
    deletePersonaBtn.classList.add('hidden');
    removeDefaultNotice();
    personaName.focus();
}

/**
 * Persist the active persona ID to localStorage and Drive status.json.
 * @param {string} personaId
 */
async function persistActivePersona(personaId) {
    // localStorage (instant)
    localStorage.setItem(STORAGE_KEYS.PERSONA, personaId);

    // Drive status.json (async, best-effort)
    try {
        const statusFile = await readStatusFile();
        if (statusFile && statusFile.settings) {
            statusFile.settings.persona = personaId;
            await updateSettings(statusFile.settings);
            log(`Active persona persisted: ${personaId}`, 'info');
        }
    } catch (err) {
        log(`Failed to persist persona to Drive: ${err.message}`, 'error');
    }
}

/**
 * Show a notice when default persona is selected.
 */
function showDefaultNotice() {
    if (!personaForm) return;
    const notice = document.createElement('div');
    notice.id = 'default-persona-notice';
    notice.className = 'persona-notice';
    notice.textContent = '기본 유저 페르소나는 변경할 수 없습니다. "새로 만들기" 버튼으로 새 페르소나를 생성해주세요.';
    personaForm.insertBefore(notice, personaForm.firstChild);
}

/**
 * Remove the default persona notice.
 */
function removeDefaultNotice() {
    const existing = document.getElementById('default-persona-notice');
    if (existing) existing.remove();
}

/**
 * Save persona from form (create or update).
 */
async function savePersonaFromForm() {
    const name = personaName.value.trim();
    if (!name) {
        log('Persona name is required', 'error');
        return;
    }

    const data = {
        name,
        description: personaDescription.value.trim(),
        note: personaNote.value.trim()
    };

    if (editingPersonaId) {
        // Update existing
        const updated = personaService.updatePersona(editingPersonaId, data);
        if (updated) {
            await personaService.savePersonaToDrive(updated);
            renderPersonaDropdown();
        }
    } else {
        // Create new
        const created = personaService.addPersona(data);
        await personaService.savePersonaToDrive(created);
        personaService.setActivePersona(created.id);
        renderPersonaDropdown();
        editingPersonaId = created.id;
    }
}

/**
 * Delete the currently selected persona.
 */
async function deletePersona() {
    if (!editingPersonaId || isDefaultPersona(editingPersonaId)) return;

    const persona = personaService.personas.find(p => p.id === editingPersonaId);
    if (!persona) return;

    const confirmed = confirm(`"${persona.name}" 페르소나를 삭제하시겠습니까?`);
    if (!confirmed) return;

    // Delete from Drive first — find the Drive file by matching persona ID
    try {
        const { storageManager } = await import('../memory/storage.manager.js');
        const driveFiles = await storageManager.listItems('persona');
        if (driveFiles) {
            for (const file of driveFiles) {
                try {
                    const data = await storageManager.loadItem('persona', file.id);
                    if (data && data.id === editingPersonaId) {
                        await personaService.deletePersonaFromDrive(file.id);
                        break;
                    }
                } catch (e) {
                    // Continue searching
                }
            }
        }
    } catch (err) {
        log(`Error deleting persona from Drive: ${err.message}`, 'error');
    }

    // Remove from memory (auto-switches to default if active)
    personaService.removePersona(editingPersonaId);
    renderPersonaDropdown();

    // Persist the fallback (default) to localStorage/Drive so stale ID doesn't survive reload
    await persistActivePersona(personaService.activePersonaId);

    log(`Persona "${persona.name}" deleted`, 'success');
}
