const { contextBridge, webFrame, ipcRenderer } = require('electron');

// Spatial Stylesheet for YouTube (inlined to work safely in sandboxed webviews)
const SPATIAL_CSS = `
ytd-promoted-video-renderer,
ytd-banner-promo-renderer,
ytd-ad-slot-renderer,
ytd-in-feed-ad-layout-renderer,
ytd-statement-banner-renderer,
ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer),
ytd-rich-item-renderer:has(ytd-banner-promo-renderer),
ytd-rich-item-renderer:has(ytd-promoted-video-renderer),
ytd-rich-item-renderer:has(ytd-display-ad-renderer),
ytd-rich-item-renderer:has(ytd-primetime-promo-renderer),
ytd-rich-item-renderer:has(ytd-feed-ad-metadata-renderer),
ytd-rich-item-renderer:has(#ad-content),
ytd-rich-item-renderer:has(.ytd-ad-slot-renderer),
ytd-rich-item-renderer:has(.ytd-in-feed-ad-layout-renderer),
ytd-rich-section-renderer:has(ytd-statement-banner-renderer),
ytd-rich-section-renderer:has(ytd-banner-promo-renderer),
ytd-rich-section-renderer:has(ytd-in-feed-ad-layout-renderer),
ytd-rich-section-renderer:has(ytd-ad-slot-renderer),
ytd-rich-section-renderer:has(ytd-brand-video-singleton-renderer),
ytd-rich-section-renderer:has(.ytd-ad-slot-renderer),
ytd-rich-section-renderer:has(.ytd-in-feed-ad-layout-renderer),
#masthead-ad,
#player-ads,
.ytp-ad-module,
.ytp-ad-overlay-container,
.ytp-ad-message-container,
ytd-merch-shelf-renderer,
#clarify-box,
ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"],
.video-ads,
.ytp-ad-progress-list,
.ytp-ad-marker,
.ytp-ad-play-progress,
.ytp-ad-player-overlay,
.ytp-ad-player-overlay-layout,
.ytp-ad-action-interstitial,
.ytp-ad-action-interstitial-background-container,
ytd-action-companion-ad-renderer,
ytd-display-ad-renderer,
ytd-compact-promoted-video-renderer,
ytd-mealbar-promo-renderer,
yt-mealbar-promo-renderer,
ytd-enforcement-message-view-model,
yt-playability-error-supported-renderers,
.ytp-playability-error-supported-renderers,
tp-yt-paper-toast:has(a[href*="google.com"]),
tp-yt-paper-toast:has(a[href*="support.google.com"]),
tp-yt-paper-toast:has(a[href*="answer"]),
tp-yt-paper-toast:has([href*="answer"]),
ytd-notification-action-renderer:has(a[href*="google.com"]),
ytd-notification-action-renderer:has(a[href*="support.google.com"]),
ytd-notification-action-renderer:has(a[href*="answer"]),
ytd-notification-action-renderer:has([href*="answer"]),
yt-notification-action-renderer:has(a[href*="google.com"]),
yt-notification-action-renderer:has(a[href*="support.google.com"]),
yt-notification-action-renderer:has(a[href*="answer"]),
#toast:has(a[href*="google.com"]),
#toast:has(a[href*="support.google.com"]),
#toast:has(a[href*="answer"]),
#toast:has([href*="answer"]),
#fulfilled-layout,
.ad-showing .ytp-ad-player-overlay,
.ad-showing .ytp-ad-player-overlay-layout {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  min-height: 0 !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

html[data-brotube-zen="true"] #comments,
html[data-brotube-zen="true"] ytd-comments,
html[data-brotube-zen="true"] #related,
html[data-brotube-zen="true"] ytd-watch-next-secondary-results-renderer,
html[data-brotube-zen="true"] #secondary,
html[data-brotube-zen="true"] #secondary-inner,
html[data-brotube-zen="true"] ytd-watch-flexy #secondary,
html[data-brotube-zen="true"] ytd-watch-grid #secondary,
html[data-brotube-zen="true"] ytd-browse[page-subtype="home"] #contents,
html[data-brotube-zen="true"] ytd-reel-shelf-renderer,
html[data-brotube-zen="true"] ytd-rich-shelf-renderer:has(a[href*="/shorts"]) {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

html[data-brotube-zen="true"] ytd-watch-flexy {
  --ytd-watch-flexy-sidebar-width: 0px !important;
  --ytd-watch-flexy-sidebar-min-width: 0px !important;
  --ytd-watch-flexy-max-player-width: 100% !important;
}

html[data-brotube-zen="true"] ytd-watch-flexy #columns,
html[data-brotube-zen="true"] ytd-watch-grid #columns {
  max-width: 100% !important;
  width: 100% !important;
  margin: 0 auto !important;
  display: flex !important;
  justify-content: center !important;
  padding: 0 16px !important;
  box-sizing: border-box !important;
}

html[data-brotube-zen="true"] ytd-watch-flexy #primary,
html[data-brotube-zen="true"] ytd-watch-flexy #primary-inner,
html[data-brotube-zen="true"] ytd-watch-grid #primary {
  max-width: 100% !important;
  width: 100% !important;
  min-width: 0 !important;
  padding-right: 0 !important;
  margin: 0 auto !important;
}

html[data-brotube-zen="true"] ytd-watch-flexy:not([theater]) #player-container-outer,
html[data-brotube-zen="true"] ytd-watch-flexy:not([theater]) #player-container-inner,
html[data-brotube-zen="true"] ytd-watch-flexy:not([theater]) #player-container,
html[data-brotube-zen="true"] ytd-watch-flexy:not([theater]) #player,
html[data-brotube-zen="true"] ytd-watch-flexy:not([theater]) #movie_player {
  max-width: 100% !important;
  width: 100% !important;
  margin: 0 auto !important;
}

html[data-brotube-zen="true"] ytd-watch-flexy:not([theater]) video.html5-main-video {
  width: 100% !important;
  left: 0 !important;
}

html[data-brotube-zen="true"] ytd-watch-grid {
  grid-template-columns: 1fr !important;
}

#movie_player.ad-showing video,
#movie_player.ad-interrupting video {
  visibility: hidden !important;
}

html[dark] #masthead-container,
html[dark] #masthead,
html[data-theme="dark"] #masthead-container,
html[data-theme="dark"] #masthead,
html:not([data-theme="light"]):not([light]) #masthead-container,
html:not([data-theme="light"]):not([light]) #masthead {
  background: rgba(15, 17, 26, 0.75) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

html[data-theme="light"] #masthead-container,
html[data-theme="light"] #masthead,
html[light] #masthead-container,
html[light] #masthead {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
}

/* Universal Contrast & Text Legibility Tokens */
html[data-theme="light"], html[light] {
  --yt-spec-text-primary: #0f172a !important;
  --yt-spec-text-secondary: #475569 !important;
  --yt-spec-text-disabled: #94a3b8 !important;
  --yt-spec-base-background: #f8fafc !important;
  --ytd-searchbox-text-color: #0f172a !important;
  --ytd-searchbox-legacy-button-color: #334155 !important;
  --ytd-searchbox-legacy-border-color: rgba(0, 0, 0, 0.12) !important;
}

html[dark], html[data-theme="dark"], html:not([data-theme="light"]):not([light]) {
  --yt-spec-text-primary: #f8fafc !important;
  --yt-spec-text-secondary: #94a3b8 !important;
  --yt-spec-text-disabled: #64748b !important;
  --yt-spec-base-background: #08090e !important;
  --ytd-searchbox-text-color: #f8fafc !important;
  --ytd-searchbox-legacy-button-color: #cbd5e1 !important;
  --ytd-searchbox-legacy-border-color: rgba(255, 255, 255, 0.12) !important;
}

/* Glassmorphic Spatial Search Bar - Dark Theme */
html[dark] #container.ytd-searchbox,
html[data-theme="dark"] #container.ytd-searchbox,
html:not([data-theme="light"]):not([light]) #container.ytd-searchbox {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  border-right: none !important;
  border-radius: 40px 0 0 40px !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25) !important;
  transition: all 0.25s ease !important;
}

html[dark] input#search.ytd-searchbox,
html[data-theme="dark"] input#search.ytd-searchbox,
html:not([data-theme="light"]):not([light]) input#search.ytd-searchbox {
  color: #f8fafc !important;
  -webkit-text-fill-color: #f8fafc !important;
  background: transparent !important;
  font-family: inherit !important;
}

html[dark] input#search.ytd-searchbox::placeholder,
html[data-theme="dark"] input#search.ytd-searchbox::placeholder,
html:not([data-theme="light"]):not([light]) input#search.ytd-searchbox::placeholder {
  color: #94a3b8 !important;
  -webkit-text-fill-color: #94a3b8 !important;
}

html[dark] #search-icon-legacy.ytd-searchbox,
html[data-theme="dark"] #search-icon-legacy.ytd-searchbox,
html:not([data-theme="light"]):not([light]) #search-icon-legacy.ytd-searchbox {
  background: rgba(255, 255, 255, 0.10) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  border-radius: 0 40px 40px 0 !important;
  color: #f8fafc !important;
  transition: all 0.2s ease !important;
}

html[dark] #search-icon-legacy.ytd-searchbox:hover,
html[data-theme="dark"] #search-icon-legacy.ytd-searchbox:hover,
html:not([data-theme="light"]):not([light]) #search-icon-legacy.ytd-searchbox:hover {
  background: rgba(255, 255, 255, 0.18) !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
}

html[dark] #search-icon-legacy.ytd-searchbox yt-icon,
html[data-theme="dark"] #search-icon-legacy.ytd-searchbox yt-icon,
html:not([data-theme="light"]):not([light]) #search-icon-legacy.ytd-searchbox yt-icon {
  color: #f8fafc !important;
  fill: #f8fafc !important;
}

html[dark] #voice-search-button,
html[data-theme="dark"] #voice-search-button,
html:not([data-theme="light"]):not([light]) #voice-search-button {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 50% !important;
}

html[dark] #voice-search-button yt-icon,
html[data-theme="dark"] #voice-search-button yt-icon,
html:not([data-theme="light"]):not([light]) #voice-search-button yt-icon {
  color: #f8fafc !important;
  fill: #f8fafc !important;
}

html[dark] ytd-searchbox[has-focus] #container.ytd-searchbox,
html[data-theme="dark"] ytd-searchbox[has-focus] #container.ytd-searchbox,
html:not([data-theme="light"]):not([light]) ytd-searchbox[has-focus] #container.ytd-searchbox {
  border-color: rgba(236, 72, 153, 0.65) !important;
  box-shadow: 0 0 16px rgba(236, 72, 153, 0.25), inset 0 1px 2px rgba(0, 0, 0, 0.3) !important;
}

/* Glassmorphic Spatial Search Bar - Light Theme */
html[light] #container.ytd-searchbox,
html[data-theme="light"] #container.ytd-searchbox {
  background: rgba(0, 0, 0, 0.045) !important;
  border: 1px solid rgba(0, 0, 0, 0.14) !important;
  border-right: none !important;
  border-radius: 40px 0 0 40px !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04) !important;
  transition: all 0.25s ease !important;
}

html[light] input#search.ytd-searchbox,
html[data-theme="light"] input#search.ytd-searchbox {
  color: #0f172a !important;
  -webkit-text-fill-color: #0f172a !important;
  background: transparent !important;
  font-family: inherit !important;
}

html[light] input#search.ytd-searchbox::placeholder,
html[data-theme="light"] input#search.ytd-searchbox::placeholder {
  color: #64748b !important;
  -webkit-text-fill-color: #64748b !important;
}

html[light] #search-icon-legacy.ytd-searchbox,
html[data-theme="light"] #search-icon-legacy.ytd-searchbox {
  background: rgba(0, 0, 0, 0.06) !important;
  border: 1px solid rgba(0, 0, 0, 0.14) !important;
  border-radius: 0 40px 40px 0 !important;
  color: #0f172a !important;
  transition: all 0.2s ease !important;
}

html[light] #search-icon-legacy.ytd-searchbox:hover,
html[data-theme="light"] #search-icon-legacy.ytd-searchbox:hover {
  background: rgba(0, 0, 0, 0.10) !important;
  border-color: rgba(0, 0, 0, 0.22) !important;
}

html[light] #search-icon-legacy.ytd-searchbox yt-icon,
html[data-theme="light"] #search-icon-legacy.ytd-searchbox yt-icon {
  color: #0f172a !important;
  fill: #0f172a !important;
}

html[light] #voice-search-button,
html[data-theme="light"] #voice-search-button {
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  border-radius: 50% !important;
}

html[light] #voice-search-button yt-icon,
html[data-theme="light"] #voice-search-button yt-icon {
  color: #0f172a !important;
  fill: #0f172a !important;
}

html[light] ytd-searchbox[has-focus] #container.ytd-searchbox,
html[data-theme="light"] ytd-searchbox[has-focus] #container.ytd-searchbox {
  border-color: rgba(225, 29, 72, 0.65) !important;
  box-shadow: 0 0 16px rgba(225, 29, 72, 0.22), inset 0 1px 2px rgba(0, 0, 0, 0.06) !important;
}

/* Autocomplete search suggestions dropdown */
.sbdd_b, ul.sbsb_b {
  border-radius: 16px !important;
  overflow: hidden !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35) !important;
}
html[dark] .sbsb_a, html[dark] ul.sbsb_b, html[dark] .sbpqs_a, html[dark] .gsfs,
html[data-theme="dark"] .sbsb_a, html[data-theme="dark"] ul.sbsb_b, html[data-theme="dark"] .sbpqs_a, html[data-theme="dark"] .gsfs {
  background: rgba(14, 18, 30, 0.95) !important;
  color: #f8fafc !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}
html[light] .sbsb_a, html[light] ul.sbsb_b, html[light] .sbpqs_a, html[light] .gsfs,
html[data-theme="light"] .sbsb_a, html[data-theme="light"] ul.sbsb_b, html[data-theme="light"] .sbpqs_a, html[data-theme="light"] .gsfs {
  background: rgba(255, 255, 255, 0.95) !important;
  color: #0f172a !important;
  border-color: rgba(0, 0, 0, 0.08) !important;
}

/* YouTube Share Dialog - Spatial Glassmorphism */
tp-yt-paper-dialog:has(ytd-unified-share-panel-renderer),
ytd-unified-share-panel-renderer {
  background: rgba(12, 16, 28, 0.65) !important;
  backdrop-filter: blur(48px) saturate(220%) !important;
  -webkit-backdrop-filter: blur(48px) saturate(220%) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 24px !important;
  box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 35px rgba(139, 92, 246, 0.18) !important;
  color: #f8fafc !important;
}

html[data-theme="light"] tp-yt-paper-dialog:has(ytd-unified-share-panel-renderer),
html[light] tp-yt-paper-dialog:has(ytd-unified-share-panel-renderer),
html[data-theme="light"] ytd-unified-share-panel-renderer,
html[light] ytd-unified-share-panel-renderer {
  background: rgba(255, 255, 255, 0.65) !important;
  backdrop-filter: blur(48px) saturate(210%) !important;
  -webkit-backdrop-filter: blur(48px) saturate(210%) !important;
  border: 1px solid rgba(255, 255, 255, 0.92) !important;
  box-shadow: 0 25px 60px -10px rgba(15, 23, 42, 0.16), 0 0 35px rgba(236, 72, 153, 0.10) !important;
  color: #0f172a !important;
}

tp-yt-paper-dialog:has(ytd-unified-share-panel-renderer) #title,
ytd-unified-share-panel-renderer #title,
ytd-share-target-renderer #title {
  color: inherit !important;
}

html[dark] ytd-guide-renderer,
html[dark] #guide-content,
html[data-theme="dark"] ytd-guide-renderer,
html[data-theme="dark"] #guide-content,
html:not([data-theme="light"]):not([light]) ytd-guide-renderer,
html:not([data-theme="light"]):not([light]) #guide-content {
  background: rgba(12, 14, 22, 0.8) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
}

html[data-theme="light"] ytd-guide-renderer,
html[data-theme="light"] #guide-content,
html[light] ytd-guide-renderer,
html[light] #guide-content {
  background: rgba(248, 250, 252, 0.85) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border-right: 1px solid rgba(0, 0, 0, 0.06) !important;
}

ytd-rich-item-renderer,
ytd-video-renderer,
ytd-grid-video-renderer {
  transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease !important;
  border-radius: 14px !important;
}

html[dark] ytd-rich-item-renderer:hover,
html[dark] ytd-video-renderer:hover,
html:not([data-theme="light"]):not([light]) ytd-rich-item-renderer:hover,
html:not([data-theme="light"]):not([light]) ytd-video-renderer:hover {
  transform: translateY(-4px) scale(1.01) !important;
  box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.5), 0 0 20px 2px rgba(99, 102, 241, 0.15) !important;
}

html[data-theme="light"] ytd-rich-item-renderer:hover,
html[data-theme="light"] ytd-video-renderer:hover,
html[light] ytd-rich-item-renderer:hover,
html[light] ytd-video-renderer:hover {
  transform: translateY(-4px) scale(1.01) !important;
  box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.12), 0 0 20px 2px rgba(236, 72, 153, 0.12) !important;
}

#thumbnail {
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
}

html[data-theme="light"] #thumbnail,
html[light] #thumbnail {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08) !important;
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
}

#player-container,
#movie_player {
  border-radius: 16px !important;
  overflow: hidden !important;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.8) !important;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: rgba(10, 10, 15, 0.4);
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

html[data-theme="light"] ::-webkit-scrollbar-track,
html[light] ::-webkit-scrollbar-track {
  background: rgba(241, 245, 249, 0.8);
}
html[data-theme="light"] ::-webkit-scrollbar-thumb,
html[light] ::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.18);
}
html[data-theme="light"] ::-webkit-scrollbar-thumb:hover,
html[light] ::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 23, 42, 0.3);
}

/* BroTube Quick Thumbnail Download Button */
.brotube-thumb-dl-btn {
  position: absolute !important;
  top: 8px !important;
  left: 8px !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 8px !important;
  background: rgba(15, 23, 42, 0.85) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  z-index: 100 !important;
  opacity: 0 !important;
  pointer-events: none !important;
  transition: opacity 0.2s ease, transform 0.15s ease, background 0.15s ease !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
}

html[data-theme="light"] .brotube-thumb-dl-btn,
html[light] .brotube-thumb-dl-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  color: #0f172a !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
}

ytd-thumbnail:hover .brotube-thumb-dl-btn,
ytd-playlist-thumbnail:hover .brotube-thumb-dl-btn,
ytd-rich-item-renderer:hover .brotube-thumb-dl-btn,
ytd-video-renderer:hover .brotube-thumb-dl-btn,
ytd-grid-video-renderer:hover .brotube-thumb-dl-btn,
ytd-compact-video-renderer:hover .brotube-thumb-dl-btn,
ytd-reel-item-renderer:hover .brotube-thumb-dl-btn,
.brotube-thumb-dl-btn:hover {
  opacity: 1 !important;
  pointer-events: auto !important;
}

.brotube-thumb-dl-btn:hover {
  transform: scale(1.1) !important;
  background: rgba(225, 29, 72, 0.95) !important;
  border-color: rgba(225, 29, 72, 0.95) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(225, 29, 72, 0.5) !important;
}

.brotube-thumb-dl-btn:active {
  transform: scale(0.92) !important;
}

.brotube-thumb-dl-btn svg {
  width: 16px !important;
  height: 16px !important;
  fill: currentColor !important;
  pointer-events: none !important;
}

/* BroTube Shorts In-Player Download Button */
.brotube-shorts-dl-btn {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  margin-top: 16px !important;
  user-select: none !important;
  transition: transform 0.15s ease !important;
}
.brotube-shorts-dl-btn:hover {
  transform: scale(1.08) !important;
}
.brotube-shorts-dl-btn:active {
  transform: scale(0.92) !important;
}
.brotube-shorts-dl-icon {
  width: 48px !important;
  height: 48px !important;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;
  transition: background 0.2s ease, border-color 0.2s ease !important;
}
.brotube-shorts-dl-btn:hover .brotube-shorts-dl-icon {
  background: rgba(225, 29, 72, 0.9) !important;
  border-color: rgba(225, 29, 72, 1) !important;
  box-shadow: 0 4px 16px rgba(225, 29, 72, 0.5) !important;
}
.brotube-shorts-dl-icon svg {
  width: 22px !important;
  height: 22px !important;
  fill: currentColor !important;
  pointer-events: none !important;
}
.brotube-shorts-dl-label {
  font-size: 12px !important;
  font-weight: 500 !important;
  color: #ffffff !important;
  margin-top: 6px !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6) !important;
  pointer-events: none !important;
}

/* BroTube 3-Dots Menu Injected Download Option */
.brotube-menu-dl-item {
  display: flex !important;
  align-items: center !important;
  cursor: pointer !important;
  user-select: none !important;
  width: 100% !important;
  box-sizing: border-box !important;
}
.brotube-menu-dl-item tp-yt-paper-item,
.brotube-menu-dl-item .brotube-menu-paper-item {
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
  min-height: 40px !important;
  padding: 0 16px !important;
  box-sizing: border-box !important;
  cursor: pointer !important;
  color: var(--yt-spec-text-primary, inherit) !important;
  transition: background-color 0.15s ease !important;
}
.brotube-menu-dl-item:hover tp-yt-paper-item,
.brotube-menu-dl-item:hover .brotube-menu-paper-item,
.brotube-menu-dl-item tp-yt-paper-item:hover {
  background-color: var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.1)) !important;
}
.brotube-menu-dl-item .brotube-menu-icon {
  width: 24px !important;
  height: 24px !important;
  margin-right: 16px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  fill: var(--yt-spec-text-primary, currentColor) !important;
  color: var(--yt-spec-text-primary, currentColor) !important;
  flex-shrink: 0 !important;
}
.brotube-menu-dl-item .brotube-menu-icon svg {
  width: 20px !important;
  height: 20px !important;
  fill: currentColor !important;
}
.brotube-menu-dl-item .brotube-menu-label {
  font-family: "Roboto", "YouTube Sans", "Arial", sans-serif !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  line-height: 20px !important;
  color: var(--yt-spec-text-primary, inherit) !important;
  white-space: nowrap !important;
}
`;

