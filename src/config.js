/**
 * Configuration Constants
 */

export const SCOPES = 'https://www.googleapis.com/auth/drive.file';
export const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
export const FOLDER_NAME = 'Ghostwriter_Data';

/**
 * Get the Google Client ID from the global scope (loaded via secrets.js)
 * @returns {string}
 */
export function getClientId() {
    if (!window.GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID not found. Make sure secrets.js is loaded.');
        return '';
    }
    return window.GOOGLE_CLIENT_ID;
}
