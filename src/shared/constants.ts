import { app } from 'electron';
import path from 'path';

export function getPreloadPath(): string {
  return path.join(__dirname, '../preload/index.js');
}

export function getRendererUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5173';
  }
  return `file://${path.join(__dirname, '../renderer/index.html')}`;
}

export function getUserDataPath(): string {
  return app.getPath('userData');
}

export function getDefaultDownloadPath(): string {
  return app.getPath('downloads');
}

// Chrome height constants for layout
export const TITLE_BAR_HEIGHT = 40;
export const TAB_BAR_HEIGHT = 44;
export const BOOKMARKS_BAR_HEIGHT = 36;
export const ADDRESS_BAR_HEIGHT = 48;
export const CHROME_HEIGHT = TITLE_BAR_HEIGHT + TAB_BAR_HEIGHT + ADDRESS_BAR_HEIGHT;
export const CHROME_WITH_BOOKMARKS = CHROME_HEIGHT + BOOKMARKS_BAR_HEIGHT;
export const SIDEBAR_WIDTH = 48;
