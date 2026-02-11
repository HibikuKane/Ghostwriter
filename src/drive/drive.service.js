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
        timestamp: new Date().toISOString()
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
