/**
 * LLM Service
 * Singleton service to manage the active LLM provider.
 */
import { GeminiProvider } from './providers/gemini.provider.js';
import { log } from '../utils/logger.js';

class LLMService {
    constructor() {
        this.provider = null;
    }

    /**
     * Initialize the provider with configuration
     * @param {string} providerName - 'gemini'
     * @param {string} apiKey 
     * @param {string} model 
     */
    setProvider(providerName, apiKey, model) {
        if (providerName === 'gemini') {
            this.provider = new GeminiProvider(apiKey, model);
            log(`LLM Provider set to ${providerName}`, 'info');
        } else {
            log(`Unknown provider: ${providerName}`, 'error');
        }
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
            const response = await this.provider.generateResponse(messages);
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
