/**
 * Claude Provider
 * Implements Anthropic Messages API.
 * 
 * Note: Uses 'anthropic-dangerous-direct-browser-access' header
 * for browser-based CORS access (officially supported by Anthropic).
 */
import { BaseProvider } from './base-provider.js';
import { log } from '../../utils/logger.js';

const DEFAULT_BASE_URL = 'https://api.anthropic.com/v1';
const API_VERSION = '2023-06-01';

export class ClaudeProvider extends BaseProvider {
    constructor(apiKey, model = 'claude-sonnet-4-20250514', baseUrl = DEFAULT_BASE_URL) {
        super();
        this.name = 'Claude';
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl.replace(/\/+$/, '');
    }

    /**
     * List available models
     * Anthropic doesn't have a public model listing endpoint,
     * so we return a curated list.
     * @returns {Promise<Array<{id: string, name: string}>>}
     */
    async listModels() {
        return [
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
            { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
        ];
    }

    /**
     * Generate a response using Anthropic Messages API
     * @param {Array<{role: string, content: string}>} messages 
     * @returns {Promise<string>}
     */
    async generateResponse(messages) {
        try {
            // Separate system message (Anthropic uses a dedicated 'system' parameter)
            const systemMessage = messages.find(m => m.role === 'system');
            const chatMessages = messages
                .filter(m => m.role !== 'system')
                .map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                }));

            const body = {
                model: this.model,
                messages: chatMessages,
                max_tokens: 2048,
                temperature: 0.7
            };

            // Add system instruction if present
            if (systemMessage) {
                body.system = systemMessage.content;
            }

            const response = await fetch(`${this.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': API_VERSION,
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            // Extract text from response
            if (data.content && data.content[0] && data.content[0].text) {
                return data.content[0].text;
            } else {
                throw new Error('Invalid response structure from Anthropic API');
            }

        } catch (err) {
            log(`Claude API Error: ${err.message}`, 'error');
            throw err;
        }
    }

    /**
     * Test the connection
     */
    async testConnection() {
        try {
            log('Testing Claude connection...', 'info');
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
