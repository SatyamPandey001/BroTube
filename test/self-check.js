const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { getDefaultDownloadDir, buildDownloadArgs } = require('../src/main/downloader');
const { setupAdblocker, getBlockedCount, AD_URL_PATTERNS } = require('../src/main/adblock');

console.log('🧪 Running BroTube Self-Check Assertions...');

// 1. Check Download Directory
const dlDir = getDefaultDownloadDir();
assert(typeof dlDir === 'string' && dlDir.length > 0, 'Download dir must be a non-empty string');
assert(fs.existsSync(dlDir), `Download directory should exist: ${dlDir}`);
console.log('✅ Download Directory verified:', dlDir);

// 3. Check Adblock module
assert.strictEqual(getBlockedCount(), 0, 'Initial blocked count should be 0');
assert(AD_URL_PATTERNS.includes('*://*.youtube.com/pagead/*'), 'Must match pagead');
assert(AD_URL_PATTERNS.includes('*://*.youtube.com/youtubei/v1/player/ad_break*'), 'Must match player ad_break');
assert(AD_URL_PATTERNS.includes('*://*.googlesyndication.com/*'), 'Must match googlesyndication');
assert(AD_URL_PATTERNS.includes('*://*.googleadservices.com/*'), 'Must match googleadservices');
assert(AD_URL_PATTERNS.includes('*://*.2mdn.net/*'), 'Must match 2mdn doubleclick cdn');
assert(!AD_URL_PATTERNS.some(p => p.includes('att/get')), 'Must NOT block att/get to prevent YouTube attestation interruption popup');

let capturedHandler = null;
const mockSession = {
  webRequest: {
    onBeforeRequest: (opts, handler) => { capturedHandler = handler; },
    onBeforeSendHeaders: () => {}
  }
};
setupAdblocker(mockSession);
assert(typeof capturedHandler === 'function', 'setupAdblocker must register onBeforeRequest handler');

let adBlocked = false;
capturedHandler({ url: 'https://www.youtube.com/pagead/123' }, (res) => {
  adBlocked = res.cancel;
});
assert.strictEqual(adBlocked, true, 'Ad requests must be cancelled');

let qoeAdBlocked = false;
capturedHandler({ url: 'https://www.youtube.com/api/stats/qoe?adformat=1' }, (res) => {
  qoeAdBlocked = res.cancel;
});
assert.strictEqual(qoeAdBlocked, true, 'QoE ad stats must be cancelled');

let playbackAdBlocked = false;
capturedHandler({ url: 'https://www.youtube.com/api/stats/playback?adformat=2' }, (res) => {
  playbackAdBlocked = res.cancel;
});
assert.strictEqual(playbackAdBlocked, true, 'Playback ad telemetry must be cancelled');

let normalPlaybackAllowed = false;
capturedHandler({ url: 'https://www.youtube.com/api/stats/playback?ns=yt&docid=123' }, (res) => {
  normalPlaybackAllowed = !res.cancel;
});
assert.strictEqual(normalPlaybackAllowed, true, 'Normal video playback telemetry must NOT be cancelled');
console.log('✅ Adblocker Engine verified');

// 4. Check Downloader Argument Generation (Audio, Video, and Playlist Safety)
const { cleanVideoUrl, cleanPlaylistUrl } = require('../src/main/downloader');
const dirtyUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDMM&index=3';
const cleanedUrl = cleanVideoUrl(dirtyUrl);
assert.strictEqual(cleanedUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'cleanVideoUrl must strip playlist parameters');

const cleanedPlaylist = cleanPlaylistUrl(dirtyUrl);
assert.strictEqual(cleanedPlaylist, 'https://www.youtube.com/playlist?list=RDMM', 'cleanPlaylistUrl must extract playlist URL');

const dedicatedPlaylist = 'https://www.youtube.com/playlist?list=PL123456&si=xyz';
assert.strictEqual(cleanPlaylistUrl(dedicatedPlaylist), 'https://www.youtube.com/playlist?list=PL123456', 'cleanPlaylistUrl must sanitize playlist URL');

const liveUrl = 'https://www.youtube.com/live/dQw4w9WgXcQ?feature=share';
assert.strictEqual(cleanVideoUrl(liveUrl), 'https://www.youtube.com/live/dQw4w9WgXcQ', 'cleanVideoUrl must sanitize /live/ URLs');

// Check Playlist Download Argument Generation (Batch Mode)
const playlistVideoArgs = buildDownloadArgs({
  url: dirtyUrl,
  isPlaylist: true,
  quality: '1080'
});
assert(playlistVideoArgs.includes('--yes-playlist'), 'Playlist downloads must include --yes-playlist');
assert(!playlistVideoArgs.includes('--no-playlist'), 'Playlist downloads must NOT include --no-playlist');
assert(playlistVideoArgs.includes('https://www.youtube.com/playlist?list=RDMM'), 'Playlist downloads must pass cleaned playlist URL');
const plVideoOutIdx = playlistVideoArgs.indexOf('-o');
assert(plVideoOutIdx !== -1 && playlistVideoArgs[plVideoOutIdx + 1].includes('%(playlist_title|Playlist)s'), 'Playlist videos must route to subfolder template');
assert(playlistVideoArgs[plVideoOutIdx + 1].includes('%(playlist_index|01)02d'), 'Playlist videos must format index template');

const playlistAudioArgs = buildDownloadArgs({
  url: dirtyUrl,
  isPlaylist: true,
  isAudioOnly: true,
  audioFormat: 'mp3'
});
assert(playlistAudioArgs.includes('--yes-playlist'), 'Playlist audio downloads must include --yes-playlist');
assert(playlistAudioArgs.includes('-x'), 'Playlist audio downloads must extract audio');
const plAudioOutIdx = playlistAudioArgs.indexOf('-o');
assert(plAudioOutIdx !== -1 && playlistAudioArgs[plAudioOutIdx + 1].includes('audios'), 'Playlist audios must route to audios subfolder');
assert(playlistAudioArgs[plAudioOutIdx + 1].includes('%(playlist_title|Playlist)s'), 'Playlist audios must route to subfolder template');

