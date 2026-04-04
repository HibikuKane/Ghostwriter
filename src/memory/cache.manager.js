/**
 * Cache Manager
 * 2-Tier local cache: in-memory Map (primary) + SessionStorage (secondary).
 * Source of truth is always Google Drive — this is a performance layer only.
 *
 * Tier 1 (Memory): ~0ms, lost on page reload
 * Tier 2 (SessionStorage): ~1ms, lost when tab closes
 * On miss: caller fetches from Drive and populates both tiers
 */

const SESSION_PREFIX = 'gw_cache_';

export class CacheManager {
    constructor() {
        this._mem = new Map();
    }

    /**
     * Get a cached value.
     * Checks memory first, then SessionStorage.
     * @param {string} key
     * @returns {*} Cached value, or null on miss
     */
    get(key) {
        if (this._mem.has(key)) return this._mem.get(key);

        try {
            const raw = sessionStorage.getItem(SESSION_PREFIX + key);
            if (raw !== null) {
                const value = JSON.parse(raw);
                this._mem.set(key, value); // promote to memory
                return value;
            }
        } catch (_) {}

        return null;
    }

    /**
     * Store a value in both tiers.
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
        this._mem.set(key, value);
        try {
            sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(value));
        } catch (_) {}
    }

    /**
     * Remove a specific key from both tiers.
     * @param {string} key
     */
    invalidate(key) {
        this._mem.delete(key);
        try {
            sessionStorage.removeItem(SESSION_PREFIX + key);
        } catch (_) {}
    }

    /**
     * Remove all cached entries from both tiers.
     */
    invalidateAll() {
        this._mem.clear();
        try {
            const toRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const k = sessionStorage.key(i);
                if (k && k.startsWith(SESSION_PREFIX)) toRemove.push(k);
            }
            toRemove.forEach(k => sessionStorage.removeItem(k));
        } catch (_) {}
    }
}

export const cacheManager = new CacheManager();
