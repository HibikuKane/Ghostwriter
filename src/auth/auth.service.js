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

// Token renewal tracking
let tokenIssuedAt = null;
const TOKEN_LIFETIME_MS = 50 * 60 * 1000; // 50 min (actual expiry 60 min, 10 min buffer)
let pendingTokenResolve = null;
let isRefreshingToken = false;

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
                    // If there's a pending token refresh, reject it
                    if (pendingTokenResolve) {
                        pendingTokenResolve.reject(new Error('Token refresh failed: ' + resp.error));
                        pendingTokenResolve = null;
                        isRefreshingToken = false;
                    }
                    throw (resp);
                }

                // Record token issue time
                tokenIssuedAt = Date.now();
                log('Token received. User authenticated.', 'success');

                // If this was a token refresh (not initial login), just resolve
                if (pendingTokenResolve) {
                    log('토큰이 자동으로 갱신되었습니다.', 'info');
                    pendingTokenResolve.resolve();
                    pendingTokenResolve = null;
                    isRefreshingToken = false;
                    return;
                }

                // Initial login flow
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
 * Ensure the current token is valid.
 * If the token has expired or is about to expire, automatically refresh it.
 * @returns {Promise<void>} Resolves when a valid token is available
 */
export async function ensureValidToken() {
    const token = gapi.client.getToken();
    if (!token) {
        throw new Error('인증되지 않은 상태입니다. 다시 로그인해주세요.');
    }

    // Check if token is still fresh
    if (tokenIssuedAt && (Date.now() - tokenIssuedAt) < TOKEN_LIFETIME_MS) {
        return; // Token is still valid
    }

    // Token needs refresh
    if (isRefreshingToken) {
        // Another refresh is already in progress, wait for it
        return new Promise((resolve, reject) => {
            const existingResolve = pendingTokenResolve;
            pendingTokenResolve = {
                resolve: () => {
                    if (existingResolve) existingResolve.resolve();
                    resolve();
                },
                reject: (err) => {
                    if (existingResolve) existingResolve.reject(err);
                    reject(err);
                }
            };
        });
    }

    // Start token refresh
    isRefreshingToken = true;
    log('토큰 만료 감지 — 자동 갱신 중...', 'info');

    return new Promise((resolve, reject) => {
        pendingTokenResolve = { resolve, reject };
        try {
            tokenClient.requestAccessToken({ prompt: '' });
        } catch (err) {
            pendingTokenResolve = null;
            isRefreshingToken = false;
            reject(new Error('토큰 갱신에 실패했습니다: ' + err.message));
        }
    });
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
        tokenIssuedAt = null;
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