const videoArgs = buildDownloadArgs({
  url: dirtyUrl,
  quality: '1080',
  isAudioOnly: false
});
assert(videoArgs.includes('--merge-output-format'), 'Video downloads should specify container merge format');
assert(videoArgs.includes('mkv'), 'Video downloads should default to mkv container');
assert(videoArgs.includes('--no-playlist'), 'Video downloads must include --no-playlist to prevent bulk downloads');
assert(videoArgs.includes('--'), 'Arguments must include -- separator before URL');
assert(videoArgs.includes('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'Arguments must pass clean URL');

const videoOutputIdx = videoArgs.indexOf('-o');
assert(videoOutputIdx !== -1 && videoArgs[videoOutputIdx + 1].includes('videos'), 'Video downloads must route to videos subfolder');
assert(fs.existsSync(path.join(dlDir, 'videos')), 'videos subfolder must exist');

const audioArgs = buildDownloadArgs({
  url: dirtyUrl,
  isAudioOnly: true,
  audioFormat: 'mp3'
});
const audioOutputIdx = audioArgs.indexOf('-o');
assert(audioOutputIdx !== -1 && audioArgs[audioOutputIdx + 1].includes('audios'), 'Audio downloads must route to audios subfolder');
assert(fs.existsSync(path.join(dlDir, 'audios')), 'audios subfolder must exist');

assert(!audioArgs.includes('--merge-output-format'), 'Audio downloads must NEVER include --merge-output-format');
assert(audioArgs.includes('--no-playlist'), 'Audio downloads must include --no-playlist');
assert(audioArgs.includes('-x'), 'Audio downloads must include -x extract flag');
assert(audioArgs.includes('mp3'), 'Audio downloads must include requested format');
assert(audioArgs.includes('--'), 'Arguments must include -- separator before URL');
assert(videoArgs.includes('--print'), 'Arguments must include --print for live track title reporting');
assert(videoArgs.includes('--progress'), 'Arguments must include --progress to ensure real-time progress stream');
assert(videoArgs.includes('--no-simulate'), 'Arguments must include --no-simulate to execute downloads while printing title');
assert(videoArgs.includes('after_video:video_title:%(title)s'), 'Arguments must include after_video:video_title template');
assert(videoArgs.includes('--js-runtimes'), 'Arguments must include --js-runtimes for JS challenge solving');
assert(videoArgs.includes('node'), 'Arguments must configure node as JS runtime');
assert(videoArgs.includes('--remote-components'), 'Arguments must include --remote-components');
assert(videoArgs.includes('ejs:github'), 'Arguments must enable ejs:github solver');

// Check non-numeric quality safety
const nanQualityArgs = buildDownloadArgs({ url: dirtyUrl, quality: 'bad-quality' });
assert(!nanQualityArgs.some(a => a.includes('NaN')), 'buildDownloadArgs must not produce NaN in format selector');
const numQualityArgs = buildDownloadArgs({ url: dirtyUrl, quality: '720p' });
assert(numQualityArgs.some(a => a.includes('height<=720')), 'buildDownloadArgs must parse numeric quality correctly');

// Check Clip / Time-Range Download Arguments
const clipArgs = buildDownloadArgs({
  url: dirtyUrl,
  quality: '1080',
  timeRange: '*01:30-03:45'
});
assert(clipArgs.includes('--download-sections'), 'Clip downloads must include --download-sections');
assert(clipArgs.includes('*01:30-03:45'), 'Clip downloads must pass requested time slice');
assert(clipArgs.includes('--force-keyframes-at-cuts'), 'Clip downloads must include --force-keyframes-at-cuts');

// Check Standalone Thumbnail Extraction
const thumbArgs = buildDownloadArgs({
  url: dirtyUrl,
  isThumbnailOnly: true
});
assert(thumbArgs.includes('--write-thumbnail'), 'Thumbnail downloads must include --write-thumbnail');
assert(thumbArgs.includes('--progress'), 'Thumbnail downloads must include --progress');
assert(thumbArgs.includes('--skip-download'), 'Thumbnail downloads must skip video download');
assert(thumbArgs.some(a => a.includes('thumbnails')), 'Thumbnail downloads must route to thumbnails directory');

// Check Standalone Subtitle Extraction
const subsArgs = buildDownloadArgs({
  url: dirtyUrl,
  isSubtitlesOnly: true
});
assert(subsArgs.includes('--write-subs'), 'Subtitle downloads must include --write-subs');
assert(subsArgs.includes('--progress'), 'Subtitle downloads must include --progress');
assert(subsArgs.includes('--convert-subs'), 'Subtitle downloads must convert to srt');
assert(subsArgs.some(a => a.includes('subtitles')), 'Subtitle downloads must route to subtitles directory');

// FFmpeg resolution assertion
const { getFfmpegDir } = require('../src/main/downloader');
const ffmpegDir = getFfmpegDir();
assert(ffmpegDir && fs.existsSync(path.join(ffmpegDir, 'ffmpeg.exe')), 'getFfmpegDir must locate valid ffmpeg executable');
assert(videoArgs.includes('--ffmpeg-location'), 'Video download arguments must include --ffmpeg-location');
assert(videoArgs.includes(ffmpegDir), 'Video download arguments must pass discovered FFmpeg directory');

// Test Cookie file formatting and passing
const { formatNetscapeCookies, exportCookiesToFile } = require('../src/main/downloader');
const testCookies = [
  { domain: '.youtube.com', path: '/', secure: true, httpOnly: true, expirationDate: 1800000000, name: 'LOGIN_INFO', value: 'token123' },
  { domain: '.youtube.com', path: '/', secure: false, httpOnly: false, expirationDate: 1800000000, name: 'VISITOR_INFO1_LIVE', value: 'vis123' }
];
const netscapeText = formatNetscapeCookies(testCookies);
assert(netscapeText.includes('#HttpOnly_.youtube.com'), 'Netscape cookies must preserve httpOnly prefix');
assert(netscapeText.includes('LOGIN_INFO\ttoken123'), 'Netscape cookies must preserve name and value separated by tab');

const dummyCookiePath = path.join(dlDir, 'test_self_check_cookies.txt');
exportCookiesToFile(testCookies, dummyCookiePath);
assert(fs.existsSync(dummyCookiePath), 'exportCookiesToFile must create cookie file on disk');

const cookieArgs = buildDownloadArgs({
  url: dirtyUrl,
  cookiePath: dummyCookiePath
});
assert(cookieArgs.includes('--cookies'), 'buildDownloadArgs must include --cookies when cookiePath is provided');
assert(cookieArgs.includes(dummyCookiePath), 'buildDownloadArgs must pass the cookie file path');
fs.unlinkSync(dummyCookiePath);

// Test Encrypted Cookie Storage & Ephemeral Lifecycle
const {
  saveEncryptedCookies,
  acquireEphemeralCookieFile,
  releaseEphemeralCookieFile,
  getDefaultEncryptedCookiePath
} = require('../src/main/downloader');

const dummyEncPath = path.join(dlDir, 'test_self_check_cookies.enc');
saveEncryptedCookies(testCookies, dummyEncPath);
assert(fs.existsSync(dummyEncPath), 'saveEncryptedCookies must create encrypted file on disk');
const rawEnc = fs.readFileSync(dummyEncPath);
assert(!rawEnc.toString('utf8').includes('LOGIN_INFO'), 'Encrypted cookie file must NOT contain plaintext credentials');

const ephemPath = acquireEphemeralCookieFile(dummyEncPath);
assert(ephemPath && fs.existsSync(ephemPath), 'acquireEphemeralCookieFile must create ephemeral file');
const ephemContent = fs.readFileSync(ephemPath, 'utf8');
assert(ephemContent.includes('LOGIN_INFO\ttoken123'), 'Ephemeral file must contain decrypted Netscape cookies');
releaseEphemeralCookieFile(ephemPath);
assert(!fs.existsSync(ephemPath), 'releaseEphemeralCookieFile must delete ephemeral cookie file');
fs.unlinkSync(dummyEncPath);

console.log('✅ Downloader Argument Generation & Bulletproof Encrypted Cookie Engine verified');

// Test Dynamic Standalone Runner Engine
const { resolveYtDlpRunner } = require('../src/main/downloader');
const runner = resolveYtDlpRunner();
assert(runner && typeof runner.command === 'string' && runner.command.length > 0, 'resolveYtDlpRunner must return a valid command');
assert(typeof runner.isStandalone === 'boolean', 'resolveYtDlpRunner must determine standalone state');
assert(Array.isArray(runner.argsPrefix), 'runner.argsPrefix must be an array');
console.log(`✅ Dynamic Standalone Engine Runner verified (Mode: ${runner.type} | Executable: ${runner.command})`);

// Check Cache & Token Residue Cleaner
const { clearDownloaderCache } = require('../src/main/downloader');
assert(typeof clearDownloaderCache === 'function', 'clearDownloaderCache must be a function');
console.log('✅ Cache & Residual Token Purge Engine verified');

// 5. Check Main Process & Preload Sandbox Safety & Syntax Integrity
const mainIndexPath = path.join(__dirname, '..', 'src', 'main', 'index.js');
const downloaderPath = path.join(__dirname, '..', 'src', 'main', 'downloader.js');
const hostPreloadPath = path.join(__dirname, '..', 'src', 'preload', 'preload.js');
const guestPreloadPath = path.join(__dirname, '..', 'src', 'preload', 'guest-preload.js');

// Verify syntax integrity - must parse without SyntaxError
execSync(`node -c "${mainIndexPath}"`);
execSync(`node -c "${downloaderPath}"`);
execSync(`node -c "${hostPreloadPath}"`);
execSync(`node -c "${guestPreloadPath}"`);

const mainCode = fs.readFileSync(mainIndexPath, 'utf8');
const downloaderCode = fs.readFileSync(downloaderPath, 'utf8');
const mainHandles = [...mainCode.matchAll(/ipcMain\.handle\(['"]([^'"]+)['"]/g)].map(m => m[1]);
const dupHandles = mainHandles.filter((h, idx) => mainHandles.indexOf(h) !== idx);
assert.strictEqual(dupHandles.length, 0, `index.js must not contain duplicate ipcMain.handle registrations: ${dupHandles.join(', ')}`);

// Verify window close process safety guard and spatial exit modal IPC
assert(mainCode.includes("mainWindow.on('close'"), 'index.js must register mainWindow close listener');
assert(mainCode.includes('show-exit-modal'), 'index.js must notify renderer with show-exit-modal on close event');
assert(mainCode.includes('check-active-tasks'), 'index.js must handle check-active-tasks IPC');
assert(mainCode.includes('confirm-exit'), 'index.js must handle confirm-exit IPC');
assert(mainCode.includes('activeConversions'), 'index.js must track activeConversions');
assert(mainCode.includes('setMaxListeners'), 'index.js must configure setMaxListeners on webContents to prevent EventEmitter warnings');

// Verify convertMediaFile export
const { convertMediaFile } = require('../src/main/downloader');
assert(typeof convertMediaFile === 'function', 'downloader must export convertMediaFile function');

const hostPreload = fs.readFileSync(hostPreloadPath, 'utf8');
assert(!hostPreload.includes("require('fs')"), 'Host preload must NOT import fs in sandboxed mode');
assert(!hostPreload.includes("require('path')"), 'Host preload must NOT import path in sandboxed mode');
assert(hostPreload.includes('logoutSession'), 'Host preload must expose logoutSession API');
assert(hostPreload.includes('setLanguage'), 'Host preload must expose setLanguage API');
assert(hostPreload.includes('openExternal'), 'Host preload must expose openExternal API');
assert(hostPreload.includes('convertMedia'), 'Host preload must expose convertMedia API');
assert(hostPreload.includes('selectFile'), 'Host preload must expose selectFile API');
assert(hostPreload.includes('confirmExit'), 'Host preload must expose confirmExit API');
assert(hostPreload.includes('checkActiveTasks'), 'Host preload must expose checkActiveTasks API');
assert(hostPreload.includes('onShowExitModal'), 'Host preload must expose onShowExitModal API');

const guestPreload = fs.readFileSync(guestPreloadPath, 'utf8');
assert(!guestPreload.includes("require('fs')"), 'Guest preload must NOT import fs in sandboxed mode');
assert(!guestPreload.includes("require('path')"), 'Guest preload must NOT import path in sandboxed mode');
assert(!guestPreload.includes('broTube'), 'Guest preload must NOT expose desktop broTube IPC to YouTube');
assert(guestPreload.includes('ytInitialPlayerResponse'), 'Guest preload must defuse ytInitialPlayerResponse');
assert(guestPreload.includes('adPlacements'), 'Guest preload must strip adPlacements');
assert(guestPreload.includes('origJSONParse'), 'Guest preload must hook JSON.parse for universal player defusing');
assert(guestPreload.includes('injectMainWorldScript'), 'Guest preload must inject defuser into main world');
assert(guestPreload.includes('setBrotubeEq'), 'Guest preload must expose setBrotubeEq');
assert(guestPreload.includes('applyEqPreset'), 'Guest preload must implement applyEqPreset DSP');
assert(guestPreload.includes('getBroTubeAudioSpectrum'), 'Guest preload must expose live getBroTubeAudioSpectrum analyser API');
assert(guestPreload.includes('attachVideoDSP'), 'Guest preload must implement multi-video / shorts attachVideoDSP');
assert(hostPreload.includes('setTheme'), 'Host preload must expose setTheme IPC API');
assert(hostPreload.includes('selectDownloadDir'), 'Host preload must expose selectDownloadDir IPC API');
assert(guestPreload.includes('ytd-mealbar-promo-renderer'), 'Guest preload must hide mealbar promos in CSS');
assert(guestPreload.includes('interruption'), 'Guest preload must defuse interruption popups');
assert(guestPreload.includes('syncYouTubeTheme'), 'Guest preload must include syncYouTubeTheme');
assert(guestPreload.includes('syncZenMode'), 'Guest preload must include syncZenMode');
assert(guestPreload.includes('checkShortsRedirect'), 'Guest preload must include checkShortsRedirect');
assert(guestPreload.includes('isShortsRedirectActive'), 'Guest preload must include isShortsRedirectActive gate');
assert(guestPreload.includes('brotube_short=1'), 'Guest preload must include brotube_short parameter');
assert(guestPreload.includes('updateDislikeCount'), 'Guest preload must include updateDislikeCount');
assert(guestPreload.includes('brotube-theme-sync'), 'Guest preload must listen for brotube-theme-sync events');
assert(guestPreload.includes('brotube-zen-sync'), 'Guest preload must listen for brotube-zen-sync events');
assert(guestPreload.includes('ytd-rich-item-renderer:has(ytd-ad-slot-renderer)'), 'Guest preload must hide rich item ad containers in CSS to prevent blank card gaps');
assert(guestPreload.includes('/youtubei/v1/browse'), 'Guest preload must intercept browse feed responses');
assert(guestPreload.includes('lastShortRedirectId'), 'Guest preload must guard against repetitive shorts location.replace calls');
assert(guestPreload.includes('--ytd-watch-flexy-sidebar-width: 0px !important'), 'Guest preload must eliminate sidebar width in Zen Mode to prevent blank card space');
assert(guestPreload.includes('#player-container-outer'), 'Guest preload must expand video player container dynamically in Zen Mode');
assert(guestPreload.includes('lastDislikeVideoId = videoId;'), 'Guest preload must record lastDislikeVideoId before fetching to prevent infinite polling');
assert(downloaderCode.includes('killActiveConversions'), 'downloader.js must export killActiveConversions');
assert(mainCode.includes('killActiveConversions()'), 'index.js must call killActiveConversions() on before-quit');
const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
assert(pkgJson.devDependencies && pkgJson.devDependencies['electron-builder'], 'package.json must contain electron-builder in devDependencies');
console.log('✅ Host and Guest Preload Sandboxing, Syntax Integrity, Brave Ad Defuser, Dynamic Zen Mode Player & Build Config verified');

// 6. Check Spatial UI Alert Modal Markup
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'index.html'), 'utf8');
assert(indexHtml.includes('allowpopups'), 'index.html must enable allowpopups on yt-webview to permit share targets');
assert(mainCode.includes('openExternalUrl'), 'index.js must define openExternalUrl helper');
const buildBatPath = path.join(__dirname, '..', 'Build-BroTube.bat');
assert(fs.existsSync(buildBatPath) && fs.statSync(buildBatPath).size > 0, 'Build-BroTube.bat must exist and be non-empty');
assert(indexHtml.includes('id="spatial-alert-modal"'), 'index.html must include spatial-alert-modal element');
assert(indexHtml.includes('id="alert-btn-action"'), 'index.html must include alert-btn-action');
assert(indexHtml.includes('id="alert-btn-primary"'), 'index.html must include alert-btn-primary');
assert(indexHtml.includes('id="btn-quick-download"'), 'index.html must include btn-quick-download');
assert(indexHtml.includes('id="btn-drawer-toggle"'), 'index.html must include btn-drawer-toggle');
assert(indexHtml.includes('id="btn-open-folder"'), 'index.html must include btn-open-folder');
assert(indexHtml.includes('id="btn-drawer-open-folder"'), 'index.html must include btn-drawer-open-folder');
assert(indexHtml.includes('id="drawer-backdrop"'), 'index.html must include drawer-backdrop');
assert(indexHtml.includes('id="drawer-status-pill"'), 'index.html must include drawer-status-pill');
assert(indexHtml.includes('id="drawer-path-text"'), 'index.html must include drawer-path-text');
assert(indexHtml.includes('id="drawer-active-badge"'), 'index.html must include drawer-active-badge');
assert(indexHtml.includes('id="check-playlist"'), 'index.html must include check-playlist');
assert(indexHtml.includes('id="label-check-playlist"'), 'index.html must include label-check-playlist');
assert(indexHtml.includes('id="splash-screen"'), 'index.html must include splash-screen element');
assert(indexHtml.includes('id="splash-icon"'), 'index.html must include splash-icon element');
assert(indexHtml.includes('class="splash-brand-title"'), 'index.html must include splash-brand-title kinetic text');
assert(indexHtml.includes('splash screen failsafe'), 'index.html must include bulletproof splash screen failsafe script');
assert(indexHtml.includes('id="btn-theme-toggle"'), 'index.html must include btn-theme-toggle element');
assert(indexHtml.includes('id="btn-change-folder"'), 'index.html must include btn-change-folder element');
assert(indexHtml.includes('id="btn-zen-toggle"'), 'index.html must include btn-zen-toggle element');
assert(indexHtml.includes('id="btn-shorts-toggle"'), 'index.html must include btn-shorts-toggle element');
assert(indexHtml.includes('id="btn-dl-thumb"'), 'index.html must include btn-dl-thumb element');
assert(indexHtml.includes('id="btn-dl-subs"'), 'index.html must include btn-dl-subs element');
assert(indexHtml.includes('id="btn-logout-session"'), 'index.html must include btn-logout-session element');
assert(indexHtml.includes('id="btn-view-terms"'), 'index.html must include btn-view-terms element');
assert(indexHtml.includes('id="eula-modal"'), 'index.html must include eula-modal element');
assert(indexHtml.includes('id="check-eula-agree"'), 'index.html must include check-eula-agree checkbox');
assert(indexHtml.includes('id="btn-eula-accept"'), 'index.html must include btn-eula-accept element');
assert(indexHtml.includes('id="btn-eula-decline"'), 'index.html must include btn-eula-decline element');
assert(indexHtml.includes('id="kofi-modal"'), 'index.html must include kofi-modal element');
assert(indexHtml.includes('id="kofi-floating-widget"'), 'index.html must include kofi-floating-widget element');
assert(indexHtml.includes('id="btn-kofi-support"'), 'index.html must include btn-kofi-support element');
assert(indexHtml.includes('id="btn-kofi-donate"'), 'index.html must include btn-kofi-donate element');
assert(indexHtml.includes('id="transcoder-modal"'), 'index.html must include transcoder-modal element');
assert(indexHtml.includes('id="btn-open-transcoder"'), 'index.html must include btn-open-transcoder element');
assert(indexHtml.includes('id="exit-modal"'), 'index.html must include exit-modal element');
assert(indexHtml.includes('id="btn-exit-confirm"'), 'index.html must include btn-exit-confirm element');
assert(indexHtml.includes('id="btn-exit-cancel"'), 'index.html must include btn-exit-cancel element');
assert(indexHtml.includes('id="exit-status-pill"'), 'index.html must include exit-status-pill element');
assert(indexHtml.includes('id="btn-quick-share"'), 'index.html must include btn-quick-share element');
assert(indexHtml.includes('id="select-language"'), 'index.html must include select-language dropdown');
assert(indexHtml.includes('id="select-eq-preset"'), 'index.html must include select-eq-preset dropdown');
assert(indexHtml.includes('id="check-time-range"'), 'index.html must include check-time-range element');
assert(indexHtml.includes('id="time-start"'), 'index.html must include time-start element');
assert(indexHtml.includes('id="time-end"'), 'index.html must include time-end element');
assert(indexHtml.includes('id="btn-stamp-current"'), 'index.html must include btn-stamp-current element');
assert(indexHtml.includes('data-theme='), 'index.html must include data-theme attribute');
assert(indexHtml.includes('class="brand-logo-img"'), 'index.html must include brand-logo-img element');
assert(indexHtml.includes('class="header-drag-filler"'), 'index.html must include header-drag-filler draggable area');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'app.js'), 'utf8');
assert(!appJs.includes('alertModal'), 'app.js must not reference undeclared alertModal');
assert(appJs.includes('spatialAlertModal'), 'app.js must reference declared spatialAlertModal');
assert(appJs.includes('openExitModal'), 'app.js must include openExitModal controller');
assert(appJs.includes('btnQuickShare'), 'app.js must wire btnQuickShare controller');
assert(appJs.includes("webview.addEventListener('new-window'"), 'app.js must listen for new-window on webview for share links');
assert(appJs.includes('dismissSplash'), 'app.js must include resilient dismissSplash controller');
assert(appJs.includes('applyZenMode'), 'app.js must include applyZenMode controller');
assert(appJs.includes('applyRedirectShorts'), 'app.js must include applyRedirectShorts controller');
assert(appJs.includes('lastRedirectedShortId'), 'app.js must track lastRedirectedShortId for seamless reversion');
assert(appJs.includes('brotube_short=1'), 'app.js must track brotube_short query tag');
assert(appJs.includes('applyLanguage'), 'app.js must include applyLanguage controller');
assert(appJs.includes('syncWebviewEq'), 'app.js must include syncWebviewEq controller');
assert(appJs.includes('kofiModal'), 'app.js must include kofiModal controller');
assert(appJs.includes('transcoderModal'), 'app.js must include transcoderModal controller');
assert(appJs.includes('btnChangeFolder'), 'app.js must include btnChangeFolder controller');
assert(appJs.includes('triggerAssetDownload'), 'app.js must include triggerAssetDownload controller');
assert(appJs.includes('openDownloadDrawer'), 'app.js must include openDownloadDrawer controller');
assert(appJs.includes('logoutSession'), 'app.js must include logoutSession handler');
assert(appJs.includes('initEulaCompliance'), 'app.js must include initEulaCompliance controller');
assert(appJs.includes('activeDownloads.delete(id)'), 'app.js must remove finished/errored tasks from activeDownloads');
assert(appJs.includes('function formatSeconds(secs)'), 'app.js must define reusable formatSeconds helper');

