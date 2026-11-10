# Changelog

All notable changes to BroTube are documented here.

## [1.0.0] — 2026-10-18

### Added
- **Brave-Parity Ad Defuser** — Zero-ad experience via Blink-native CSS injection and universal `JSON.parse` player data filtering
- **Lossless 4K/8K DASH Downloader** — yt-dlp + Gyan FFmpeg 9.0.1; peak 8K/4K HDR, 1440p, 1080p60, 720p, FLAC, MP3 320k, Opus
- **Smart Folder Organization** — Videos → `Videos/BroTube/videos/`, audio → `Videos/BroTube/audios/`
- **Playlist Batch Downloads** — Full playlist support with subfolder sorting, live track progress and ETA telemetry
- **iOS / visionOS Liquid Glass UI** — 3-layer design token system, Apple SF Pro, authentic visionOS blur depths (42–54px)
- **Dynamic Theme Sync** — Light/Dark toggle updates both app HUD and YouTube's internal player theme in real-time
- **Native Share Integration** — WhatsApp, Email, Twitter/X, Facebook share drawer triggers native OS protocols
- **Window Close Guard** — Intercepts accidental closure during active downloads with a spatial confirmation modal
- **Dynamic Shorts Redirection** — Toggle between Shorts feed and full desktop player mode
- **Windows 11 Fluent Frame** — Frameless chrome with specular rim border, 10px rounded corners, red close hover
- **Kinetic Typography Entrance** — Animated opening screen with neon logo breathing pulse and spring-settle text
- **300% Volume Booster** — WebAudio Gain Node with dynamics compressor limiter
- **Native Floating Picture-in-Picture** — OS-level floating player
- **Native Google Session Auth** — Login within sandboxed profile; cookies auto-sync for premium/age-restricted downloads
- **1-Click Direct Download Mode** — Persistent quality memory, skips modal for repeat downloads
- **Downloads Hub** — Scrollable drawer with live stats, concurrency isolation, transcoder cap
- **Debug Mode & Log Scanner** — Toggleable diagnostic overlay with capped 600-entry circular log buffer
- **GPU TDR Safeguards** — `disable-gpu-sandbox`, `disable-gpu-watchdog`, DirectComposition overlay disabling
- **Silent yt-dlp Auto-Update** — Background update on startup to keep downloads working as YouTube evolves
- **Dislike Count Badge** — Cached retry injection for Return YouTube Dislike extension compatibility
- **Self-Check Test Suite** — 20-section zero-dependency assertion suite (`npm test`)
