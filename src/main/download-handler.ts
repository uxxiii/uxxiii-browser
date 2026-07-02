import { session, DownloadItem as ElectronDownloadItem, app, BrowserWindow } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { DownloadItem } from '@shared/types';
import { persistence } from './store/persistence';

class DownloadHandler {
  private downloads: Map<string, DownloadItem> = new Map();
  private electronItems: Map<string, ElectronDownloadItem> = new Map();

  initialize(): void {
    session.defaultSession.on('will-download', (event, item, webContents) => {
      const settings = persistence.getSettings();
      const id = uuidv4();

      let savePath = path.join(
        settings.downloadPath || app.getPath('downloads'),
        item.getFilename()
      );

      // Handle duplicate filenames
      if (fs.existsSync(savePath)) {
        const ext = path.extname(savePath);
        const base = path.basename(savePath, ext);
        const dir = path.dirname(savePath);
        let counter = 1;
        while (fs.existsSync(savePath)) {
          savePath = path.join(dir, `${base} (${counter})${ext}`);
          counter++;
        }
      }

      item.setSavePath(savePath);

      const download: DownloadItem = {
        id,
        url: item.getURL(),
        filename: item.getFilename(),
        path: savePath,
        totalBytes: item.getTotalBytes(),
        receivedBytes: 0,
        state: 'progressing',
        startTime: Date.now(),
        mimeType: item.getMimeType(),
      };

      this.downloads.set(id, download);
      this.electronItems.set(id, item);

      this.notifyUpdate();

      item.on('updated', (_event, state) => {
        download.receivedBytes = item.getReceivedBytes();
        download.totalBytes = item.getTotalBytes();

        if (state === 'interrupted') {
          download.state = 'interrupted';
        } else if (state === 'progressing') {
          if (item.isPaused()) {
            download.state = 'progressing';
          }
        }
        this.notifyUpdate();
      });

      item.once('done', (_event, state) => {
        download.receivedBytes = item.getReceivedBytes();
        download.totalBytes = item.getTotalBytes();
        download.endTime = Date.now();

        if (state === 'completed') {
          download.state = 'completed';
          this.showNotification(download);
        } else if (state === 'cancelled') {
          download.state = 'cancelled';
        } else {
          download.state = 'interrupted';
        }

        this.electronItems.delete(id);
        this.notifyUpdate();
      });
    });
  }

  private notifyUpdate(): void {
    const allDownloads = this.getAll();
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('downloads:updated', allDownloads);
    }
  }

  private showNotification(download: DownloadItem): void {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('notification:download-complete', {
        filename: download.filename,
        path: download.path,
      });
    }
  }

  getAll(): DownloadItem[] {
    return Array.from(this.downloads.values()).sort(
      (a, b) => b.startTime - a.startTime
    );
  }

  cancel(id: string): void {
    const item = this.electronItems.get(id);
    if (item) {
      item.cancel();
    }
    const download = this.downloads.get(id);
    if (download) {
      download.state = 'cancelled';
      this.notifyUpdate();
    }
  }

  open(id: string): void {
    const download = this.downloads.get(id);
    if (download && download.state === 'completed') {
      const { shell } = require('electron');
      shell.openPath(download.path);
    }
  }

  showInFolder(id: string): void {
    const download = this.downloads.get(id);
    if (download) {
      const { shell } = require('electron');
      shell.showItemInFolder(download.path);
    }
  }

  clear(): void {
    this.downloads.clear();
    this.notifyUpdate();
  }
}

export const downloadHandler = new DownloadHandler();
