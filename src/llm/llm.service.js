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
    async generate(messages) {
        if (!this.provider) {
            throw new Error('No LLM Provider configured.');
        }
        return await this.provider.generateResponse(messages);
    }

    async testConnection() {
        if (!this.provider) return false;
        return await this.provider.testConnection();
    }

    async listModels() {
        if (!this.provider || typeof this.provider.listModels !== 'function') return [];
        return await this.provider.listModels();
    }
}

export const llmService = new LLMService();
