/**
 * In-App Tooltip System
 * Handles click-to-show tooltip popups for '?' guide buttons.
 *
 * Usage pattern in HTML:
 *   <span class="tooltip-wrap">
 *     <button class="tooltip-btn" type="button" aria-label="도움말">?</button>
 *     <div class="tooltip-popup hidden" role="tooltip">설명 텍스트</div>
 *   </span>
 */

/**
 * Initialize the global tooltip click handler.
 * Call once at boot — handles all current and future .tooltip-btn elements.
 */
export function initTooltips() {
    document.addEventListener('click', _onDocumentClick);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') _hideAll();
    });
}

function _onDocumentClick(e) {
    const btn = e.target.closest('.tooltip-btn');

    if (btn) {
        e.stopPropagation();
        const popup = btn.closest('.tooltip-wrap')?.querySelector('.tooltip-popup');
        if (!popup) return;

        const isVisible = !popup.classList.contains('hidden');
        _hideAll();
        if (!isVisible) popup.classList.remove('hidden');
        return;
    }

    // Click outside any tooltip → hide all
    if (!e.target.closest('.tooltip-popup')) {
        _hideAll();
    }
}

function _hideAll() {
    document.querySelectorAll('.tooltip-popup:not(.hidden)').forEach(t => {
        t.classList.add('hidden');
    });
}
