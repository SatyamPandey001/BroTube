---
title: BroTube - Session Log & Progress
tags: [project/brotube, logs, session, progress]
created: 2026-10-10
updated: 2026-10-10
---

# 📝 Session Log & Milestone Tracking

## 📅 Session 6: 2026-11-22 (Clip Trimming Pipeline Hardening & Quality Tag Calibration - v1.0.2)

### Accomplished:
- [x] Fixed clip timing range download pipeline:
  - Added sanitized clip range suffix (`[Clip <start>-<end>]`) to output filename templates to prevent duplicate skip collisions.
  - Added explicit `--print after_move:final_filepath:%(filepath)s` in yt-dlp arguments to guarantee exact final path resolution.
  - Restricted regex destination matching (`destMatch`) and fallback scanning to true media containers, preventing intermediate `.webp` thumbnails from usurping video destinations.
  - Added orphan thumbnail cleanup for section exports.
- [x] Fixed Downloads Hub "4K UHD" tag mislabeling:
  - Decoupled default preset from `"Peak 4K/8K"` to `"Best Quality"`.
  - Added dynamic resolution refinement upon download completion (`8K UHD`, `4K UHD`, `2K QHD`, `1080p HD`, `720p HD`).
- [x] Eliminated UI freeze during silent FFmpeg stream trimming:
  - Injected synthetic processing telemetry (`Trimming clip via FFmpeg...`) and active UI state.
- [x] Hardened environment augmentation:
  - Unified Windows `PATH` and `Path` casing and added application executable directory discovery.
- [x] Offloaded debug logging disk writes to non-blocking asynchronous calls.
- [x] Expanded automated test suite (`test/self-check.js`) with clip output template, filepath reporting, and extension isolation assertions.

## 📅 Session 5: 2026-11-22 (Production Hardening & Download 403 / Standalone Binary Fixes)

### Accomplished:
- [x] Identified root cause of download failures in dev and packaged `.exe`:
  - `brotube_cookies.enc` persisted unauthenticated guest cookies that caused YouTube Google Video Server CDN to reject streams with `HTTP Error 403: Forbidden`.
  - Bundled `bin/yt-dlp.exe` was a 108 KB pip script wrapper with a hardcoded developer path (`#!C:\Users\GAURI\...`) instead of a genuine standalone executable.
- [x] Upgraded `bin/yt-dlp.exe` to the official standalone 22.4 MB PyInstaller binary from GitHub Releases (yt-dlp 2026.10.26).
- [x] Added `fs.statSync().size > 1024 * 1024` guard in `resolveYtDlpRunner()` to reject shims and ensure only genuine standalone binaries are executed or copied to AppData.
- [x] Hardened `syncSessionCookies()` to only save/provide cookies if active authentication tokens (`LOGIN_INFO`, `SAPISID`, or `__Secure-3PSID`) exist; purged unauthenticated cookie files.
- [x] Implemented automatic 1-shot retry without cookies in `startDownload()` and `getVideoInfo()` upon encountering `HTTP Error 403: Forbidden`, guaranteeing seamless downloads for unauthenticated users.
- [x] Injected augmented PATH in child process spawning for reliable detection of bundled or system tools (Node, FFmpeg, AppData bin).
- [x] Added window close fast-path in `index.js` when `runningTasks === 0`, preventing UI close deadlocks.
- [x] Tested live download end-to-end with verified 100% completion.
- [x] Updated self-check test suite (`test/self-check.js`) with 403 auto-recovery and standalone binary assertions.

## 📅 Session 1: 2026-10-10 (Kickoff & Core Assembly)

### Accomplished:
- [x] Initialized architecture requirements via `/grill-me`.
- [x] Detected system environment: Python 3.14.7, `nodejs_wheel` Node.js v24.19.0, npm 11.17.0.
- [x] Installed and configured **Gyan FFmpeg 9.0.1 Essentials** into permanent Windows PATH.
- [x] Validated **`yt-dlp`** 2026.08.19 engine.
- [x] Initialized Obsidian Vault structure (`BroTube_Vault/`) with tracking notes and Obsidian config.
- [x] Built core Electron application with Windows 11 Spatial Glassmorphism HUD.
- [x] Injected Brave-level ad-blocking scriptlets and SponsorBlock integration.
- [x] Created lossless 4K/8K media downloader IPC bridge with real-time progress.
- [x] Added "Export to Obsidian" markdown note generator for timestamped video notes.
- [x] Fixed frameless window minimize & maximize controls: added `-webkit-app-region: no-drag !important` to buttons, set SVG `pointer-events: none`, added sender window resolution with `restore()` fallback, and enabled titlebar double-click to toggle maximize.

