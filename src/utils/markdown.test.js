import { describe, it, expect, afterEach } from 'vitest';
import { renderMarkdown } from './markdown.js';

describe('renderMarkdown', () => {
    afterEach(() => {
        delete global.marked;
        delete global.DOMPurify;
    });

    it('returns null when marked is not available', () => {
        expect(renderMarkdown('**bold**')).toBeNull();
    });

    it('renders markdown using marked when available', () => {
        global.marked = { parse: () => '<p><strong>bold</strong></p>\n' };
        expect(renderMarkdown('**bold**')).toBe('<p><strong>bold</strong></p>\n');
    });

    it('sanitizes output with DOMPurify when available', () => {
        global.marked = { parse: () => '<p>clean</p><script>evil()</script>' };
        global.DOMPurify = { sanitize: (h) => h.replace(/<script[\s\S]*?<\/script>/gi, '') };
        expect(renderMarkdown('clean')).toBe('<p>clean</p>');
    });

    it('returns raw marked output when DOMPurify is not available', () => {
        global.marked = { parse: () => '<p>hello</p>\n' };
        expect(renderMarkdown('hello')).toBe('<p>hello</p>\n');
    });

    it('handles empty string input', () => {
        global.marked = { parse: () => '' };
        expect(renderMarkdown('')).toBe('');
    });
});
