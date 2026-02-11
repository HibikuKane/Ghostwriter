/**
 * Base Provider Class
 * Defines the interface that all LLM providers must implement.
 */
export class BaseProvider {
    constructor(config = {}) {
        this.config = config;
        this.name = 'BaseProvider';
    }

    /**
     * Generate a response from the LLM
     * @param {Array<{role: string, content: string}>} messages - The chat history
     * @returns {Promise<string>} The generated text response
     */
    async generateResponse(messages) {
        throw new Error('Method "generateResponse" must be implemented');
    }

    /**
     * Test the connection to the API
     * @returns {Promise<boolean>} True if connection is successful
     */
    async testConnection() {
        throw new Error('Method "testConnection" must be implemented');
    }
}
