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

/**
 * Default Prompt Pipeline Config
 *
 * slot types:
 *   'custom'           — user-editable text block (has `content`, `deletable: true`)
 *   'character_system' — auto: character.systemPrompt
 *   'character_details'— auto: keyword-triggered details
 *   'persona'          — auto: active persona description
 *   'history'          — special: conversation message history array
 *   'current_message'  — special: current user input
 *
 * Built-in auto/special slots are non-deletable.
 * Custom slots are deletable and freely reorderable.
 */
export const DEFAULT_PROMPT_CONFIG = {
    separator: '\n\n',
    slots: [
        { id: 'meta',             type: 'custom',           label: '메타 프롬프트',          enabled: false, content: '', deletable: true  },
        { id: 'character_system', type: 'character_system', label: '캐릭터 시스템 프롬프트', enabled: true,              deletable: false },
        { id: 'character_details',type: 'character_details',label: '키워드 트리거 세부 설정', enabled: true,              deletable: false },
        { id: 'persona',          type: 'persona',          label: '유저 페르소나',           enabled: true,              deletable: false },
        { id: 'history',          type: 'history',          label: '대화 히스토리',           enabled: true,              deletable: false },
        { id: 'format_hint',      type: 'custom',           label: '대화 형식 지정자',        enabled: false, content: '', deletable: true  },
        { id: 'current_message',  type: 'current_message',  label: '현재 유저 메시지',        enabled: true,              deletable: false },
    ]
};