### Pending / Next Steps:
- [x] Fixed all 14 Ponytail audit findings:
  - Eliminated sandboxed preload boot crash (removed illegal `require('fs')`).
  - Created isolated guest preload for YouTube webview with separate context bridge.
  - Fixed audio-only download fatal crash (removed `--merge-output-format` on audio extractions).
  - Wired Brave-parity network adblocker to partition session `persist:brotube`.
  - Added playback rate and volume restoration when ads finish.
  - Fixed WebAudio volume booster injection across context isolation.
  - Fixed PiP window minimum size bounds on Windows 11.
  - Implemented download task tracking and cancel button support.
  - Made launcher script portable using `%LOCALAPPDATA%`.
  - Expanded automated self-check test suite with unit assertions.
  - Eliminated "gimmick" behavior across all HUD buttons:
    - Added instant video DOM metadata extraction (title, creator, duration, video ID) in `app.js` instead of 10s Python CLI blocking.
    - Added YouTube Shorts support (`/shorts/`) across all download and export buttons.
    - Wired native OS floating Picture-in-Picture (`requestPictureInPicture`) on playing videos.
    - Fixed Audio Booster context suspension (`resume()`) and dynamic `<video>` re-attachment across page navigations.
    - Pre-filled live video timestamps in Obsidian notes exporter.
    - Added dynamic button opacity feedback for browser back/forward navigation.
  - Fixed bulk playlist/media download bug:
    - Added `--no-playlist` flag to `yt-dlp` to ensure only the active single video downloads.
    - Added `cleanVideoUrl` to strip `&list=` / `&index=` playlist parameters from recommended video URLs.
    - Updated Download button to always open the media and quality selection modal (with organized Video vs Audio optgroups) instead of downloading unprompted.
  - Resolved YouTube Anti-Bot Challenge ("Sign in to confirm you're not a bot"):
    - Equipped `yt-dlp` with Node.js JavaScript challenge solver (`--js-runtimes node --remote-components ejs:github`) to resolve `n`-token and signature ciphers.
    - Added automatic Chromium session cookie export (`session.fromPartition('persist:brotube')`) to `brotube_cookies.txt` with browser auto-import fallback.
  - Streamlined Header Frame & Software Identity:
    - Confirmed software identity is strictly **BroTube** (eliminated all "spatial" branding and tags).
    - Removed odd download button and drawer button from top titlebar frame.
    - Consolidated all tools (Download Video / Audio, Downloads Queue, PiP, Cookie Sync, Engine Update, Folder Opener) inside clean Settings & Tools menu popover.
    - Re-positioned Settings gear button neatly right before window controls with aligned popover.
  - Corrected Obsidian Integration Scope:
    - Clarified that Obsidian is the project's development lifecycle vault (`BroTube_Vault/`), not an in-app feature.
    - Completely stripped unused in-app note exporter (`obsidian.js`, IPC handlers, and modal UI) to keep BroTube light, clean, and bloat-free.
  - Windows Frame Icon Branding:
    - Configured `Neon Download Player Icon.png` across the native Windows desktop frame (`BrowserWindow` icon), the main window header/titlebar chrome, HTML favicon, and the splash screen.

---

## 📅 Session 2: 2026-10-10 (Brave-Parity Adblock & Playlist Batching)

### Accomplished:
- [x] **Brave-Parity Adblock Engine Hardening**:
  - Injected 30+ Blink-native CSS adblock rules into guest preload hiding banner slots, masthead promotions, promoted discovery cards, and player ad modules (`ytd-ad-slot-renderer`, `.video-ads`, `ytp-ad-module`, etc.).
  - Added universal `JSON.parse` hook in guest execution context stripping `playerAds`, `adPlacements`, and `adSlots` from player initialization data before player instantiation.
  - Implemented 10ms micro-interval ad skippers with unskippable video auto-fast-forward (`video.currentTime = video.duration`) as instant fallback.
- [x] **Full Playlist Batch Downloading**:
  - Implemented playlist URL recognition (`/playlist?list=` and `&list=`).
  - Added playlist batch routing: downloads each item sequentially into dedicated subfolders (`Videos/BroTube/videos/<playlist_title>/01 - Title.mkv`).
  - Added playlist progress tracking and count aggregation.
- [x] **Header Drag Region Usability**:
  - Fixed top middle titlebar dead zone: ensured central header area has `-webkit-app-region: drag` for window moving, while isolating interactive buttons with `-webkit-app-region: no-drag !important`.

---

## 📅 Session 3: 2026-10-11 (UI/UX Design Tokens & Kinetic Typography)

