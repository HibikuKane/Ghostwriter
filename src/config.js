/**
 * Configuration Constants
 */

export const SCOPES = 'https://www.googleapis.com/auth/drive.file';
export const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
export const FOLDER_NAME = 'Ghostwriter_Data';

/**
 * Google OAuth Client ID
 * NOTE: Client IDs are NOT secrets — they are public identifiers.
 * Google restricts usage to Authorized JavaScript Origins only.
 */
const GOOGLE_CLIENT_ID = '802635867565-52bbemk7gut7qhfrvql2to0valavulon.apps.googleusercontent.com';

export function getClientId() {
    return GOOGLE_CLIENT_ID;
}

/**
 * Storage Keys (localStorage)
 */
export const STORAGE_KEYS = {
    PROVIDER: 'ghostwriter_provider',
    MODEL: 'ghostwriter_model',
    CHARACTER: 'ghostwriter_character',
    PERSONA: 'ghostwriter_persona',
    MODEL_PARAMS: 'ghostwriter_model_params',
    PROMPT_CONFIG: 'ghostwriter_prompt_config'
};

export const DEFAULT_MODEL_PARAMS = {
    temperature: 0.7,
    maxTokens: 2048,
    topP: null  // null = use API default
};

export const DEFAULT_PROMPT_CONFIG = {
    separator: '\n\n',
    elements: [
        { id: 'meta',             label: '메타 프롬프트',          enabled: false, content: '' },
        { id: 'character_system', label: '캐릭터 시스템 프롬프트', enabled: true  },
        { id: 'character_details',label: '키워드 트리거 세부 설정', enabled: true  },
        { id: 'persona',          label: '유저 페르소나',           enabled: true  },
        { id: 'format_hint',      label: '대화 형식 지정자',        enabled: false, content: '' },
    ]
};
