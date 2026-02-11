/** 
 * Ghostwriter - Phase 1: The Handshake 
 * @type {string} 
 */
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// DOM Elements
const authBtn = document.getElementById('auth-btn');
const signoutBtn = document.getElementById('signout-btn');
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const userEmailSpan = document.getElementById('user-email');
const initBtn = document.getElementById('init-btn');
const consoleOutput = document.getElementById('console-output');

/**
 * Log message to on-screen console
 * @param {string} msg 
 * @param {'info'|'success'|'error'} type 
 */
function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    div.innerText = `[${time}] ${msg}`;
    consoleOutput.appendChild(div);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

/**
 * Initialize Google Identity Services (GIS)
 */
function handleClientLoad() {
    gapi.load('client', async () => {
        try {
            await gapi.client.init({
                discoveryDocs: [DISCOVERY_DOC],
            });
            gapiInited = true;
            log('GAPI initialized.', 'success');
            maybeEnableButtons();
        } catch (err) {
            log('Error initializing GAPI: ' + JSON.stringify(err), 'error');
        }
    });

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: async (resp) => {
            if (resp.error !== undefined) {
                throw (resp);
            }
            log('Token received. User authenticated.', 'success');
            showDashboard();
            await listFiles(); // Just to test connection
        },
    });
    gisInited = true;
    log('GIS initialized.', 'success');
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        authBtn.style.display = 'block';
    }
}

/**
 * Trigger Login
 */
function handleAuthClick() {
    tokenClient.requestAccessToken();
}

/**
 * Trigger Logout
 */
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        log('User signed out.', 'info');
        showAuth();
    }
}

function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
}

function showAuth() {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
}

/**
 * Core Logic: Handshake (Create Folder + File)
 */
async function initializeGhostwriter() {
    initBtn.disabled = true;
    log('Starting initialization...', 'info');

    try {
        // 1. Check if folder exists
        const folderName = 'Ghostwriter_Data';
        // Check for folder (not trashed)
        const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`;

        let response = await gapi.client.drive.files.list({
            q: q,
            fields: 'files(id, name)',
        });

        let folderId;

        if (response.result.files.length > 0) {
            log(`Found existing folder: ${folderName}`, 'info');
            folderId = response.result.files[0].id;
        } else {
            // 2. Create Folder
            log(`Creating new folder: ${folderName}...`, 'info');
            const fileMetadata = {
                'name': folderName,
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
        log('Creating status.json...', 'info');
        const fileContent = {
            system: "online",
            connected: true,
            timestamp: new Date().toISOString()
        };

        // Construct multipart/related body for Drive API
        // This is required because GAPI client doesn't support easy media upload, 
        // and FormData sends multipart/form-data which Drive API often rejects for this purpose.
        const boundary = 'foo_bar_7_baz_qux';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const metadata = {
            name: 'status.json',
            mimeType: 'application/json',
            parents: [folderId]
        };

        const body =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(fileContent, null, 2) +
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

        log(`status.json created! ID: ${file.id}`, 'success');
        log('Ghostwriter initialization complete.', 'success');
        initBtn.innerText = "Initialization Complete";

    } catch (err) {
        log('Error during initialization: ' + JSON.stringify(err), 'error');
        console.error(err);
        initBtn.disabled = false;
    }
}

/**
 * Placeholder for listFiles if needed, or remove call above
 */
async function listFiles() {
    // Optional: list files to verify scope
}

// Event Listeners
authBtn.onclick = handleAuthClick;
signoutBtn.onclick = handleSignoutClick;
initBtn.onclick = initializeGhostwriter;

// Load GAPI script dynamically to ensure order
const script = document.createElement('script');
script.src = "https://apis.google.com/js/api.js";
script.onload = handleClientLoad;
document.body.appendChild(script);