### Accomplished:
- [x] **3-Layer Design Token Architecture**:
  - Re-architected `styles.css` with primitives (palette ramps, glass blur scales, spring curves), semantic tokens (`[data-theme="dark"]` and `[data-theme="light"]`), and component specifications.
- [x] **Frame Icon Branding Alignment**:
  - Replaced animated `.mp4` references on the titlebar header with static high-res `Neon Download Player Icon.png`.
  - Added subtle glowing ambient aura to the header logo.
- [x] **Kinetic Typography Opening Screen**:
  - Retained opening video backdrop with overlayed branding card.
  - Integrated Google Fonts **Outfit** and **Plus Jakarta Sans** with letter-spacing tracking animation (`0.25em` to `0.02em`) and spring-settle entrance curve.
  - Implemented floating neon badge pulse on opening screen icon.
- [x] **Windows 11 Fluent Frame Integration**:
  - Styled frameless window controls (38×30px, smooth transitions, fluent red close hover `#e81123`).
  - Added 1px spatial glass border and 10px rounded corners to `.app-container`.
  - Added `.window-maximized` listener to automatically flush border radius and frame borders to zero when maximized.

---

## 📅 Session 4: 2026-10-11 (Live Playlist Titles, Theme Sync & Audit)

### Accomplished:
- [x] **Real-Time Playlist Track Titles**:
  - Spawns `yt-dlp` with `--print after_video:video_title:%(title)s --no-simulate`.
  - Captures `video_title:` stdout stream and regex-parses `Track X/Y` counters to dynamically refresh `.dl-title` with `[Track X/Y] Actual Video Title` in real-time.
- [x] **Playlist Thumbnail & First-Video Resolution**:
  - Updated `getActiveVideoMeta()` to instantly scrape playlist cover and first video thumbnail directly from DOM (`ytd-playlist-header-renderer` / `ytd-playlist-video-renderer`).
  - Updated `getVideoInfo` in downloader to resolve playlist thumbnails via `--flat-playlist --playlist-items 1` with fallback to `data.thumbnails` and `data.entries[0]`.
- [x] **Webpage (YouTube) Light & Dark Theme Synchronization**:
  - Implemented `set-theme` IPC handler syncing Electron `nativeTheme.themeSource`, window background, and persistent YouTube `PREF` cookie (`f6=40000000` dark vs `f6=400` light).
  - Wired guest preload `brotube-theme-sync` listener dynamically toggling YouTube DOM `dark` / `light` attributes and injecting responsive `SPATIAL_CSS` rules for YouTube masthead, guide, and player.
- [x] **Intro Screen Dismiss & Escape Key Handler Resiliency**:
  - Fixed startup lockup where premature `webview.executeJavaScript` call in `syncWebviewTheme` aborted `initApp()` before splash controller registration.
  - Replaced undeclared identifier `alertModal` with `spatialAlertModal` in the global `Escape` keydown handler to prevent `ReferenceError` crashes when dismissing prompts.
  - Moved splash screen controller to the top of `initApp()` with direct click/Escape listeners and registered an inline bulletproof auto-dismissal failsafe script in `index.html`.
- [x] **Project Cleanup & Lifecycle Hygiene**:
  - Removed duplicate loose media files from workspace root (`Animated Icon.mp4` and `Neon Download Player Icon.png`), reclaiming ~12.2 MB.
  - Cleaned scratch test scripts from artifact directory.
  - Created root `README.md` with complete documentation, gestures, and shortcut guides.
  - Updated all Obsidian vault notes to accurately reflect version 1.2.0.
  - Re-verified all test assertions in `test/self-check.js` (100% pass rate).

---

## 📅 Session 5: 2026-10-11 (iOS Liquid Glass Redesign, External Share, Close Safety & Stability)

