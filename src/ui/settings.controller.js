/**
 * Settings Controller
 * Manages the Settings Modal and API Key persistence.
 */
import { llmService } from '../llm/llm.service.js';
import { log } from '../utils/logger.js';
import { characterService } from '../persona/character.service.js';
import { personaService } from '../persona/persona.service.js';
import { readStatusFile, updateSettings } from '../drive/drive.service.js';
import { STORAGE_KEYS } from '../config.js';
import { showChat, clearChat } from './chat.controller.js';
import { hideLoadingScreen, showSettingsButton } from './ui.controller.js';
import { renderCharacterList } from './character.controller.js';
import { renderPersonaDropdown } from './persona.controller.js';

// DOM Elements - Main Settings Modal
const settingsToggle = document.getElementById('settings-toggle');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const apiKeyInput = document.getElementById('api-key-input');
const providerSelect = document.getElementById('provider-select');
const modelSelect = document.getElementById('model-select');
const characterSelect = document.getElementById('character-select');
const refreshModelsBtn = document.getElementById('refresh-models-btn');
const testConnectionBtn = document.getElementById('test-connection-btn');

// DOM Elements - First-Time Setup Modal
const firstSetupModal = document.getElementById('first-setup-modal');
const firstProviderSelect = document.getElementById('first-provider-select');
const firstApiKeyInput = document.getElementById('first-api-key-input');
const firstSaveBtn = document.getElementById('first-save-btn');

export async function initSettings() {
    // Load saved settings from localStorage (non-sensitive)
    const savedProvider = localStorage.getItem(STORAGE_KEYS.PROVIDER) || 'gemini';
    const savedModel = localStorage.getItem(STORAGE_KEYS.MODEL);
    const savedCharacter = localStorage.getItem(STORAGE_KEYS.CHARACTER) || 'ghostwriter';

    // Init Character Select
    if (characterSelect) {
        characterSelect.innerHTML = '';
        characterService.characters.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.text = c.name;
            characterSelect.add(opt);
        });
        characterSelect.value = savedCharacter;
        characterService.setActiveCharacter(savedCharacter);
    }

    providerSelect.value = savedProvider;

    // Event Listeners - Main Settings
    if (settingsToggle) settingsToggle.onclick = openSettings;
    if (closeSettingsBtn) closeSettingsBtn.onclick = closeSettings;
    if (saveSettingsBtn) saveSettingsBtn.onclick = saveSettings;
    if (testConnectionBtn) testConnectionBtn.onclick = testConnection;
    if (refreshModelsBtn) refreshModelsBtn.onclick = () => refreshModels(apiKeyInput.value, modelSelect.value);

    // Event Listeners - First-Time Setup
    if (firstSaveBtn) firstSaveBtn.onclick = saveFirstTimeSettings;

    // Close on click outside
    window.onclick = (event) => {
        if (event.target == settingsModal) {
            closeSettings();
        }
        if (event.target == firstSetupModal) {
            // Don't allow closing first setup modal by clicking outside
            // User must complete setup
        }
    }
}

/**
 * Load settings from Google Drive (called after authentication)
 */
