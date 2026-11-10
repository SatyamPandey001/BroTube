---
title: BroTube - Media Download Pipeline
tags: [project/brotube, yt-dlp, ffmpeg, downloads, lossless, 4k, 8k, playlists]
created: 2026-10-10
updated: 2026-10-11
---

# ⚡ Lossless 4K/8K Media Download Pipeline

## 1. Zero Quality Compromise

YouTube streams 1080p, 1440p (2K), 2160p (4K), and 4320p (8K) as isolated DASH streams:
- High-resolution video: AV1 (`av01`) or VP9 (`vp09`) without sound.
- High-fidelity audio: Opus 160kbps (`opus`) or AAC 128kbps (`mp4a`) without video.

BroTube downloads the absolute highest available quality stream pair using `yt-dlp` and losslessly muxes them via **Gyan FFmpeg 9.0.1 Essentials** into MKV/MP4 containers without re-encoding, preserving 100% of the original bitstream, HDR color metadata, and multi-channel audio.

---

## 2. Dynamic Format Matrix & Cookie Sharing

When the user clicks the Download HUD button:
1. BroTube queries `python -m yt_dlp -J [URL]` with the user's active session cookies extracted from `%APPDATA%/BroTube/Profile`.
2. This unlocks 1080p Premium (enhanced bitrate), age-restricted content, and member-only videos.
3. The user can select:
   - **Quick Peak**: Downloads the best video + best audio instantly.
   - **Custom Quality**: 8K, 4K HDR, 1440p, 1080p 60fps, 720p, or Audio-Only (FLAC / MP3 320k / Opus).
   - **Extras**: Embed thumbnail, subtitles, and chapter markers.

---

## 3. Playlist Batch Downloading & Directory Partitioning

BroTube automatically identifies playlist URLs (`/playlist?list=` or `&list=`) and adapts the download strategy:

- **Isolated Subfolder Routing**:
  - Standalone videos: `C:\Users\<User>\Videos\BroTube\videos\%(title)s.%(ext)s`
  - Audio tracks: `C:\Users\<User>\Videos\BroTube\audios\%(title)s.%(ext)s`
  - Playlists: `C:\Users\<User>\Videos\BroTube\videos\<playlist_title>\%(playlist_index)02d - %(title)s.%(ext)s`
- **Instant Playlist Metadata & Thumbnail Extraction**:
  - Active page DOM is inspected for `ytd-playlist-header-renderer` and `ytd-playlist-video-renderer` to extract playlist cover thumbnails in 0ms without waiting for CLI network calls.
  - Downloader CLI fallback invokes `yt-dlp --flat-playlist --playlist-items 1` to resolve playlist title and high-resolution cover image from `data.thumbnails` or `data.entries[0]`.

---

## 4. Real-Time Track Title & Telemetry Progress Stream

Unlike standard downloaders where playlist progress freezes or jumps directly from 0% to 100%, BroTube features continuous live progress streaming:

1. **Stdout Injection**: `yt-dlp` is spawned with `--print after_video:video_title:%(title)s --no-simulate`.
2. **Stdout Stream Parsing**:
   - Matches `video_title:<Title>` lines as individual playlist items transition.
   - Matches `\[download\] Downloading video (\d+) of (\d+)` or `\[download\] Downloading item (\d+) of (\d+)` to compute `Track X/Y`.
   - Parses regex `\[download\]\s+([\d\.]+)%\s+of\s+~?([\d\.]+\w+)\s+at\s+([\d\.]+\w+\/s)\s+ETA\s+([\d:]+)` extracting instantaneous percent, total size, transfer speed, and remaining time.
3. **IPC Notification**: Emits `download-progress` with `{ playlistInfo: 'Track X/Y', currentTitle: '...', percent, speed, eta }`.
4. **Live UI Refresh**: Dynamically animates the gradient progress bar, percentage badge, speed indicator, and track title inside the Downloads Hub drawer.

---

## 5. JavaScript Cipher & Anti-Bot Solving

YouTube frequently updates its JavaScript signature and `n`-token ciphers:
- BroTube equips `yt-dlp` with the Node.js JavaScript runtime: `--js-runtimes node --remote-components ejs:github`.
- Automatically executes cipher solver routines in Node.js to bypass download throttle speed restrictions (guaranteeing full-bandwidth 20–50+ MB/s download speeds).

---

## 6. Process Safety & Active Job Protection

BroTube tracks all running child download and conversion processes:
- `downloader.hasActiveDownloads()` maintains an active job registry.
- If the user attempts to close the window while downloads or FFmpeg muxing jobs are running, the host window close event is intercepted.
- A spatial liquid glass confirmation modal is presented, preventing corrupt partially-muxed media files while giving the user full control to either cancel closure or force a clean process termination.
