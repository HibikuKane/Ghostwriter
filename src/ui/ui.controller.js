/**
 * UI Controller
 * Manages DOM elements and event listeners.
 */
import { signIn, signOut } from '../auth/auth.service.js';
import { initSettings } from './settings.controller.js';
import { initChat, showChat } from './chat.controller.js';

// DOM Elements
const authBtn = document.getElementById('auth-btn');
const signoutBtn = document.getElementById('signout-btn');
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loadingScreen = document.getElementById('loading-screen');
const settingsToggle = document.getElementById('settings-toggle');

/**
 * Initialize UI Components
 */
export function initUI() {
    // Init logger output
    const loggerOutput = document.getElementById('logger-output');
    if (loggerOutput) {
        window.loggerElement = loggerOutput;
    }

    if (authBtn) authBtn.onclick = signIn;
    if (signoutBtn) signoutBtn.onclick = signOut;

    // Settings Modal
    initSettings();

    // Chat Interface
    initChat();
}

/**
 * Update UI based on authentication state
 * @param {boolean} isAuthenticated 
 */
export function updateUIState(isAuthenticated) {
    if (isAuthenticated) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        showLoadingScreen();
    } else {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        hideLoadingScreen();
        hideSettingsButton();
    }
}

/**
 * Show loading screen
 */
export function showLoadingScreen() {
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
}

/**
 * Hide loading screen
 */
export function hideLoadingScreen() {
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

/**
 * Show floating settings button (when API key exists)
 */
export function showSettingsButton() {
    if (settingsToggle) {
        settingsToggle.classList.remove('hidden');
    }
}

/**
 * Hide floating settings button
 */
export function hideSettingsButton() {
    if (settingsToggle) {
        settingsToggle.classList.add('hidden');
    }
}