export async function loadSettingsFromDrive() {
    log('loadSettingsFromDrive() called', 'info');
    try {
        const statusFile = await readStatusFile();
        log(`statusFile received: ${statusFile ? 'yes' : 'no'}`, 'info');
        if (statusFile && statusFile.settings) {
            const settings = statusFile.settings;
            log(`Settings found in status file: ${JSON.stringify(Object.keys(settings))}`, 'info');

            if (settings.apiKey) {
                apiKeyInput.value = settings.apiKey;

                // Update localStorage with synced settings
                if (settings.provider) localStorage.setItem(STORAGE_KEYS.PROVIDER, settings.provider);
                if (settings.model) localStorage.setItem(STORAGE_KEYS.MODEL, settings.model);
                if (settings.character) localStorage.setItem(STORAGE_KEYS.CHARACTER, settings.character);

                // Update UI
                // Update UI
                if (settings.provider) providerSelect.value = settings.provider;
                if (settings.character) {
                    characterSelect.value = settings.character;
                    characterService.setActiveCharacter(settings.character);
                }

                // Determine effective settings (Drive > Local > Default)
                const effectiveProvider = settings.provider || localStorage.getItem(STORAGE_KEYS.PROVIDER) || 'gemini';
                const effectiveModel = settings.model || localStorage.getItem(STORAGE_KEYS.MODEL) || 'gemini-1.5-flash';
                const effectiveKey = settings.apiKey;

                // Initialize service
                llmService.setProvider(
                    effectiveProvider,
                    effectiveKey,
                    effectiveModel
                );

                // Update Model Select UI to reflect effective model
                if (modelSelect.options.length > 0) {
                    modelSelect.value = effectiveModel;
                }

                // Try to fetch models
                if (effectiveProvider === 'gemini') {
                    refreshModels(effectiveKey, effectiveModel);
                }

                log('Settings loaded from Google Drive', 'success');

                // Load characters from Drive and re-render sidebar
                await characterService.loadCharactersFromDrive();
                renderCharacterList();

                // Load personas from Drive and render dropdown
                await personaService.loadPersonasFromDrive();
                if (settings.persona) {
                    personaService.setActivePersona(settings.persona);
                    localStorage.setItem(STORAGE_KEYS.PERSONA, settings.persona);
                }
                renderPersonaDropdown();

                // Refresh greeting to match active character
                clearChat();

                // Hide loading screen and show chat
                hideLoadingScreen();
                showSettingsButton();
                showChat();
            } else {
                log('No API key found in settings', 'warning');
                // Show first-time setup modal
                hideLoadingScreen();
                showFirstSetupModal();
            }
        } else {
            log('No settings found in status file', 'warning');
            // Show first-time setup modal
            hideLoadingScreen();
            showFirstSetupModal();
        }
    } catch (err) {
        log('Failed to load settings from Google Drive: ' + err.message, 'error');
        console.error('loadSettingsFromDrive error:', err);
        // On error, still show first setup modal
        hideLoadingScreen();
        showFirstSetupModal();
    }
}

async function refreshModels(apiKey, currentModel) {
    if (!apiKey) {
        alert('Please enter an API Key first.');
        return;
    }

    try {
        refreshModelsBtn.disabled = true;
        refreshModelsBtn.innerText = 'Refreshing...';
        modelSelect.disabled = true;

        llmService.setProvider('gemini', apiKey, currentModel);

        const models = await llmService.listModels();

        // Clear options
        modelSelect.innerHTML = '';

        if (models.length === 0) {
            const opt = document.createElement('option');
            opt.text = 'No models found (Check Key)';
            modelSelect.add(opt);
        } else {
            models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.text = m.name + ` (${m.id})`;
                modelSelect.add(opt);
            });

            // Re-select current model if available, or default
            // Re-select current model if available, or default
            if (currentModel && (models.find(m => m.id === currentModel) || true)) {
                // We allow selecting the currentModel even if not in the list (e.g. preview models or custom fine-tuned)
                modelSelect.value = currentModel;

                // Ensure the service is using this model (in case setProvider above didn't catch it or logic changed)
                llmService.setProvider('gemini', apiKey, currentModel);
            } else {
                // Prefer flash or pro if available
                const preferred = models.find(m => m.id.includes('flash')) || models[0];
                modelSelect.value = preferred.id;
                llmService.setProvider('gemini', apiKey, preferred.id);
            }
        }

    } catch (err) {
        log('Error refreshing models: ' + err.message, 'error');
    } finally {
        refreshModelsBtn.disabled = false;
        refreshModelsBtn.innerText = '🔄 Refresh Models';
        modelSelect.disabled = false;
    }
}

function openSettings() {
    settingsModal.classList.remove('hidden');
}

function closeSettings() {
    settingsModal.classList.add('hidden');
}