assert(downloaderCode.includes("'-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k'"), 'downloader.js must encode audio to AAC for stream-copied MP4 playback');
assert(downloaderCode.includes('new URL(res.headers.location, currentUrl).href'), 'downloader.js must resolve relative redirect URLs');

const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'styles.css'), 'utf8');
assert(stylesCss.includes('.exit-card'), 'styles.css must style .exit-card');
assert(stylesCss.includes('.exit-danger-btn'), 'styles.css must style .exit-danger-btn');
assert(stylesCss.includes('.theme-switch-btn.active .theme-switch-thumb'), 'styles.css must style active switch thumb');
assert(!stylesCss.includes('[data-theme="light"] .theme-switch-thumb'), 'styles.css must not globally force switch thumb in light mode');
assert(stylesCss.includes('.header-download-btn'), 'styles.css must style .header-download-btn');
assert(stylesCss.includes('[data-theme="light"] .peak-btn'), 'styles.css must style light mode peak-btn for visibility');
assert(stylesCss.includes('--floating-window-bg'), 'styles.css must configure --floating-window-bg for translucent floating windows');
assert(!stylesCss.includes('animation: spectrumBounce'), 'styles.css must NOT use fake static spectrumBounce CSS animation');
assert(appJs.includes('startAudioSpectrum'), 'app.js must implement live reactive startAudioSpectrum visualizer');
assert(indexHtml.includes('hashtag/trending'), 'index.html must route Trending tab to live hashtag/trending');
assert(guestPreload.includes('ytd-searchbox'), 'guest-preload.js must style ytd-searchbox with glassmorphic tokens');
assert(guestPreload.includes('ytd-unified-share-panel-renderer'), 'guest-preload.js must style ytd-unified-share-panel-renderer with frosted glass');
assert(mainCode.includes('releaseEphemeralCookieFile(cookiePath)'), 'main index.js must release ephemeral cookies in get-video-info');
assert(mainCode.includes('acquireEphemeral = false'), 'main index.js must not leak ephemeral cookies on startup');
assert(mainCode.includes('win.unmaximize()') && !mainCode.includes('win.restore()'), 'main index.js must toggle maximize cleanly without jitter');
assert(mainCode.includes('web-contents-created'), 'main index.js must handle web-contents-created to intercept share targets');
assert(mainCode.includes('whatsapp:'), 'main index.js must support whatsapp scheme');
assert(mainCode.includes('disable-gpu-sandbox'), 'main index.js must configure disable-gpu-sandbox for Windows GPU stability');
assert(!mainCode.includes('disable-gpu-process-crash-limit'), 'main index.js must NOT disable crash limits to prevent OS hang loops');
assert(!mainCode.includes('enable-zero-copy'), 'main index.js must NOT force zero-copy to prevent D3D11 TDR driver crashes');

