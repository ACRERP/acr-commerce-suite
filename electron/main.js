import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn, fork } from 'child_process';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine if running in development - using isPackaged for better reliability
const isDev = !app.isPackaged;

// Try to import electron-updater, but don't fail if it's not available
let autoUpdater;
try {
    const updaterModule = await import('electron-updater');
    autoUpdater = updaterModule.autoUpdater;

    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.logger = console;
} catch (err) {
    console.log('electron-updater not available:', err.message);
    autoUpdater = null;
}

let mainWindow;
let apiProcess;

function startApiServer() {
    if (isDev) {
        console.log('Starting Local API in DEV mode (tsx)...');
        const serverPath = path.join(__dirname, 'server/server.ts');
        apiProcess = spawn('npx', ['tsx', serverPath], {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit',
            env: { ...process.env, PORT: '3000' },
            shell: true
        });
    } else {
        // In production, server is bundled to dist-electron/server.cjs
        // We configured asarUnpack for this file so it can be forked
        const serverPath = path.join(process.resourcesPath, 'app.asar.unpacked/dist-electron/server.cjs');
        console.log(`Starting Local API in PROD mode from: ${serverPath}`);

        apiProcess = fork(serverPath, [], {
            env: { ...process.env, PORT: '3000', NODE_ENV: 'production' }
        });
    }

    apiProcess.on('error', (err) => {
        console.error('Failed to start API server:', err);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Remove default menu in production for a "premium" experience
    if (!isDev) {
        Menu.setApplicationMenu(null);
        mainWindow.setMenuBarVisibility(false);
    }

    if (isDev) {
        mainWindow.loadURL('http://localhost:8085');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        // Ensure DevTools are not accessible in production if desired
        mainWindow.webContents.on('devtools-opened', () => {
            mainWindow.webContents.closeDevTools();
        });
    }

    // Check for updates after window is ready
    mainWindow.webContents.on('did-finish-load', () => {
        if (!isDev && autoUpdater) {
            setTimeout(() => {
                autoUpdater.checkForUpdates();
            }, 3000);
        }
    });
}

// Auto-updater events (only if available)
if (autoUpdater) {
    autoUpdater.on('update-available', (info) => {
        console.log('Update available:', info.version);
        if (mainWindow) {
            mainWindow.webContents.send('update-available', info);
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded:', info.version);
        if (mainWindow) {
            mainWindow.webContents.send('update-downloaded', info);
        }
    });

    autoUpdater.on('error', (err) => {
        console.error('Auto-updater error:', err);
    });

    // IPC handlers for update
    ipcMain.on('download-update', () => {
        autoUpdater.downloadUpdate();
    });

    ipcMain.on('install-update', () => {
        autoUpdater.quitAndInstall();
    });
}

app.whenReady().then(() => {
    startApiServer();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (apiProcess) apiProcess.kill();
        app.quit();
    }
});

app.on('before-quit', () => {
    if (apiProcess) apiProcess.kill();
});
