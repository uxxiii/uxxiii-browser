# Packaging the uxxxiii Browser (Local build)

This project can be packaged into platform installers using electron-builder.

Important: building installers downloads native dependencies and can take several minutes and several hundred MBs of disk/network usage.

## Add dev dependencies

Locally install dev dependencies (on Windows/macOS/Linux):

```bash
npm install --save-dev electron-builder
```

You may prefer `npm ci` if you're installing all dev deps from package-lock.json.

## Build steps (recommended local flow)

1. Build the main and renderer bundles:

```bash
npm run build
```

2. Create the platform installer (Windows example):

```bash
npm run dist:win
```

Artifacts will be produced into the `dist_installer/` directory (per `package.json` `build.directories.output`).

## After building

- Copy the produced `*.exe` from `dist_installer/` into `website/downloads/` and update `website/downloads.json` to point to the file path (or upload to your web host and set the URL).
- For distribution, you can upload the installer to GitHub Releases and set `website/downloads.json` `releases` URL to your Releases page.

## Notes

- If you want automated builds, I can add a GitHub Actions workflow to build and upload artifacts to Releases on new tags.
- Make sure `assets/icon.ico` exists for Windows builds. Replace with your own icon.
 - If you want automated builds, I can add a GitHub Actions workflow to build and upload artifacts to Releases on new tags.
 - The packager will use the repository logo by default: `logo/uxxiii logo.png`. For best results provide a proper Windows `.ico` at `assets/icon.ico` (optional) or let `electron-builder` generate icons from the PNG.
