import { app, BrowserWindow, globalShortcut } from 'electron';
import { windowManager } from './window-manager';
import { downloadHandler } from './download-handler';
import { registerIpcHandlers } from './ipc';
import { persistence } from './store/persistence';
import { initAutoUpdater } from './update-manager';

// Must be called before app.ready
const settings = persistence.getSettings();
if (!settings.hardwareAcceleration) {
  app.disableHardwareAcceleration();
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.whenReady().then(() => {
  registerIpcHandlers();
  downloadHandler.initialize();
  initAutoUpdater();

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.webContents.openDevTools();
  });

  windowManager.restoreSession();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  windowManager.saveSession();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  windowManager.saveSession();
  globalShortcut.unregisterAll();
});

app.on('second-instance', () => {
  const windows = windowManager.getAllWindows();
  if (windows.length > 0) {
    const win = windows[0];
    if (win.isMinimized()) win.restore();
    win.focus();
  } else {
    windowManager.createWindow();
  }
});

// Handle uncaught exceptions for crash recovery
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  windowManager.saveSession();
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
