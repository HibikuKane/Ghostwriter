/**
 * Settings Controller
 * Manages the Settings Modal and API Key persistence.
 */
import { llmService } from '../llm/llm.service.js';
import { log } from '../utils/logger.js';
import { characterService } from '../persona/character.service.js';
import { readStatusFile, updateSettings } from '../drive/drive.service.js';
import { STORAGE_KEYS } from '../config.js';
import { showChat } from './chat.controller.js';

// DOM Elements
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const apiKeyInput = document.getElementById('api-key-input');
const providerSelect = document.getElementById('provider-select');
const modelSelect = document.getElementById('model-select');
const characterSelect = document.getElementById('character-select');
const refreshModelsBtn = document.getElementById('refresh-models-btn');
const testConnectionBtn = document.getElementById('test-connection-btn');

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

    // Event Listeners
    if (settingsBtn) settingsBtn.onclick = openSettings;
    if (closeSettingsBtn) closeSettingsBtn.onclick = closeSettings;
    if (saveSettingsBtn) saveSettingsBtn.onclick = saveSettings;
    if (testConnectionBtn) testConnectionBtn.onclick = testConnection;
    if (refreshModelsBtn) refreshModelsBtn.onclick = () => refreshModels(apiKeyInput.value, modelSelect.value);

    // Close on click outside
    window.onclick = (event) => {
        if (event.target == settingsModal) {
            closeSettings();
        }
    }
}

/**
 * Load settings from Google Drive (called after authentication)
 */
export async function loadSettingsFromDrive() {
    try {
        const statusFile = await readStatusFile();
        if (statusFile && statusFile.settings) {
            const settings = statusFile.settings;

            if (settings.apiKey) {
                apiKeyInput.value = settings.apiKey;

                // Update localStorage with synced settings
                if (settings.provider) localStorage.setItem(STORAGE_KEYS.PROVIDER, settings.provider);
                if (settings.model) localStorage.setItem(STORAGE_KEYS.MODEL, settings.model);
                if (settings.character) localStorage.setItem(STORAGE_KEYS.CHARACTER, settings.character);

                // Update UI
                if (settings.provider) providerSelect.value = settings.provider;
                if (settings.character) {
                    characterSelect.value = settings.character;
                    characterService.setActiveCharacter(settings.character);
                }

                // Initialize service
                llmService.setProvider(
                    settings.provider || 'gemini',
                    settings.apiKey,
                    settings.model || 'gemini-1.5-flash'
                );

                // Try to fetch models
                if ((settings.provider || 'gemini') === 'gemini') {
                    refreshModels(settings.apiKey, settings.model);
                }

                log('Settings loaded from Google Drive', 'success');

                // Auto-show chat if settings loaded successfully
                const initBtn = document.getElementById('init-btn');
                if (initBtn) {
                    initBtn.innerText = 'Initialization Complete';
                    initBtn.disabled = true;
                }
                showChat();
            }
        }
    } catch (err) {
        log('Failed to load settings from Google Drive: ' + err.message, 'error');
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

        llmService.setProvider('gemini', apiKey);

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
            if (currentModel && models.find(m => m.id === currentModel)) {
                modelSelect.value = currentModel;
            } else {
                // Prefer flash or pro if available
                const preferred = models.find(m => m.id.includes('flash')) || models[0];
                modelSelect.value = preferred.id;
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
        const settings = {
            apiKey: key,
            provider: provider,
            model: model,
            character: characterId
        };

        // Save to Google Drive
        await updateSettings(settings);

        // Also save to localStorage for quick access
        localStorage.setItem(STORAGE_KEYS.PROVIDER, provider);
        localStorage.setItem(STORAGE_KEYS.MODEL, model);
        localStorage.setItem(STORAGE_KEYS.CHARACTER, characterId);

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
