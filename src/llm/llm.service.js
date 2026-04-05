/**
 * LLM Service
 * Singleton service to manage the active LLM provider.
 */
import { GeminiProvider } from './providers/gemini.provider.js';
import { OpenAIProvider } from './providers/openai.provider.js';
import { ClaudeProvider } from './providers/claude.provider.js';
import { log } from '../utils/logger.js';
import { DEFAULT_MODEL_PARAMS } from '../config.js';

class LLMService {
    constructor() {
        this.provider = null;
        this.modelParams = { ...DEFAULT_MODEL_PARAMS };
    }

    /**
     * Update model generation parameters (temperature, maxTokens, topP).
     * @param {Partial<typeof DEFAULT_MODEL_PARAMS>} params
     */
    setModelParams(params) {
        this.modelParams = { ...this.modelParams, ...params };
        log(`Model params updated: temp=${this.modelParams.temperature}, maxTokens=${this.modelParams.maxTokens}, topP=${this.modelParams.topP}`, 'info');
    }

    /**
     * Initialize the provider with configuration
     * @param {string} providerName - 'gemini' | 'openai' | 'claude' | 'custom'
     * @param {string} apiKey 
     * @param {string} model 
     * @param {Object} [options] - Additional options (e.g. { baseUrl, format })
     */
    setProvider(providerName, apiKey, model, options = {}) {
        switch (providerName) {
            case 'gemini':
                this.provider = new GeminiProvider(apiKey, model);
                break;
            case 'openai':
                this.provider = new OpenAIProvider(apiKey, model);
                break;
            case 'claude':
                this.provider = new ClaudeProvider(apiKey, model);
                break;
            case 'custom': {
                const { baseUrl, format } = options;
                if (!baseUrl) {
                    log('Custom provider requires a base URL', 'error');
                    return;
                }
                // Reuse existing provider classes based on format
                switch (format) {
                    case 'anthropic':
                        this.provider = new ClaudeProvider(apiKey, model, baseUrl);
                        this.provider.name = 'Custom (Anthropic)';
                        break;
                    case 'gemini':
                        this.provider = new GeminiProvider(apiKey, model);
                        // Gemini provider uses constructed URLs, override baseUrl
                        this.provider.baseUrl = baseUrl;
                        this.provider.name = 'Custom (Gemini)';
                        break;
                    case 'openai':
                    default:
                        this.provider = new OpenAIProvider(apiKey, model, baseUrl);
                        this.provider.name = 'Custom (OpenAI)';
                        break;
                }
                break;
            }
            default:
                log(`Unknown provider: ${providerName}`, 'error');
                return;
        }
        log(`LLM Provider set to: ${this.provider.name} (model: ${model})`, 'info');
    }

    /**
     * Generate text
     * @param {Array} messages 
     * @returns {Promise<string>}
     */
    /**
     * Generate text
     * @param {Array} messages 
     * @returns {Promise<string>}
     */
    async generate(messages) {
        if (!this.provider) {
            throw new Error('No LLM Provider configured.');
        }

        // Emit Generation Start
        this._emit('generation_start', { messages });

        const startTime = Date.now();
        try {
            const response = await this.provider.generateResponse(messages, this.modelParams);
            const duration = Date.now() - startTime;

            // Emit Generation End (Mocking token usage for now if not provided)
            this._emit('generation_end', {
                response,
                duration,
                tokenUsage: {
                    input: messages.reduce((acc, m) => acc + m.content.length / 4, 0), // Estimate
                    output: response.length / 4
                }
            });

            return response;
        } catch (error) {
            this._emit('generation_error', { error });
            throw error;
        }
    }

    async testConnection() {
        if (!this.provider) return false;
        return await this.provider.testConnection();
    }

    async listModels() {
        if (!this.provider || typeof this.provider.listModels !== 'function') return [];
        return await this.provider.listModels();
    }

    /**
     * Subscribe to LLM events
     * @param {string} event - 'generation_start' | 'generation_end' | 'generation_error'
     * @param {Function} callback 
     */
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    _emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}

export const llmService = new LLMService();
// Initialize listeners map
llmService.listeners = {};
