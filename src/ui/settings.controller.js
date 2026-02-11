/**
 * Settings Controller
 * Manages the Settings Modal and API Key persistence.
 */
import { llmService } from '../llm/llm.service.js';
import { log } from '../utils/logger.js';
import { characterService } from '../persona/character.service.js';

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

export function initSettings() {
    // Load saved settings
    const savedKey = localStorage.getItem('ghostwriter_api_key');
    const savedProvider = localStorage.getItem('ghostwriter_provider') || 'gemini';
    const savedModel = localStorage.getItem('ghostwriter_model');
    const savedCharacter = localStorage.getItem('ghostwriter_character') || 'ghostwriter';

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

    if (savedKey) {
        apiKeyInput.value = savedKey;
        // Initialize service if key exists
        llmService.setProvider(savedProvider, savedKey, savedModel || 'gemini-1.5-flash');

        // Try to verify/fetch models silently if key exists
        if (savedProvider === 'gemini') {
            refreshModels(savedKey, savedModel);
        }
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

async function refreshModels(apiKey, currentModel) {
    if (!apiKey) {
        alert('Please enter an API Key first.');
        return;
    }

    try {
        refreshModelsBtn.disabled = true;
        refreshModelsBtn.innerText = 'Refreshing...';
        modelSelect.disabled = true;

        // Temporarily init service to fetch models (hacky but works for now)
        // Ideally checking models shouldn't require setting the provider globally, 
        // but our llmService wrapper is simple.
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

    if (!key) {
        alert('Please enter an API Key.');
        return;
    }

    // Save to local storage (Security Note: basic implementation)
    localStorage.setItem('ghostwriter_api_key', key);
    localStorage.setItem('ghostwriter_provider', provider);
    localStorage.setItem('ghostwriter_model', model);

    // Initialize service
    try {
        llmService.setProvider(provider, key, model);
        log(`Settings saved. Provider: ${provider}, Model: ${model}`, 'success');
        closeSettings();
    } catch (err) {
        log('Error initializing LLM: ' + err.message, 'error');
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

        // Temporarily set provider just for test if not saved yet
        // Actually, just ease:
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