async function saveSettings() {
    const key = apiKeyInput.value.trim();
    const provider = providerSelect.value;
    const model = modelSelect.value;
    const characterId = characterSelect.value;

    if (!key) {
        alert('Please enter an API Key.');
        return;
    }

    try {
        // Prepare settings object
        const personaId = personaService.activePersonaId;
        const settings = {
            apiKey: key,
            provider: provider,
            model: model,
            character: characterId,
            persona: personaId
        };

        // Save to Google Drive
        await updateSettings(settings);

        // Also save to localStorage for quick access
        localStorage.setItem(STORAGE_KEYS.PROVIDER, provider);
        localStorage.setItem(STORAGE_KEYS.MODEL, model);
        localStorage.setItem(STORAGE_KEYS.CHARACTER, characterId);
        localStorage.setItem(STORAGE_KEYS.PERSONA, personaId);

        // Initialize service
        llmService.setProvider(provider, key, model);
        characterService.setActiveCharacter(characterId);

        log(`Settings saved to Google Drive. Character: ${characterId}`, 'success');
        closeSettings();
    } catch (err) {
        log('Error saving settings: ' + err.message, 'error');
        alert('Failed to save settings: ' + err.message);
    }
}

async function testConnection() {
    const key = apiKeyInput.value.trim();
    const provider = providerSelect.value;
    const model = modelSelect.value;

    if (!key) {
        alert('Please enter an API Key first.');
        return;
    }

    try {
        testConnectionBtn.disabled = true;
        testConnectionBtn.innerText = 'Testing...';

        llmService.setProvider(provider, key, model);

        const success = await llmService.provider.testConnection();

        if (success) {
            log('Connection test successful!', 'success');
            alert('Connection successful!');
        } else {
            throw new Error('Test failed (no response)');
        }
    } catch (err) {
        log('Connection test failed: ' + err.message, 'error');
        alert('Connection failed: ' + err.message);
    } finally {
        testConnectionBtn.disabled = false;
        testConnectionBtn.innerText = 'Test Connection';
    }
}

/**
 * Show first-time setup modal
 */
function showFirstSetupModal() {
    if (firstSetupModal) {
        firstSetupModal.classList.remove('hidden');
    }
}

/**
 * Close first-time setup modal
 */
function closeFirstSetupModal() {
    if (firstSetupModal) {
        firstSetupModal.classList.add('hidden');
    }
}

/**
 * Save settings from first-time setup modal
 */
async function saveFirstTimeSettings() {
    const key = firstApiKeyInput.value.trim();
    const provider = firstProviderSelect.value;

    if (!key) {
        alert('API 키를 입력해주세요.');
        return;
    }

    try {
        firstSaveBtn.disabled = true;
        firstSaveBtn.innerText = '저장 중...';

        // Prepare settings with default values
        const settings = {
            apiKey: key,
            provider: provider,
            model: 'gemini-1.5-flash', // Default model
            character: 'ghostwriter' // Default character
        };

        // Save to Google Drive
        await updateSettings(settings);

        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.PROVIDER, provider);
        localStorage.setItem(STORAGE_KEYS.MODEL, settings.model);
        localStorage.setItem(STORAGE_KEYS.CHARACTER, settings.character);

        // Initialize service
        llmService.setProvider(provider, key, settings.model);
        characterService.setActiveCharacter(settings.character);

        // Also update main settings modal fields
        if (apiKeyInput) apiKeyInput.value = key;
        if (providerSelect) providerSelect.value = provider;

        log('Initial API key saved successfully', 'success');

        // Close first-time modal
        closeFirstSetupModal();

        // Show settings button and chat
        showSettingsButton();
        showChat();
    } catch (err) {
        log('Error saving initial settings: ' + err.message, 'error');
        alert('설정 저장에 실패했습니다: ' + err.message);
    } finally {
        firstSaveBtn.disabled = false;
        firstSaveBtn.innerText = '저장하고 시작하기';
    }
}
