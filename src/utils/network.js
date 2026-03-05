/**
 * Network Utilities
 * Provides fetch with timeout, offline detection, and network status banner.
 */
import { log } from './logger.js';

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Fetch with AbortController timeout.
 * Wraps native fetch to prevent indefinite hanging on network failures.
 * @param {string} url - Request URL
 * @param {Object} [options={}] - Fetch options
 * @param {number} [timeoutMs=30000] - Timeout in ms
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    if (!navigator.onLine) {
        throw new NetworkError('네트워크에 연결되어 있지 않습니다. 인터넷 연결을 확인해주세요.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new NetworkError('요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.');
        }
        if (!navigator.onLine) {
            throw new NetworkError('네트워크 연결이 끊어졌습니다.');
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Custom error class for network-related failures.
 */
export class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}

// ── Offline Banner ──

let offlineBanner = null;

/**
 * Initialize network status monitoring.
 * Shows/hides an offline banner based on connectivity.
 */
export function initNetworkMonitor() {
    // Create the offline banner element
    offlineBanner = document.getElementById('offline-banner');
    if (!offlineBanner) {
        offlineBanner = document.createElement('div');
        offlineBanner.id = 'offline-banner';
        offlineBanner.className = 'offline-banner hidden';
        offlineBanner.innerHTML = '⚠️ 네트워크 연결이 끊어져 있습니다. 일부 기능이 제한될 수 있습니다.';
        document.body.prepend(offlineBanner);
    }

    window.addEventListener('online', () => {
        offlineBanner.classList.add('hidden');
        log('Network connection restored.', 'success');
    });

    window.addEventListener('offline', () => {
        offlineBanner.classList.remove('hidden');
        log('Network connection lost.', 'warning');
    });

    // Set initial state
    if (!navigator.onLine) {
        offlineBanner.classList.remove('hidden');
    }

    log('Network monitor initialized.', 'info');
}
