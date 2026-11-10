---
title: BroTube - Architecture & Design
tags: [project/brotube, architecture, electron, chromium, spatial-ui, design-tokens]
created: 2026-10-10
updated: 2026-10-11
---

# 🏛️ Architecture & System Design

## 1. High-Level System Layers

BroTube is architected in 4 synchronized subsystems:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SPATIAL GLASSMORPHIC HUD (RENDERER)                  │
│  - Windows 11 Fluent Frame (Draggable header, 10px radius, glass edge)  │
│  - 3-Layer Design Tokens (Primitives -> Semantic Dark/Light -> Specs)  │
│  - Kinetic Typography Entrance Screen (Outfit + Plus Jakarta Sans)    │
│  - Action Hub: Quality Picker Modal, Downloads Drawer, Settings Popover│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ IPC Context Bridge (preload.js)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    ELECTRON MAIN RUNTIME (HOST)                        │
│  - Chromium 130+ Desktop Engine & BrowserWindow Chrome                 │
│  - Native Theme Coordinator (`nativeTheme.themeSource`)                │
│  - Sandboxed Session Vault (`persist:brotube` in %APPDATA%)            │
│  - Persistent YouTube Cookie Sync (`PREF f6=40000000 / f6=400`)        │
└───────────────┬────────────────────────────────────────┬───────────────┘
                │ Webview Guest Preload                  │ Child Process
┌───────────────▼──────────────────────┐ ┌───────────────▼───────────────┐
│     YOUTUBE GUEST WEBVIEW            │ │ LOSSLESS 4K/8K DOWNLOAD ENGINE│
│ - Blink-Native CSS Adblock (30+ rules)│ │ - yt-dlp 2026.08.19+ CLI      │
│ - JSON.parse Player Ad Stripping     │ │ - Gyan FFmpeg 9.0.1 DASH Muxer│
│ - Live Webpage Theme Sync Bridge     │ │ - Real-time Track Title Stream│
│ - WebAudio 300% Boost & PiP Bridge   │ │ - Playlist Subfolder Routing  │
└──────────────────────────────────────┘ └───────────────────────────────┘
```

---

## 2. 3-Layer Design Token Architecture (iOS / visionOS Liquid Glass)

BroTube implements a systematic, Apple-inspired 3-layer design token system:

1. **Primitive Tokens**:
   - **Typography Stack**: Apple SF Pro typography (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`) with calibrated letter tracking:
     - `--tracking-tight: -0.015em`
     - `--tracking-normal: -0.005em`
     - `--tracking-wide: 0.025em`
   - **Liquid Glass Dynamics**: VisionOS depth blur scales:
     - `--blur-header: 42px`
     - `--blur-surface: 46px`
     - `--blur-drawer: 48px`
     - `--blur-modal: 54px`
   - **Spring Curves**: Smooth tactile response (`cubic-bezier(0.16, 1, 0.3, 1)`).
2. **Semantic Tokens (Dark & Light Theme Adaptations)**:
   - `[data-theme="dark"]`:
     - Deep cosmic obsidian background (`#070b12`, `#0a0e17`).
     - Translucency: `rgba(10, 14, 23, 0.44)` (surfaces) to `rgba(10, 14, 23, 0.52)` (header/drawers).
     - Specular highlight: `inset 0 1px 0 0 rgba(255, 255, 255, 0.18)` simulating edge refraction.
     - Text colors: Crisp high-contrast snow (`#f8fafc` primary, `#94a3b8` secondary).
     - Accents: Electric cyan (`#00f0ff`) and sapphire blue (`#3b82f6`).
   - `[data-theme="light"]`:
     - Ceramic snow glass background (`#f1f5f9`, `#ffffff`).
     - Translucency: `rgba(255, 255, 255, 0.48)` (surfaces) to `rgba(255, 255, 255, 0.56)` (header/drawers).
     - Specular highlight: Crisp refraction rim `inset 0 1px 0 0 rgba(255, 255, 255, 0.70)`.
     - Text colors: High-contrast deep ink (`#0a0e17` primary, `#334155` secondary) eliminating washed-out readability issues.
     - Accents: Deep cobalt (`#2563eb`) and royal azure (`#1d4ed8`).
3. **Component-Scoped Tokens**:
   - Titlebar: `--titlebar-height: 48px` with `-webkit-app-region: drag` and isolated `no-drag` control hitboxes.
   - Spatial shadows: Deep visionOS float `0 24px 56px -12px rgba(...)`.
   - Modals & Drawers: Backdrops saturated to 180% with heavy 54px Gaussian blur.

---

## 3. Windows 11 Fluent Window Frame & Drag Region

