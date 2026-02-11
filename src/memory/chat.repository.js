/**
 * Chat Repository
 * Manages storage and retrieval of chat sessions in Google Drive.
 */
import { FOLDER_NAME } from '../config.js';
import { log } from '../utils/logger.js';

export class ChatRepository {
    constructor() {
        this.baseFolderId = null;
        this.chatsFolderId = null;
    }

    /**
     * Ensure the folder structure exists
     * .Ghostwriter_Data/chats/
     */
    async init() {
        if (this.chatsFolderId) return;

        try {
            // Find base folder
            const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${FOLDER_NAME}' and trashed = false`;
            const response = await gapi.client.drive.files.list({ q, fields: 'files(id)' });

            if (response.result.files.length === 0) {
                log('Base folder not found. Please initialize first.', 'error');
                return;
            }
            this.baseFolderId = response.result.files[0].id;

            // Find or create 'chats' folder
            const chatsQ = `mimeType = 'application/vnd.google-apps.folder' and name = 'chats' and '${this.baseFolderId}' in parents and trashed = false`;
            const chatsResponse = await gapi.client.drive.files.list({ q: chatsQ, fields: 'files(id)' });

            if (chatsResponse.result.files.length > 0) {
                this.chatsFolderId = chatsResponse.result.files[0].id;
            } else {
                this.chatsFolderId = await this._createFolder('chats', this.baseFolderId);
            }
        } catch (err) {
            log('Error initializing ChatRepository: ' + err.message, 'error');
        }
    }

    /**
     * Save a chat session
     * @param {string} sessionId - e.g. "chat_2023-10-27_123456"
     * @param {Array} messages 
     */
    async saveSession(sessionId, messages) {
        if (!this.chatsFolderId) await this.init();

        const fileName = `${sessionId}.json`;
        const fileContent = {
            id: sessionId,
            updatedAt: new Date().toISOString(),
            messages: messages
        };

        // Check availability
        const q = `name = '${fileName}' and '${this.chatsFolderId}' in parents and trashed = false`;
        const response = await gapi.client.drive.files.list({ q, fields: 'files(id)' });

        if (response.result.files.length > 0) {
            // Update
            await this._updateFile(response.result.files[0].id, fileContent);
            log(`Session saved: ${fileName}`, 'info'); // Subtle log
        } else {
            // Create
            await this._createFile(fileName, this.chatsFolderId, fileContent);
            log(`New session created: ${fileName}`, 'info');
        }
    }

    /**
     * Internal: Create Folder
     */
    async _createFolder(name, parentId) {
        const metadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
        };
        const res = await gapi.client.drive.files.create({ resource: metadata, fields: 'id' });
        return res.result.id;
    }

    /**
     * Internal: Create File
     */
    async _createFile(name, parentId, content) {
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

        const accessToken = gapi.client.getToken().access_token;
        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'multipart/related; boundary=' + boundary
            },
            body: body
        });
    }

    /**
     * Internal: Update File
     */
    async _updateFile(fileId, content) {
        const accessToken = gapi.client.getToken().access_token;
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(content, null, 2)
        });
    }
}

export const chatRepository = new ChatRepository();
