/**
 * Markdown Utility
 * Renders markdown text to sanitized HTML using marked + DOMPurify (loaded via CDN).
 * Returns null if marked is unavailable (caller should fall back to innerText).
 */

/**
 * Render markdown text to sanitized HTML.
 * @param {string} text - Raw markdown text
 * @returns {string|null} Sanitized HTML string, or null if marked is not loaded
 */
export function renderMarkdown(text) {
    if (typeof marked === 'undefined') return null;

    const html = marked.parse(text);

    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html);
    }

    return html;
}
