import { app, BrowserWindow, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

function getPrimaryWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] ?? null;
}

function showMessage(message: string, detail?: string) {
  const win = getPrimaryWindow();
  dialog.showMessageBox(win, {
    type: 'info',
    title: 'uxxxiii Browser Update',
    message,
    detail,
    buttons: ['OK'],
    defaultId: 0,
  });
}

function promptRestart(): void {
  const win = getPrimaryWindow();
  if (!win) return;

  dialog
    .showMessageBox(win, {
      type: 'question',
      title: 'Update Ready to Install',
      message: 'A new version of uxxxiii Browser has been downloaded.',
      detail: 'Restart now to apply the update.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
}

export function initAutoUpdater(): void {
  if (!app.isPackaged) {
    console.log('Auto-updater disabled in development mode.');
    return;
  }

  autoUpdater.autoDownload = false;

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
  });

  autoUpdater.on('update-available', () => {
    console.log('Update available');
    const win = getPrimaryWindow();
    if (!win) return;

    dialog
      .showMessageBox(win, {
        type: 'info',
        title: 'Update Available',
        message: 'A new version of uxxxiii Browser is available.',
        detail: 'Download the update now and restart when ready.',
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No update available.');
  });

  autoUpdater.on('error', (error) => {
    console.error('Update error:', error);
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`Update download progress: ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded.');
    promptRestart();
  });

  autoUpdater.checkForUpdates();
}
