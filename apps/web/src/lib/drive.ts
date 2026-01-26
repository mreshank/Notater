import { StoredProject } from "./db";
import { exportProjectPackage } from "./sync";

// Global types for Google API
declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: any) => any;
                };
            };
        };
        gapi?: {
            load: (api: string, callback: () => void) => void;
            client: {
                init: (config: any) => Promise<void>;
                getToken: () => any;
                setToken: (token: any) => void;
                drive: {
                    files: {
                        list: (params: any) => Promise<any>;
                        get: (params: any) => Promise<any>;
                        create: (params: any) => Promise<any>;
                        update: (params: any) => Promise<any>;
                    };
                };
            };
        };
    }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Initialize Google API Client
export async function initGoogleClient() {
    if (!CLIENT_ID || !API_KEY) {
        console.warn("Google Drive credentials missing");
        return;
    }

    // Load GAPI
    if (typeof window !== 'undefined' && !gapiInited && window.gapi) {
        await new Promise<void>((resolve) => {
            window.gapi!.load('client', async () => {
                await window.gapi!.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: [DISCOVERY_DOC],
                });
                gapiInited = true;
                resolve();
            });
        });
    }

    // Load GIS
    if (typeof window !== 'undefined' && !gisInited && window.google) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // defined at request time
        });
        gisInited = true;
    }
}

// Request Access Token
export async function loginToGoogle(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (!tokenClient) reject("Google Client not initialized");
        
        tokenClient.callback = async (resp: any) => {
            if (resp.error) {
                reject(resp);
            }
            resolve(true);
        };

        if (window.gapi && window.gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });
}

// List Notate Projects
export async function listDriveProjects() {
    if (!gapiInited) await initGoogleClient();
    
    // Search for files with specific property or extension
    // We can filter by appProperties if we set them, or just name
    // q: "name contains '.notate' and trashed = false"
    const response = await window.gapi!.client.drive.files.list({
        q: "name contains '.notate' and trashed = false",
        fields: 'files(id, name, createdTime, appProperties)',
    });
    
    return response.result.files;
}

// Upload Project
export async function uploadProjectToDrive(project: StoredProject) {
    if (!gapiInited) await initGoogleClient();
    
    // 1. Export package
    const blob = await exportProjectPackage(project.id);
    
    // 2. Prepare Metadata
    const metadata = {
        name: `${project.name}.notate`,
        mimeType: 'application/zip',
        appProperties: {
            type: 'notater_project',
            projectId: project.id
        }
    };
    
    // 3. Upload (Multipart)
    // Using gapi for simple uploads is tricky for multipart.
    // Easier to use raw fetch with the access token gapi holds.
    
    const accessToken = window.gapi?.client.getToken()?.access_token;
    if (!accessToken) throw new Error("No access token");
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);
    
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form
    });
    
    if (!res.ok) throw new Error("Upload failed: " + res.statusText);
    return await res.json();
}

// Download Project
export async function downloadFromDrive(fileId: string): Promise<Blob> {
    const accessToken = window.gapi?.client.getToken()?.access_token;
    if (!accessToken) throw new Error("No access token");

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken })
    });
    
    if (!res.ok) throw new Error("Download failed");
    return await res.blob();
}
