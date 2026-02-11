/**
 * UI Controller
 * Manages DOM elements and event listeners.
 */
import { signIn, signOut } from '../auth/auth.service.js';
import { createWorkspace } from '../drive/drive.service.js';

// DOM Elements
const authBtn = document.getElementById('auth-btn');
const signoutBtn = document.getElementById('signout-btn');
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const initBtn = document.getElementById('init-btn');

/**
 * Initialize UI Event Listeners
 */
export function initUI() {
    if (authBtn) authBtn.onclick = signIn;
    if (signoutBtn) signoutBtn.onclick = signOut;
    if (initBtn) initBtn.onclick = handleInitClick;
}

/**
 * Update UI based on authentication state
 * @param {boolean} isAuthenticated 
 */
export function updateUIState(isAuthenticated) {
    if (isAuthenticated) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
    } else {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
}

/**
 * Handle Initialization Button Click
 */
async function handleInitClick() {
    if (initBtn) initBtn.disabled = true;

    const success = await createWorkspace();

    if (success && initBtn) {
        initBtn.innerText = "Initialization Complete";
    } else if (initBtn) {
        initBtn.disabled = false;
    }
}
