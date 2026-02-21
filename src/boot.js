/**
 * Ghostwriter Boot Script
 * Entry point for the application.
 */
import { initAuth } from './auth/auth.service.js';
import { initUI } from './ui/ui.controller.js';
import { initCharacterList } from './ui/character.controller.js';
import { initSessionToolbar } from './ui/session.controller.js';
import { initPersonaUI } from './ui/persona.controller.js';
import { log } from './utils/logger.js';

document.addEventListener('DOMContentLoaded', () => {
    log('System booting...', 'info');

    // Initialize UI handlers
    initUI();

    // Initialize Character List
    initCharacterList();

    // Initialize Session Toolbar
    initSessionToolbar();

    // Initialize Persona UI
    initPersonaUI();

    // Initialize Authentication
    initAuth();

    // Initialize DevTools
    import('./ui/devtools.js').then(module => {
        new module.DevTools();
        log('DevTools initialized.', 'success');
    });
});