// Inject spatial CSS at Blink native engine level immediately at document-start
try {
  if (webFrame && typeof webFrame.insertCSS === 'function') {
    webFrame.insertCSS(SPATIAL_CSS);
  }
} catch {}

// Theme & Zen Synchronization inside YouTube Webview
function syncYouTubeTheme(theme) {
  const isLight = theme === 'light';
  const html = document.documentElement;
  if (!html) return;
  html.setAttribute('data-theme', isLight ? 'light' : 'dark');
  if (isLight) {
    html.removeAttribute('dark');
    html.setAttribute('light', '');
  } else {
    html.setAttribute('dark', 'true');
    html.removeAttribute('light');
  }
}

function syncZenMode(enabled) {
  const html = document.documentElement;
  if (!html) return;
  if (enabled) {
    html.setAttribute('data-brotube-zen', 'true');
  } else {
    html.removeAttribute('data-brotube-zen');
  }
  window.dispatchEvent(new Event('resize'));
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 60);
}

let redirectShortsEnabled = true;
try {
  const saved = localStorage.getItem('brotube-redirect-shorts');
  if (saved !== null) {
    redirectShortsEnabled = saved === 'true';
  }
} catch (_) {}

function isShortsRedirectActive() {
  const docAttr = document.documentElement?.getAttribute('data-brotube-redirect-shorts');
  if (docAttr === 'false') return false;
  if (docAttr === 'true') return true;
  return redirectShortsEnabled;
}

