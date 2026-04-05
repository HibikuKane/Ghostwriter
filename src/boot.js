/**
 * Ghostwriter Boot Script
 * Entry point for the application.
 */
import { initAuth } from './auth/auth.service.js';
import { initUI } from './ui/ui.controller.js';
import { initCharacterList } from './ui/character.controller.js';
import { initSessionToolbar } from './ui/session.controller.js';
import { initPersonaUI } from './ui/persona.controller.js';
import { initPromptControl } from './ui/prompt-control.controller.js';
import { initNetworkMonitor } from './utils/network.js';
import { initTooltips } from './utils/tooltip.js';
import { log } from './utils/logger.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        log('System booting...', 'info');

        // Initialize UI handlers
        initUI();

        // Initialize In-App Tooltips
        initTooltips();

        // Initialize Character List
        initCharacterList();

        // Initialize Session Toolbar
        initSessionToolbar();

        // Initialize Persona UI
        initPersonaUI();

        // Initialize Prompt Control
        initPromptControl();

        // Initialize Network Monitor
        initNetworkMonitor();

        // Initialize Authentication
        initAuth();

        // Initialize DevTools
        import('./ui/devtools.js').then(module => {
            new module.DevTools();
            log('DevTools initialized.', 'success');
        }).catch(err => {
            console.error('DevTools 로드 실패:', err);
        });
    } catch (err) {
        console.error('Boot error:', err);
        showBootError(err.message);
    }
});

/**
 * Display a user-friendly error screen when boot fails.
 * @param {string} message - Error details
 */
function showBootError(message) {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem; color: #fff;">
                <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">⚠️ 앱을 시작할 수 없습니다</h2>
                <p style="color: #a0a0a0; margin-bottom: 0.5rem;">초기화 중 오류가 발생했습니다.</p>
                <p style="color: #f44336; font-family: monospace; font-size: 0.85rem; margin-bottom: 2rem;">${message}</p>
                <button onclick="location.reload()" style="
                    padding: 0.8rem 2rem; border-radius: 8px; border: none;
                    background: #fff; color: #333; font-weight: 600;
                    font-size: 1rem; cursor: pointer;
                ">다시 시도</button>
                <p style="color: #666; font-size: 0.75rem; margin-top: 2rem;">
                    문제가 지속되면 네트워크 연결을 확인하거나 브라우저 캐시를 삭제해주세요.
                </p>
            </div>`;
    }
}

