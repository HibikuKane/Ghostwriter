/**
 * Settings Controller
 * Manages the Settings Modal and API Key persistence.
 */
import { llmService } from '../llm/llm.service.js';
import { promptConfigService } from '../llm/prompt-config.service.js';
import { log } from '../utils/logger.js';
import { characterService } from '../persona/character.service.js';
import { personaService } from '../persona/persona.service.js';
import { readStatusFile, updateSettings } from '../drive/drive.service.js';
import { STORAGE_KEYS, DEFAULT_MODEL_PARAMS } from '../config.js';
import { showChat, clearChat } from './chat.controller.js';
import { syncPromptControlUI } from './prompt-control.controller.js';
import { hideLoadingScreen, showSettingsButton } from './ui.controller.js';
import { renderCharacterList } from './character.controller.js';
import { renderPersonaDropdown } from './persona.controller.js';
import { showToast } from '../utils/toast.js';

// DOM Elements - Main Settings Modal
const settingsToggle = document.getElementById('settings-toggle');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeyHint = document.getElementById('api-key-hint');
const providerSelect = document.getElementById('provider-select');
const modelSelect = document.getElementById('model-select');
const refreshModelsBtn = document.getElementById('refresh-models-btn');
const testConnectionBtn = document.getElementById('test-connection-btn');

// DOM Elements - Custom Provider
const customProviderFields = document.getElementById('custom-provider-fields');
const customUrlInput = document.getElementById('custom-url');
const customFormatSelect = document.getElementById('custom-format');
const customModelInput = document.getElementById('custom-model');

// DOM Elements - Model Parameters
const paramTemperature = document.getElementById('param-temperature');
const paramTemperatureValue = document.getElementById('param-temperature-value');
const paramMaxTokens = document.getElementById('param-max-tokens');
const paramMaxTokensValue = document.getElementById('param-max-tokens-value');
const paramTopP = document.getElementById('param-top-p');
const paramTopPValue = document.getElementById('param-top-p-value');
const paramTopPEnabled = document.getElementById('param-top-p-enabled');
const resetParamsBtn = document.getElementById('reset-params-btn');

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

    // Init active character from localStorage
    characterService.setActiveCharacter(savedCharacter);

    providerSelect.value = savedProvider;

    // Event Listeners - Main Settings
    if (settingsToggle) settingsToggle.onclick = openSettings;
    if (closeSettingsBtn) closeSettingsBtn.onclick = closeSettings;
    if (saveSettingsBtn) saveSettingsBtn.onclick = saveSettings;
    if (testConnectionBtn) testConnectionBtn.onclick = testConnection;
    if (refreshModelsBtn) refreshModelsBtn.onclick = () => refreshModels(apiKeyInput.value, modelSelect.value);

    // Provider change handler
    if (providerSelect) {
        providerSelect.addEventListener('change', () => onProviderChange(providerSelect.value));
        // Initialize UI state for current provider
        onProviderChange(savedProvider);
    }

    // Event Listeners - First-Time Setup
    if (firstSaveBtn) firstSaveBtn.onclick = saveFirstTimeSettings;

    // Event Listeners - Model Parameters
    _initModelParamsUI();

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
                if (settings.provider) providerSelect.value = settings.provider;
                if (settings.character) {
                    characterService.setActiveCharacter(settings.character);
                }

                // Restore custom provider fields if applicable
                if (settings.provider === 'custom') {
                    if (customUrlInput && settings.customUrl) customUrlInput.value = settings.customUrl;
                    if (customFormatSelect && settings.customFormat) customFormatSelect.value = settings.customFormat;
                    if (customModelInput && settings.customModel) customModelInput.value = settings.customModel;
                    // Also restore from localStorage as fallback
                } else {
                    // Restore custom fields from localStorage (in case Drive doesn't have them yet)
                    const savedCustomUrl = localStorage.getItem('gw_custom_url');
                    const savedCustomFormat = localStorage.getItem('gw_custom_format');
                    const savedCustomModel = localStorage.getItem('gw_custom_model');
                    if (customUrlInput && savedCustomUrl) customUrlInput.value = savedCustomUrl;
                    if (customFormatSelect && savedCustomFormat) customFormatSelect.value = savedCustomFormat;
                    if (customModelInput && savedCustomModel) customModelInput.value = savedCustomModel;
                }

                // Toggle custom fields UI
                onProviderChange(settings.provider || 'gemini');

                // Determine effective settings (Drive > Local > Default)
                const effectiveProvider = settings.provider || localStorage.getItem(STORAGE_KEYS.PROVIDER) || 'gemini';
                const effectiveModel = settings.model || localStorage.getItem(STORAGE_KEYS.MODEL) || 'gemini-1.5-flash';
                const effectiveKey = settings.apiKey;

                // Initialize service
                if (effectiveProvider === 'custom') {
                    const customUrl = settings.customUrl || localStorage.getItem('gw_custom_url') || '';
                    const customFormat = settings.customFormat || localStorage.getItem('gw_custom_format') || 'openai';
                    llmService.setProvider('custom', effectiveKey, effectiveModel, {
                        baseUrl: customUrl,
                        format: customFormat
                    });
                } else {
                    llmService.setProvider(effectiveProvider, effectiveKey, effectiveModel);
                }

                // Update Model Select UI to reflect effective model
                if (modelSelect.options.length > 0) {
                    modelSelect.value = effectiveModel;
                }

                // Try to fetch models (skip for custom)
                if (effectiveProvider !== 'custom') {
                    refreshModels(effectiveKey, effectiveModel);
                }

                // Restore model params
                if (settings.modelParams) {
                    llmService.setModelParams(settings.modelParams);
                    _applyModelParamsToUI(settings.modelParams);
                }

                // Restore prompt config
                if (settings.promptConfig) {
                    promptConfigService.setConfig(settings.promptConfig);
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
        showToast('API 키를 먼저 입력해주세요.', 'warning');
        return;
    }

    const provider = providerSelect.value;

    // Custom provider doesn't support refresh
    if (provider === 'custom') {
        log('Custom provider: use the model name field instead', 'info');
        return;
    }

    try {
        refreshModelsBtn.disabled = true;
        refreshModelsBtn.innerText = 'Refreshing...';
        modelSelect.disabled = true;

        llmService.setProvider(provider, apiKey, currentModel);

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

            // Re-select current model if available
            if (currentModel && models.find(m => m.id === currentModel)) {
                modelSelect.value = currentModel;
            } else {
                // Pick first model as default
                const preferred = models.find(m => m.id.includes('flash')) || models[0];
                modelSelect.value = preferred.id;
            }

            llmService.setProvider(provider, apiKey, modelSelect.value);
        }

    } catch (err) {
        log('Error refreshing models: ' + err.message, 'error');
    } finally {
        refreshModelsBtn.disabled = false;
        refreshModelsBtn.innerText = '🔄 Refresh Models';
        modelSelect.disabled = false;
    }
}