let lastShortRedirectId = '';
function checkShortsRedirect() {
  if (!isShortsRedirectActive()) return;
  if (window.location.pathname.startsWith('/shorts/')) {
    const videoId = window.location.pathname.split('/shorts/')[1]?.split(/[?&/]/)[0];
    if (videoId && videoId !== lastShortRedirectId) {
      lastShortRedirectId = videoId;
      window.location.replace(`https://www.youtube.com/watch?v=${videoId}&brotube_short=1`);
    }
  }
}

let lastDislikeVideoId = '';
let isDislikeFetching = false;
let cachedDislikeData = null;

function applyDislikeBadge(dislikeBtn, formatted, count) {
  let badge = dislikeBtn.querySelector('.brotube-ryd-count');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'brotube-ryd-count';
    badge.style.cssText = 'margin-left: 6px; font-size: 13px; font-weight: 500; opacity: 0.9;';
    dislikeBtn.appendChild(badge);
  }
  badge.textContent = formatted;
  dislikeBtn.setAttribute('title', `${count.toLocaleString()} dislikes`);
}

function updateDislikeCount(videoId) {
  if (!videoId) return;

  const dislikeBtn = document.querySelector('dislike-button-view-model button, ytd-segmented-like-dislike-button-renderer dislike-button-view-model button, button[aria-label*="Dislike" i], button[aria-label*="dislike" i]');

  if (cachedDislikeData && cachedDislikeData.videoId === videoId) {
    if (dislikeBtn && !dislikeBtn.querySelector('.brotube-ryd-count')) {
      applyDislikeBadge(dislikeBtn, cachedDislikeData.formatted, cachedDislikeData.dislikes);
      lastDislikeVideoId = videoId;
    }
    return;
  }

  if (videoId === lastDislikeVideoId || isDislikeFetching) return;
  isDislikeFetching = true;

  fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${encodeURIComponent(videoId)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      isDislikeFetching = false;
      if (!data || typeof data.dislikes !== 'number') return;
      const formatted = data.dislikes >= 1000000
        ? (data.dislikes / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
        : (data.dislikes >= 1000
            ? (data.dislikes / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
            : data.dislikes.toString());
      cachedDislikeData = { videoId, formatted, dislikes: data.dislikes };
      const btn = document.querySelector('dislike-button-view-model button, ytd-segmented-like-dislike-button-renderer dislike-button-view-model button, button[aria-label*="Dislike" i], button[aria-label*="dislike" i]');
      if (btn) {
        applyDislikeBadge(btn, formatted, data.dislikes);
        lastDislikeVideoId = videoId;
      }
    })
    .catch(() => {
      isDislikeFetching = false;
    });
}

window.addEventListener('message', (e) => {
  if (!e.data) return;
  if (e.data.type === 'brotube-theme-sync') {
    syncYouTubeTheme(e.data.theme);
  } else if (e.data.type === 'brotube-zen-sync') {
    syncZenMode(e.data.enabled);
  } else if (e.data.type === 'brotube-shorts-sync') {
    redirectShortsEnabled = !!e.data.enabled;
    try {
      localStorage.setItem('brotube-redirect-shorts', redirectShortsEnabled ? 'true' : 'false');
    } catch (_) {}
    if (redirectShortsEnabled) checkShortsRedirect();
  }
});

window.addEventListener('brotube-shorts-sync', (e) => {
  if (e && e.detail && typeof e.detail.enabled !== 'undefined') {
    redirectShortsEnabled = !!e.detail.enabled;
    try {
      localStorage.setItem('brotube-redirect-shorts', redirectShortsEnabled ? 'true' : 'false');
    } catch (_) {}
    if (redirectShortsEnabled) checkShortsRedirect();
  }
});

window.addEventListener('yt-navigate-finish', checkShortsRedirect);

// WebAudio Studio DSP: 300% Volume Booster, Live Frequency Analyser & Audiophile Equalizer
let audioCtx = null;
let gainNode = null;
let lowShelfNode = null;
let midPeakNode = null;
let highShelfNode = null;
let compressor = null;
let analyserNode = null;
let currentVolumeBoost = 1.0;
let currentEqPreset = 'flat';
const connectedVideos = new WeakSet();

function applyEqPreset(preset) {
  currentEqPreset = preset || 'flat';
  if (!lowShelfNode || !midPeakNode || !highShelfNode) return;
  if (currentEqPreset === 'bass') {
    lowShelfNode.gain.value = 7.0;
    midPeakNode.gain.value = 0.0;
    highShelfNode.gain.value = 1.0;
  } else if (currentEqPreset === 'vocal') {
    lowShelfNode.gain.value = -2.0;
    midPeakNode.gain.value = 5.0;
    highShelfNode.gain.value = 2.0;
  } else if (currentEqPreset === 'cinema') {
    lowShelfNode.gain.value = 4.0;
    midPeakNode.gain.value = -1.5;
    highShelfNode.gain.value = 4.0;
  } else if (currentEqPreset === 'night') {
    lowShelfNode.gain.value = -4.0;
    midPeakNode.gain.value = 2.0;
    highShelfNode.gain.value = -2.0;
  } else {
    lowShelfNode.gain.value = 0.0;
    midPeakNode.gain.value = 0.0;
    highShelfNode.gain.value = 0.0;
  }
}

function ensureAudioGraph() {
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtxClass) return;

  if (!audioCtx) {
    try {
      audioCtx = new AudioCtxClass();
      gainNode = audioCtx.createGain();
      gainNode.gain.value = currentVolumeBoost;

      lowShelfNode = audioCtx.createBiquadFilter();
      lowShelfNode.type = 'lowshelf';
      lowShelfNode.frequency.value = 200;

      midPeakNode = audioCtx.createBiquadFilter();
      midPeakNode.type = 'peaking';
      midPeakNode.frequency.value = 2500;
      midPeakNode.Q.value = 1.0;

      highShelfNode = audioCtx.createBiquadFilter();
      highShelfNode.type = 'highshelf';
      highShelfNode.frequency.value = 8000;

      compressor = audioCtx.createDynamicsCompressor();

      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 64;
      analyserNode.smoothingTimeConstant = 0.8;

      gainNode.connect(lowShelfNode);
      lowShelfNode.connect(midPeakNode);
      midPeakNode.connect(highShelfNode);
      highShelfNode.connect(compressor);
      compressor.connect(analyserNode);
      analyserNode.connect(audioCtx.destination);
      applyEqPreset(currentEqPreset);
    } catch (e) {
      console.warn('Audio DSP graph init failed:', e);
      return;
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

function attachVideoDSP(video) {
  if (!video || connectedVideos.has(video)) {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return;
  }
  ensureAudioGraph();
  if (!audioCtx || !gainNode) return;
  try {
    const source = audioCtx.createMediaElementSource(video);
    source.connect(gainNode);
    connectedVideos.add(video);
  } catch {
    connectedVideos.add(video);
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

function initAudioDSP(video) {
  attachVideoDSP(video);
}

// Automatically attach DSP to all videos (both long-form and dynamic shorts carousel) as they play
document.addEventListener('play', (e) => {
  if (e.target && e.target.tagName === 'VIDEO') {
    attachVideoDSP(e.target);
  }
}, true);

document.addEventListener('playing', (e) => {
  if (e.target && e.target.tagName === 'VIDEO') {
    attachVideoDSP(e.target);
  }
}, true);

function setBroTubeVolumeBoost(multiplier) {
  currentVolumeBoost = Math.max(1.0, Math.min(3.0, Number(multiplier) || 1.0));
  ensureAudioGraph();
  if (gainNode) {
    gainNode.gain.value = currentVolumeBoost;
  }
  document.querySelectorAll('video').forEach(attachVideoDSP);
}

function setBrotubeEq(preset) {
  ensureAudioGraph();
  applyEqPreset(preset);
  document.querySelectorAll('video').forEach(attachVideoDSP);
}

function getBroTubeAudioSpectrum() {
  if (!analyserNode) return [6, 6, 6, 6, 6, 6, 6, 6, 6, 6];
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyserNode.getByteFrequencyData(dataArray);

  const bands = [
    [0, 1], [2, 3], [4, 5], [6, 7], [8, 10],
    [11, 13], [14, 17], [18, 21], [22, 26], [27, 31]
  ];

  return bands.map(([start, end]) => {
    let sum = 0;
    let count = 0;
    for (let i = start; i <= end && i < bufferLength; i++) {
      sum += dataArray[i];
      count++;
    }
    const avg = count > 0 ? sum / count : 0;
    return Math.max(6, Math.min(98, Math.round(6 + (avg / 255) * 92)));
  });
}

// Expose safe player API to webview main world
contextBridge.exposeInMainWorld('setBroTubeVolumeBoost', setBroTubeVolumeBoost);
contextBridge.exposeInMainWorld('setBrotubeEq', setBrotubeEq);
contextBridge.exposeInMainWorld('getBroTubeAudioSpectrum', getBroTubeAudioSpectrum);

// Brave-parity main-world player response defuser: strips ad objects before player ever schedules ads
const MAIN_WORLD_DEFUSER = `
(() => {
  if (window.__brotube_defuser_installed) return;
  window.__brotube_defuser_installed = true;

  function pruneAds(obj) {
    if (!obj || typeof obj !== 'object' || obj.__brotube_pruned) return obj;
    try {
      Object.defineProperty(obj, '__brotube_pruned', { value: true, enumerable: false, configurable: true });
      if ('adPlacements' in obj) obj.adPlacements = [];
      if ('adSlots' in obj) obj.adSlots = [];
      if ('playerAds' in obj) obj.playerAds = [];
      delete obj.adBreakHeartbeatParams;
      delete obj.adBreakParams;
      delete obj.adParams;
      if (obj.playerResponse && typeof obj.playerResponse === 'object') {
        pruneAds(obj.playerResponse);
      }
      if (obj.auxiliaryUi) {
        delete obj.auxiliaryUi;
      }
      if (Array.isArray(obj.messages)) {
        obj.messages = obj.messages.filter(m => {
          const str = JSON.stringify(m).toLowerCase();
          return !str.includes('interruption') && !str.includes('adblock') && !str.includes('enforcement');
        });
      }
      if (Array.isArray(obj.alerts)) {
        obj.alerts = obj.alerts.filter(a => {
          const str = JSON.stringify(a).toLowerCase();
          return !str.includes('interruption') && !str.includes('adblock') && !str.includes('enforcement') && !str.includes('google.com');
        });
      }
      if (Array.isArray(obj.onResponseReceivedActions)) {
        obj.onResponseReceivedActions = obj.onResponseReceivedActions.filter(a => {
          const str = JSON.stringify(a).toLowerCase();
          return !str.includes('interruption') && !str.includes('adblock') && !str.includes('enforcement') && !str.includes('google.com');
        });
      }
      if (Array.isArray(obj.onResponseReceivedEndpoints)) {
        obj.onResponseReceivedEndpoints = obj.onResponseReceivedEndpoints.filter(a => {
          const str = JSON.stringify(a).toLowerCase();
          return !str.includes('interruption') && !str.includes('adblock') && !str.includes('enforcement') && !str.includes('google.com');
        });
      }
      if (Array.isArray(obj.contents)) {
        obj.contents = obj.contents.filter(item => {
          if (!item || typeof item !== 'object') return true;
          const r = item.richItemRenderer?.content || item.richSectionRenderer?.content;
          if (r && (r.adSlotRenderer || r.inFeedAdLayoutRenderer || r.statementBannerRenderer || r.bannerPromoRenderer)) {
            return false;
          }
          return !item.adSlotRenderer && !item.inFeedAdLayoutRenderer;
        });
      }
    } catch {}
    return obj;
  }

  // 1. Defuse initial player response
  let rawPlayer = window.ytInitialPlayerResponse;
  if (rawPlayer) pruneAds(rawPlayer);
  try {
    Object.defineProperty(window, 'ytInitialPlayerResponse', {
      get() { return rawPlayer; },
      set(val) { rawPlayer = pruneAds(val); },
      configurable: true,
      enumerable: true
    });
  } catch {}

  // 2. Intercept JSON.parse (universal catch-all for player JSON responses)
  try {
    const origJSONParse = JSON.parse;
    JSON.parse = function(text, reviver) {
      const result = origJSONParse.call(this, text, reviver);
      // Fast-path: only traverse objects that actually contain ad keys
      if (result && typeof result === 'object' && (result.adPlacements || result.playerAds || result.adSlots)) {
        pruneAds(result);
      }
      return result;
    };
  } catch {}

  // 3. Intercept Response.prototype.json and text
  try {
    const origJson = Response.prototype.json;
    Response.prototype.json = async function() {
      const data = await origJson.apply(this);
      if (data && typeof data === 'object') {
        pruneAds(data);
      }
      return data;
    };
  } catch {}

  try {
    const origText = Response.prototype.text;
    Response.prototype.text = async function() {
      const text = await origText.apply(this);
      if (typeof text === 'string' && (text.includes('adPlacements') || text.includes('adSlots') || text.includes('playerAds'))) {
        try {
          const data = JSON.parse(text);
          pruneAds(data);
          return JSON.stringify(data);
        } catch {}
      }
      return text;
    };
  } catch {}

  // 4. Intercept Innertube player and browse fetch calls
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const res = await origFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
    if (res && res.ok && (url.includes('/youtubei/v1/player') || url.includes('/youtubei/v1/next') || url.includes('/youtubei/v1/browse'))) {
      try {
        const clone = res.clone();
        const data = await clone.json();
        pruneAds(data);
        const headers = new Headers(res.headers);
        headers.delete('content-encoding');
        headers.delete('content-length');
        headers.set('content-type', 'application/json');
        return new Response(JSON.stringify(data), {
          status: res.status,
          statusText: res.statusText,
          headers
        });
      } catch {}
    }
    return res;
  };

  // 5. Intercept XHR for player and browse responses
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._brotube_url = typeof url === 'string' ? url : '';
    return origOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function(...args) {
    if (this._brotube_url && (this._brotube_url.includes('/youtubei/v1/player') || this._brotube_url.includes('/youtubei/v1/next') || this._brotube_url.includes('/youtubei/v1/browse'))) {
      this.addEventListener('readystatechange', () => {
        if (this.readyState === 4 && this.status === 200) {
          try {
            const data = JSON.parse(this.responseText);
            pruneAds(data);
            const text = JSON.stringify(data);
            Object.defineProperty(this, 'responseText', { value: text, configurable: true });
            Object.defineProperty(this, 'response', { value: text, configurable: true });
          } catch {}
        }
      });
    }
    return origSend.apply(this, args);
  };
})();
`;

// Execute immediately in main world at document-start (bypasses CSP)
try {
  if (webFrame && typeof webFrame.executeJavaScript === 'function') {
    webFrame.executeJavaScript(MAIN_WORLD_DEFUSER);
  }
} catch {}

function injectMainWorldScript() {
  const target = document.head || document.documentElement;
  if (target) {
    const script = document.createElement('script');
    script.textContent = MAIN_WORLD_DEFUSER;
    target.appendChild(script);
    script.remove();
    return true;
  }
  return false;
}

if (!injectMainWorldScript()) {
  const obs = new MutationObserver(() => {
    if (injectMainWorldScript()) {
      obs.disconnect();
    }
  });
  obs.observe(document, { childList: true, subtree: true });
}

// DOM Injection for YouTube Web App
window.addEventListener('DOMContentLoaded', () => {
  // webFrame.insertCSS (above) already injected SPATIAL_CSS at document-start — no need to repeat here

  // Notify host window to dismiss open popovers on click anywhere in webview
  document.addEventListener('pointerdown', () => {
    try {
      ipcRenderer.sendToHost('guest-click');
    } catch {}
  }, true);

  // 2. Anti-Adblock Defuser & Instant Zero-Delay Ad Skipper
  let wasAdShowing = false;
  let previousMuted = false;
  let previousPlaybackRate = 1.0;

  function triggerInstantSkip() {
    const moviePlayer = document.getElementById('movie_player');
    const video = document.querySelector('video');
    const isAdShowing = !!(
      (moviePlayer && (moviePlayer.classList.contains('ad-showing') || moviePlayer.classList.contains('ad-interrupting'))) ||
      document.querySelector('.ytp-ad-player-overlay, .ytp-ad-text, .ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern')
    );

    if (isAdShowing && video) {
      if (!wasAdShowing) {
        previousMuted = video.muted;
        previousPlaybackRate = (video.playbackRate > 0 && video.playbackRate <= 2.0) ? video.playbackRate : 1.0;
        wasAdShowing = true;
      }
      video.muted = true;
      video.playbackRate = 16.0;
      if (moviePlayer && typeof moviePlayer.skipAd === 'function') {
        try { moviePlayer.skipAd(); } catch {}
      }
      const skipBtn = document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-container button');
      if (skipBtn) skipBtn.click();
      if (isFinite(video.duration) && video.duration > 0) {
        video.currentTime = video.duration;
      }
    } else if (!isAdShowing && wasAdShowing && video) {
      video.muted = previousMuted;
      video.playbackRate = previousPlaybackRate;
      wasAdShowing = false;
    }
  }

  // 0ms microtask reaction to player ad-state class changes and interruption toasts
  function purgeInterruptionToast(node) {
    if (!node || node.nodeType !== 1) return;
    const tag = (node.tagName || '').toLowerCase();
    if (tag === 'tp-yt-paper-toast' || tag === 'ytd-notification-action-renderer' || tag === 'yt-notification-action-renderer' || node.id === 'toast') {
      const text = node.textContent || '';
      if (/interruption/i.test(text) || node.querySelector?.('a[href*="google.com"], a[href*="answer"]')) {
        const target = node.closest?.('tp-yt-paper-toast') || node;
        target.remove();
        const overlay = document.querySelector('tp-yt-iron-overlay-backdrop');
        if (overlay) overlay.remove();
      }
    } else if (node.firstElementChild) {
      const toast = node.querySelector?.('tp-yt-paper-toast, ytd-notification-action-renderer, yt-notification-action-renderer, #toast');
      if (toast) {
        const text = toast.textContent || '';
        if (/interruption/i.test(text) || toast.querySelector?.('a[href*="google.com"], a[href*="answer"]')) {
          const target = toast.closest?.('tp-yt-paper-toast') || toast;
          target.remove();
          const overlay = document.querySelector('tp-yt-iron-overlay-backdrop');
          if (overlay) overlay.remove();
        }
      }
    }
  }

  try {
    const playerObs = new MutationObserver((mutations) => {
      triggerInstantSkip();
      for (let i = 0; i < mutations.length; i++) {
        const mut = mutations[i];
        if (mut.addedNodes && mut.addedNodes.length > 0) {
          for (let j = 0; j < mut.addedNodes.length; j++) {
            purgeInterruptionToast(mut.addedNodes[j]);
          }
        }
        if (mut.type === 'attributes' && mut.target) {
          purgeInterruptionToast(mut.target);
        }
      }
    });
    playerObs.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'opened']
    });
  } catch {}

  try {
    customElements.whenDefined('tp-yt-paper-toast').then((proto) => {
      const origOpen = proto?.prototype?.open;
      const origShow = proto?.prototype?.show;
      function isBlockedToast(el) {
        const text = (el?.textContent || '').toLowerCase();
        return text.includes('interruption') || !!el?.querySelector?.('a[href*="google.com"], a[href*="answer"]');
      }
      if (origOpen) {
        proto.prototype.open = function(...args) {
          if (isBlockedToast(this)) {
            this.remove();
            return;
          }
          return origOpen.apply(this, args);
        };
      }
      if (origShow) {
        proto.prototype.show = function(...args) {
          if (isBlockedToast(this)) {
            this.remove();
            return;
          }
          return origShow.apply(this, args);
        };
      }
    });
  } catch {}

  setInterval(() => {
    const onVideoPage = window.location.pathname.startsWith('/watch') || window.location.pathname.startsWith('/shorts/');
    if (!onVideoPage) return;
    // Defuse YouTube anti-adblock modal
    const adblockModal = document.querySelector('ytd-enforcement-message-view-model');
    if (adblockModal) {
      adblockModal.remove();
      const overlay = document.querySelector('tp-yt-iron-overlay-backdrop');
      if (overlay) overlay.remove();
      const video = document.querySelector('video');
      if (video && video.paused) {
        video.play();
      }
    }

    // Dismiss "Experiencing interruptions?" toasts & promo mealbars (fast guard check before NodeList iteration)
    const hasPopup = document.querySelector('tp-yt-paper-toast, ytd-mealbar-promo-renderer, yt-mealbar-promo-renderer, ytd-notification-action-renderer');
    if (hasPopup) {
      const popups = document.querySelectorAll('tp-yt-paper-toast, ytd-mealbar-promo-renderer, yt-mealbar-promo-renderer, ytd-notification-action-renderer');
      for (const el of popups) {
        const text = el.textContent || '';
        if (/interruption/i.test(text) || el.querySelector('a[href*="google.com"], a[href*="answer"]')) {
          const target = el.closest('tp-yt-paper-toast') || el;
          target.remove();
          const overlay = document.querySelector('tp-yt-iron-overlay-backdrop');
          if (overlay) overlay.remove();
          const video = document.querySelector('video');
          if (video && video.paused) {
            video.play();
          }
        }
      }
    }

    // Purge blank ad card slots holding space on YouTube home and feed pages
    const hasAdCard = document.querySelector('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, #ad-content, ytd-statement-banner-renderer, ytd-banner-promo-renderer');
    if (hasAdCard) {
      const adCards = document.querySelectorAll(
        'ytd-rich-item-renderer:has(ytd-ad-slot-renderer), ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer), ytd-rich-item-renderer:has(#ad-content), ytd-rich-section-renderer:has(ytd-statement-banner-renderer), ytd-rich-section-renderer:has(ytd-banner-promo-renderer), ytd-rich-section-renderer:has(ytd-ad-slot-renderer)'
      );
      for (const card of adCards) {
        card.remove();
      }
    }

    triggerInstantSkip();
  }, 1000);

  // Hook into video lifecycle events for 0ms reaction
  document.addEventListener('play', triggerInstantSkip, true);
  document.addEventListener('timeupdate', triggerInstantSkip, true);

  // 3. Integrated SponsorBlock
  let currentVideoId = '';
  let skipSegments = [];

  function checkVideoIdAndFetchSponsor() {
    const params = new URLSearchParams(window.location.search);
    let videoId = params.get('v');
    if (!videoId && window.location.pathname.includes('/shorts/')) {
      videoId = window.location.pathname.split('/shorts/')[1]?.split(/[?&/]/)[0];
    }
    if (!videoId) {
      currentVideoId = '';
      skipSegments = [];
      return;
    }
    if (videoId !== currentVideoId) {
      currentVideoId = videoId;
      skipSegments = [];
      const categoriesParam = encodeURIComponent(JSON.stringify(['sponsor', 'intro', 'outro', 'selfpromo']));
      fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(videoId)}&categories=${categoriesParam}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          skipSegments = Array.isArray(data) ? data : [];
        })
        .catch(() => {});
    }
  }

  setInterval(() => {
    const onVideoPage = window.location.pathname.startsWith('/watch') || window.location.pathname.startsWith('/shorts/');
    checkShortsRedirect();
    if (!onVideoPage) return;
    checkVideoIdAndFetchSponsor();
    if (currentVideoId) {
      updateDislikeCount(currentVideoId);
    }
    const activeReelActions = document.querySelectorAll('ytd-reel-video-renderer #actions, ytd-reel-player-overlay-renderer #actions');
    for (let i = 0; i < activeReelActions.length; i++) {
      injectShortsBtn(activeReelActions[i]);
    }
    const video = document.querySelector('video');
    if (video && skipSegments.length > 0) {
      const cur = video.currentTime;
      for (const seg of skipSegments) {
        if (seg.segment && cur >= seg.segment[0] && cur < seg.segment[1]) {
          video.currentTime = seg.segment[1];
          break;
        }
      }
    }
  }, 500);

  // 4. Video Player Gestures: Double-click left/right side to seek -10s / +10s (prevent fullscreen toggle)
  document.addEventListener('dblclick', (e) => {
    const video = document.querySelector('video');
    if (!video || !e.target.closest('#movie_player, .html5-video-player')) return;
    if (e.target.closest('.ytp-chrome-bottom, .ytp-progress-bar-container, button')) return;
    const player = document.getElementById('movie_player') || video;
    const rect = player.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width * 0.35) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      video.currentTime = Math.max(0, video.currentTime - 10);
    } else if (clickX > rect.width * 0.65) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      video.currentTime = Math.min(video.duration || 99999, video.currentTime + 10);
    }
  }, true);

  // 5. BroTube In-Stream, Thumbnail, Suggestions & Shorts Quick Download Integration
  const DL_ICON_SVG = '<svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>';
  const VIDEO_CARD_SELECTORS = 'ytd-rich-item-renderer, yt-lockup-view-model, ytd-rich-grid-media, ytd-rich-grid-slim-media, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-reel-item-renderer, ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer';
  const MENU_TRIGGER_SELECTORS = 'ytd-menu-renderer, #menu, [aria-label*="action" i], [aria-label*="menu" i], [aria-label*="more" i], [aria-haspopup="menu"], [aria-haspopup="true"], yt-icon-button, button, yt-button-shape, .dropdown-trigger';

  function extractCardMeta(card) {
    if (!card) return null;
    const linkEl = card.querySelector('a#thumbnail[href], a#video-title-link[href], a#video-title[href], a[href*="/watch"], a[href*="/shorts/"], a[href*="/playlist"], a[href*="list="], a.yt-lockup-view-model-wiz__content-image[href], a.yt-core-attributed-string__link[href]');
    const href = linkEl?.getAttribute('href') || linkEl?.href || '';
    if (!href) return null;
    const url = href.startsWith('http') ? href : `https://www.youtube.com${href}`;
    const titleEl = card.querySelector('#video-title, #video-title-link, .yt-lockup-metadata-view-model-wiz__title, .ytd-video-renderer #title, h3, [class*="title"], [title]');
    const title = (
      titleEl?.getAttribute('title') ||
      titleEl?.textContent ||
      card.querySelector('a#video-title-link, a#video-title, a[href*="/watch"]')?.getAttribute('title') ||
      card.querySelector('a#video-title-link, a#video-title, a[href*="/watch"]')?.getAttribute('aria-label') ||
      ''
    ).trim();
    return { url, title, card };
  }

  function injectThumbnailBtn(target) {
    if (!target) return;
    const card = target.closest(VIDEO_CARD_SELECTORS);
    const thumb = (card && card.querySelector('ytd-thumbnail, ytd-playlist-thumbnail, #thumbnail, .yt-lockup-view-model-wiz__content-image')) || target.closest('ytd-thumbnail, ytd-playlist-thumbnail, ytd-reel-item-renderer');
    if (!thumb || thumb.querySelector('.brotube-thumb-dl-btn')) return;
    if (getComputedStyle(thumb).position === 'static') {
      thumb.style.position = 'relative';
    }
    const btn = document.createElement('div');
    btn.className = 'brotube-thumb-dl-btn';
    btn.title = 'Download Video (BroTube)';
    btn.setAttribute('role', 'button');
    btn.innerHTML = DL_ICON_SVG;
    thumb.appendChild(btn);
  }

  function injectShortsBtn(actions) {
    if (!actions || actions.querySelector('.brotube-shorts-dl-btn')) return;
    const btn = document.createElement('div');
    btn.className = 'brotube-shorts-dl-btn';
    btn.title = 'Download Short (BroTube)';
    btn.setAttribute('role', 'button');
    btn.innerHTML = `<div class="brotube-shorts-dl-icon">${DL_ICON_SVG}</div><span class="brotube-shorts-dl-label">Download</span>`;
    const shareOrMenu = actions.querySelector('#share-button, #menu, ytd-menu-renderer');
    if (shareOrMenu) {
      actions.insertBefore(btn, shareOrMenu.nextSibling);
    } else {
      actions.appendChild(btn);
    }
  }

  // Track active video card when 3-dots menu button is clicked
  // shortcut: captures meta from DOM directly on trigger click, upgrade with MutationObserver if YouTube renders async detached action sheets
  let lastMenuCard = null;
  let lastMenuMeta = null;

  function trackActiveMenuCard(e) {
    if (!e.target || !e.target.closest) return;
    if (e.target.closest('tp-yt-iron-dropdown, ytd-popup-container, ytd-menu-popup-renderer, yt-sheet-view-model')) {
      return;
    }
    const card = e.target.closest(VIDEO_CARD_SELECTORS);
    if (!card) return;

    if (e.target.closest(MENU_TRIGGER_SELECTORS)) {
      lastMenuCard = card;
      const meta = extractCardMeta(card);
      if (meta) {
        lastMenuMeta = meta;
      }
      ensureMenuDownloadButton(card);
    }
  }

  // BroTube 3-Dots Menu Permanent Download Injection Engine
  function hasMenuDownload(menuContainer) {
    if (!menuContainer) return false;
    if (menuContainer.querySelector('ytd-menu-service-item-download-renderer, .brotube-menu-dl-item')) {
      return true;
    }
    const items = menuContainer.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-item, ytd-menu-navigation-item-renderer, yt-button-view-model, yt-menu-service-item-view-model');
    for (const item of items) {
      const text = (item.textContent || item.getAttribute('aria-label') || '').trim();
      if (/download/i.test(text)) {
        return true;
      }
    }
    return false;
  }

  function createMenuDownloadItem(targetCard) {
    const item = document.createElement('ytd-menu-service-item-renderer');
    item.className = 'style-scope ytd-menu-popup-renderer brotube-menu-dl-item';
    item.setAttribute('role', 'menuitem');
    item.setAttribute('tabindex', '-1');

    let meta = targetCard ? extractCardMeta(targetCard) : null;
    if (!meta && window.location.pathname.startsWith('/watch')) {
      const titleEl = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1, h1');
      meta = {
        url: window.location.href,
        title: (titleEl?.getAttribute('title') || titleEl?.textContent || document.title.replace(' - YouTube', '')).trim(),
        card: null
      };
    }
    if (meta) {
      item._brotubeMeta = meta;
    }

    item.innerHTML = `
      <tp-yt-paper-item class="style-scope ytd-menu-service-item-renderer brotube-menu-paper-item" role="option">
        <yt-icon class="style-scope ytd-menu-service-item-renderer brotube-menu-icon">${DL_ICON_SVG}</yt-icon>
        <yt-formatted-string class="style-scope ytd-menu-service-item-renderer brotube-menu-label">Download</yt-formatted-string>
      </tp-yt-paper-item>
    `;
    return item;
  }

  function findActiveMenuListbox() {
    const dropdowns = document.querySelectorAll('tp-yt-iron-dropdown, ytd-popup-container tp-yt-iron-dropdown');
    for (const d of dropdowns) {
      if (d.opened || d.getAttribute('aria-hidden') === 'false' || (d.offsetParent !== null && getComputedStyle(d).display !== 'none')) {
        const listbox = d.querySelector('tp-yt-paper-listbox, [role="menu"], #items');
        if (listbox && listbox.children.length > 0) return { listbox, dropdown: d };
      }
    }
    const popups = document.querySelectorAll('ytd-menu-popup-renderer, yt-sheet-view-model');
    for (const p of popups) {
      if (p.offsetParent !== null && getComputedStyle(p).display !== 'none') {
        const listbox = p.querySelector('tp-yt-paper-listbox, [role="menu"], #items') || p;
        if (listbox && listbox.children.length > 0) return { listbox, dropdown: p.closest('tp-yt-iron-dropdown') || p };
      }
    }
    return null;
  }

  function ensureMenuDownloadButton(cardHint) {
    const active = findActiveMenuListbox();
    if (!active || !active.listbox) return;
    const { listbox, dropdown } = active;

    if (hasMenuDownload(listbox)) return;

    const card = cardHint || lastMenuCard || dropdown?.positionTarget?.closest(VIDEO_CARD_SELECTORS);
    const dlItem = createMenuDownloadItem(card);

    const items = Array.from(listbox.children);
    const refItem = items.find(el => /not interested|don't recommend|report/i.test(el.textContent || ''));
    if (refItem) {
      listbox.insertBefore(dlItem, refItem);
    } else {
      listbox.appendChild(dlItem);
    }
  }

  function initMenuObserver() {
    const container = document.querySelector('ytd-popup-container');
    if (container) {
      const observer = new MutationObserver(() => {
        ensureMenuDownloadButton(lastMenuCard);
      });
      observer.observe(container, { childList: true, subtree: true });
    } else {
      setTimeout(initMenuObserver, 500);
    }
  }
  initMenuObserver();

  document.addEventListener('pointerdown', trackActiveMenuCard, true);

  document.addEventListener('mouseover', (e) => {
    if (e.target && e.target.closest) {
      injectThumbnailBtn(e.target);
      const reel = e.target.closest('ytd-reel-video-renderer, ytd-reel-player-overlay-renderer');
      if (reel) {
        const actions = reel.querySelector('#actions');
        if (actions) injectShortsBtn(actions);
      }
      if (e.target.closest('ytd-menu-popup-renderer, tp-yt-iron-dropdown, yt-sheet-view-model')) {
        ensureMenuDownloadButton(lastMenuCard);
      }
    }
  }, { passive: true });

  document.addEventListener('click', (e) => {
    // A. Thumbnail Download Button Click (Cards on Home, Suggestions, Search)
    const thumbBtn = e.target && e.target.closest && e.target.closest('.brotube-thumb-dl-btn');
    if (thumbBtn) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const card = thumbBtn.closest(VIDEO_CARD_SELECTORS) || thumbBtn.parentElement;
      const meta = extractCardMeta(card);
      const href = meta?.url || '';
      if (!href) return;
      const title = meta?.title || '';

      thumbBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { thumbBtn.style.transform = ''; }, 150);

      ipcRenderer.sendToHost('guest-download-url', { url: href, title });
      return;
    }

    // B. Shorts In-Player Download Button Click
    const shortsBtn = e.target && e.target.closest && e.target.closest('.brotube-shorts-dl-btn');
    if (shortsBtn) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const reel = shortsBtn.closest('ytd-reel-video-renderer') || document.querySelector('ytd-reel-video-renderer[is-active]') || document;
      let shortUrl = '';
      const linkEl = reel.querySelector?.('a[href*="/shorts/"]');
      if (linkEl && linkEl.href) {
        shortUrl = linkEl.href;
      }
      if (!shortUrl && window.location.pathname.includes('/shorts/')) {
        shortUrl = window.location.href;
      }
      if (!shortUrl && reel.getAttribute) {
        const vidId = reel.getAttribute('video-id') || reel.getAttribute('data-video-id');
        if (vidId) shortUrl = `https://www.youtube.com/shorts/${vidId}`;
      }
      if (!shortUrl) shortUrl = window.location.href;

      const titleEl = reel.querySelector?.('h2.ytd-shorts-player-title-view-model, #overlay .title, ytd-reel-player-header-renderer h2, h2') || document.querySelector('h2.ytd-shorts-player-title-view-model');
      const title = (titleEl?.getAttribute('title') || titleEl?.textContent || document.title.replace(' - YouTube', '')).trim();

      ipcRenderer.sendToHost('guest-download-url', { url: shortUrl, title });
      return;
    }

    // C. Intercept YouTube's native Download button under player, in cards, or in 3-dots menus
    const nativeDlBtn = e.target && e.target.closest && e.target.closest('ytd-download-button-renderer, ytd-menu-service-item-download-renderer, [aria-label*="Download" i], [title*="Download" i], .brotube-menu-dl-item');
    const menuDlItem = e.target && e.target.closest && e.target.closest('ytd-menu-service-item-renderer, tp-yt-paper-item, ytd-menu-navigation-item-renderer, yt-button-view-model, button, .brotube-menu-dl-item');
    const isMenuDlText = menuDlItem && /download/i.test(menuDlItem.textContent || menuDlItem.getAttribute('aria-label') || '');

    if ((nativeDlBtn || isMenuDlText) && !e.target.closest('.brotube-thumb-dl-btn, .brotube-shorts-dl-btn')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Dismiss open dropdown menus if any
      document.querySelectorAll('tp-yt-iron-dropdown, ytd-menu-popup-renderer').forEach(d => {
        try { if (d.opened) d.opened = false; } catch (_) {}
      });

      // 1. Resolve from injected item, tracked menu meta, or card
      const injectedItem = e.target.closest('.brotube-menu-dl-item');
      let targetMeta = (injectedItem && injectedItem._brotubeMeta) ||
                       lastMenuMeta ||
                       (lastMenuCard ? extractCardMeta(lastMenuCard) : null);

      // 2. Fallback: inspect open dropdown's positionTarget anchor element
      if (!targetMeta) {
        const dropdown = e.target.closest('tp-yt-iron-dropdown') ||
          document.querySelector('tp-yt-iron-dropdown[aria-hidden="false"], tp-yt-iron-dropdown:not([style*="display: none"]), ytd-popup-container tp-yt-iron-dropdown');
        const anchor = dropdown?.positionTarget || dropdown?._positionTarget;
        const anchorCard = anchor?.closest?.(VIDEO_CARD_SELECTORS);
        if (anchorCard) {
          targetMeta = extractCardMeta(anchorCard);
        }
      }

      // 3. Fallback: inspect YouTube element internal data for videoId
      if (!targetMeta) {
        const item = menuDlItem || nativeDlBtn;
        const vidId = item?.data?.serviceEndpoint?.downloadVideoEndpoint?.videoId ||
                      item?.data?.serviceEndpoint?.watchEndpoint?.videoId ||
                      item?.data?.navigationEndpoint?.watchEndpoint?.videoId ||
                      item?.__data?.data?.serviceEndpoint?.downloadVideoEndpoint?.videoId ||
                      item?.__data?.data?.serviceEndpoint?.watchEndpoint?.videoId;
        if (vidId) {
          targetMeta = { url: `https://www.youtube.com/watch?v=${vidId}`, title: '' };
        }
      }

      if (targetMeta && targetMeta.url) {
        ipcRenderer.sendToHost('guest-download-url', { url: targetMeta.url, title: targetMeta.title || '' });
        lastMenuCard = null;
        lastMenuMeta = null;
        return;
      }

      // 4. Fallback for Shorts page
      if (window.location.pathname.startsWith('/shorts/')) {
        const titleEl = document.querySelector('h2.ytd-shorts-player-title-view-model, #overlay .title, h2');
        const title = (titleEl?.getAttribute('title') || titleEl?.textContent || document.title.replace(' - YouTube', '')).trim();
        ipcRenderer.sendToHost('guest-download-url', { url: window.location.href, title });
        lastMenuCard = null;
        lastMenuMeta = null;
        return;
      }

      // 5. Fallback for Watch page (active player)
      if (window.location.pathname.startsWith('/watch')) {
        const titleEl = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1, h1');
        const title = (titleEl?.getAttribute('title') || titleEl?.textContent || document.title.replace(' - YouTube', '')).trim();
        ipcRenderer.sendToHost('guest-download-url', { url: window.location.href, title });
        lastMenuCard = null;
        lastMenuMeta = null;
        return;
      }

      ipcRenderer.sendToHost('guest-download-current');
      lastMenuCard = null;
      lastMenuMeta = null;
    }
  }, true);
});
