/**
 * i18n Service
 * Lightweight internationalization for Ghostwriter UI.
 *
 * Usage:
 *   - Add `data-i18n="key"` to set element textContent
 *   - Add `data-i18n-placeholder="key"` to set input placeholder
 *   - Add `data-i18n-title="key"` to set element title attribute
 *   - Call `i18n.applyToDOM()` after locale change (or on boot)
 *   - Use `i18n.t(key)` in JS code for dynamic strings
 */
import { ko } from './locales/ko.js';
import { en } from './locales/en.js';
import { ja } from './locales/ja.js';

const LOCALES = { ko, en, ja };
const STORAGE_KEY = 'ghostwriter_lang';
const DEFAULT_LANG = 'ko';

export const SUPPORTED_LANGS = [
    { code: 'ko', label: '한국어' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
];

export class I18nService {
    constructor() {
        this._lang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    }

    get lang() {
        return this._lang;
    }

    /**
     * Translate a key. Falls back to key itself if not found.
     * @param {string} key
     * @returns {string}
     */
    t(key) {
        return LOCALES[this._lang]?.[key] ?? LOCALES[DEFAULT_LANG]?.[key] ?? key;
    }

    /**
     * Switch language and apply to DOM.
     * @param {string} lang - 'ko' | 'en' | 'ja'
     */
    setLang(lang) {
        if (!LOCALES[lang]) return;
        this._lang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        this.applyToDOM();
    }

    /**
     * Scan the DOM and apply translations to elements with data-i18n* attributes.
     * No-op in non-browser environments.
     */
    applyToDOM() {
        if (typeof document === 'undefined') return;

        // Text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const val = this.t(key);
            // Preserve child nodes (e.g. badge spans inside labels)
            if (el.children.length === 0) {
                el.textContent = val;
            } else {
                // Only replace the first text node
                for (const node of el.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        node.textContent = val;
                        break;
                    }
                }
            }
        });

        // Placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = this.t(el.dataset.i18nPlaceholder);
        });

        // Title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = this.t(el.dataset.i18nTitle);
        });
    }
}

export const i18n = new I18nService();
