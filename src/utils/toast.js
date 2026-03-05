/**
 * Toast Notification System
 * Provides non-blocking in-app toast notifications.
 * Replaces native alert() for better UX.
 */

let toastContainer = null;

/**
 * Initialize the toast container. (auto-called)
 */
function ensureContainer() {
    if (toastContainer) return;
    toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

/**
 * Show a toast notification.
 * @param {string} message - Message to display
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - Toast type
 * @param {number} [duration=3000] - Display duration (ms)
 */
export function showToast(message, type = 'info', duration = 3000) {
    ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
        toast.classList.add('toast-show');
    });

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, duration);
}
