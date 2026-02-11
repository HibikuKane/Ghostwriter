/**
 * Gemini Provider
 * Implements Google Gemini API integration.
 */
import { BaseProvider } from './base-provider.js';
import { log } from '../../utils/logger.js';

export class GeminiProvider extends BaseProvider {
    constructor(apiKey, model = 'gemini-1.5-flash') {
        super();
        this.name = 'Gemini';
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = `https://generativelanguage.googleapis.com/v1beta`;
    }

    /**
     * List available models
     * @returns {Promise<Array<{name: string, displayName: string}>>}
     */
    async listModels() {
        try {
            const url = `${this.baseUrl}/models?key=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) throw new Error(data.error.message);

            // Filter for models that support generateContent
            return data.models
                .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                .map(m => ({
                    id: m.name.replace('models/', ''),
                    name: m.displayName
                }));
        } catch (err) {
            log(`Error listing models: ${err.message}`, 'error');
            return [];
        }
    }

    /**
     * Generate a response from Gemini
     * @param {Array<{role: string, content: string}>} messages 
     * @returns {Promise<string>}
     */
    async generateResponse(messages) {
        try {
            const contents = this._formatMessages(messages);
            const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    }
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            // Extract text from response
            if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response structure from Gemini API');
            }

        } catch (err) {
            log(`Gemini API Error: ${err.message}`, 'error');
            throw err;
        }
    }

    /**
     * Test the connection by sending a simple "Hello"
     */
    async testConnection() {
        try {
            log('Testing Gemini connection...', 'info');
            const response = await this.generateResponse([{ role: 'user', content: 'Hello' }]);
            return !!response; // Success if we got a response
        } catch (err) {
            log(`Connection Test Failed: ${err.message}`, 'error');
            return false;
        }
    }

    /**
     * Convert internal message format to Gemini format
     * Internal: { role: 'user'|'assistant'|'system', content: '...' }
     * Gemini: { role: 'user'|'model', parts: [{ text: '...' }] }
     */
    _formatMessages(messages) {
        return messages.map(msg => {
            // Map 'assistant' to 'model' for Gemini
            let role = msg.role;
            if (role === 'assistant') role = 'model';
            // Gemini doesn't strictly support 'system' in the same way as OpenAI in `contents`,
            // but for now we'll treat system as user or model instruction or use systemInstruction field in future.
            // For simple chat, mapping system->user is often a safe fallback or just separate it.
            // Let's keep it simple: map 'system' to 'user' with a prefix for now, or ignore if using systemInstruction.

            return {
                role: role === 'system' ? 'user' : role,
                parts: [{ text: msg.content }]
            };
        });
    }
}
