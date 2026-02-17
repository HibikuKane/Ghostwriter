/**
 * Logger Utility
 * Handles output to the on-screen console.
 */
const consoleOutput = document.getElementById('console-output');

/**
 * Log message to on-screen console
 * @param {string} msg - The message to log
 * @param {'info'|'success'|'error'} [type='info'] - The type of log message
 */
export function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    div.innerText = `[${time}] ${msg}`;

    if (consoleOutput) {
        consoleOutput.appendChild(div);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    } else {
        // console.warn('Console output element not found:', msg);
    }

    // Notify subscribers
    subscribers.forEach(cb => cb({ time, msg, type }));
}

/**
 * Subscribe to log events
 * @param {Function} callback 
 */
export function subscribeLog(callback) {
    subscribers.push(callback);
}

const subscribers = [];
