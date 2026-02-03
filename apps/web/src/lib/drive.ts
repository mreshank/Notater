/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StoredProject } from "@notater/core";
import { exportProjectPackage } from "@notater/core";

// Global types for Google API
declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: {
                        client_id: string;
                        scope: string;
                        callback: (resp: any) => void;
                    }) => {
                        requestAccessToken: (opts: { prompt?: string }) => void;
                        callback: (resp: any) => void;
                    };
                    hasGrantedAllScopes: (token: any, scope: string) => boolean;
                    revoke: (token: string, callback: () => void) => void;
                };
            };
        };
        gapi?: {
            load: (api: string, callback: () => void) => void;
            client: {
                init: (config: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;
                getToken: () => { access_token: string } | null;
                setToken: (token: { access_token: string } | null) => void;
                drive: {
                    files: {
                        list: (params: { q?: string; fields?: string; [key: string]: unknown }) => Promise<{ result: { files: any[] } }>;
                        get: (params: { fileId: string; alt?: string; [key: string]: unknown }) => Promise<{ body: string; result: any }>;
                        create: (params: { resource?: any; media?: any; fields?: string; [key: string]: unknown }) => Promise<{ result: { id: string } }>;
                        update: (params: { fileId: string; resource?: any; media?: any; fields?: string; [key: string]: unknown }) => Promise<{ result: { id: string } }>;
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
const FOLDER_NAME = "Notater Projects";

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
let isAuthorized = false;

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
                console.log("[Drive] GAPI client loaded, initializing...");
                try {
                    await window.gapi!.client.init({
                        apiKey: API_KEY,
                        discoveryDocs: [DISCOVERY_DOC],
                    });
                    console.log("[Drive] GAPI client initialized");
                    gapiInited = true;
                } catch (err) {
                    console.error("[Drive] GAPI init failed", err);
                }
                
                // Check if we have a stored token
                const storedToken = localStorage.getItem("gdrive_token");
                if (storedToken) {
                    const token = JSON.parse(storedToken);
                    window.gapi!.client.setToken(token);
                    isAuthorized = true;
                }
                resolve();
            });
        });
    }

    // Load GIS
    if (typeof window !== 'undefined' && !gisInited && window.google) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (resp: any) => {
                console.log("[Drive] Token callback received", resp);
                if (resp.error !== undefined) {
                    throw (resp);
                }
                isAuthorized = true;
                // Save token for next session (expiry handling needed in real app)
                // For now we just use it while valid
                if (window.gapi?.client.getToken()) {
                   localStorage.setItem("gdrive_token", JSON.stringify(window.gapi.client.getToken()));
                }
            },
        });
        gisInited = true;
    }
}

// Check auth status
export function isDriveAuthorized() {
    return isAuthorized;
}

// Request Access Token
export async function loginToGoogle(): Promise<boolean> {
    if (!tokenClient) await initGoogleClient();
    
    return new Promise((resolve, reject) => {
        try {
            // Override callback for this request
            tokenClient.callback = async (resp: { error?: string }) => {
                if (resp.error) {
                    reject(resp);
                }
                isAuthorized = true;
                const token = window.gapi!.client.getToken();
                if (token) {
                  localStorage.setItem("gdrive_token", JSON.stringify(token));
                }
                resolve(true);
            };

            if (window.gapi && window.gapi.client.getToken() === null) {
                console.log("[Drive] Requesting access token (consent)...");
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                console.log("[Drive] Requesting access token (no prompt)...");
                tokenClient.requestAccessToken({ prompt: '' });
            }
        } catch (e) {
            reject(e);
        }
    });
}

// Logout
export function logoutFromGoogle() {
    const token = window.gapi?.client.getToken();
    if (token) {
        window.google?.accounts.oauth2.revoke(token.access_token, () => {});
        window.gapi?.client.setToken(null);
        localStorage.removeItem("gdrive_token");
        isAuthorized = false;
    }
}

// Ensure "Notater Projects" folder exists
async function ensureAppFolder(): Promise<string> {
    const response = await window.gapi!.client.drive.files.list({
        q: `mimeType = 'application/vnd.google-apps.folder' and name = '${FOLDER_NAME}' and trashed = false`,
        fields: 'files(id, name)',
    });
    
    const files = response.result.files;
    if (files && files.length > 0) {
        return files[0].id; // Return existing folder ID
    }

    // Create folder
    const folderMetadata = {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
    };
    
    const tokenObj = window.gapi!.client.getToken();
    if (!tokenObj) throw new Error("No access token");
    const token = tokenObj.access_token;
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(folderMetadata)
    });
    
    const folder = await res.json();
    return folder.id;
}

// List Notater Projects
export async function listDriveProjects() {
    if (!gapiInited) await initGoogleClient();
    
    // Search for files in the folder or by property
    const folderId = await ensureAppFolder();
    
    const response = await window.gapi!.client.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, createdTime, appProperties)',
    });
    
    return response.result.files;
}

// Sync/Upload Project to App Folder
export async function syncProjectToDrive(project: StoredProject): Promise<string> {
    if (!gapiInited) await initGoogleClient();
    if (!isAuthorized) throw new Error("Not authorized");
    
    const folderId = await ensureAppFolder();
    
    // Check if file mainly exists
    // We use a custom property 'projectId' to match files uniquely
    const listRes = await window.gapi!.client.drive.files.list({
        // q: `name = '${project.name}.notate' and '${folderId}' in parents and trashed = false`,
        // Better: search by appProperties
        q: `appProperties has { key='projectId' and value='${project.id}' } and '${folderId}' in parents and trashed = false`,
        fields: 'files(id, name)',
    });
    
    const existingFileId = listRes.result.files?.[0]?.id;
    
    // 1. Export package
    const blob = await exportProjectPackage(project.id);
    const accessToken = window.gapi?.client.getToken()?.access_token;
    
    const metadata = {
        name: `${project.name}.notate`,
        mimeType: 'application/zip',
        parents: existingFileId ? undefined : [folderId], // Only set parent on create
        appProperties: {
            type: 'notater_project',
            projectId: project.id,
            lastSynced: Date.now().toString()
        }
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);
    
    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';
    
    if (existingFileId) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
        method = 'PATCH'; // Update content
    }
    
    const res = await fetch(url, {
        method,
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form
    });
    
    if (!res.ok) throw new Error("Sync failed: " + res.statusText);
    const result = await res.json();
    return result.id;
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