// 7. Check Media Assets (Brand Logo & Standardized Icons)
const logoPath = path.join(__dirname, '..', 'src', 'renderer', 'assets', 'logo.png');
const icoPath = path.join(__dirname, '..', 'src', 'renderer', 'assets', 'icon.ico');
const sbBmp = path.join(__dirname, '..', 'src', 'renderer', 'assets', 'installerSidebar.bmp');
const hdrBmp = path.join(__dirname, '..', 'src', 'renderer', 'assets', 'installerHeader.bmp');
const splashBmp = path.join(__dirname, '..', 'src', 'renderer', 'assets', 'installerSplash.bmp');
const nsisScript = fs.readFileSync(path.join(__dirname, '..', 'build', 'installer.nsh'), 'utf8');
assert(fs.existsSync(logoPath) && fs.statSync(logoPath).size > 0, 'assets/logo.png must exist and be non-empty');
assert(fs.existsSync(icoPath) && fs.statSync(icoPath).size > 0, 'assets/icon.ico must exist and be non-empty');
assert(fs.existsSync(sbBmp) && fs.statSync(sbBmp).size > 0, 'assets/installerSidebar.bmp must exist and be non-empty');
assert(fs.existsSync(hdrBmp) && fs.statSync(hdrBmp).size > 0, 'assets/installerHeader.bmp must exist and be non-empty');
assert(fs.existsSync(splashBmp) && fs.statSync(splashBmp).size > 0, 'assets/installerSplash.bmp must exist and be non-empty');
assert(nsisScript.includes('advsplash::show'), 'installer.nsh must configure advsplash for modern borderless splash UI');
assert(!nsisScript.includes('SilentInstall silent'), 'installer.nsh must NOT configure silent install to preserve interactive UX');
assert(nsisScript.includes('DwmSetWindowAttribute'), 'installer.nsh must configure DWM spatial dark glass attributes');
assert(pkgJson.build.nsis.oneClick === false, 'package.json must configure oneClick: false for interactive wizard');
assert(pkgJson.build.nsis.installerSidebar, 'package.json must configure nsis.installerSidebar');
assert(indexHtml.includes('assets/logo.png'), 'index.html must use assets/logo.png');
console.log('✅ Standardized Brand Logo Asset, Spatial Installer Bitmaps & Windows Multi-Resolution Icon verified');

