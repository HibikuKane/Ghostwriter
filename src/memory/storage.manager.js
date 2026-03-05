/**
 * Storage Manager
 * Handles all Google Drive interactions for Ghostwriter data.
 */
import { FOLDER_NAME } from '../config.js';
import { log } from '../utils/logger.js';
import { ensureValidToken } from '../auth/auth.service.js';
import { fetchWithTimeout } from '../utils/network.js';

const FOLDER_MAP = {
    'persona': 'personas',
    'character': 'characters',
    'session': 'sessions',
    'preset': 'presets',
    'asset': 'assets'
};

export class StorageManager {
    constructor() {
        this.rootFolderId = null;
        this.folders = {
            'personas': null,
            'characters': null,
            'sessions': null,
            'presets': null,
            'assets': null
        };
        this.isInitialized = false;
    }

    /**
     * Initialize the StorageManager.
     * Ensures necessary folders exist.
     */
    async init() {
        if (this.isInitialized) return;

        try {
            log('Initializing StorageManager...', 'info');

            // 1. Find or Create Root Folder
            this.rootFolderId = await this._findOrCreateFolder(FOLDER_NAME);

            // 2. Find or Create Subfolders
            const folderNames = Object.values(FOLDER_MAP); // ['personas', 'characters', etc.]

            // Sequential to avoid race conditions or rate limits
            for (const name of folderNames) {
                this.folders[name] = await this._findOrCreateFolder(name, this.rootFolderId);
                log(`Folder mapped: ${name} -> ${this.folders[name]}`, 'info');
            }

            this.isInitialized = true;
            log('StorageManager initialized successfully.', 'success');
        } catch (err) {
            // Reset initialization state so next call retries
            // Keep any folders that were successfully mapped (idempotent)
            this.isInitialized = false;
            log('Error initializing StorageManager: ' + err.message, 'error');
            console.error(err);
            throw err;
        }
    }

    /**
     * Find or create a folder.
     * @param {string} name - Folder name
     * @param {string} [parentId] - Parent folder ID (optional, defaults to root)
     * @returns {Promise<string>} Folder ID
     */
    async _findOrCreateFolder(name, parentId = null) {
        let q = `mimeType = 'application/vnd.google-apps.folder' and name = '${name}' and trashed = false`;
        if (parentId) {
            q += ` and '${parentId}' in parents`;
        }

        const response = await gapi.client.drive.files.list({ q, fields: 'files(id)' });

        if (response.result.files.length > 0) {
            return response.result.files[0].id;
        } else {
            const metadata = {
                name: name,
                mimeType: 'application/vnd.google-apps.folder',
            };
            if (parentId) {
                metadata.parents = [parentId];
            }
            const res = await gapi.client.drive.files.create({ resource: metadata, fields: 'id' });
            return res.result.id;
        }
    }

    /**
     * Get folder ID for a specific type.
     * @param {string} type - 'persona', 'character', 'session', 'preset', 'asset'
     * @returns {string} Folder ID
     */
    _getFolderId(type) {
        if (!FOLDER_MAP[type]) throw new Error(`Unknown type: ${type}`);
        const folderName = FOLDER_MAP[type];
        return this.folders[folderName];
    }

    /**
     * Save an item (Create or Update).
     * @param {string} type - Item type
     * @param {Object} item - Item data (must have 'id' if updating, or 'name' for new files)
     * @returns {Promise<string>} File ID
     */
    async saveItem(type, item) {
        if (!this.isInitialized) await this.init();

        const folderId = this._getFolderId(type);
        let fileId = item.id;

        // Ensure updatedAt is set
        item.updatedAt = new Date().toISOString();
        if (!item.createdAt) item.createdAt = item.updatedAt;

        // Construct filename. 
        let fileName = (item.name || item.id) + '.json';

        if (fileId) {
            // Try to update existng file
            try {
                await this._updateFile(fileId, item);
                log(`Saved ${type}: ${fileName} (${fileId})`, 'info');
                return fileId;
            } catch (e) {
                // Fallback to create if update fails (e.g. 404)
                console.warn("Update failed, trying create", e);
            }
        }

        // Create new
        const newFileId = await this._createFile(fileName, folderId, item);

        // Update the item with its new File ID if it was missing
        if (!item.id) {
            item.id = newFileId;
        }

        log(`Created new ${type}: ${fileName}`, 'success');
        return newFileId;
    }

    /**
     * Load an item by ID.
     * @param {string} type - Item type
     * @param {string} fileId - Google Drive File ID
     * @returns {Promise<Object>} Item data
     */
    async loadItem(type, fileId) {
        if (!this.isInitialized) await this.init();

        try {
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });
            const item = response.result;
            item.id = fileId;
            return item;
        } catch (err) {
            log(`Error loading ${type} ${fileId}: ` + err.message, 'error');
            throw err;
        }
    }

    /**
     * List all items of a type.
     * @param {string} type 
     * @returns {Promise<Array<{id: string, name: string}>>} List of files/items
     */
    async listItems(type) {
        if (!this.isInitialized) await this.init();
        const folderId = this._getFolderId(type);

        const q = `'${folderId}' in parents and trashed = false`;
        const response = await gapi.client.drive.files.list({
            q,
            fields: 'files(id, name)',
            pageSize: 100
        });

        return response.result.files;
    }

    /**
     * Internal: Create File (Multipart)
     */
    async _createFile(name, parentId, content) {
        log(`Creating file '${name}' in folder '${parentId}'...`, 'info');
        const boundary = 'foo_bar_7_baz_qux';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const metadata = {
            name: name,
            mimeType: 'application/json',
            parents: [parentId]
        };

        const body =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(content, null, 2) +
            close_delim;

        await ensureValidToken();
        const accessToken = gapi.client.getToken().access_token;
        const res = await fetchWithTimeout('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'multipart/related; boundary=' + boundary
            },
            body: body
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Drive Creation Failed (${res.status}): ${errorText}`);
        }

        const json = await res.json();
        return json.id;
    }

    /**
     * Internal: Update File
     */
    async _updateFile(fileId, content) {
        await ensureValidToken();
        const accessToken = gapi.client.getToken().access_token;
        const res = await fetchWithTimeout(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(content, null, 2)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Drive Update Failed (${res.status}): ${errorText}`);
        }
    }

    /**
    * Delete file
    */
    async deleteItem(fileId) {
        if (!this.isInitialized) await this.init();
        await gapi.client.drive.files.delete({ fileId: fileId });
        log(`Deleted file: ${fileId}`, 'info');
    }
}

export const storageManager = new StorageManager();
