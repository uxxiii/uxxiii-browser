# Uxxiii Browser

A premium, production-grade desktop web browser built with Electron, React, and TypeScript.

## Features

- **Tabs** — Open, close, duplicate, reorder, pin, and drag tabs
- **Navigation** — Address bar with autocomplete, back/forward, reload, home, HTTPS indicator
- **New Tab Page** — Greeting, search, quick access, pinned sites, recent history, weather widget, clock
- **Bookmarks** — Bookmarks bar, folders, bookmark manager
- **Downloads** — Real download handling via Electron session
- **History** — Browsing history with persistence
- **Settings** — Appearance, privacy, performance, startup, fonts, downloads, keyboard shortcuts
- **Themes** — Light, Dark, OLED, Minimal, Glass, Nord, Tokyo Night, Solarized, Dracula
- **Workspaces** — Personal, Study, Coding, Entertainment
- **Sidebar** — Bookmarks, History, Downloads, Settings, Themes, Extensions (placeholder), AI (placeholder)
- **Security** — HTTPS indicator, incognito mode, privacy controls
- **Browser Features** — Zoom, print, DevTools, find in page, fullscreen, context menus, session restore

## Tech Stack

- Electron + Chromium (BrowserView per tab)
- React 18 + TypeScript
- TailwindCSS + Framer Motion
- Zustand (renderer state) + Electron Store (persistence)
- Vite (renderer build) + esbuild (main/preload)

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

This builds the main process, starts the Vite dev server, and launches Electron.

## Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── index.ts    # App entry point
│   ├── tab-manager.ts
│   ├── window-manager.ts
│   ├── download-handler.ts
│   ├── ipc/        # IPC handlers
│   └── store/      # Electron Store persistence
├── preload/        # Secure contextBridge API
├── renderer/       # React UI shell
│   ├── components/ # UI components
│   ├── pages/      # NTP, Settings
│   ├── stores/     # Zustand stores
│   └── hooks/      # Custom hooks
└── shared/         # Shared types & constants
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+T | New tab |
| Ctrl+W | Close tab |
| Ctrl+N | New window |
| Ctrl+Shift+N | Incognito window |
| Ctrl+R | Reload |
| Ctrl+Shift+R | Hard reload |
| Ctrl+L | Focus address bar |
| Ctrl+D | Bookmark page |
| Ctrl+F | Find in page |
| Ctrl+Tab | Next tab |
| F11 | Fullscreen |
| F12 | DevTools |

## Architecture

- **Main process** manages BrowserWindow, BrowserView per tab, downloads, and persistence
- **Preload** exposes a typed `window.uxxxiii` API via contextBridge
- **Renderer** is the browser chrome (tab bar, address bar, sidebar, NTP)
- **BrowserView** renders actual web content for external URLs
- Internal pages (`uxxxiii://newtab`, `uxxxiii://settings`) render in the React shell

## Website Distribution

The website download page lives in [website](website) and is ready to be published via GitHub Pages.

### Publish the download site

1. Push this repository to GitHub.
2. Open the repository on GitHub and go to Settings → Pages.
3. Select the "GitHub Actions" source.
4. The workflow in [.github/workflows/deploy-website.yml](.github/workflows/deploy-website.yml) will publish the site automatically on every push to the main branch.

Once published, visitors can download the packaged Windows installer from the website.

### Release the installer

- Place the final installer file in [website/downloads](website/downloads).
- Update [website/downloads.json](website/downloads.json) if you want to point to a new file or a GitHub Releases asset.
- For public distribution, upload the installer to GitHub Releases and replace the download URL there.

## License

MIT