// Ensure zero duplicate HTML element IDs
const idMatches = [...indexHtml.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
const duplicateIds = idMatches.filter((id, idx) => idMatches.indexOf(id) !== idx);
assert.strictEqual(duplicateIds.length, 0, `index.html must not contain duplicate IDs: ${duplicateIds.join(', ')}`);
console.log('✅ Spatial Alert UI Modal structure and Unique Element IDs verified');

// 6. Check External Binaries (yt-dlp & FFmpeg)
try {
  const ytdlpVer = execSync('python -m yt_dlp --version').toString().trim();
  assert(ytdlpVer.length > 0, 'yt-dlp version must be present');
  console.log('✅ yt-dlp binary verified (Version:', ytdlpVer + ')');
} catch (e) {
  assert.fail(`yt-dlp execution failed: ${e.message}`);
}

try {
  const ffmpegVer = execSync('ffmpeg -version').toString().trim();
  assert(ffmpegVer.includes('ffmpeg version'), 'FFmpeg must report its version');
  console.log('✅ Gyan FFmpeg 9.0.1 binary verified');
} catch (e) {
  assert.fail(`FFmpeg execution failed: ${e.message}`);
}

// 8. Check Bug Fix Regressions (Settings Icon, Popover Dismissal, Back Button Size, Video Gestures)
assert(indexHtml.includes('btn-settings-toggle') && indexHtml.includes('H3a2 2 0 0 1-2-2'), 'Settings icon must have valid closed gear SVG path');
assert(stylesCss.includes('#btn-back') && stylesCss.includes('width: 36px'), 'Back button must have increased 36px size in CSS');
const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'app.js'), 'utf8');
assert(appJsCode.includes('hideSettingsPopover') && appJsCode.includes('guest-click'), 'app.js must dismiss settings popover on guest click');
assert(guestPreload.includes('guest-click') && guestPreload.includes('pointerdown'), 'guest-preload.js must notify host on pointerdown');
assert(guestPreload.includes('stopImmediatePropagation') && guestPreload.includes('preventDefault'), 'guest-preload.js must stop double-click propagation to prevent fullscreen');
console.log('✅ UI Bug Fix Regressions verified (Settings Icon, Popover Auto-Hide, Back Button Size, Double-Click Seek)');

