/**
 * OpenAI Provider
 * Implements OpenAI Chat Completions API.
 * Also compatible with: Grok, DeepSeek, Ollama, vLLM, llama.cpp, etc.
 * 
 * baseUrl can be overridden for custom endpoints.
 */
import { BaseProvider, classifyApiError } from './base-provider.js';
import { log } from '../../utils/logger.js';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export class OpenAIProvider extends BaseProvider {
    constructor(apiKey, model = 'gpt-4o-mini', baseUrl = DEFAULT_BASE_URL) {
        super();
        this.name = 'OpenAI';
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl.replace(/\/+$/, ''); // Trim trailing slashes
    }

    /**
     * List available models
     * @returns {Promise<Array<{id: string, name: string}>>}
     */
    async listModels() {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            const data = await response.json();

            if (data.error) throw new Error(data.error.message);

            // Filter for chat models and sort by id
            const models = (data.data || [])
                .filter(m => m.id && !m.id.includes('embedding') && !m.id.includes('whisper') && !m.id.includes('tts') && !m.id.includes('dall-e'))
                .map(m => ({
                    id: m.id,
                    name: m.id
                }))
                .sort((a, b) => a.id.localeCompare(b.id));

            return models;
        } catch (err) {
            log(`Error listing OpenAI models: ${err.message}`, 'error');
            return [];
        }
    }

    /**
     * Generate a response using Chat Completions API
     * @param {Array<{role: string, content: string}>} messages 
     * @returns {Promise<string>}
     */
    async generateResponse(messages, params = {}) {
        try {
            // OpenAI format uses 'assistant' directly (matches our internal format)
            const formattedMessages = messages.map(msg => ({
                role: msg.role, // system, user, assistant — all supported natively
                content: msg.content
            }));

            const body = {
                model: this.model,
                messages: formattedMessages,
                temperature: params.temperature ?? 0.7,
                max_tokens: params.maxTokens ?? 2048,
            };
            if (params.topP != null) body.top_p = params.topP;

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw classifyApiError(response);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            } else {
                throw new Error('Invalid response structure from OpenAI-compatible API');
            }

        } catch (err) {
            const classified = classifyApiError(null, err);
            log(`${this.name} 오류: ${classified.message}`, 'error');
            throw classified;
        }
    }

    /**
     * Test the connection
     */
    async testConnection() {
        try {
            log('Testing OpenAI connection...', 'info');
            const response = await this.generateResponse([
                { role: 'user', content: 'Hello' }
            ]);
            return !!response;
        } catch (err) {
            log(`Connection Test Failed: ${err.message}`, 'error');
            return false;
        }
    }
}
