const AD_URL_PATTERNS = [
  '*://*.doubleclick.net/*',
  '*://*.googleads.g.doubleclick.net/*',
  '*://adservice.google.com/*',
  '*://*.googleadservices.com/*',
  '*://*.googlesyndication.com/*',
  '*://pagead2.googlesyndication.com/*',
  '*://*.2mdn.net/*',
  '*://*.youtube.com/pagead/*',
  '*://*.youtube.com/api/stats/ads*',
  '*://*.youtube.com/youtubei/v1/player/ad_break*',
  '*://*.youtube.com/ptracking*',
  '*://*.youtube.com/get_midroll_info*',
  '*://static.doubleclick.net/*',
  '*://*.innovid.com/*',
  '*://*.youtube.com/api/stats/qoe*',
  '*://*.youtube.com/api/stats/playback*',
  '*://*.youtube.com/api/stats/watchtime*'
];

let blockedCount = 0;

function setupAdblocker(session, onBlockedCallback) {
  session.webRequest.onBeforeRequest({ urls: AD_URL_PATTERNS }, (details, callback) => {
    const url = details.url;

    // For stats telemetry, only cancel if related to ads
    if ((url.includes('api/stats/qoe') || url.includes('api/stats/playback') || url.includes('api/stats/watchtime')) && !url.includes('adformat=')) {
      return callback({ cancel: false });
    }

    blockedCount++;
    if (typeof onBlockedCallback === 'function') {
      onBlockedCallback(blockedCount, details.url);
    }
    callback({ cancel: true });
  });

  // Strip anti-adblock tracking headers and cookies if present
  session.webRequest.onBeforeSendHeaders({ urls: ['*://*.youtube.com/*'] }, (details, callback) => {
    if (details.requestHeaders) {
      delete details.requestHeaders['X-YouTube-Ad-Signals'];
    }
    callback({ requestHeaders: details.requestHeaders });
  });
}

function getBlockedCount() {
  return blockedCount;
}

module.exports = {
  setupAdblocker,
  getBlockedCount,
  AD_URL_PATTERNS
};