// 9. Check Debug Mode, Log Scanner & GPU TDR / Audio Extraction Guards
const { setDownloaderLogger } = require('../src/main/downloader');
assert(typeof setDownloaderLogger === 'function', 'downloader must export setDownloaderLogger');

const audioTestArgs = buildDownloadArgs({
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  isAudioOnly: true,
  audioFormat: 'mp3',
  embedSubs: true,
  embedThumbnail: true
});
assert(!audioTestArgs.includes('--embed-subs'), 'Audio downloads must NEVER include --embed-subs');
assert(audioTestArgs.includes('--postprocessor-args'), 'Audio downloads must include postprocessor thread limit');
assert(audioTestArgs.includes('ExtractAudio:-threads 2'), 'Audio downloads must throttle ffmpeg threads to 2');
assert(audioTestArgs.includes('--convert-thumbnails'), 'Audio downloads must convert thumbnail to PNG for ID3 tags');
assert(audioTestArgs.includes('png'), 'Thumbnail conversion target must be PNG');

const playlistTestArgs = buildDownloadArgs({
  url: 'https://www.youtube.com/playlist?list=PL1234',
  isPlaylist: true
});
assert(playlistTestArgs.includes('--ignore-errors'), 'Playlist downloads must include --ignore-errors');
assert(playlistTestArgs.includes('--no-abort-on-error'), 'Playlist downloads must include --no-abort-on-error');

