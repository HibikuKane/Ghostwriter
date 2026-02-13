/**
 * Drive Service
 * Manages Google Drive API interactions.
 */
import { FOLDER_NAME } from '../config.js';
import { log } from '../utils/logger.js';

/**
 * Initialize the Ghostwriter workspace in Google Drive
 * @returns {Promise<boolean>} Success status
 */
export async function createWorkspace() {
    log('Starting initialization...', 'info');

    try {
        // 1. Check if folder exists
        const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${FOLDER_NAME}' and trashed = false`;

        let response = await gapi.client.drive.files.list({
            q: q,
            fields: 'files(id, name)',
        });

        let folderId;

        if (response.result.files.length > 0) {
            log(`Found existing folder: ${FOLDER_NAME}`, 'info');
            folderId = response.result.files[0].id;
        } else {
            // 2. Create Folder
            log(`Creating new folder: ${FOLDER_NAME}...`, 'info');
            const fileMetadata = {
                'name': FOLDER_NAME,
                'mimeType': 'application/vnd.google-apps.folder'
            };
            const folder = await gapi.client.drive.files.create({
                resource: fileMetadata,
                fields: 'id'
            });
            folderId = folder.result.id;
            log(`Folder created! ID: ${folderId}`, 'success');
        }

        // 3. Create Status File
        await createStatusFile(folderId);

        log('Ghostwriter initialization complete.', 'success');
        return true;

    } catch (err) {
        log('Error during initialization: ' + JSON.stringify(err), 'error');
        console.error(err);
        return false;
    }
}

async function createStatusFile(folderId) {
    log('Checking for existing status.json...', 'info');

    // Check for existing file
    const q = `name = 'status.json' and '${folderId}' in parents and trashed = false`;
    const response = await gapi.client.drive.files.list({
        q: q,
        fields: 'files(id, name)'
    });

    const fileContent = {
        system: "online",
        connected: true,
        timestamp: new Date().toISOString(),
        settings: null // Will store user settings (API key, provider, model, character)
    };

    if (response.result.files.length > 0) {
        // Update existing file
        const fileId = response.result.files[0].id;
        log(`Found existing status.json (ID: ${fileId}). Updating...`, 'info');

        await updateFile(fileId, fileContent);
        log(`status.json updated!`, 'success');
    } else {
        // Create new file
        log('Creating new status.json...', 'info');
        await createFile(folderId, 'status.json', fileContent);
        log(`status.json created!`, 'success');
    }
}

/**
 * Read the status.json file from Google Drive
 * @returns {Promise<Object|null>} The status file content, or null if not found
 */
export async function readStatusFile() {
    try {
        // Find the Ghostwriter folder
        const folderQuery = `mimeType = 'application/vnd.google-apps.folder' and name = '${FOLDER_NAME}' and trashed = false`;
        const folderResponse = await gapi.client.drive.files.list({
            q: folderQuery,
            fields: 'files(id, name)'
        });

        if (folderResponse.result.files.length === 0) {
            log('Ghostwriter folder not found', 'warning');
            return null;
        }

        const folderId = folderResponse.result.files[0].id;

        // Find status.json
        const fileQuery = `name = 'status.json' and '${folderId}' in parents and trashed = false`;
        const fileResponse = await gapi.client.drive.files.list({
            q: fileQuery,
            fields: 'files(id, name)'
        });

        if (fileResponse.result.files.length === 0) {
            log('status.json not found', 'warning');
            return null;
        }

        const fileId = fileResponse.result.files[0].id;

        // Read file content
        const accessToken = gapi.client.getToken().access_token;
        const fetchResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (!fetchResponse.ok) {
            throw new Error(`Failed to read file: ${fetchResponse.statusText}`);
        }

        const content = await fetchResponse.json();
        log('status.json loaded successfully', 'success');
        return content;
    } catch (err) {
        log('Error reading status.json: ' + err.message, 'error');
        return null;
    }
}

/**
 * Update user settings in status.json
 * @param {Object} settings - User settings (apiKey, provider, model, character)
 * @returns {Promise<boolean>} Success status
 */
export async function updateSettings(settings) {
    try {
        // Find the Ghostwriter folder
        const folderQuery = `mimeType = 'application/vnd.google-apps.folder' and name = '${FOLDER_NAME}' and trashed = false`;
        const folderResponse = await gapi.client.drive.files.list({
            q: folderQuery,
            fields: 'files(id, name)'
        });

        if (folderResponse.result.files.length === 0) {
            throw new Error('Ghostwriter folder not found');
        }

        const folderId = folderResponse.result.files[0].id;

        // Find status.json
        const fileQuery = `name = 'status.json' and '${folderId}' in parents and trashed = false`;
        const fileResponse = await gapi.client.drive.files.list({
            q: fileQuery,
            fields: 'files(id, name)'
        });

        let fileId;
        if (fileResponse.result.files.length > 0) {
            fileId = fileResponse.result.files[0].id;

            // Read current content
            const currentContent = await readStatusFile();

            // Update with new settings
            const updatedContent = {
                ...currentContent,
                settings: {
                    ...settings,
                    lastModified: new Date().toISOString()
                }
            };

            await updateFile(fileId, updatedContent);
        } else {
            // Create new status.json with settings
            const newContent = {
                system: "online",
                connected: true,
                timestamp: new Date().toISOString(),
                settings: {
                    ...settings,
                    lastModified: new Date().toISOString()
                }
            };
            await createFile(folderId, 'status.json', newContent);
        }

        log('Settings saved to status.json', 'success');
        return true;
    } catch (err) {
        log('Error updating settings: ' + err.message, 'error');
        throw err;
    }
}

async function createFile(folderId, fileName, content) {
    const boundary = 'foo_bar_7_baz_qux';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId]
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
    const fetchResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'multipart/related; boundary=' + boundary
        },
        body: body
    });

    const file = await fetchResponse.json();
    if (file.error) throw file.error;
    return file;
}

async function updateFile(fileId, content) {
    const accessToken = gapi.client.getToken().access_token;

    // For simple update of content only (using uploadType=media)
    const fetchResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content, null, 2)
    });

    const file = await fetchResponse.json();
    if (file.error) throw file.error;
    return file;
}
