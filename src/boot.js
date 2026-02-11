/**
 * Ghostwriter Boot Script
 * Entry point for the application.
 */
import { initAuth } from './auth/auth.service.js';
import { initUI } from './ui/ui.controller.js';
import { log } from './utils/logger.js';

document.addEventListener('DOMContentLoaded', () => {
    log('System booting...', 'info');

    // Initialize UI handlers
    initUI();

    // Initialize Authentication
    initAuth();
});