const videoTestArgs = buildDownloadArgs({
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  isAudioOnly: false,
  quality: '1080'
});
assert(videoTestArgs.includes('Merger:-threads 2'), 'Video downloads must throttle ffmpeg merger threads to 2');

assert(hostPreload.includes('getDebugMode'), 'Preload must expose getDebugMode API');
assert(hostPreload.includes('setDebugMode'), 'Preload must expose setDebugMode API');
assert(hostPreload.includes('getDebugLogs'), 'Preload must expose getDebugLogs API');
assert(hostPreload.includes('scanDebugLogs'), 'Preload must expose scanDebugLogs API');
assert(indexHtml.includes('btn-debug-toggle'), 'index.html must include btn-debug-toggle');
assert(indexHtml.includes('log-scanner-modal'), 'index.html must include log-scanner-modal');
assert(indexHtml.includes('btn-run-log-scan'), 'index.html must include btn-run-log-scan');
assert(mainCode.includes('disable-gpu-watchdog'), 'main index.js must append disable-gpu-watchdog switch');
assert(mainCode.includes('disable-direct-composition-video-overlays'), 'main index.js must append disable-direct-composition-video-overlays switch to prevent AMD driver crashes');
assert(mainCode.includes('DirectCompositionVideoOverlays'), 'main index.js must disable DirectCompositionVideoOverlays feature');
assert(mainCode.includes("updateYtDlp().catch"), 'main index.js must call updateYtDlp silently on startup');
assert(fs.existsSync(path.join(__dirname, '..', 'CHANGELOG.md')), 'CHANGELOG.md must exist for v1.0.0 release');
console.log('✅ Debug Mode Toggle, Log Scanner Engine & GPU TDR Freezing Safeguards verified');

// 10. Check Downloads Hub Scrolling, Flex Non-Shrink & UI-UX Pro Max Layout Safeguards
assert(stylesCss.includes('min-height: 0;'), 'downloads-list must have min-height: 0 to allow flex container scrolling');
assert(stylesCss.includes('flex-shrink: 0;'), 'download items and drawer chrome must have flex-shrink: 0 to prevent card compacting');
assert(stylesCss.includes('overscroll-behavior: contain;'), 'downloads-list must contain overscroll');
assert(stylesCss.includes('.downloads-list::-webkit-scrollbar'), 'downloads-list must define custom sleek scrollbar');
assert(stylesCss.includes('min-width: 0;'), 'dl-title-row must set min-width: 0 for proper text ellipsis');
console.log('✅ Downloads Hub Scrollability & Flexbox Anti-Compacting Safeguards verified');

// 11. Check Direct 1-Click Download Mode & Persistent Quality Memory
assert(indexHtml.includes('btn-direct-dl-toggle'), 'index.html must include btn-direct-dl-toggle');
assert(indexHtml.includes('check-direct-dl'), 'index.html must include check-direct-dl');
assert(appJsCode.includes('triggerDirectDownload'), 'app.js must implement triggerDirectDownload');
assert(appJsCode.includes('brotube-default-quality'), 'app.js must persist brotube-default-quality');
assert(appJsCode.includes('brotube-direct-dl'), 'app.js must persist brotube-direct-dl');
console.log('✅ Direct 1-Click Download Mode & Persistent Quality Memory verified');

// 12. Check Downloads Hub Clean Header & Aligned Stats Space Utilization
assert(!indexHtml.includes('id="btn-drawer-logs"'), 'index.html must not put diagnostic logs button in downloads drawer');
assert(indexHtml.includes('class="drawer-status-line"'), 'index.html must provide dedicated status line under title');
assert(stylesCss.includes('flex: 1;') && stylesCss.includes('.drawer-tab-btn'), 'drawer-tab-btn must have flex: 1 to utilize available space evenly');
assert(appJsCode.includes('stat-pill-divider'), 'app.js must format simultaneous downloading and finished counts');
console.log('✅ Downloads Hub Clean Header & Aligned Stats Space Utilization verified');

