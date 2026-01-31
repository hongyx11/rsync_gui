# Rsync GUI

A simple Electron + React desktop application for visualizing and managing rsync file synchronization tasks.

## Features

- **Project-based organization** - Group sync items by projects with custom names and colors
- **Progress visualization** - Real-time progress bar and output log
- **Two-way sync** - Sync files bidirectionally (A→B then B→A) with `-u` flag to preserve newer files
- **Exclude patterns** - Add folder/file patterns to exclude from sync
- **Last sync time** - Track when each item was last synced
- **Cross-platform** - Works on macOS and Linux

## Prerequisites

- Node.js (v16 or higher)
- npm
- rsync installed on your system
  - macOS: Comes pre-installed (uses `openrsync`)
  - Linux: `sudo apt install rsync` or equivalent

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd rsync_gui

# Install dependencies
npm install
```

## Development

```bash
# Run in development mode with hot reload
npm run dev
```

## Build & Run

```bash
# Build the application
npm run build

# Run the built application
npx electron .
```

## Building for Distribution

```bash
# Package the app for your platform
npm run build
npx electron-builder
```

## Project Structure

```
rsync_gui/
├── electron/           # Electron main process
│   ├── main.ts         # Main process entry, rsync spawning
│   └── preload.ts      # Preload script for IPC
├── src/
│   ├── components/     # React components
│   │   ├── AddItemForm.tsx
│   │   ├── OutputLog.tsx
│   │   ├── PathSelector.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ProjectManager.tsx
│   │   └── SyncList.tsx
│   ├── hooks/          # Custom React hooks
│   │   ├── useRsync.ts
│   │   └── useStorage.ts
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx         # Main app component
│   ├── App.css         # Styles
│   └── main.tsx        # React entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Usage

1. **Create a Project** - Click the "+" button in the sidebar to create a new project
2. **Add Sync Items** - Click "Add Sync Item" and configure:
   - Source path (local or remote `user@server:/path`)
   - Destination path
   - Options (archive, verbose, compress, delete, dry-run)
   - Two-way sync (optional)
   - Exclude patterns (optional)
3. **Run Sync** - Click the play button on individual items or the project play button to run all items in a project
4. **Monitor Progress** - Watch the progress bar and output log

## License

MIT
