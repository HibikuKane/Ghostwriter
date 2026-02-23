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
    PERSONA: 'ghostwriter_persona'
};