/**
 * Handle provider dropdown change — toggle custom fields, update hints
 */
function onProviderChange(provider) {
    const isCustom = provider === 'custom';

    // Toggle custom fields visibility
    if (customProviderFields) {
        customProviderFields.classList.toggle('hidden', !isCustom);
    }

    // Toggle model select & refresh for custom (user types model name instead)
    if (isCustom) {
        modelSelect.closest('.form-group').classList.add('hidden');
        refreshModelsBtn.closest('.form-group')?.classList.add('hidden');
    } else {
        modelSelect.closest('.form-group').classList.remove('hidden');
    }
}

function openSettings() {
    settingsModal.classList.remove('hidden');
    syncPromptControlUI();
}

function closeSettings() {
    settingsModal.classList.add('hidden');
}

async function saveSettings() {
    const key = apiKeyInput.value.trim();
    const provider = providerSelect.value;
    const characterId = characterService.activeCharacterId || localStorage.getItem(STORAGE_KEYS.CHARACTER) || 'ghostwriter';

    if (!key) {
        showToast('API 키를 입력해주세요.', 'warning');
        return;
    }

    try {
        // Prepare settings object
        const personaId = personaService.activePersonaId;
        const settings = {
            apiKey: key,
            provider: provider,
            character: characterId,
            persona: personaId
        };

        // Collect model params from UI
        const modelParams = _collectModelParams();
        settings.modelParams = modelParams;

        // Include current prompt config
        settings.promptConfig = promptConfigService.config;

        if (provider === 'custom') {
            // Custom provider settings
            const customUrl = customUrlInput?.value.trim();
            const customFormat = customFormatSelect?.value || 'openai';
            const customModel = customModelInput?.value.trim();

            if (!customUrl) {
                showToast('커스텀 프로바이더에는 URL이 필요합니다.', 'warning');
                return;
            }
            if (!customModel) {
                showToast('커스텀 프로바이더에는 모델명이 필요합니다.', 'warning');
                return;
            }

            settings.model = customModel;
            settings.customUrl = customUrl;
            settings.customFormat = customFormat;
            settings.customModel = customModel;

            llmService.setProvider('custom', key, customModel, {
                baseUrl: customUrl,
                format: customFormat
            });
        } else {
            const model = modelSelect.value;
            settings.model = model;
            llmService.setProvider(provider, key, model);
        }

        llmService.setModelParams(modelParams);

        // Save to Google Drive
        await updateSettings(settings);

        // Also save to localStorage for quick access
        localStorage.setItem(STORAGE_KEYS.PROVIDER, provider);
        localStorage.setItem(STORAGE_KEYS.MODEL, settings.model);
        localStorage.setItem(STORAGE_KEYS.CHARACTER, characterId);
        localStorage.setItem(STORAGE_KEYS.PERSONA, personaId);

        // Save custom settings to localStorage
        if (provider === 'custom') {
            localStorage.setItem('gw_custom_url', settings.customUrl);
            localStorage.setItem('gw_custom_format', settings.customFormat);
            localStorage.setItem('gw_custom_model', settings.customModel);
        }



        log(`Settings saved to Google Drive. Provider: ${provider}`, 'success');
        closeSettings();
    } catch (err) {
        log('Error saving settings: ' + err.message, 'error');
        showToast('설정 저장에 실패했습니다: ' + err.message, 'error');
    }
}

