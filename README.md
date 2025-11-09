
# Dawn of Sorcerer — Electron packaging

This folder contains a ready-to-build Electron wrapper for the Dawn of Sorcerer web app.

## Build an .exe locally (Windows)
1. Install Node.js (16+ LTS) and Git.
2. Open a terminal in this folder.
3. Run:
   npm install
4. To test in development (hot-reload):
   - In one terminal: npm run dev:web
   - In another terminal: set DEV=1 && npm run start
   (Or use the combined dev script if Git Bash/WSL supports env vars.)
5. To build a Windows installer/exe (requires building on Windows):
   npm run dist
   This runs the web build then electron-builder to create an NSIS installer and EXE in `dist/`.

## CI build (GitHub Actions)
A sample workflow `/.github/workflows/win-build.yml` is included for building an installer automatically when you push tags.

Note: Building the final .exe requires a Windows environment for signing/packaging. If you don't have Windows, you can use GitHub Actions (workflow provided) to produce an .exe automatically.
