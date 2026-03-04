/**
 * Auth Service
 * Manages Google Identity Services (GIS) and GAPI authentication.
 */
import { SCOPES, DISCOVERY_DOC, getClientId, STORAGE_KEYS } from '../config.js';
import { log } from '../utils/logger.js';
import { updateUIState } from '../ui/ui.controller.js';
import { loadSettingsFromDrive } from '../ui/settings.controller.js';
import { storageManager } from '../memory/storage.manager.js';
import { createWorkspace } from '../drive/drive.service.js';

let tokenClient;
let gapiInited = false;
let gisInited = false;

/**
 * Initialize the Auth Service
 */
export function initAuth() {
    // Load GAPI script
    const script = document.createElement('script');
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    discoveryDocs: [DISCOVERY_DOC],
                });
                gapiInited = true;
                log('GAPI initialized.', 'success');
                checkInitComplete();
            } catch (err) {
                log('Error initializing GAPI: ' + JSON.stringify(err), 'error');
            }
        });
    };
    document.body.appendChild(script);

    // Load GIS script
    const gisScript = document.createElement('script');
    gisScript.src = "https://accounts.google.com/gsi/client";
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: getClientId(),
            scope: SCOPES,
            callback: async (resp) => {
                if (resp.error !== undefined) {
                    throw (resp);
                }
                log('Token received. User authenticated.', 'success');
                updateUIState(true);

                // Auto-initialize workspace
                try {
                    await createWorkspace();
                    await storageManager.init();
                    log('Attempting to load settings from Drive...', 'info');
                    await loadSettingsFromDrive();
                } catch (err) {
                    log('Error initializing app data: ' + err.message, 'error');
                    console.error('Full error:', err);
                }
            },
        });
        gisInited = true;
        log('GIS initialized.', 'success');
        checkInitComplete();
    };
    document.body.appendChild(gisScript);
}

function checkInitComplete() {
    if (gapiInited && gisInited) {
        // Ready for interaction
    }
}

/**
 * Trigger Login Flow
 */
export function signIn() {
    if (!tokenClient) {
        log('Auth not initialized yet.', 'error');
        return;
    }
    tokenClient.requestAccessToken();
}

/**
 * Trigger Logout Flow
 */
export function signOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        clearLocalStorage();
        log('User signed out.', 'info');
        updateUIState(false);
    }
}

/**
 * Clear Ghostwriter-related localStorage keys on sign out.
 * API keys are stored only on Drive, but provider/model/character
 * preferences are cleared to prevent leaking usage info on shared PCs.
 */
function clearLocalStorage() {
    const keysToRemove = [
        STORAGE_KEYS.PROVIDER,
        STORAGE_KEYS.MODEL,
        STORAGE_KEYS.CHARACTER,
        STORAGE_KEYS.PERSONA,
        'gw_custom_url',
        'gw_custom_format',
        'gw_custom_model',
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    log('로컬 저장소 정리 완료.', 'info');
}