async function testConnection() {
    const key = apiKeyInput.value.trim();
    const provider = providerSelect.value;
    const model = modelSelect.value;

    if (!key) {
        showToast('API 키를 먼저 입력해주세요.', 'warning');
        return;
    }

    try {
        testConnectionBtn.disabled = true;
        testConnectionBtn.innerText = 'Testing...';

        llmService.setProvider(provider, key, model);

        const success = await llmService.provider.testConnection();

        if (success) {
            log('Connection test successful!', 'success');
            showToast('연결에 성공했습니다!', 'success');
        } else {
            throw new Error('Test failed (no response)');
        }
    } catch (err) {
        log('Connection test failed: ' + err.message, 'error');
        showToast('연결 테스트 실패: ' + err.message, 'error');
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
        showToast('API 키를 입력해주세요.', 'warning');
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
        showToast('설정 저장에 실패했습니다: ' + err.message, 'error');
    } finally {
        firstSaveBtn.disabled = false;
        firstSaveBtn.innerText = '저장하고 시작하기';
    }
}

// ========================================
// Model Parameters UI
// ========================================

function _initModelParamsUI() {
    if (!paramTemperature) return;

    // Sync slider → display value
    paramTemperature.addEventListener('input', () => {
        paramTemperatureValue.textContent = Number(paramTemperature.value).toFixed(2);
    });
    paramMaxTokens.addEventListener('input', () => {
        paramMaxTokensValue.textContent = paramMaxTokens.value;
    });
    paramTopP.addEventListener('input', () => {
        paramTopPValue.textContent = paramTopPEnabled.checked
            ? Number(paramTopP.value).toFixed(2)
            : '-';
    });
    paramTopPEnabled.addEventListener('change', () => {
        paramTopP.disabled = !paramTopPEnabled.checked;
        paramTopPValue.textContent = paramTopPEnabled.checked
            ? Number(paramTopP.value).toFixed(2)
            : '-';
    });
    paramTopP.disabled = true; // disabled until checkbox checked

    // Reset button
    if (resetParamsBtn) {
        resetParamsBtn.onclick = () => _applyModelParamsToUI(DEFAULT_MODEL_PARAMS);
    }

    // Apply current LLM service params to UI on open
    _applyModelParamsToUI(llmService.modelParams);
}

/**
 * Apply a modelParams object to the slider UI.
 * @param {{ temperature: number, maxTokens: number, topP: number|null }} params
 */
function _applyModelParamsToUI(params) {
    if (!paramTemperature) return;

    paramTemperature.value = params.temperature ?? DEFAULT_MODEL_PARAMS.temperature;
    paramTemperatureValue.textContent = Number(paramTemperature.value).toFixed(2);

    paramMaxTokens.value = params.maxTokens ?? DEFAULT_MODEL_PARAMS.maxTokens;
    paramMaxTokensValue.textContent = paramMaxTokens.value;

    const hasTopP = params.topP != null;
    paramTopPEnabled.checked = hasTopP;
    paramTopP.disabled = !hasTopP;
    paramTopP.value = params.topP ?? 1;
    paramTopPValue.textContent = hasTopP ? Number(paramTopP.value).toFixed(2) : '-';
}

/**
 * Collect modelParams from the slider UI.
 * @returns {{ temperature: number, maxTokens: number, topP: number|null }}
 */
function _collectModelParams() {
    if (!paramTemperature) return { ...DEFAULT_MODEL_PARAMS };

    return {
        temperature: parseFloat(paramTemperature.value),
        maxTokens: parseInt(paramMaxTokens.value, 10),
        topP: paramTopPEnabled.checked ? parseFloat(paramTopP.value) : null,
    };
}