### Accomplished:
- [x] **iOS & visionOS Liquid Glass 3-Layer Design System**:
  - Restructured all application surfaces, slides, and layers using Apple SF Pro typography stack (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text"`), tightening letter tracking (`--tracking-tight: -0.015em`, `--tracking-normal: -0.005em`, `--tracking-wide: 0.025em`).
  - Increased blur levels to authentic visionOS depths (`--blur-header: 42px`, `--blur-surface: 46px`, `--blur-drawer: 48px`, `--blur-modal: 54px`).
  - Deepened transparency levels (`0.44`–`0.52` in dark mode, `0.48`–`0.56` in light mode) with specular rim light insets (`inset 0 1px 0 0 rgba(...)`) and multi-stage ambient drop shadows (`0 24px 56px -12px rgba(...)`).
  - Restructured Light Mode typography with high-contrast deep ink (`#0a0e17` primary, `#334155` secondary) to ensure crystal-clear legibility over frosted snow backdrops.
- [x] **External Protocol & Native Share Integration**:
  - Resolved non-functional social sharing (e.g. clicking WhatsApp, Email, Twitter/X from YouTube's share drawer previously failed silently inside the webview).
  - Implemented `setWindowOpenHandler` in Electron main process, parsing URL protocols (`whatsapp:`, `mailto:`, `https://api.whatsapp.com/`, `https://wa.me/`, and web share intents) and dispatching directly to the OS / default browser via `shell.openExternal`.
- [x] **Settings Toggle Switch Smooth Animations**:
  - Fixed frozen toggle switches in Settings popover where toggle thumbs remained static when clicked.
  - Corrected CSS transform transitions and switch hitbox styling across both light and dark themes.
- [x] **Process Safety on Close (Window Close Guard)**:
  - Added download and conversion state verification to window close lifecycle (`downloader.hasActiveDownloads()`).
  - When closing with running tasks, intercepts close and displays an iOS Liquid Glass spatial confirmation modal warning of in-flight operations with "Cancel" and "Quit Anyway" actions.
- [x] **Downloads Hub UI Overhaul & Real-Time Progress Stream**:
  - Restyled Downloads Hub drawer with elevated header, pill status counter, clear action icon, and glass card styling for individual download items.
  - Fixed progress bar issue where progress remained at 0% until snapping to 100%; now streams live percentage, speed, and ETA directly from `yt-dlp` output chunks.
- [x] **Shorts Redirection Toggle Persistence**:
  - Fixed Shorts redirect toggle behavior: when ON, redirects `/shorts/<id>` to standard `/watch?v=<id>` video player mode; when turned OFF, gracefully disables the redirection and allows native Shorts viewing.
- [x] **MaxListenersExceededWarning Memory Leak Defuser**:
  - Resolved Node.js EventEmitter warning: `(node:10480) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 did-stop-loading listeners added to [WebContents]`.
  - Configured `app.on('web-contents-created', ...)` with `contents.setMaxListeners(50)`.
  - Streamlined `did-stop-loading` and `will-navigate` listeners in renderer and host to eliminate duplicate subscriptions.

---

## 📅 Session 6: 2026-10-18 (Shorts, Suggestions & Homepage Download Redirection + Options Modal)

### Accomplished:
- [x] **Universal Download Options Modal Guarantee**:
  - Bypassed auto-direct download on webview download events in `src/renderer/app.js` (`guest-download-current` and `guest-download-url`).
  - Clicking any in-player or card download trigger now consistently opens the Lossless Studio Download modal (`openDownloadModal`), giving users full quality, format, audio/video, subtitle, and clipping options before starting.
- [x] **Suggestions & Homepage Video Card Download Interception**:
  - Removed `ytd-download-button-renderer` from `SPATIAL_CSS` hidden elements in `src/preload/guest-preload.js`.
  - Upgraded `injectThumbnailBtn` to detect video card containers (`ytd-compact-video-renderer`, `ytd-rich-item-renderer`, `ytd-video-renderer`, etc.) on hover anywhere on the card.
  - Implemented `lastMenuCard` tracking on `pointerdown` for YouTube's 3-dots menus; clicking "Download video" / "Download" in popup menus extracts the specific card's URL and title rather than defaulting to the active playing video.
- [x] **YouTube Shorts In-Player Download Action Integration**:
  - Created `.brotube-shorts-dl-btn` matching native YouTube Shorts circular glass button styling and layout.
  - Injected download action button into `ytd-reel-video-renderer #actions` across Shorts carousels and navigation.
  - Wired click listener to capture active Short URL and title and dispatch `guest-download-url` straight to BroTube's options modal.
- [x] **Automated Self-Check Verification**:
  - Added Check 15 to `test/self-check.js` asserting Shorts download injection, menu card tracking, suggestion card handling, and options modal routing (100% pass rate).

---

## 📅 Session 7 — Clip Feature Removal & Simplification (2026-11-22)

- **Removed Clip / Time-Range Controls**:
  - Removed `<div class="time-range-box">` and timestamp input elements from `src/renderer/index.html`.
  - Removed all clip event listeners, input parsers, and `timeRange` payload parameters from `src/renderer/app.js`.
  - Removed `--download-sections` and `--force-keyframes-at-cuts` from `src/main/downloader.js`.
  - Updated test assertions in `test/self-check.js` (all 20 test suites pass).

---

## 📌 Active Backlog & Future Milestones

- [ ] Monitor YouTube anti-adblock scriptlet updates for future releases.
- [ ] Explore optional concurrent multi-stream download acceleration for large playlists.

