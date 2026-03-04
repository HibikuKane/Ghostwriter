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

/**
 * Classify API errors into user-friendly Korean messages.
 * Maps HTTP status codes and network errors to descriptive messages.
 * 
 * @param {Response|null} response - The fetch Response object (null for network errors)
 * @param {Error|null} rawError - The original error
 * @returns {Error} A classified error with a user-friendly message
 */
export function classifyApiError(response, rawError) {
    // Network / fetch failure (no response object)
    if (!response || typeof response.status !== 'number') {
        if (rawError?.message?.includes('Failed to fetch') || rawError?.name === 'TypeError') {
            return new Error('인터넷 연결을 확인해주세요.');
        }
        return rawError || new Error('알 수 없는 오류가 발생했습니다.');
    }

    // HTTP status code classification
    switch (response.status) {
        case 401:
            return new Error('API 키가 유효하지 않습니다. 설정에서 확인해주세요.');
        case 403:
            return new Error('API 접근 권한이 없습니다. API 키를 확인해주세요.');
        case 429:
            return new Error('요청 한도 초과. 잠시 후 다시 시도해주세요.');
        case 500:
        case 502:
        case 503:
            return new Error('AI 서비스에 일시적 문제가 있습니다. 잠시 후 다시 시도해주세요.');
        default:
            return rawError || new Error(`API 오류 (${response.status})`);
    }
}