- **Frameless Window Chrome**: Standard OS titlebar is removed (`frame: false`), replaced with a custom acrylic glass header.
- **Draggable Header**: The header incorporates `-webkit-app-region: drag` spanning the top brand logo, center space, and status indicators.
- **Non-Drag Control Islands**: All interactive buttons (Navigation, Search toggle, Downloads button, Settings button, Window Controls) explicitly declare `-webkit-app-region: no-drag !important` to ensure effortless clicking and prevent drag locking.
- **Maximized Window Snapping**: When maximized (`window-maximized`), the 10px container border radius and 1px outer glass border smoothly drop to 0, ensuring perfectly flush alignment with Windows display edges.

---

## 4. Dual-Context Sandboxing & Webpage Theme Sync

BroTube features complete, real-time theme synchronization between the desktop application and YouTube's internal web player:

1. **User Trigger**: Toggling theme in BroTube's Settings menu updates the root `[data-theme]` attribute in the renderer.
2. **IPC Dispatch**: Renderer dispatches `set-theme` IPC call to Electron main process.
3. **Electron Synchronization**: Main process updates `nativeTheme.themeSource` (`dark` vs `light`), window background color, and writes the persistent YouTube `PREF` cookie (`f6=40000000` for dark, `f6=400` for light) to the `persist:brotube` cookie jar.
4. **Guest DOM Theme Flip**: Guest preload listens for `brotube-theme-sync` and instantly toggles `html[dark]`, `html:not([dark])`, and dynamically injects `SPATIAL_CSS` rules to adjust the YouTube masthead, guide navigation drawer, and scrollbars without requiring a page reload.

---

## 5. Media & Playlist Download Subsystem Architecture

- **Execution Isolation**: Runs via Node.js `child_process.spawn` invoking `python -m yt_dlp` with Gyan FFmpeg 9.0.1.
- **Live Output Streaming**: Spawns with `--print after_video:video_title:%(title)s --no-simulate`, capturing stdout lines to emit real-time track title and progress updates (`[Track X/Y] Title`) directly to the Downloads Hub drawer.
- **Smart Directory Partitioning**:
  - Standalone videos: `C:\Users\<User>\Videos\BroTube\videos\`
  - Audio extractions: `C:\Users\<User>\Videos\BroTube\audios\`
  - Full playlists: `C:\Users\<User>\Videos\BroTube\videos\<playlist_title>\01 - <video_title>.mkv`
- **Anti-Bot Defuser**: Uses `--js-runtimes node --remote-components ejs:github` to resolve YouTube JavaScript cipher puzzles, backed by session cookie export from `%APPDATA%\BroTube\Profile\`.

---

## 6. Native Share & External Protocol Pipeline

BroTube handles external link dispatching from within YouTube's guest webview:

- **Window Open Interception**: Electron's `setWindowOpenHandler` inspects navigation requests from guest webview contexts.
- **Protocol Routing**:
  - Social & Messaging: `whatsapp:`, `https://api.whatsapp.com/`, `https://wa.me/`, `twitter.com/intent/tweet`, `facebook.com/sharer/`.
  - Mail & OS Protocols: `mailto:`, `tg:`, `discord:`.
- **Desktop Dispatch**: Instead of spawning unusable popups inside the sandboxed webview, URLs are dispatched via `shell.openExternal(url)`, delegating to the user's default browser or registered Windows desktop app (e.g. WhatsApp for Windows).

---

## 7. Process Safety & Window Close Guard

To prevent accidental termination during active lossless video downloads or audio muxing:

1. **Close Event Hook**: The `close` event on `BrowserWindow` is intercepted.
2. **Active Task Verification**: `downloader.hasActiveDownloads()` checks if any `yt-dlp` or `ffmpeg` child processes are currently running.
3. **Spatial Confirmation Modal**:
   - If processes are running, the close event is prevented (`event.preventDefault()`).
   - BroTube renders a spatial Liquid Glass warning dialog alerting the user to active background jobs.
   - "Cancel" closes the modal and resumes work without interrupting downloads.
   - "Quit Anyway" gracefully aborts active child process trees and terminates the application cleanly.

---

## 8. Memory & Event Listener Architecture

To ensure zero memory leakage during long streaming and navigation sessions:

- **WebContents Ceiling**: Electron limits `WebContents` EventEmitter to 10 listeners by default. With multiple preload bridges and webview hooks, this triggered `MaxListenersExceededWarning`.
- **Dynamic Capacity**: Main process listens on `app.on('web-contents-created', (e, contents) => contents.setMaxListeners(50))`, ensuring ample capacity for complex multi-context navigation.
- **Deduplicated IPC Listeners**: Navigation event hooks (`did-stop-loading`, `will-navigate`) are registered as singletons, preventing cumulative registrations across page navigations.
