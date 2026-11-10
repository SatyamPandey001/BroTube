---
title: BroTube - Anti-Breakage & Adblock System
tags: [project/brotube, adblock, brave, scriptlets, security, theme-sync]
created: 2026-10-10
updated: 2026-10-11
---

# 🛡️ YouTube Anti-Breakage & Ad-Block System

## 1. The Anti-Breakage Guarantee

BroTube ensures complete resilience against YouTube updates through three fundamental mechanisms:

1. **Chromium Rendering Pipeline**: BroTube executes YouTube inside the official Chromium WebView environment. As YouTube updates its Polymer web components, CSS layouts, and internal JavaScript, Chromium renders them naturally without requiring scraper maintenance.
2. **Network Request Interception**: Ad-tracking domains, analytics beacons, and preroll video ad manifests (`doubleclick.net`, `googleads.g.doubleclick.net`, `googlevideo.com/videoplayback?*&adformat=*`) are intercepted and dropped at the Chromium session layer before they hit the network.
3. **Anti-Adblock Defuser Scriptlets**: When YouTube attempts to trigger its "Ad blockers violate YouTube's Terms of Service" popup or force pauses, BroTube's preload script overrides `ytPubsub` ad-notification events and removes dialog modals automatically.

---

## 2. Brave-Parity Multi-Tier Ad-Block Engine

To match Brave Browser's ad-blocking reliability, BroTube employs a multi-tiered defense:

### Tier 1: Blink-Native CSS Rule Injection
Injected immediately upon DOM creation into the guest webview (`guest-preload.js`), targeting 30+ layout and ad slot selectors with `display: none !important; opacity: 0 !important; pointer-events: none !important; height: 0 !important;`:
- `ytd-ad-slot-renderer`, `ytd-in-feed-ad-layout-renderer`, `ytd-banner-promo-renderer`
- `ytd-promoted-sparkles-web-renderer`, `ytd-statement-banner-renderer`
- `.video-ads`, `.ytp-ad-module`, `.ytp-ad-overlay-container`, `.ytp-ad-player-overlay`
- `ytd-enforcement-message-view-model`, `yt-mealbar-promo-renderer`

### Tier 2: Universal `JSON.parse` Hook
Hooks `window.JSON.parse` in the guest window to sanitize player payloads before YouTube's frontend scripts parse them:
- Automatically deletes `playerAds`, `adPlacements`, `adSlots`, and `adBreakParams`.
- Strips promo payloads and survey questions.

### Tier 3: Fetch & XHR Request Interception
Patches `window.fetch` and `XMLHttpRequest.prototype.open` to monitor calls to `/youtubei/v1/player` and `/youtubei/v1/next`:
- Cleans ad objects from returned JSON responses.
- Neutralizes tracking beacons targeting `/api/stats/ads` or `/pagead/`.

### Tier 4: Micro-Interval Fast-Forward Auto-Skipper
If an ad stream ever bypasses network and JSON filters:
- Detects the `.ad-showing` class on the video player element.
- Instantly advances `video.currentTime = video.duration` (skipping the entire video ad duration in <10ms).
- Programmatically triggers click events on `.ytp-ad-skip-button`, `.ytp-ad-skip-button-modern`, and `.ytp-skip-ad-button`.

---

## 3. Dynamic Webpage Theme Synchronization

BroTube guarantees seamless visual cohesion between the host app and the YouTube webview:

- **Brotube Theme Sync Listener**: Guest preload listens for `brotube-theme-sync` messages from the host renderer.
- **Dynamic CSS Injection**: Injects `SPATIAL_CSS` rules styling `#masthead`, `#guide`, `ytd-app`, `#chips`, and scrollbars according to active theme.
- **DOM Attribute Switching**: Toggles the `dark` attribute on `document.documentElement` dynamically without reloading the page.
- **Session Cookie Persistence**: Writes `f6=40000000` (Dark) or `f6=400` (Light) into the Chromium `PREF` cookie jar for persistent reloads.

---

## 4. Integrated SponsorBlock

BroTube connects to the public SponsorBlock API (`https://sponsor.ajay.app/api/skipSegments`):
- Retrieves community-submitted segments (Sponsor, Intermission, Intro, Outro, Self-Promo).
- Displays visual segment bars directly on the video scrubber.
- Automatically skips segments with smooth transitions.

---

## 5. Dynamic YouTube Shorts Redirection Controller

YouTube Shorts enforce a vertical UI with limited playback controls and auto-looping. BroTube provides toggleable redirection control:
- **Watch Mode Conversion**: When "Redirect Shorts" is enabled in Settings, the guest webview automatically transforms `/shorts/<id>` URLs into `/watch?v=<id>`, allowing users to view shorts with standard desktop player controls, scrubber, speed adjustment, and quality selection.
- **Bi-Directional State Sync**: When toggled off, redirection is disabled cleanly without trapping navigation, enabling native Shorts layout exploration on demand.

---

## 6. External Share Intent & Protocol Interception

When users interact with YouTube's native Share menu (WhatsApp, Email, Twitter/X, Facebook):
- Standard webview sandboxing typically blocks or breaks `window.open` requests and custom schemes (`whatsapp://`, `mailto:`).
- BroTube intercepts `setWindowOpenHandler` calls across all guest webviews.
- Automatically normalizes URL intents and passes them to `shell.openExternal(url)`, delegating to the native Windows app or system browser without interrupting YouTube playback.
