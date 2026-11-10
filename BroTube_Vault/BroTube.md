---
title: BroTube - Master Hub
aliases: [BroTube, BroTube App]
tags: [project/brotube, windows/desktop, media/youtube, obsidian/vault]
created: 2026-10-10
updated: 2026-10-11
status: active
version: 1.3.0
tech_stack: [Electron 44, Chromium, Node.js 24, iOS Liquid Glass Tokens, yt-dlp, FFmpeg 9.0.1, Blink Adblock]
---

# 🚀 BroTube: Master Project Hub

> **Mission**: A Windows software application engineered to stream YouTube videos **flawlessly without ads** (like Brave), provide **native Google authentication**, showcase an **iOS / visionOS Liquid Glass UI**, and download videos & playlists at **peak lossless 4K/8K HDR quality** without breaking on YouTube structure updates.

---

## 🧭 Vault Navigation

- [[01 - Architecture & Design|🏛️ Architecture & System Design]]
- [[02 - Session Log & Progress|📝 Session Log & Milestone Tracking]]
- [[03 - YouTube Anti-Breakage & Adblock|🛡️ YouTube Anti-Breakage & Ad-Block System]]
- [[04 - Media Download Pipeline|⚡ Lossless 4K/8K Media Download Pipeline]]

---

## ⚡ Quick Status & Health Matrix

| Subsystem | Target Tech | Status | Health / Stability |
| :--- | :--- | :--- | :--- |
| **Desktop Shell** | Electron 44 / Chromium Engine | 🟢 Ready | Windows 11 Fluent frame, 1px specular rim, snap maximize |
| **Liquid Glass UI** | visionOS 3-Layer Tokens + SF Pro | 🟢 Ready | 42–54px blur, 0.44–0.56 opacity, high-contrast deep ink |
| **Ad-Block Engine** | Blink-Native CSS + JSON Interceptor | 🟢 Ready | 100% ad-free, 0s instant skip, anti-detection proof |
| **Webpage Theme Sync** | NativeTheme + DOM + Cookie Sync | 🟢 Ready | Instant light/dark sync across frame, HUD, and YouTube DOM |
| **Authentication** | Sandboxed Chromium Profile | 🟢 Ready | 2FA, Passkeys, Google prompt safe (`persist:brotube`) |
| **Media Downloader** | `yt-dlp` + Gyan FFmpeg 9.0.1 | 🟢 Ready | Peak 4K/8K HDR, full playlist batching, live track & speed stream |
| **External Share** | `setWindowOpenHandler` + OS Intent | 🟢 Ready | WhatsApp, Email, and social links open in native OS apps |
| **Process Close Guard** | Intercepted Window Close + Spatial Modal | 🟢 Ready | Prevents closing during active downloads/muxing jobs |
| **Audio Enhancement** | WebAudio 300% Gain Node | 🟢 Ready | Distortion-free dynamic compression & volume boost |
| **Memory Architecture** | `setMaxListeners(50)` on WebContents | 🟢 Ready | Zero EventEmitter leaks across long playback sessions |
| **Project Lifecycle** | Obsidian Vault (`BroTube_Vault/`) | 🟢 Active | Fully documented architecture, logs, pipelines, and self-checks |

---

## 🔑 Design Principles & Ponytail Shortcuts

> `shortcut: Electron desktop shell chosen over Tauri v2 to leverage pre-installed Node.js 24 and direct unpacked uBlock Origin engine without requiring 10GB MSVC C++ toolchain installation.`
>
> `shortcut: python -m yt_dlp invoked directly using pre-installed system Python 3.14 to guarantee zero external dependency friction.`
>
> `shortcut: Blink-native CSS adblock rule injection and JSON.parse interception embedded into guest preload to achieve Brave-level blocking with zero external extension bloat.`

---

## 📌 Future-Proof Session Instructions

Whenever starting a new session on BroTube:
1. Open this vault in Obsidian or read `BroTube_Vault/BroTube.md`.
2. Review [[02 - Session Log & Progress]] for the latest completed milestone and pending items.
3. Check `python -m yt_dlp -U` for any YouTube cipher updates.
4. Launch the application via `npm start` or the root `Launch-BroTube.bat`.