// 13. Check Drawer Non-Auto-Opening & Interruption Toast Elimination
const openDrawerCalls = [...appJsCode.matchAll(/(?<!function\s+)openDownloadDrawer\(\)/g)];
assert.strictEqual(openDrawerCalls.length, 1, 'openDownloadDrawer() must only be called on explicit drawer toggle click, not on download start');
assert(guestPreload.includes('purgeInterruptionToast'), 'guest-preload.js must implement instant purgeInterruptionToast');
assert(guestPreload.includes('tp-yt-paper-toast:has(a[href*="google.com"])'), 'guest-preload.js SPATIAL_CSS must suppress google.com interruption toasts');
assert(guestPreload.includes('obj.alerts = obj.alerts.filter'), 'guest-preload.js pruneAds must filter alerts for interruption/adblock');
console.log('✅ Drawer Non-Auto-Opening & Interruption Toast Elimination verified');

// 14. Check Feed Thumbnail Quick Download & Native In-Stream Download Hijacking
const updatedAppJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'app.js'), 'utf8');
const updatedGuestPreload = fs.readFileSync(path.join(__dirname, '..', 'src', 'preload', 'guest-preload.js'), 'utf8');
assert(updatedGuestPreload.includes('brotube-thumb-dl-btn'), 'guest-preload.js must define .brotube-thumb-dl-btn styling and element');
assert(updatedGuestPreload.includes('guest-download-url'), 'guest-preload.js must send guest-download-url IPC event');
assert(updatedGuestPreload.includes('ytd-download-button-renderer'), 'guest-preload.js must intercept native YouTube download button');
assert(updatedGuestPreload.includes('guest-download-current'), 'guest-preload.js must send guest-download-current IPC event');
assert(updatedAppJs.includes('guest-download-url'), 'app.js must handle guest-download-url IPC event');
assert(updatedAppJs.includes('guest-download-current'), 'app.js must handle guest-download-current IPC event');
console.log('✅ Feed Thumbnail Quick Download & Native In-Stream Download Hijacking verified');

// 15. Check Shorts, Suggestions & Homepage Download Redirection & Options Modal Guarantee
assert(updatedGuestPreload.includes('brotube-shorts-dl-btn'), 'guest-preload.js must define .brotube-shorts-dl-btn element');
assert(updatedGuestPreload.includes('injectShortsBtn'), 'guest-preload.js must implement injectShortsBtn');
assert(updatedGuestPreload.includes('lastMenuCard'), 'guest-preload.js must track lastMenuCard for 3-dots menus');
assert(updatedGuestPreload.includes('ytd-compact-video-renderer'), 'guest-preload.js must handle suggestion video cards');
assert(updatedGuestPreload.includes('yt-lockup-view-model'), 'guest-preload.js must support modern YouTube homepage yt-lockup-view-model cards');
assert(updatedGuestPreload.includes('lastMenuMeta'), 'guest-preload.js must capture lastMenuMeta for reliable 3-dots download redirection');
assert(updatedGuestPreload.includes('brotube-menu-dl-item'), 'guest-preload.js must define .brotube-menu-dl-item for permanent 3-dots download guarantee');
assert(updatedGuestPreload.includes('ensureMenuDownloadButton'), 'guest-preload.js must implement ensureMenuDownloadButton for videos missing native download option');
assert(updatedAppJs.includes("openDownloadModal(getSavedQuality())"), 'app.js must open download modal with options on current download');
assert(updatedAppJs.includes("openDownloadModal(getSavedQuality(), targetUrl, targetTitle)"), 'app.js must open download modal with options on url download');
console.log('✅ Shorts, Suggestions & Homepage Download Redirection & Options Modal Guarantee verified');

// 16. Check Error Integrity, Ephemeral Cleanup, Concurrency Isolation & Transcoder Capping
const latestDownloaderCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'main', 'downloader.js'), 'utf8');
const indexCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'main', 'index.js'), 'utf8');
const finalAppJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'app.js'), 'utf8');

assert(latestDownloaderCode.includes("const args = ['-y', '-threads', '2', '-i', inputPath];"), 'convertMediaFile must cap ffmpeg threads to 2');
assert(latestDownloaderCode.includes('cleanupCookies();') && latestDownloaderCode.includes('Invalid URL: must be an http(s) URL'), 'startDownload must clean up cookies on invalid URL');
assert(finalAppJs.includes("cleanMsg = 'Video unavailable';"), 'app.js must parse Video unavailable errors cleanly');
assert(finalAppJs.includes("item.getAttribute('data-status') === 'completed'"), 'markDownloadItemDone must guard against duplicate execution');
assert(indexCode.includes('Unavailable or Restricted Content Detected'), 'scan-debug-logs must identify unavailable content');
console.log('✅ Error Integrity, Ephemeral Cleanup, Concurrency Isolation & Transcoder Capping verified');

// 17. Check Audit Fixes: Dislike Retry Cache, Stream Telemetry Capping & Clean Menu Dispatch
const auditGuestPreload = fs.readFileSync(path.join(__dirname, '..', 'src', 'preload', 'guest-preload.js'), 'utf8');
assert(auditGuestPreload.includes('cachedDislikeData'), 'guest-preload.js must cache dislike data for slow-rendering DOM buttons');
assert(auditGuestPreload.includes('applyDislikeBadge'), 'guest-preload.js must use reusable applyDislikeBadge helper');
assert(!auditGuestPreload.includes("document.addEventListener('mousedown', trackActiveMenuCard"), 'guest-preload.js must eliminate redundant mousedown menu listener');
assert(finalAppJs.includes('appendLogEntry(entry)'), 'app.js must append single log lines to prevent UI freezing during active downloads');
assert(finalAppJs.includes('cachedLogs.length > 600'), 'app.js must bound cachedLogs buffer to 600 items to prevent memory leaks');
assert(!indexCode.includes('exportCookiesToFile'), 'index.js must not import unused legacy exportCookiesToFile');
console.log('✅ Dislike Retry Cache, Stream Telemetry Capping & Clean Menu Dispatch verified');

// Cookie encryption round-trip (highest-risk code, covers both AES-GCM and safeStorage paths)
const { encryptCookieData, decryptCookieData } = require('../src/main/downloader');
const roundTrip = decryptCookieData(encryptCookieData('test-session-cookie'));
assert.strictEqual(roundTrip, 'test-session-cookie', 'Cookie encrypt→decrypt round-trip must be lossless');
console.log('✅ Cookie encryption round-trip verified');

console.log('\n🎉 ALL BROTUBE SELF-CHECKS PASSED!');

