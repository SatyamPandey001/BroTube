// BroTube Frontend Application Logic
function initApp() {
  // Opening Splash Screen Controller - registered first for resilient instant skip & failsafe dismissal
  const splashScreen = document.getElementById('splash-screen');
  let dismissSplash = () => {};
  if (splashScreen) {
    let dismissed = false;
    const splashStatusEl = document.getElementById('splash-status-text');
    const statusMessages = [
      'Calibrating lossless DASH mux...',
      'Warming 32-bit audio DSP...',
      'Activating zero-ad kernel shield...',
      'Ready to launch.'
    ];
    let statusIdx = 0;
    const statusTimer = setInterval(() => {
      if (dismissed || !splashStatusEl) return;
      statusIdx = (statusIdx + 1) % statusMessages.length;
      splashStatusEl.textContent = statusMessages[statusIdx];
    }, 650);

    dismissSplash = () => {
      if (dismissed) return;
      dismissed = true;
      clearInterval(statusTimer);
      splashScreen.classList.add('fade-out');
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 600);
    };

    splashScreen.addEventListener('click', dismissSplash);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        dismissSplash();
      }
    });

    // Dismiss when YouTube actually loads; 3s failsafe for slow starts
    const splashFailsafe = setTimeout(dismissSplash, 3000);
    const onReady = () => { clearTimeout(splashFailsafe); dismissSplash(); };
    const splashWv = document.getElementById('yt-webview');
    if (splashWv) splashWv.addEventListener('dom-ready', onReady, { once: true });
  }

  const webview = document.getElementById('yt-webview');
  const shieldCountEl = document.getElementById('shield-count');
  const btnBack = document.getElementById('btn-back');
  const btnForward = document.getElementById('btn-forward');
  const btnReload = document.getElementById('btn-reload');
  const btnMin = document.getElementById('win-min');
  const btnMax = document.getElementById('win-max');
  const btnClose = document.getElementById('win-close');
  const btnPiP = document.getElementById('btn-pip');

  // Tool buttons & Settings
  const btnQuickDownload = document.getElementById('btn-quick-download');
  const btnQuickShare = document.getElementById('btn-quick-share');
  const btnSettingsToggle = document.getElementById('btn-settings-toggle');
  const settingsPopover = document.getElementById('settings-popover');
  const boostSlider = document.getElementById('boost-slider');
  const boostLabel = document.getElementById('boost-label');
  const btnDrawerToggle = document.getElementById('btn-drawer-toggle');
  const drawerClose = document.getElementById('drawer-close');
  const downloadDrawer = document.getElementById('download-drawer');
  const btnOpenFolder = document.getElementById('btn-open-folder');
  const btnChangeFolder = document.getElementById('btn-change-folder');
  const btnDrawerOpenFolder = document.getElementById('btn-drawer-open-folder');
  const btnUpdateYtDlp = document.getElementById('btn-update-ytdlp');
  const btnSyncCookies = document.getElementById('btn-sync-cookies');
  const btnLogoutSession = document.getElementById('btn-logout-session');
  const btnViewTerms = document.getElementById('btn-view-terms');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIconSlot = document.getElementById('theme-icon-slot');
  const themeLabel = document.getElementById('theme-label');
  const btnZenToggle = document.getElementById('btn-zen-toggle');
  const zenLabel = document.getElementById('zen-label');
  const btnShortsToggle = document.getElementById('btn-shorts-toggle');
  const shortsLabel = document.getElementById('shorts-label');
  const selectLanguage = document.getElementById('select-language');
  const selectEqPreset = document.getElementById('select-eq-preset');
  const btnKofiSupport = document.getElementById('btn-kofi-support');
  const btnOpenTranscoder = document.getElementById('btn-open-transcoder');
  const btnDebugToggle = document.getElementById('btn-debug-toggle');
  const debugLabel = document.getElementById('debug-label');
  const btnOpenLogScanner = document.getElementById('btn-open-log-scanner');
  const btnDrawerLogs = document.getElementById('btn-drawer-logs');
  const logScannerModal = document.getElementById('log-scanner-modal');
  const logModalClose = document.getElementById('log-modal-close');
  const btnRunLogScan = document.getElementById('btn-run-log-scan');
  const btnCopyLogs = document.getElementById('btn-copy-logs');
  const btnClearLogs = document.getElementById('btn-clear-logs');
  const logScanResults = document.getElementById('log-scan-results');
  const logScanSummary = document.getElementById('log-scan-summary');
  const logScanItems = document.getElementById('log-scan-items');
  const logConsoleContainer = document.getElementById('log-console-container');
  const logConsoleStream = document.getElementById('log-console-stream');
  const logStatusCounter = document.getElementById('log-status-counter');
  const checkLogAutoscroll = document.getElementById('check-log-autoscroll');

  // EULA Compliance Modal
  const eulaModal = document.getElementById('eula-modal');
  const checkEulaAgree = document.getElementById('check-eula-agree');
  const btnEulaAccept = document.getElementById('btn-eula-accept');
  const btnEulaDecline = document.getElementById('btn-eula-decline');

  // Community Ko-fi & Media Transcoder Modals
  const kofiModal = document.getElementById('kofi-modal');
  const kofiClose = document.getElementById('kofi-close');
  const btnKofiDismiss = document.getElementById('btn-kofi-dismiss');
  const btnKofiDonate = document.getElementById('btn-kofi-donate');

  const transcoderModal = document.getElementById('transcoder-modal');
  const transcoderClose = document.getElementById('transcoder-close');
  const transcodeInputPath = document.getElementById('transcode-input-path');
  const btnSelectTranscodeFile = document.getElementById('btn-select-transcode-file');
  const transcodeTargetFormat = document.getElementById('transcode-target-format');
  const transcodePreset = document.getElementById('transcode-preset');
  const transcodeStatus = document.getElementById('transcode-status');
  const transcodeStatusText = document.getElementById('transcode-status-text');
  const btnStartTranscode = document.getElementById('btn-start-transcode');

  // Spatial Exit Confirmation Modal Elements
  const exitModal = document.getElementById('exit-modal');
  const exitCloseBtn = document.getElementById('exit-close-btn');
  const btnExitCancel = document.getElementById('btn-exit-cancel');
  const btnExitConfirm = document.getElementById('btn-exit-confirm');
  const exitTitleText = document.getElementById('exit-title-text');
  const exitIconWrap = document.getElementById('exit-icon-wrap');
  const exitIconSvg = document.getElementById('exit-icon-svg');
  const exitStatusPill = document.getElementById('exit-status-pill');
  const exitStatusCountText = document.getElementById('exit-status-count-text');
  const exitLeadText = document.getElementById('exit-lead-text');
  const exitDetailText = document.getElementById('exit-detail-text');
  const btnExitConfirmText = document.getElementById('btn-exit-confirm-text');

  // Modals & Alerts
  const proModal = document.getElementById('pro-modal');
  const modalClose = document.getElementById('modal-close');
  const modalLoading = document.getElementById('modal-loading');
  const modalContent = document.getElementById('modal-content');
  const previewThumb = document.getElementById('preview-thumb');
  const previewTitle = document.getElementById('preview-title');
  const previewChannel = document.getElementById('preview-channel');
  const previewDuration = document.getElementById('preview-duration');
  const qualitySelect = document.getElementById('quality-select');
  const checkSubs = document.getElementById('check-subs');
  const checkThumb = document.getElementById('check-thumb');
  const checkChapters = document.getElementById('check-chapters');
  const labelCheckPlaylist = document.getElementById('label-check-playlist');
  const checkPlaylist = document.getElementById('check-playlist');
  const btnStartProDownload = document.getElementById('btn-start-pro-download');
  const btnDlThumb = document.getElementById('btn-dl-thumb');
  const btnDlSubs = document.getElementById('btn-dl-subs');
  const checkTimeRange = document.getElementById('check-time-range');
  const timeRangeControls = document.getElementById('time-range-controls');
  const timeStart = document.getElementById('time-start');
  const timeEnd = document.getElementById('time-end');
  const btnStampCurrent = document.getElementById('btn-stamp-current');
  const checkDirectDl = document.getElementById('check-direct-dl');
  const btnDirectDlToggle = document.getElementById('btn-direct-dl-toggle');
  const directDlLabel = document.getElementById('direct-dl-label');

  const spatialAlertModal = document.getElementById('spatial-alert-modal');
  const alertTitle = document.getElementById('alert-title');
  const alertBody = document.getElementById('alert-body');
  const alertIcon = document.getElementById('alert-icon');
  const alertClose = document.getElementById('alert-close');
  const alertBtnAction = document.getElementById('alert-btn-action');
  const alertBtnPrimary = document.getElementById('alert-btn-primary');

  const downloadsList = document.getElementById('downloads-list');
  const downloadsEmpty = document.getElementById('downloads-empty');

  const showSpatialAlert = ({ title = 'Notice', message = '', icon = 'info', actionText = null, onAction = null }) => {
    if (!spatialAlertModal) return;
    alertTitle.textContent = title;
    alertBody.innerHTML = message;

    if (icon === 'bot' || icon === 'auth') {
      alertIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ec4899" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg>`;
    } else if (icon === 'success') {
      alertIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else {
      alertIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#06b6d4" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }

    if (actionText && typeof onAction === 'function') {
      alertBtnAction.textContent = actionText;
      alertBtnAction.classList.remove('hidden');
      alertBtnAction.onclick = () => {
        spatialAlertModal.classList.add('hidden');
        onAction();
      };
    } else {
      alertBtnAction.classList.add('hidden');
      alertBtnAction.onclick = null;
    }

    alertBtnPrimary.onclick = () => {
      spatialAlertModal.classList.add('hidden');
    };
    alertClose.onclick = () => {
      spatialAlertModal.classList.add('hidden');
    };

    spatialAlertModal.classList.remove('hidden');
  };

  let currentVideoData = null;
  const activeDownloads = new Map();

  // Helper: Detect if active URL is a playable YouTube video, Short, or Playlist
  function isVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return url.includes('watch?v=') || url.includes('/shorts/') || url.includes('/live/') || url.includes('youtu.be/') || url.includes('/playlist') || url.includes('list=');
  }

  // Helper: Strip playlist/mix parameters on client side to avoid downloading full mixes
  function cleanVideoUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    try {
      const parsed = new URL(rawUrl.trim());
      if (parsed.hostname.includes('youtube.com')) {
        if (parsed.searchParams.has('v')) {
          return `https://www.youtube.com/watch?v=${parsed.searchParams.get('v')}`;
        }
        if (parsed.pathname.includes('/shorts/')) {
          const id = parsed.pathname.split('/shorts/')[1].split(/[?&/]/)[0];
          return `https://www.youtube.com/shorts/${id}`;
        }
        if (parsed.pathname.includes('/live/')) {
          const id = parsed.pathname.split('/live/')[1].split(/[?&/]/)[0];
          return `https://www.youtube.com/live/${id}`;
        }
      }
      if (parsed.hostname.includes('youtu.be')) {
        const id = parsed.pathname.replace(/^\//, '').split(/[?&/]/)[0];
        return `https://youtu.be/${id}`;
      }
      return rawUrl.trim();
    } catch {
      return (rawUrl || '').trim();
    }
  }

  // Helper: Extract clean playlist URL
  function cleanPlaylistUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    try {
      const parsed = new URL(rawUrl.trim());
      if (parsed.searchParams.has('list')) {
        return `https://www.youtube.com/playlist?list=${parsed.searchParams.get('list')}`;
      }
      return rawUrl.trim();
    } catch {
      return (rawUrl || '').trim();
    }
  }

  // Helper: Get active YouTube URL
  function getCurrentVideoUrl() {
    try {
      return webview.getURL() || '';
    } catch {
      return '';
    }
  }

  // Helper: Extract active video metadata directly from the page DOM (instant response)
  async function getActiveVideoMeta() {
    try {
      return await webview.executeJavaScript(`(() => {
        const v = document.querySelector('video');
        const titleEl = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h2.ytd-shorts-player-title-view-model, yt-dynamic-sizing-formatted-string#text, h1#title') || document.querySelector('title');
        const title = (titleEl ? titleEl.innerText || titleEl.textContent : '') || document.title.replace(' - YouTube', '');
        const channelEl = document.querySelector('#channel-name, ytd-channel-name, ytd-playlist-byline-renderer');
        const uploader = (channelEl ? channelEl.innerText || channelEl.textContent : '').trim() || 'Creator';
        const duration = v && isFinite(v.duration) ? Math.floor(v.duration) : 0;
        const currentTime = v && isFinite(v.currentTime) ? Math.floor(v.currentTime) : 0;
        const params = new URLSearchParams(window.location.search);
        let videoId = params.get('v');
        if (!videoId && window.location.pathname.includes('/shorts/')) {
          videoId = window.location.pathname.split('/shorts/')[1]?.split(/[?&/]/)[0];
        }

        let thumbUrl = '';
        if (videoId) {
          thumbUrl = 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';
        } else {
          const firstVideoLink = document.querySelector('ytd-playlist-video-renderer a#thumbnail, a#thumbnail[href*="v="]');
          if (firstVideoLink && firstVideoLink.href) {
            try {
              const u = new URL(firstVideoLink.href, window.location.origin);
              const vId = u.searchParams.get('v');
              if (vId) {
                videoId = vId;
                thumbUrl = 'https://i.ytimg.com/vi/' + vId + '/hqdefault.jpg';
              }
            } catch (_) {}
          }
          if (!thumbUrl) {
            const domImg = document.querySelector('ytd-playlist-header-renderer img, ytd-playlist-video-thumbnail-renderer img, #thumbnail img');
            if (domImg && domImg.src && domImg.src.startsWith('http')) {
              thumbUrl = domImg.src;
            }
          }
        }

        return { title: (title || '').trim(), uploader, duration, currentTime, videoId, thumbnail: thumbUrl };
      })()`);
    } catch {
      return null;
    }
  }

  // Window Controls
  if (btnMin) {
    btnMin.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.broTube?.minimizeWindow();
    });
  }

  if (btnMax) {
    btnMax.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.broTube?.maximizeWindow();
    });
  }

  // Spatial Exit Confirmation Modal Controller
  const openExitModal = async (forcedCount = null) => {
    if (!exitModal) {
      window.broTube?.confirmExit();
      return;
    }

    let runningTasks = 0;
    if (typeof forcedCount === 'number') {
      runningTasks = forcedCount;
    } else if (window.broTube?.checkActiveTasks) {
      try {
        const res = await window.broTube.checkActiveTasks();
        runningTasks = (res && typeof res.count === 'number') ? res.count : 0;
      } catch {
        runningTasks = activeDownloads.size;
      }
    } else {
      runningTasks = activeDownloads.size;
    }

    if (runningTasks > 0) {
      if (exitTitleText) exitTitleText.textContent = 'Active Tasks in Progress';
      if (exitIconWrap) exitIconWrap.className = 'exit-icon-bubble warning-state';
      if (exitIconSvg) {
        exitIconSvg.innerHTML = `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`;
      }
      if (exitStatusCountText) {
        exitStatusCountText.textContent = `${runningTasks} Background Task${runningTasks > 1 ? 's' : ''} Active`;
      }
      if (exitStatusPill) exitStatusPill.classList.remove('hidden');
      if (exitLeadText) exitLeadText.textContent = 'Are you sure you want to quit BroTube?';
      if (exitDetailText) {
        exitDetailText.textContent = `Closing now will abort ${runningTasks} active download${runningTasks > 1 ? 's' : ''} or media conversion${runningTasks > 1 ? 's' : ''}. Incomplete tasks will not be saved.`;
        exitDetailText.classList.remove('hidden');
      }
      if (btnExitConfirm) btnExitConfirm.className = 'action-btn peak-btn exit-danger-btn';
      if (btnExitConfirmText) btnExitConfirmText.textContent = 'Quit Anyway';
    } else {
      if (exitTitleText) exitTitleText.textContent = 'Exit BroTube';
      if (exitIconWrap) exitIconWrap.className = 'exit-icon-bubble idle-state';
      if (exitIconSvg) {
        exitIconSvg.innerHTML = `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`;
      }
      if (exitStatusPill) exitStatusPill.classList.add('hidden');
      if (exitLeadText) exitLeadText.textContent = 'Are you sure you want to exit BroTube?';
      if (exitDetailText) {
        exitDetailText.textContent = 'Your ad-free playback settings and preferences are safely saved.';
        exitDetailText.classList.remove('hidden');
      }
      if (btnExitConfirm) btnExitConfirm.className = 'action-btn peak-btn exit-neutral-btn';
      if (btnExitConfirmText) btnExitConfirmText.textContent = 'Exit BroTube';
    }

    exitModal.classList.remove('hidden');
  };

  const closeExitModal = () => {
    if (exitModal) exitModal.classList.add('hidden');
  };

  if (exitCloseBtn) exitCloseBtn.addEventListener('click', closeExitModal);
  if (btnExitCancel) btnExitCancel.addEventListener('click', closeExitModal);

  if (btnExitConfirm) {
    btnExitConfirm.addEventListener('click', () => {
      closeExitModal();
      window.broTube?.confirmExit();
    });
  }

  if (exitModal) {
    exitModal.addEventListener('click', (e) => {
      if (e.target === exitModal) closeExitModal();
    });
  }

  if (window.broTube?.onShowExitModal) {
    window.broTube.onShowExitModal((data) => {
      openExitModal(data?.runningTasks);
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openExitModal();
    });
  }

  // Picture-in-Picture: Use native OS video PiP when playing, fallback to window PiP
  if (btnPiP) {
    btnPiP.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (settingsPopover) settingsPopover.classList.add('hidden');
      try {
        const handledInPage = await webview.executeJavaScript(`(() => {
          const v = document.querySelector('video');
          if (!v) return false;
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
            return true;
          } else if (document.pictureInPictureEnabled) {
            v.requestPictureInPicture();
            return true;
          }
          return false;
        })()`);
        if (!handledInPage) {
          window.broTube?.togglePiP();
        }
      } catch {
        window.broTube?.togglePiP();
      }
    });
  }

  // Double click titlebar to toggle maximize/restore
  const header = document.querySelector('.app-header, .spatial-header');
  if (header) {
    header.addEventListener('dblclick', (e) => {
      if (e.target.closest('.no-drag, button, input, select, textarea')) return;
      window.broTube?.maximizeWindow();
    });
  }

  // Update maximize button icon and window frame class when window state changes
  if (window.broTube?.onMaximizedState && btnMax) {
    window.broTube.onMaximizedState((isMax) => {
      document.body.classList.toggle('window-maximized', isMax);
      btnMax.title = isMax ? 'Restore' : 'Maximize';
      btnMax.innerHTML = isMax
        ? `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"/><polyline points="10 6 10 3 20 3 20 13 18 13"/></svg>`
        : `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`;
    });
  }

  // Destination Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-dest-tab');
  navTabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const targetUrl = tab.getAttribute('data-url');
      if (targetUrl && webview) {
        webview.loadURL(targetUrl).catch(() => {});
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      }
    });
  });

  const syncActiveNavTab = (currentUrl) => {
    if (!currentUrl) return;
    navTabs.forEach((tab) => {
      const tabUrl = tab.getAttribute('data-url');
      if (!tabUrl) return;
      if ((tabUrl.includes('trending') || tabUrl.includes('hashtag/trending')) && (currentUrl.includes('trending') || currentUrl.includes('hashtag/trending'))) {
        tab.classList.add('active');
      } else if (tabUrl.includes('/feed/subscriptions') && currentUrl.includes('/feed/subscriptions')) {
        tab.classList.add('active');
      } else if (tabUrl.includes('/feed/library') && (currentUrl.includes('/feed/library') || currentUrl.includes('/feed/you'))) {
        tab.classList.add('active');
      } else if (tabUrl === 'https://www.youtube.com' && (currentUrl === 'https://www.youtube.com/' || currentUrl === 'https://www.youtube.com' || (!currentUrl.includes('/feed/') && !currentUrl.includes('trending') && !currentUrl.includes('hashtag/') && !currentUrl.includes('watch?v=')))) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  };

  // Navigation Visual Feedback
  const updateNavButtons = () => {
    try {
      if (btnBack) btnBack.style.opacity = webview.canGoBack() ? '1' : '0.4';
      if (btnForward) btnForward.style.opacity = webview.canGoForward() ? '1' : '0.4';
      syncActiveNavTab(webview.getURL?.() || '');
    } catch {}
  };

  btnBack.addEventListener('click', () => { if (webview.canGoBack()) webview.goBack(); });
  btnForward.addEventListener('click', () => { if (webview.canGoForward()) webview.goForward(); });
  btnReload.addEventListener('click', () => webview.reload());

  webview.addEventListener('did-navigate', updateNavButtons);
  webview.addEventListener('did-navigate-in-page', updateNavButtons);
  webview.addEventListener('dom-ready', updateNavButtons);

  // Desktop Gestures: Mouse Back/Forward Side Buttons
  window.addEventListener('mouseup', (e) => {
    if (e.button === 3 && webview.canGoBack()) webview.goBack();
    else if (e.button === 4 && webview.canGoForward()) webview.goForward();
  });

  // Global Keyboard Shortcuts & Gestures (Esc dismiss, Ctrl+D download, Ctrl+J drawer)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (splashScreen && !splashScreen.classList.contains('fade-out')) {
        dismissSplash();
        return;
      }
      if (proModal && !proModal.classList.contains('hidden')) {
        proModal.classList.add('hidden');
        return;
      }
      if (kofiModal && !kofiModal.classList.contains('hidden')) {
        kofiModal.classList.add('hidden');
        return;
      }
      if (transcoderModal && !transcoderModal.classList.contains('hidden')) {
        transcoderModal.classList.add('hidden');
        return;
      }
      if (spatialAlertModal && !spatialAlertModal.classList.contains('hidden')) {
        spatialAlertModal.classList.add('hidden');
        return;
      }
      if (exitModal && !exitModal.classList.contains('hidden')) {
        closeExitModal();
        return;
      }
      if (eulaModal && !eulaModal.classList.contains('hidden')) {
        let isAccepted = false;
        try { isAccepted = localStorage.getItem('brotube_eula_v1_accepted') === 'true'; } catch (_) {}
        if (isAccepted) {
          eulaModal.classList.add('hidden');
          return;
        }
      }
      if (downloadDrawer && !downloadDrawer.classList.contains('closed')) {
        closeDownloadDrawer();
        return;
      }
      if (settingsPopover && !settingsPopover.classList.contains('hidden')) {
        settingsPopover.classList.add('hidden');
        stopAudioSpectrum();
        return;
      }
    }

    if (e.key === 'Enter') {
      if (exitModal && !exitModal.classList.contains('hidden')) {
        e.preventDefault();
        if (btnExitConfirm) btnExitConfirm.click();
        return;
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      openDownloadModal('best');
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
      e.preventDefault();
      toggleDownloadDrawer();
      return;
    }
  });

  // Shield Updates
  if (window.broTube?.onAdBlocked) {
    window.broTube.onAdBlocked(({ count }) => {
      if (shieldCountEl) shieldCountEl.textContent = count;
    });
  }

  // Live Reactive Audio DSP Spectrum Visualizer Engine
  const spectrumBars = document.querySelectorAll('.spectrum-bar');
  let spectrumPollTimer = null;

  function updateAudioSpectrumLoop() {
    if (!settingsPopover || settingsPopover.classList.contains('hidden') || !webview) {
      stopAudioSpectrum();
      return;
    }
    webview.executeJavaScript(`window.getBroTubeAudioSpectrum ? window.getBroTubeAudioSpectrum() : null`)
      .then((bands) => {
        if (Array.isArray(bands) && bands.length >= 10) {
          spectrumBars.forEach((bar, idx) => {
            bar.style.height = `${bands[idx]}%`;
          });
        } else {
          spectrumBars.forEach((bar) => { bar.style.height = '6%'; });
        }
      })
      .catch(() => {
        spectrumBars.forEach((bar) => { bar.style.height = '6%'; });
      })
      .finally(() => {
        if (settingsPopover && !settingsPopover.classList.contains('hidden')) {
          spectrumPollTimer = setTimeout(updateAudioSpectrumLoop, 40);
        }
      });
  }

  function startAudioSpectrum() {
    if (spectrumPollTimer) clearTimeout(spectrumPollTimer);
    updateAudioSpectrumLoop();
  }

  function stopAudioSpectrum() {
    if (spectrumPollTimer) {
      clearTimeout(spectrumPollTimer);
      spectrumPollTimer = null;
    }
    spectrumBars.forEach((bar) => { bar.style.height = '6%'; });
  }

  // Settings & Tools Popover Toggle
  if (btnSettingsToggle && settingsPopover) {
    btnSettingsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isClosed = settingsPopover.classList.toggle('hidden');
      if (!isClosed) {
        startAudioSpectrum();
      } else {
        stopAudioSpectrum();
      }
      const multiplier = parseFloat(boostSlider.value) / 100.0;
      webview.executeJavaScript(`if (typeof window.setBroTubeVolumeBoost === 'function') window.setBroTubeVolumeBoost(${multiplier});`);
    });

    const hideSettingsPopover = (e) => {
      if (settingsPopover.classList.contains('hidden')) return;
      if (e && (settingsPopover.contains(e.target) || btnSettingsToggle.contains(e.target))) return;
      settingsPopover.classList.add('hidden');
      stopAudioSpectrum();
    };

    document.addEventListener('pointerdown', hideSettingsPopover, true);
    document.addEventListener('click', hideSettingsPopover, true);
    window.addEventListener('blur', () => hideSettingsPopover());

    if (webview) {
      webview.addEventListener('focus', () => hideSettingsPopover());
      webview.addEventListener('ipc-message', (e) => {
        if (e.channel === 'guest-click') {
          hideSettingsPopover();
        }
      });
    }

    // Settings Popover Segmented Tab Switching
    const settingsNavTabs = settingsPopover.querySelectorAll('.settings-nav-tab');
    const settingsPanels = settingsPopover.querySelectorAll('.settings-tab-panel');
    settingsNavTabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const tabName = tab.getAttribute('data-tab');
        settingsNavTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        settingsPanels.forEach(p => p.classList.remove('active'));
        const activePanel = document.getElementById(`settings-panel-${tabName}`);
        if (activePanel) activePanel.classList.add('active');
        if (tabName === 'audio') {
          startAudioSpectrum();
        } else {
          stopAudioSpectrum();
        }
      });
    });
  }

  // Theme Switching (Light / Dark Mode with Glassmorphism)
  const SUN_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  const MOON_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

  function syncWebviewTheme(theme) {
    const isLight = theme === 'light';
    if (!webview) return;
    const js = `(() => {
      try {
        const isLight = ${isLight};
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
        const currentCookie = document.cookie || '';
        const prefMatch = currentCookie.match(/(?:^|;\s*)PREF=([^;]*)/);
        let prefVal = isLight ? 'f6=40000000' : 'f6=400';
        if (prefMatch && prefMatch[1]) {
          const existing = prefMatch[1];
          prefVal = existing.includes('f6=')
            ? existing.replace(/f6=\d+/, isLight ? 'f6=40000000' : 'f6=400')
            : (existing + '&' + prefVal);
        }
        const exp = new Date(Date.now() + 31536000000).toUTCString();
        document.cookie = 'PREF=' + prefVal + '; path=/; domain=.youtube.com; expires=' + exp;
        const app = document.querySelector('ytd-app');
        if (app && typeof app.setTheme === 'function') {
          app.setTheme(isLight ? 'light' : 'dark');
        }
      } catch (_) {}
    })()`;
    try {
      if (typeof webview.executeJavaScript === 'function') {
        const res = webview.executeJavaScript(js);
        if (res && typeof res.catch === 'function') res.catch(() => {});
      }
    } catch (_) {}
    try {
      webview.contentWindow?.postMessage({ type: 'brotube-theme-sync', theme }, '*');
    } catch (_) {}
  }

  function applyTheme(theme) {
    const isLight = theme === 'light';
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
    try {
      localStorage.setItem('brotube-theme', isLight ? 'light' : 'dark');
    } catch (_) {}
    if (themeLabel) themeLabel.textContent = isLight ? 'Light' : 'Dark';
    if (themeIconSlot) themeIconSlot.innerHTML = isLight ? SUN_ICON : MOON_ICON;
    if (btnThemeToggle) {
      btnThemeToggle.classList.toggle('active', isLight);
    }

    // 1. Notify Electron native OS background & cookies
    window.broTube?.setTheme?.(theme);

    // 2. Synchronize YouTube Webview theme
    syncWebviewTheme(theme);
  }

  // Initialize theme from storage
  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('brotube-theme') || 'dark';
  } catch (_) {}
  applyTheme(savedTheme);

    if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Debug Engine Mode & Log Scanner Logic
  let isDebugActive = false;
  try {
    isDebugActive = localStorage.getItem('brotube-debug-mode') === 'true';
  } catch (_) {}

  const applyDebugMode = (active) => {
    isDebugActive = !!active;
    try {
      localStorage.setItem('brotube-debug-mode', isDebugActive ? 'true' : 'false');
    } catch (_) {}
    if (btnDebugToggle) btnDebugToggle.classList.toggle('active', isDebugActive);
    if (debugLabel) debugLabel.textContent = isDebugActive ? 'Active' : 'Off';
    window.broTube?.setDebugMode?.(isDebugActive);
  };

  applyDebugMode(isDebugActive);

  if (btnDebugToggle) {
    btnDebugToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      applyDebugMode(!isDebugActive);
    });
  }

  // Log Scanner Modal & Diagnostic Viewer
  let cachedLogs = [];
  let currentLogFilter = 'all';

  const formatLogLine = (log) => {
    const ts = log.timestamp ? log.timestamp.split('T')[1].replace('Z', '') : '';
    const cat = log.category || 'INFO';
    const detailStr = log.details ? ' ' + JSON.stringify(log.details) : '';
    return `[${ts}] [${cat}] ${log.message}${detailStr}`;
  };

  const renderLogStream = (logs, filter = 'all') => {
    if (!logConsoleStream) return;
    logConsoleStream.innerHTML = '';
    const filtered = (logs || []).filter((l) => {
      if (filter === 'all') return true;
      if (filter === 'DOWNLOAD') return l.category === 'DOWNLOAD' || l.category === 'YT-DLP';
      if (filter === 'ERROR') return l.category === 'ERROR' || l.category === 'YT-DLP-STDERR';
      if (filter === 'GPU') return l.category === 'GPU' || l.category === 'SYSTEM';
      return true;
    });

    if (filtered.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'log-line system-line';
      emptyDiv.textContent = `[SYSTEM] No logs matching filter '${filter}'.`;
      logConsoleStream.appendChild(emptyDiv);
    } else {
      for (const log of filtered) {
        const lineDiv = document.createElement('div');
        lineDiv.className = `log-line category-${log.category || 'INFO'}`;
        lineDiv.textContent = formatLogLine(log);
        logConsoleStream.appendChild(lineDiv);
      }
    }

    if (logStatusCounter) {
      logStatusCounter.textContent = `${filtered.length} of ${logs.length} entries shown`;
    }

    if (checkLogAutoscroll && checkLogAutoscroll.checked && logConsoleContainer) {
      logConsoleContainer.scrollTop = logConsoleContainer.scrollHeight;
    }
  };

  const appendLogEntry = (log) => {
    if (!logConsoleStream) return;
    const matchesFilter =
      currentLogFilter === 'all' ||
      (currentLogFilter === 'DOWNLOAD' && (log.category === 'DOWNLOAD' || log.category === 'YT-DLP')) ||
      (currentLogFilter === 'ERROR' && (log.category === 'ERROR' || log.category === 'YT-DLP-STDERR')) ||
      (currentLogFilter === 'GPU' && (log.category === 'GPU' || log.category === 'SYSTEM'));
    if (!matchesFilter) return;

    const emptyLine = logConsoleStream.querySelector('.system-line');
    if (emptyLine) emptyLine.remove();

    const lineDiv = document.createElement('div');
    lineDiv.className = `log-line category-${log.category || 'INFO'}`;
    lineDiv.textContent = formatLogLine(log);
    logConsoleStream.appendChild(lineDiv);

    while (logConsoleStream.children.length > 600) {
      logConsoleStream.removeChild(logConsoleStream.firstChild);
    }

    if (logStatusCounter) {
      logStatusCounter.textContent = `${logConsoleStream.children.length} entries shown`;
    }

    if (checkLogAutoscroll && checkLogAutoscroll.checked && logConsoleContainer) {
      logConsoleContainer.scrollTop = logConsoleContainer.scrollHeight;
    }
  };

  const runLogScan = async () => {
    if (!window.broTube?.scanDebugLogs) return;
    try {
      const scanRes = await window.broTube.scanDebugLogs();
      if (!logScanResults || !logScanSummary || !logScanItems) return;
      logScanResults.classList.remove('hidden');
      logScanItems.innerHTML = '';

      const statusBadge = scanRes.status === 'Healthy'
        ? '<span style="color:#10b981;">● All Systems Healthy</span>'
        : (scanRes.status === 'Issues Found' ? '<span style="color:#ef4444;">▲ Issues Detected</span>' : '<span style="color:#f59e0b;">● Warnings Found</span>');

      logScanSummary.innerHTML = `
        <span>Automated Diagnostic Analysis: ${statusBadge}</span>
        <span style="font-weight:400;color:var(--text-secondary);font-size:11px;">(${scanRes.totalLogs} logs analyzed | ${scanRes.activeTasks} tasks active | ${scanRes.gpuCrashCount} GPU resets)</span>
      `;

      if (!scanRes.issues || scanRes.issues.length === 0) {
        const okItem = document.createElement('div');
        okItem.className = 'scan-issue-item';
        okItem.innerHTML = `
          <div class="scan-issue-title">No download blocks or driver crash anomalies detected.</div>
          <div class="scan-issue-desc">Downloads are operating normally. If a download did not start, check that your network connection is active.</div>
        `;
        logScanItems.appendChild(okItem);
      } else {
        for (const issue of scanRes.issues) {
          const issueEl = document.createElement('div');
          issueEl.className = `scan-issue-item ${issue.severity || 'warning'}`;
          issueEl.innerHTML = `
            <div class="scan-issue-title">${issue.title}</div>
            <div class="scan-issue-desc">${issue.description}</div>
            <div class="scan-issue-action"><strong>Remedy:</strong> ${issue.action}</div>
          `;
          logScanItems.appendChild(issueEl);
        }
      }
    } catch (err) {
      console.warn('Log scan failed:', err);
    }
  };

  const openLogScannerModal = async () => {
    if (settingsPopover) settingsPopover.classList.add('hidden');
    if (logScannerModal) logScannerModal.classList.remove('hidden');
    try {
      cachedLogs = (await window.broTube?.getDebugLogs?.()) || [];
      renderLogStream(cachedLogs, currentLogFilter);
      runLogScan();
    } catch (_) {}
  };

  const closeLogScannerModal = () => {
    if (logScannerModal) logScannerModal.classList.add('hidden');
  };

  if (btnOpenLogScanner) {
    btnOpenLogScanner.addEventListener('click', openLogScannerModal);
  }
  if (btnDrawerLogs) {
    btnDrawerLogs.addEventListener('click', openLogScannerModal);
  }
  if (logModalClose) {
    logModalClose.addEventListener('click', closeLogScannerModal);
  }
  if (btnRunLogScan) {
    btnRunLogScan.addEventListener('click', async () => {
      cachedLogs = (await window.broTube?.getDebugLogs?.()) || [];
      renderLogStream(cachedLogs, currentLogFilter);
      runLogScan();
    });
  }
  if (btnClearLogs) {
    btnClearLogs.addEventListener('click', async () => {
      await window.broTube?.clearDebugLogs?.();
      cachedLogs = [];
      renderLogStream(cachedLogs, currentLogFilter);
      if (logScanResults) logScanResults.classList.add('hidden');
    });
  }
  if (btnCopyLogs) {
    btnCopyLogs.addEventListener('click', async () => {
      const text = cachedLogs.map(formatLogLine).join('\n');
      try {
        await navigator.clipboard.writeText(text);
        btnCopyLogs.textContent = 'Copied!';
        setTimeout(() => { btnCopyLogs.textContent = 'Copy'; }, 1500);
      } catch (_) {}
    });
  }

  const logFilterChips = document.querySelectorAll('.log-filter-chip');
  logFilterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      logFilterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentLogFilter = chip.getAttribute('data-filter') || 'all';
      renderLogStream(cachedLogs, currentLogFilter);
    });
  });

  if (window.broTube?.onDebugLog) {
    window.broTube.onDebugLog((entry) => {
      cachedLogs.push(entry);
      if (cachedLogs.length > 600) cachedLogs.shift();
      if (logScannerModal && !logScannerModal.classList.contains('hidden')) {
        appendLogEntry(entry);
      }
    });
  }

  // Global Multi-Language System (HUD + Webview)
  const I18N = {
    en: {
      download: 'Download',
      mediaTranscoder: 'Media Transcoder Studio (Pro)',
      supportKofi: 'Support BroTube (Ko-fi)',
      language: 'Language',
      studioEq: 'Studio EQ',
      adblockShield: 'Adblock Shield',
      blocked: 'blocked',
      kofiTitle: 'Support BroTube',
      kofiDonate: 'Support on Ko-fi',
      startConversion: 'Start Lossless Conversion'
    },
    es: {
      download: 'Descargar',
      mediaTranscoder: 'Estudio de Transcodificación (Pro)',
      supportKofi: 'Apoyar BroTube (Ko-fi)',
      language: 'Idioma',
      studioEq: 'Ecualizador Studio',
      adblockShield: 'Escudo Antibloqueo',
      blocked: 'bloqueados',
      kofiTitle: 'Apoyar a BroTube',
      kofiDonate: 'Donar en Ko-fi',
      startConversion: 'Iniciar Conversión Sin Pérdidas'
    },
    de: {
      download: 'Herunterladen',
      mediaTranscoder: 'Transcoder Studio (Pro)',
      supportKofi: 'BroTube unterstützen (Ko-fi)',
      language: 'Sprache',
      studioEq: 'Studio Equalizer',
      adblockShield: 'Adblock-Schutz',
      blocked: 'blockiert',
      kofiTitle: 'BroTube unterstützen',
      kofiDonate: 'Spenden auf Ko-fi',
      startConversion: 'Verlustfreie Konvertierung starten'
    },
    fr: {
      download: 'Télécharger',
      mediaTranscoder: 'Studio de Transcodage (Pro)',
      supportKofi: 'Soutenir BroTube (Ko-fi)',
      language: 'Langue',
      studioEq: 'Égaliseur Studio',
      adblockShield: 'Bouclier Anti-pub',
      blocked: 'bloquées',
      kofiTitle: 'Soutenir BroTube',
      kofiDonate: 'Offrir un café sur Ko-fi',
      startConversion: 'Lancer la Conversion Sans Perte'
    },
    hi: {
      download: 'डाउनलोड',
      mediaTranscoder: 'मीडिया ट्रांसकोडर स्टूडियो (प्रो)',
      supportKofi: 'BroTube को सपोर्ट करें (Ko-fi)',
      language: 'भाषा',
      studioEq: 'स्टूडियो इक्वलाइज़र',
      adblockShield: 'एडब्लॉक शील्ड',
      blocked: 'अवरुद्ध',
      kofiTitle: 'BroTube का समर्थन करें',
      kofiDonate: 'Ko-fi पर दान करें',
      startConversion: 'दोषरहित रूपांतरण शुरू करें'
    },
    ja: {
      download: 'ダウンロード',
      mediaTranscoder: 'メディア変換スタジオ (Pro)',
      supportKofi: 'BroTubeを支援 (Ko-fi)',
      language: '言語',
      studioEq: 'スタジオEQ',
      adblockShield: '広告ブロックシールド',
      blocked: '件ブロック済',
      kofiTitle: 'BroTubeを応援',
      kofiDonate: 'Ko-fiで支援する',
      startConversion: 'ロスレス変換を開始'
    }
  };

  function applyLanguage(lang, initial = false) {
    const dict = I18N[lang] || I18N.en;
    try {
      localStorage.setItem('brotube-language', lang);
    } catch (_) {}

    if (selectLanguage) selectLanguage.value = lang;

    const dlSpan = btnQuickDownload?.querySelector('span');
    if (dlSpan) dlSpan.textContent = dict.download;

    const transcoderSpan = document.getElementById('label-btn-transcoder');
    if (transcoderSpan) transcoderSpan.textContent = dict.mediaTranscoder;
    const kofiSpan = document.getElementById('label-btn-kofi');
    if (kofiSpan) kofiSpan.textContent = dict.supportKofi;
    const langLabel = document.getElementById('label-lang-setting');
    if (langLabel) langLabel.textContent = dict.language;
    const eqLabel = document.getElementById('label-eq-setting');
    if (eqLabel) eqLabel.textContent = dict.studioEq;
    const shieldLabel = document.getElementById('label-shield-title');
    if (shieldLabel) shieldLabel.textContent = dict.adblockShield;
    const shieldBlocked = document.getElementById('label-shield-text');
    if (shieldBlocked) shieldBlocked.textContent = dict.blocked;

    const btnKofiDonateText = document.getElementById('btn-kofi-donate-text');
    if (btnKofiDonateText) btnKofiDonateText.textContent = dict.kofiDonate;
    const kofiTitle = document.getElementById('kofi-title');
    if (kofiTitle) kofiTitle.textContent = dict.kofiTitle;

    const btnStartTranscodeText = document.getElementById('btn-start-transcode-text');
    if (btnStartTranscodeText) btnStartTranscodeText.textContent = dict.startConversion;

    // 1. Synchronize Electron main-process YouTube session cookie
    window.broTube?.setLanguage?.(lang);

    // 2. Synchronize YouTube webview cookie & reload if language was actively changed by user
    if (webview) {
      const js = `(() => {
        try {
          const lang = '${lang}';
          const currentCookie = document.cookie || '';
          const prefMatch = currentCookie.match(/(?:^|;\s*)PREF=([^;]*)/);
          let prefVal = 'hl=' + lang + '&gl=US';
          if (prefMatch && prefMatch[1]) {
            const existing = prefMatch[1];
            prefVal = existing.includes('hl=')
              ? existing.replace(/hl=[a-zA-Z_-]+/, 'hl=' + lang)
              : (existing + '&hl=' + lang);
          }
          const exp = new Date(Date.now() + 31536000000).toUTCString();
          document.cookie = 'PREF=' + prefVal + '; path=/; domain=.youtube.com; expires=' + exp;
        } catch (_) {}
      })()`;
      try {
        webview.executeJavaScript(js).catch(() => {});
        if (!initial) {
          webview.reload();
        }
      } catch (_) {}
    }
  }

  let savedLang = 'en';
  try {
    savedLang = localStorage.getItem('brotube-language') || 'en';
  } catch (_) {}
  applyLanguage(savedLang, true);

  if (selectLanguage) {
    selectLanguage.addEventListener('change', (e) => {
      applyLanguage(e.target.value, false);
    });
  }

  // Studio DSP Equalizer Controller
  function syncWebviewEq() {
    if (!webview) return;
    const preset = selectEqPreset?.value || 'flat';
    webview.executeJavaScript(`if (typeof window.setBrotubeEq === 'function') window.setBrotubeEq('${preset}');`).catch(() => {});
  }

  let savedEq = 'flat';
  try {
    savedEq = localStorage.getItem('brotube-eq-preset') || 'flat';
  } catch (_) {}
  if (selectEqPreset) {
    selectEqPreset.value = savedEq;
    selectEqPreset.addEventListener('change', () => {
      const val = selectEqPreset.value;
      try { localStorage.setItem('brotube-eq-preset', val); } catch (_) {}
      syncWebviewEq();
    });
  }

  // Zen Mode (Distraction-Free) Controller
  let isZenMode = false;
  try {
    isZenMode = localStorage.getItem('brotube-zen-mode') === 'true';
  } catch (_) {}

  function syncWebviewZen(enabled) {
    if (!webview) return;
    const js = `(function() {
      const html = document.documentElement;
      if (!html) return;
      if (${enabled}) {
        html.setAttribute('data-brotube-zen', 'true');
      } else {
        html.removeAttribute('data-brotube-zen');
      }
      window.dispatchEvent(new Event('resize'));
      setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 60);
    })()`;
    try {
      if (typeof webview.executeJavaScript === 'function') {
        const res = webview.executeJavaScript(js);
        if (res && typeof res.catch === 'function') res.catch(() => {});
      }
    } catch (_) {}
    try {
      webview.contentWindow?.postMessage({ type: 'brotube-zen-sync', enabled }, '*');
    } catch (_) {}
  }

  function applyZenMode(enabled) {
    isZenMode = enabled;
    try {
      localStorage.setItem('brotube-zen-mode', enabled ? 'true' : 'false');
    } catch (_) {}
    if (zenLabel) zenLabel.textContent = enabled ? 'On' : 'Off';
    if (btnZenToggle) {
      if (enabled) {
        btnZenToggle.classList.add('active');
      } else {
        btnZenToggle.classList.remove('active');
      }
    }
    syncWebviewZen(enabled);
  }

  applyZenMode(isZenMode);

  if (btnZenToggle) {
    btnZenToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      applyZenMode(!isZenMode);
    });
  }

  // Shorts Auto-Redirect Controller
  let isRedirectShorts = true;
  try {
    isRedirectShorts = localStorage.getItem('brotube-redirect-shorts') !== 'false';
  } catch (_) {}

  function syncWebviewShorts(enabled) {
    if (!webview) return;
    try {
      if (typeof webview.executeJavaScript === 'function') {
        const script = `
          (() => {
            try {
              document.documentElement.setAttribute('data-brotube-redirect-shorts', '${enabled}');
              localStorage.setItem('brotube-redirect-shorts', '${enabled}');
            } catch (_) {}
            window.dispatchEvent(new CustomEvent('brotube-shorts-sync', { detail: { enabled: ${enabled} } }));
          })();
        `;
        const res = webview.executeJavaScript(script);
        if (res && typeof res.catch === 'function') res.catch(() => {});
      }
    } catch (_) {}
    try {
      webview.contentWindow?.postMessage({ type: 'brotube-shorts-sync', enabled }, '*');
    } catch (_) {}
  }

  let lastRedirectedShortId = null;

  function applyRedirectShorts(enabled) {
    isRedirectShorts = enabled;
    try {
      localStorage.setItem('brotube-redirect-shorts', enabled ? 'true' : 'false');
    } catch (_) {}
    if (shortsLabel) shortsLabel.textContent = enabled ? 'On' : 'Off';
    if (btnShortsToggle) {
      if (enabled) {
        btnShortsToggle.classList.add('active');
      } else {
        btnShortsToggle.classList.remove('active');
      }
    }
    syncWebviewShorts(enabled);

    if (webview) {
      try {
        const curUrl = (typeof webview.getURL === 'function' ? webview.getURL() : '') || '';
        if (!enabled) {
          // Off: revert current converted video back to Shorts mode
          let targetShortId = null;
          if (curUrl.includes('brotube_short=1')) {
            const match = curUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
            if (match) targetShortId = match[1];
          } else if (lastRedirectedShortId && curUrl.includes('/watch?v=' + lastRedirectedShortId)) {
            targetShortId = lastRedirectedShortId;
          }
          if (targetShortId) {
            lastRedirectedShortId = null;
            webview.loadURL(`https://www.youtube.com/shorts/${targetShortId}`).catch(() => {});
          }
        } else {
          // On: convert current Short to full video mode immediately
          if (curUrl.includes('/shorts/')) {
            const match = curUrl.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
            if (match) {
              lastRedirectedShortId = match[1];
              webview.loadURL(`https://www.youtube.com/watch?v=${match[1]}&brotube_short=1`).catch(() => {});
            }
          }
        }
      } catch (_) {}
    }
  }

  applyRedirectShorts(isRedirectShorts);

  if (btnShortsToggle) {
    btnShortsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      applyRedirectShorts(!isRedirectShorts);
    });
  }

  // Ensure webview receives current theme, zen, and shorts settings upon navigations
  if (webview) {
    const updateShortsTracking = (e) => {
      const url = (e && e.url) || (typeof webview.getURL === 'function' ? webview.getURL() : '') || '';
      if (url) {
        if (url.includes('brotube_short=1')) {
          const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
          if (match) lastRedirectedShortId = match[1];
        } else if (lastRedirectedShortId && !url.includes(lastRedirectedShortId)) {
          lastRedirectedShortId = null;
        }
      }
    };

    const syncAllWebviewSettings = (e) => {
      updateShortsTracking(e);
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      syncWebviewTheme(current);
      syncWebviewZen(isZenMode);
      syncWebviewShorts(isRedirectShorts);
      syncWebviewEq();
    };

    webview.addEventListener('dom-ready', syncAllWebviewSettings);
    webview.addEventListener('did-navigate', syncAllWebviewSettings);
    webview.addEventListener('did-navigate-in-page', syncAllWebviewSettings);
    webview.addEventListener('will-navigate', (e) => {
      if (e.url && e.url.includes('/feed/trending')) {
        e.preventDefault();
        webview?.loadURL('https://www.youtube.com/hashtag/trending').catch(() => {});
        return;
      }
      if (isRedirectShorts && e.url && e.url.includes('/shorts/')) {
        const match = e.url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
        if (match) {
          e.preventDefault();
          const shortId = match[1];
          if (lastRedirectedShortId === shortId) return;
          lastRedirectedShortId = shortId;
          setTimeout(() => {
            webview?.loadURL(`https://www.youtube.com/watch?v=${shortId}&brotube_short=1`).catch(() => {});
          }, 0);
          return;
        }
      }
      const isExternal = e.url && (
        e.url.startsWith('mailto:') ||
        e.url.startsWith('whatsapp:') ||
        (!e.url.includes('youtube.com') && !e.url.includes('google.com') && !e.url.includes('gstatic.com') && !e.url.includes('googlevideo.com'))
      );
      if (isExternal) {
        e.preventDefault();
        window.broTube?.openExternal(e.url);
      }
    });
  }

  // Volume Booster Slider
  if (boostSlider) {
    boostSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      if (boostLabel) boostLabel.textContent = `${val}%`;
      const multiplier = parseFloat(val) / 100.0;
      webview.executeJavaScript(`if (typeof window.setBroTubeVolumeBoost === 'function') window.setBroTubeVolumeBoost(${multiplier});`);
    });
  }

  // Downloads Hub Drawer Controller
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const btnDrawerClearDone = document.getElementById('btn-drawer-clear-done');
  const btnDrawerChangeDir = document.getElementById('btn-drawer-change-dir');
  const btnEmptyStartDownload = document.getElementById('btn-empty-start-download');

  const updateDrawerPathDisplay = async () => {
    const pathEl = document.getElementById('drawer-path-text');
    if (!pathEl) return;
    let path = customDownloadDir;
    if (!path && window.broTube?.getDefaultDownloadDir) {
      try {
        path = await window.broTube.getDefaultDownloadDir();
      } catch (_) {}
    }
    pathEl.textContent = path || 'Videos\\BroTube';
    pathEl.title = path || 'Videos\\BroTube';
  };

  function openDownloadDrawer() {
    if (settingsPopover) settingsPopover.classList.add('hidden');
    if (downloadDrawer) downloadDrawer.classList.remove('closed');
    if (drawerBackdrop) drawerBackdrop.classList.remove('hidden');
    updateDrawerPathDisplay();
  }

  function closeDownloadDrawer() {
    if (downloadDrawer) downloadDrawer.classList.add('closed');
    if (drawerBackdrop) drawerBackdrop.classList.add('hidden');
  }

  function toggleDownloadDrawer() {
    if (downloadDrawer && downloadDrawer.classList.contains('closed')) {
      openDownloadDrawer();
    } else {
      closeDownloadDrawer();
    }
  }

  if (btnDrawerToggle) {
    btnDrawerToggle.addEventListener('click', () => {
      toggleDownloadDrawer();
    });
  }
  if (drawerClose) {
    drawerClose.addEventListener('click', () => {
      closeDownloadDrawer();
    });
  }
  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', () => {
      closeDownloadDrawer();
    });
  }
  if (btnDrawerClearDone) {
    btnDrawerClearDone.addEventListener('click', () => {
      const finishedItems = downloadsList?.querySelectorAll('.download-item.completed, .download-item.failed');
      finishedItems?.forEach(item => {
        activeDownloads.delete(item.id);
        item.remove();
      });
      updateFilterCounts();
      checkDownloadsEmpty();
    });
  }
  if (btnDrawerChangeDir) {
    btnDrawerChangeDir.addEventListener('click', () => {
      btnChangeFolder?.click();
    });
  }
  if (btnEmptyStartDownload) {
    btnEmptyStartDownload.addEventListener('click', () => {
      closeDownloadDrawer();
      const quickDl = document.getElementById('btn-quick-download');
      quickDl?.click();
    });
  }

  // Filter tabs setup
  let currentFilter = 'all';
  const filterBtns = document.querySelectorAll('.drawer-tab-btn');
  const applyDrawerFilter = (filter) => {
    currentFilter = filter;
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
    });
    const items = downloadsList?.querySelectorAll('.download-item') || [];
    items.forEach(item => {
      const status = item.getAttribute('data-status') || 'active';
      if (filter === 'all') {
        item.style.display = '';
      } else if (filter === 'active') {
        item.style.display = status === 'active' ? '' : 'none';
      } else if (filter === 'completed') {
        item.style.display = status === 'completed' ? '' : 'none';
      }
    });
  };

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter') || 'all';
      applyDrawerFilter(filter);
    });
  });

  const checkDownloadsEmpty = () => {
    const items = downloadsList?.querySelectorAll('.download-item') || [];
    if (downloadsEmpty) {
      downloadsEmpty.style.display = items.length === 0 ? 'flex' : 'none';
    }
  };

  const updateFilterCounts = () => {
    const items = downloadsList?.querySelectorAll('.download-item') || [];
    const active = downloadsList?.querySelectorAll('.download-item[data-status="active"]') || [];
    const completed = downloadsList?.querySelectorAll('.download-item[data-status="completed"]') || [];

    const countAll = document.getElementById('count-all');
    const countActive = document.getElementById('count-active');
    const countCompleted = document.getElementById('count-completed');
    const statusPill = document.getElementById('drawer-status-pill');
    const headerActiveBadge = document.getElementById('drawer-active-badge');
    const headerToggleBtn = document.getElementById('btn-drawer-toggle');

    if (countAll) countAll.textContent = items.length;
    if (countActive) countActive.textContent = active.length;
    if (countCompleted) countCompleted.textContent = completed.length;

    if (statusPill) {
      if (active.length > 0 && completed.length > 0) {
        statusPill.innerHTML = `<span class="stat-num active">${active.length} Downloading</span><span class="stat-pill-divider">•</span><span class="stat-num done">${completed.length} Finished</span>`;
        statusPill.className = 'drawer-status-pill mixed';
      } else if (active.length > 0) {
        statusPill.textContent = `${active.length} Downloading`;
        statusPill.className = 'drawer-status-pill active';
      } else if (completed.length > 0) {
        statusPill.textContent = `${completed.length} Finished`;
        statusPill.className = 'drawer-status-pill completed';
      } else {
        statusPill.textContent = 'Queue Idle';
        statusPill.className = 'drawer-status-pill';
      }
    }

    if (headerActiveBadge && headerToggleBtn) {
      if (active.length > 0) {
        headerActiveBadge.textContent = active.length;
        headerActiveBadge.classList.remove('hidden');
        headerToggleBtn.classList.add('has-active-downloads');
      } else {
        headerActiveBadge.classList.add('hidden');
        headerToggleBtn.classList.remove('has-active-downloads');
      }
    }
  };

  let customDownloadDir = '';
  try {
    customDownloadDir = localStorage.getItem('brotube-download-dir') || '';
  } catch (_) {}

  updateDrawerPathDisplay();

  const triggerOpenFolder = (targetPath = null) => {
    if (settingsPopover) settingsPopover.classList.add('hidden');
    window.broTube?.openFolder(targetPath || customDownloadDir || null);
  };

  if (btnOpenFolder) {
    btnOpenFolder.addEventListener('click', () => triggerOpenFolder());
  }
  if (btnDrawerOpenFolder) {
    btnDrawerOpenFolder.addEventListener('click', () => triggerOpenFolder());
  }
  if (btnChangeFolder) {
    btnChangeFolder.addEventListener('click', async () => {
      if (settingsPopover) settingsPopover.classList.add('hidden');
      try {
        const selected = await window.broTube?.selectDownloadDir();
        if (selected) {
          customDownloadDir = selected;
          try {
            localStorage.setItem('brotube-download-dir', selected);
          } catch (_) {}
          showSpatialAlert({
            title: 'Download Folder Updated',
            icon: 'success',
            message: `Downloads will now save to:<br><code style="font-size:12px;color:var(--accent-cyan);word-break:break-all;">${selected}</code>`
          });
        }
      } catch (err) {
        showSpatialAlert({
          title: 'Selection Notice',
          icon: 'info',
          message: 'Unable to select folder: ' + err.message
        });
      }
    });
  }

  // Update yt-dlp Tool
  if (btnUpdateYtDlp) {
    btnUpdateYtDlp.addEventListener('click', async () => {
      btnUpdateYtDlp.textContent = 'Updating engine...';
      try {
        const out = await window.broTube?.updateYtDlp();
        showSpatialAlert({
          title: 'Engine Update',
          icon: 'info',
          message: out ? `<pre style="font-family:inherit;white-space:pre-wrap;">${out}</pre>` : 'yt-dlp engine is up to date.'
        });
      } catch (err) {
        showSpatialAlert({
          title: 'Update Notice',
          icon: 'info',
          message: 'Unable to update engine automatically. The current built-in engine remains active.'
        });
      } finally {
        btnUpdateYtDlp.innerHTML = `
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/><polyline points="21 3 21 9 15 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span>Update yt-dlp Engine</span>
        `;
      }
    });
  }

  // Sync YouTube Auth & Cookies Tool
  if (btnSyncCookies) {
    btnSyncCookies.addEventListener('click', async () => {
      btnSyncCookies.textContent = 'Syncing authentication...';
      try {
        const res = await window.broTube?.syncCookies();
        if (res && res.success) {
          showSpatialAlert({
            title: 'Authentication Verified',
            icon: 'success',
            message: `Successfully synced session cookies from <strong>${res.source || 'session'}</strong>.<br><br>Protected downloads are now authorized.`
          });
        } else {
          showSpatialAlert({
            title: 'Authentication Required',
            icon: 'auth',
            message: res?.message || 'Please sign in to YouTube inside BroTube (click "Sign in" at the top right of YouTube) to authenticate downloads.'
          });
        }
      } catch (err) {
        showSpatialAlert({
          title: 'Cookie Sync Notice',
          icon: 'info',
          message: 'Unable to sync cookies automatically. Please ensure you are signed into YouTube inside BroTube.'
        });
      } finally {
        btnSyncCookies.innerHTML = `
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg>
          <span>Sync YouTube Auth / Cookies</span>
        `;
      }
    });
  }

  // Log Out & Clear YouTube Session Tool
  if (btnLogoutSession) {
    btnLogoutSession.addEventListener('click', () => {
      if (settingsPopover) settingsPopover.classList.add('hidden');
      showSpatialAlert({
        title: 'Sign Out & Clear Session',
        icon: 'auth',
        message: 'Are you sure you want to log out of YouTube?<br><br>This will terminate your active session, erase all locally encrypted cookies, and clear the web cache.',
        actionText: 'Confirm Log Out',
        onAction: async () => {
          try {
            const res = await window.broTube?.logoutSession();
            if (res && res.success) {
              if (webview) {
                webview.loadURL('https://www.youtube.com').catch(() => {});
              }
              showSpatialAlert({
                title: 'Session Cleared',
                icon: 'success',
                message: 'You have been successfully logged out. All on-device session credentials and cache have been wiped.'
              });
            } else {
              showSpatialAlert({
                title: 'Notice',
                icon: 'info',
                message: (res && res.message) || 'Unable to clear session.'
              });
            }
          } catch (err) {
            showSpatialAlert({
              title: 'Error',
              icon: 'info',
              message: 'Failed to log out: ' + err.message
            });
          }
        }
      });
    });
  }

  // Terms of Service & EULA Compliance Controller
  const EULA_STORAGE_KEY = 'brotube_eula_v1_accepted';
  function initEulaCompliance() {
    let isAccepted = false;
    try {
      isAccepted = localStorage.getItem(EULA_STORAGE_KEY) === 'true';
    } catch (_) {}

    if (!isAccepted && eulaModal) {
      eulaModal.classList.remove('hidden');
    }

    if (checkEulaAgree && btnEulaAccept) {
      checkEulaAgree.addEventListener('change', () => {
        btnEulaAccept.disabled = !checkEulaAgree.checked;
      });

      btnEulaAccept.addEventListener('click', () => {
        try {
          localStorage.setItem(EULA_STORAGE_KEY, 'true');
        } catch (_) {}
        if (eulaModal) eulaModal.classList.add('hidden');
        if (kofiModal) kofiModal.classList.remove('hidden');
      });
    }

    if (btnEulaDecline) {
      btnEulaDecline.addEventListener('click', () => {
        window.broTube?.closeWindow();
      });
    }

    if (btnViewTerms && eulaModal) {
      btnViewTerms.addEventListener('click', () => {
        if (settingsPopover) settingsPopover.classList.add('hidden');
        if (checkEulaAgree) checkEulaAgree.checked = true;
        if (btnEulaAccept) btnEulaAccept.disabled = false;
        eulaModal.classList.remove('hidden');
      });
    }
  }

  initEulaCompliance();

  // Community Ko-fi Support Modal Controller
  if (btnKofiSupport && kofiModal) {
    btnKofiSupport.addEventListener('click', () => {
      if (settingsPopover) settingsPopover.classList.add('hidden');
      kofiModal.classList.remove('hidden');
    });
  }
  if (kofiClose && kofiModal) {
    kofiClose.addEventListener('click', () => {
      kofiModal.classList.add('hidden');
    });
  }
  if (btnKofiDismiss && kofiModal) {
    btnKofiDismiss.addEventListener('click', () => {
      kofiModal.classList.add('hidden');
    });
  }
  if (btnKofiDonate) {
    btnKofiDonate.addEventListener('click', () => {
      window.broTube?.openExternal('https://ko-fi.com/brotube');
      if (kofiModal) kofiModal.classList.add('hidden');
    });
  }

  // Dedicated Bottom-Left Ko-fi Floating Widget Controller
  const kofiFloatWidget = document.getElementById('kofi-floating-widget');
  const btnKofiFloating = document.getElementById('btn-kofi-floating');
  const btnKofiFloatClose = document.getElementById('btn-kofi-float-close');
  if (kofiFloatWidget) {
    try {
      if (localStorage.getItem('brotube-kofi-collapsed') === 'true') {
        kofiFloatWidget.classList.add('collapsed');
      }
    } catch (_) {}
  }
  if (btnKofiFloating) {
    btnKofiFloating.addEventListener('click', (e) => {
      e.preventDefault();
      if (kofiFloatWidget?.classList.contains('collapsed')) {
        kofiFloatWidget.classList.remove('collapsed');
        try { localStorage.setItem('brotube-kofi-collapsed', 'false'); } catch (_) {}
      } else {
        window.broTube?.openExternal('https://ko-fi.com/brotube');
      }
    });
  }
  if (btnKofiFloatClose && kofiFloatWidget) {
    btnKofiFloatClose.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      kofiFloatWidget.classList.add('collapsed');
      try { localStorage.setItem('brotube-kofi-collapsed', 'true'); } catch (_) {}
    });
  }

  // Lossless Media Transcoder Studio Controller
  if (btnOpenTranscoder && transcoderModal) {
    btnOpenTranscoder.addEventListener('click', () => {
      if (settingsPopover) settingsPopover.classList.add('hidden');
      transcoderModal.classList.remove('hidden');
    });
  }
  if (transcoderClose && transcoderModal) {
    transcoderClose.addEventListener('click', () => {
      transcoderModal.classList.add('hidden');
    });
  }
  if (btnSelectTranscodeFile && transcodeInputPath) {
    btnSelectTranscodeFile.addEventListener('click', async () => {
      const file = await window.broTube?.selectFile();
      if (file) {
        transcodeInputPath.value = file;
        if (btnStartTranscode) btnStartTranscode.disabled = false;
      }
    });
  }
  if (btnStartTranscode) {
    btnStartTranscode.addEventListener('click', async () => {
      const inputPath = transcodeInputPath ? transcodeInputPath.value : '';
      const targetFormat = transcodeTargetFormat?.value || 'mp4';
      const preset = transcodePreset?.value || 'lossless';
      if (!inputPath) return;

      btnStartTranscode.disabled = true;
      if (transcodeStatus) {
        transcodeStatus.classList.remove('hidden');
        if (transcodeStatusText) transcodeStatusText.textContent = `Remastering into .${targetFormat.toUpperCase()} with FFmpeg...`;
      }

      try {
        const res = await window.broTube?.convertMedia({ inputPath, targetFormat, preset });
        if (res && res.success) {
          if (transcodeStatusText) transcodeStatusText.textContent = 'Conversion successful!';
          showSpatialAlert({
            title: 'Remaster Complete',
            icon: 'success',
            message: `File successfully transcoded:<br><code style="font-size:11.5px;color:var(--accent-cyan);word-break:break-all;">${res.outputPath}</code>`,
            actionText: 'Show File',
            onAction: () => {
              window.broTube?.openFolder(res.outputPath);
            }
          });
          if (transcoderModal) transcoderModal.classList.add('hidden');
        } else {
          showSpatialAlert({
            title: 'Conversion Notice',
            icon: 'info',
            message: res?.message || 'Media conversion failed. Ensure FFmpeg is available and file is not corrupted.'
          });
        }
      } catch (err) {
        showSpatialAlert({
          title: 'Transcoder Error',
          icon: 'info',
          message: err.message
        });
      } finally {
        btnStartTranscode.disabled = false;
        if (transcodeStatus) transcodeStatus.classList.add('hidden');
      }
    });
  }

  function formatSeconds(secs) {
    if (typeof secs !== 'number' || isNaN(secs) || secs < 0) return '00:00';
    const total = Math.floor(secs);
    const m = Math.floor(total / 60);
    const s = total % 60;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(remM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(remM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // Direct 1-Click Download Preference Controller
  let isDirectDl = false;
  try {
    isDirectDl = localStorage.getItem('brotube-direct-dl') === 'true';
  } catch (_) {}

  const getSavedQuality = () => {
    try {
      return localStorage.getItem('brotube-default-quality') || 'audio-mp3';
    } catch (_) {
      return 'audio-mp3';
    }
  };

  const getQualityBadgeLabel = (q) => {
    if (q === 'audio-mp3') return 'MP3';
    if (q === 'audio-flac') return 'FLAC';
    if (q === 'audio-opus') return 'Opus';
    if (q === 'best') return 'Peak';
    return `${q}p`;
  };

  const updateDirectDlUI = () => {
    if (btnDirectDlToggle) {
      btnDirectDlToggle.classList.toggle('active', isDirectDl);
    }
    if (directDlLabel) {
      directDlLabel.textContent = isDirectDl ? 'On' : 'Off';
    }
    if (checkDirectDl) {
      checkDirectDl.checked = isDirectDl;
    }
    if (btnQuickDownload) {
      const q = getSavedQuality();
      const qLabel = getQualityBadgeLabel(q);
      if (isDirectDl) {
        btnQuickDownload.title = `Direct 1-Click Download [${qLabel}] (Shift+Click to change quality or clip)`;
      } else {
        btnQuickDownload.title = 'Download Video or Audio with Quality Selection';
      }
    }
  };

  const setDirectDlMode = (enabled) => {
    isDirectDl = !!enabled;
    try {
      localStorage.setItem('brotube-direct-dl', isDirectDl ? 'true' : 'false');
    } catch (_) {}
    updateDirectDlUI();
  };

  if (btnDirectDlToggle) {
    btnDirectDlToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setDirectDlMode(!isDirectDl);
    });
  }

  if (checkDirectDl) {
    checkDirectDl.addEventListener('change', () => {
      setDirectDlMode(checkDirectDl.checked);
    });
  }

  updateDirectDlUI();

  // Direct 1-Click Downloader
  // shortcut: uses getActiveVideoMeta() title directly without secondary yt-dlp probe, upgrade if custom stream format overrides are needed
  async function triggerDirectDownload(targetUrl = null, targetTitle = null) {
    const rawUrl = targetUrl || getCurrentVideoUrl();
    if (!isVideoUrl(rawUrl)) {
      showSpatialAlert({
        title: 'No Media Selected',
        icon: 'info',
        message: 'Please open or play a YouTube video, Short, or playlist first to download.'
      });
      return;
    }

    const quality = getSavedQuality();
    const isPlaylist = rawUrl.includes('/playlist') || (rawUrl.includes('list=') && !rawUrl.includes('watch?v='));
    const url = isPlaylist ? cleanPlaylistUrl(rawUrl) : cleanVideoUrl(rawUrl);

    const isAudioOnly = quality.startsWith('audio-');
    const audioFormat = isAudioOnly ? quality.replace('audio-', '') : 'mp3';

    const taskId = `dl-${Date.now()}`;
    let title = targetTitle;
    if (!title) {
      const meta = await getActiveVideoMeta();
      title = (meta && meta.title) || (isPlaylist ? 'Playlist Download' : 'YouTube Download');
    }
    const mediaType = isAudioOnly ? `Audio (${audioFormat.toUpperCase()})` : (quality === 'best' ? 'Peak 4K/8K' : `${quality}p`);
    const label = isPlaylist ? `Playlist • ${mediaType}` : mediaType;

    addDownloadItem(taskId, title, label);

    try {
      const res = await window.broTube.startDownload({
        taskId,
        url,
        isPlaylist,
        quality,
        isAudioOnly,
        audioFormat,
        embedSubs: true,
        embedThumbnail: true,
        downloadDir: customDownloadDir || undefined
      });
      markDownloadItemDone(taskId, res.finalPath, res?.alreadyDownloaded);
    } catch (err) {
      if (err?.message === 'Cancelled') {
        markDownloadItemError(taskId, 'Cancelled');
        return;
      }
      const isBot = /anti-bot|sign in to confirm|confirm you are not a bot/i.test(err?.message || '');
      markDownloadItemError(taskId, err?.message || (isBot ? 'Sign-in required' : 'Download failed'));
      if (isBot) {
        showSpatialAlert({
          title: 'Sign in Required for Peak Quality',
          icon: 'auth',
          message: 'YouTube requires an active account to authorize this media stream. Please sign in or sync cookies.'
        });
      }
    }
  }

  // Open Download Studio Modal to prompt user for media type & quality
  const openDownloadModal = async (preferredQuality = null, targetUrl = null, targetTitle = null) => {
    const rawUrl = targetUrl || getCurrentVideoUrl();
    if (!isVideoUrl(rawUrl)) {
      showSpatialAlert({
        title: 'No Media Selected',
        icon: 'info',
        message: 'Please open or play a YouTube video, Short, or playlist first to download.'
      });
      return;
    }

    const hasPlaylist = rawUrl.includes('list=') || rawUrl.includes('/playlist');
    if (labelCheckPlaylist && checkPlaylist) {
      if (hasPlaylist) {
        labelCheckPlaylist.style.display = 'flex';
        checkPlaylist.checked = rawUrl.includes('/playlist');
      } else {
        labelCheckPlaylist.style.display = 'none';
        checkPlaylist.checked = false;
      }
    }

    const updateModalBtnText = () => {
      const isPl = !!(checkPlaylist && checkPlaylist.checked);
      const span = btnStartProDownload.querySelector('span');
      if (span) span.textContent = isPl ? 'Download Lossless Playlist' : 'Download Lossless File';
    };
    updateModalBtnText();
    if (checkPlaylist) {
      checkPlaylist.onchange = updateModalBtnText;
    }

    if (checkTimeRange) checkTimeRange.checked = false;
    if (timeRangeControls) timeRangeControls.classList.add('hidden');
    if (timeStart) timeStart.value = '00:00';
    if (timeEnd) timeEnd.value = '';

    const isPlPage = rawUrl.includes('/playlist') || (rawUrl.includes('list=') && !rawUrl.includes('watch?v='));
    const url = isPlPage ? cleanPlaylistUrl(rawUrl) : cleanVideoUrl(rawUrl);
    proModal.classList.remove('hidden');
    if (qualitySelect) {
      qualitySelect.value = preferredQuality || getSavedQuality();
    }
    if (checkDirectDl) {
      checkDirectDl.checked = isDirectDl;
    }

    let meta = null;
    if (!targetUrl) {
      meta = await getActiveVideoMeta();
    }
    let vidId = (meta && meta.videoId) || '';
    if (!vidId) {
      const match = rawUrl.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
      if (match) vidId = match[1];
    }
    const initialThumb = (meta && meta.thumbnail) || (vidId ? `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg` : '');
    if (initialThumb) {
      previewThumb.src = initialThumb;
    }
    previewTitle.textContent = targetTitle || (meta && meta.title) || (hasPlaylist ? 'YouTube Playlist' : 'YouTube Video');
    previewChannel.textContent = (meta && meta.uploader) || (hasPlaylist ? 'Playlist Creator' : 'Creator');
    previewDuration.textContent = meta && meta.duration ? `${Math.floor(meta.duration / 60)}m ${meta.duration % 60}s` : '';
    if (timeEnd && meta && meta.duration) {
      timeEnd.value = formatSeconds(meta.duration);
    }
    modalLoading.classList.add('hidden');
    modalContent.classList.remove('hidden');
    currentVideoData = { webpage_url: rawUrl, title: targetTitle || (meta && meta.title), uploader: meta && meta.uploader, duration: meta && meta.duration, thumbnail: initialThumb };

    // Enhance stream options in background from yt-dlp
    window.broTube?.getVideoInfo(url).then((info) => {
      currentVideoData = { ...info, webpage_url: rawUrl };
      if (info.thumbnail) previewThumb.src = info.thumbnail;
      if (info.title) previewTitle.textContent = info.title;
      if (info.uploader) previewChannel.textContent = info.uploader;
      if (info.duration) {
        previewDuration.textContent = `${Math.floor(info.duration / 60)}m ${info.duration % 60}s`;
        if (timeEnd && (!timeEnd.value || timeEnd.value === '00:00')) {
          timeEnd.value = formatSeconds(info.duration);
        }
      }
    }).catch(() => {
      // DOM metadata already displayed
    });
  };

  // Time-Range Toggle & Current Time Stamper
  if (checkTimeRange && timeRangeControls) {
    checkTimeRange.addEventListener('change', () => {
      if (checkTimeRange.checked) {
        timeRangeControls.classList.remove('hidden');
      } else {
        timeRangeControls.classList.add('hidden');
      }
    });
  }

  if (btnStampCurrent && timeStart) {
    btnStampCurrent.addEventListener('click', async () => {
      try {
        const secs = await webview.executeJavaScript(`(() => {
          const v = document.querySelector('video');
          return v ? v.currentTime : 0;
        })()`);
        if (typeof secs === 'number') {
          timeStart.value = formatSeconds(secs);
        }
      } catch (_) {}
    });
  }

  // Standalone Asset Downloader (Artwork & Subtitles)
  async function triggerAssetDownload(type) {
    const rawUrl = (currentVideoData && currentVideoData.webpage_url) || getCurrentVideoUrl();
    if (!isVideoUrl(rawUrl)) return;
    const url = cleanVideoUrl(rawUrl);
    proModal.classList.add('hidden');

    const taskId = `dl-${Date.now()}`;
    const baseTitle = (currentVideoData && currentVideoData.title) || previewTitle.textContent || 'Media Asset';
    const isThumb = type === 'thumbnail';
    const title = isThumb ? `Artwork • ${baseTitle}` : `Subtitles • ${baseTitle}`;
    const label = isThumb ? 'Thumbnail (PNG)' : 'Subtitles (.srt)';
    addDownloadItem(taskId, title, label);

    try {
      const res = await window.broTube.startDownload({
        taskId,
        url,
        isThumbnailOnly: isThumb,
        isSubtitlesOnly: !isThumb,
        downloadDir: customDownloadDir || undefined
      });
      markDownloadItemDone(taskId, res.finalPath, res?.alreadyDownloaded);
    } catch (err) {
      markDownloadItemError(taskId, err?.message === 'Cancelled' ? 'Cancelled' : 'Failed');
    }
  }

  if (btnDlThumb) {
    btnDlThumb.addEventListener('click', () => triggerAssetDownload('thumbnail'));
  }
  if (btnDlSubs) {
    btnDlSubs.addEventListener('click', () => triggerAssetDownload('subtitles'));
  }

  if (btnQuickDownload) {
    btnQuickDownload.addEventListener('click', (e) => {
      if (settingsPopover) settingsPopover.classList.add('hidden');
      if (isDirectDl && !e.shiftKey) {
        triggerDirectDownload();
      } else {
        openDownloadModal(getSavedQuality());
      }
    });
  }

  // Handle in-stream & thumbnail quick download triggers from guest webview
  if (webview) {
    webview.addEventListener('ipc-message', (e) => {
      if (e.channel === 'guest-download-current') {
        if (settingsPopover) settingsPopover.classList.add('hidden');
        if (isDirectDl) {
          triggerDirectDownload();
        } else {
          openDownloadModal(getSavedQuality());
        }
      } else if (e.channel === 'guest-download-url') {
        const payload = e.args && e.args[0];
        const targetUrl = payload && payload.url;
        const targetTitle = payload && payload.title;
        if (targetUrl) {
          if (settingsPopover) settingsPopover.classList.add('hidden');
          if (isDirectDl) {
            triggerDirectDownload(targetUrl, targetTitle);
          } else {
            openDownloadModal(getSavedQuality(), targetUrl, targetTitle);
          }
        }
      }
    });
  }

  if (btnQuickShare) {
    btnQuickShare.addEventListener('click', async () => {
      if (settingsPopover) settingsPopover.classList.add('hidden');
      const rawUrl = getCurrentVideoUrl();
      if (!isVideoUrl(rawUrl)) {
        showSpatialAlert({
          title: 'No Video Selected',
          icon: 'info',
          message: 'Please play or open a YouTube video first to share it.'
        });
        return;
      }

      const cleanUrl = cleanVideoUrl(rawUrl);
      try {
        // Attempt to trigger native YouTube share modal in webview
        const triggered = await webview.executeJavaScript(`(() => {
          const shareBtn = document.querySelector('ytd-watch-metadata #top-level-buttons-computed button[aria-label*="Share"], button[aria-label*="Share"], ytd-share-target-renderer, #actions button[aria-label*="Share"]');
          if (shareBtn) {
            shareBtn.click();
            return true;
          }
          return false;
        })()`);

        if (!triggered) {
          await navigator.clipboard.writeText(cleanUrl);
          showSpatialAlert({
            title: 'Share Video',
            icon: 'success',
            message: `<strong>Video link copied to clipboard!</strong><br><br><span style="font-size:12px;color:var(--text-secondary);word-break:break-all;">${cleanUrl}</span>`,
            actionText: 'Open WhatsApp',
            onAction: () => {
              window.broTube?.openExternal(`https://api.whatsapp.com/send?text=${encodeURIComponent(cleanUrl)}`);
            }
          });
        }
      } catch {
        try {
          await navigator.clipboard.writeText(cleanUrl);
          showSpatialAlert({
            title: 'Share Video',
            icon: 'success',
            message: `<strong>Video link copied to clipboard!</strong><br><br><span style="font-size:12px;color:var(--text-secondary);word-break:break-all;">${cleanUrl}</span>`,
            actionText: 'Open WhatsApp',
            onAction: () => {
              window.broTube?.openExternal(`https://api.whatsapp.com/send?text=${encodeURIComponent(cleanUrl)}`);
            }
          });
        } catch (_) {}
      }
    });
  }

  modalClose.addEventListener('click', () => {
    proModal.classList.add('hidden');
  });

  btnStartProDownload.addEventListener('click', async () => {
    const rawUrl = (currentVideoData && currentVideoData.webpage_url) || getCurrentVideoUrl();
    if (!isVideoUrl(rawUrl)) return;
    const isPlaylist = !!(checkPlaylist && checkPlaylist.checked);
    const url = isPlaylist ? cleanPlaylistUrl(rawUrl) : cleanVideoUrl(rawUrl);

    const quality = qualitySelect.value;
    try {
      localStorage.setItem('brotube-default-quality', quality);
    } catch (_) {}
    if (checkDirectDl && checkDirectDl.checked !== isDirectDl) {
      setDirectDlMode(checkDirectDl.checked);
    } else {
      updateDirectDlUI();
    }
    if (quality === 'asset-thumbnail') {
      return triggerAssetDownload('thumbnail');
    }
    if (quality === 'asset-subs') {
      return triggerAssetDownload('subtitles');
    }

    const isAudioOnly = quality.startsWith('audio-');
    const audioFormat = isAudioOnly ? quality.replace('audio-', '') : 'mp3';

    // Time-range clip parameters
    let timeRange = null;
    let clipLabel = '';
    if (checkTimeRange && checkTimeRange.checked) {
      const start = (timeStart?.value || '00:00').trim();
      const end = (timeEnd?.value || '').trim();
      if (start || end) {
        timeRange = `*${start || '0'}-${end || 'inf'}`;
        clipLabel = ` [${start || '0'} - ${end || 'end'}]`;
      }
    }

    proModal.classList.add('hidden');

    const taskId = `dl-${Date.now()}`;
    const title = (currentVideoData && currentVideoData.title) || previewTitle.textContent || (isPlaylist ? 'Playlist Download' : 'Video Download');
    const mediaType = isAudioOnly ? `Audio (${audioFormat.toUpperCase()})` : (quality === 'best' ? 'Peak 4K/8K' : `${quality}p`);
    const label = isPlaylist ? `Playlist • ${mediaType}${clipLabel}` : `${mediaType}${clipLabel}`;
    addDownloadItem(taskId, title, label);

    try {
      const res = await window.broTube.startDownload({
        taskId,
        url,
        isPlaylist,
        quality,
        isAudioOnly,
        audioFormat,
        embedSubs: checkSubs.checked,
        embedThumbnail: checkThumb.checked,
        timeRange,
        downloadDir: customDownloadDir || undefined
      });
      markDownloadItemDone(taskId, res.finalPath, res?.alreadyDownloaded);
    } catch (err) {
      if (err?.message === 'Cancelled') {
        markDownloadItemError(taskId, 'Cancelled');
        return;
      }
      const isBot = /anti-bot|sign in to confirm|confirm you are not a bot/i.test(err?.message || '');
      markDownloadItemError(taskId, err?.message || (isBot ? 'Sign-in required' : 'Download failed'));
      if (isBot) {
        showSpatialAlert({
          title: 'Sign in Required for Peak Quality',
          icon: 'auth',
          message: 'YouTube requires an active account to authorize this media stream (anti-bot challenge).<br><br>To continue downloading and unlock the highest peak quality (4K/8K):<br>1. Click <strong>Sign in</strong> at the top right of the YouTube player.<br>2. Retry your download once signed in.',
          actionText: 'Sync Cookies Now',
          onAction: async () => {
            const res = await window.broTube?.syncCookies();
            showSpatialAlert({
              title: res?.success ? 'Cookies Synced' : 'Sync Status',
              icon: res?.success ? 'success' : 'info',
              message: res?.success
                ? 'YouTube session cookies verified. You can now retry downloading at peak quality!'
                : (res?.message || 'Please click "Sign in" at the top right of the YouTube player first.')
            });
          }
        });
      }
    }
  });

  // Download UI Helpers
  function addDownloadItem(id, title, format) {
    if (downloadsEmpty) downloadsEmpty.style.display = 'none';

    let badgeClass = 'dl-badge-video';
    let badgeText = 'VIDEO';
    const fmtLower = (format || '').toLowerCase();
    if (fmtLower.includes('thumb')) {
      badgeClass = 'dl-badge-thumb';
      badgeText = 'THUMB';
    } else if (fmtLower.includes('sub')) {
      badgeClass = 'dl-badge-subs';
      badgeText = 'SUBS';
    } else if (fmtLower.includes('mp3') || fmtLower.includes('audio')) {
      badgeClass = 'dl-badge-audio';
      badgeText = 'AUDIO';
    } else if (fmtLower.includes('2160') || fmtLower.includes('4k')) {
      badgeClass = 'dl-badge-4k';
      badgeText = '4K UHD';
    } else if (fmtLower.includes('playlist')) {
      badgeClass = 'dl-badge-video';
      badgeText = 'PLAYLIST';
    }

    const item = document.createElement('div');
    item.id = id;
    item.className = 'download-item active';
    item.setAttribute('data-status', 'active');
    item.innerHTML = `
      <div class="dl-card-top">
        <div class="dl-badges-group">
          <span class="dl-badge ${badgeClass}">${badgeText}</span>
          <span class="dl-quality-label">${format}</span>
        </div>
        <div class="dl-top-actions">
          <span class="dl-percent">0%</span>
          <button class="btn-cancel-task dl-card-btn" title="Cancel Download">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="dl-title-row">
        <span class="dl-title"></span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
      <div class="download-meta">
        <div class="dl-speed-box">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span class="dl-speed">${format}</span>
        </div>
        <span class="dl-eta">Connecting stream...</span>
      </div>
      <div class="dl-completed-bar hidden">
        <button class="dl-btn-show-folder" type="button" title="Show file in folder">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span>Show in Folder</span>
        </button>
      </div>
    `;

    const titleEl = item.querySelector('.dl-title');
    if (titleEl) {
      titleEl.textContent = title;
      titleEl.title = title;
    }

    const cancelBtn = item.querySelector('.btn-cancel-task');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.broTube?.cancelDownload(id);
        markDownloadItemError(id, 'Cancelled');
      });
    }

    downloadsList.prepend(item);
    if (downloadsList.scrollTo) {
      downloadsList.scrollTo({ top: 0, behavior: 'smooth' });
    }
    activeDownloads.set(id, item);
    updateFilterCounts();
    applyDrawerFilter(currentFilter);
  }

  function markDownloadItemDone(id, finalPath, alreadyDownloaded = false) {
    const item = activeDownloads.get(id) || (id ? document.getElementById(id) : null);
    if (!item || item.getAttribute('data-status') === 'completed') return;
    activeDownloads.delete(id);
    item.classList.remove('active');
    item.classList.add('completed');
    item.setAttribute('data-status', 'completed');

    const percentEl = item.querySelector('.dl-percent');
    if (percentEl) {
      percentEl.textContent = '100%';
      percentEl.style.color = alreadyDownloaded ? '#38bdf8' : '#4ade80';
    }
    const fillEl = item.querySelector('.progress-fill');
    if (fillEl) {
      fillEl.style.width = '100%';
      fillEl.style.background = alreadyDownloaded ? '#06b6d4' : '#22c55e';
    }
    const speedEl = item.querySelector('.dl-speed');
    if (speedEl && alreadyDownloaded) {
      speedEl.textContent = 'Existing File';
    }
    const etaEl = item.querySelector('.dl-eta');
    if (etaEl) {
      etaEl.textContent = alreadyDownloaded ? 'File already in folder (Skipped)' : 'Completed!';
      etaEl.style.color = alreadyDownloaded ? '#38bdf8' : '#4ade80';
    }

    const cancelBtn = item.querySelector('.btn-cancel-task');
    if (cancelBtn) cancelBtn.remove();

    const titleEl = item.querySelector('.dl-title');
    if (titleEl && (titleEl.textContent === 'Active Video Stream' || titleEl.textContent === 'Fetching video stream...') && finalPath) {
      const baseName = finalPath.split(/[/\\]/).pop().replace(/\.[^.]+$/, '');
      if (baseName) titleEl.textContent = baseName;
    }

    const completedBar = item.querySelector('.dl-completed-bar');
    if (completedBar) {
      completedBar.classList.remove('hidden');
      const showFolderBtn = completedBar.querySelector('.dl-btn-show-folder');
      if (showFolderBtn) {
        showFolderBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.broTube?.openFolder(finalPath);
        });
      }
    }

    item.style.cursor = 'pointer';
    item.title = 'Click to show in folder';
    item.addEventListener('click', () => {
      window.broTube?.openFolder(finalPath);
    });

    updateFilterCounts();
    applyDrawerFilter(currentFilter);
  }

  function markDownloadItemError(id, msg) {
    const item = activeDownloads.get(id) || (id ? document.getElementById(id) : null);
    if (!item) return;
    activeDownloads.delete(id);
    item.classList.remove('active');
    item.classList.add('failed');
    item.setAttribute('data-status', 'failed');

    let cleanMsg = 'Download failed';
    const raw = String(msg || '');
    if (raw === 'Cancelled') {
      cleanMsg = 'Cancelled';
    } else if (/anti-bot|sign in to confirm|confirm you are not a bot/i.test(raw)) {
      cleanMsg = 'Sign-in required';
    } else if (/Video unavailable/i.test(raw)) {
      cleanMsg = 'Video unavailable';
    } else if (/Private video/i.test(raw)) {
      cleanMsg = 'Private video';
    } else if (/Members-only/i.test(raw)) {
      cleanMsg = 'Members-only';
    } else if (/Sign in to confirm your age|Age-restricted/i.test(raw)) {
      cleanMsg = 'Age-restricted (Sign-in)';
    } else if (/Premieres in/i.test(raw)) {
      cleanMsg = 'Premieres soon';
    } else if (raw && raw !== 'Download failed' && raw !== 'Failed') {
      const stripped = raw.replace(/^ERROR:\s*(\[[^\]]+\]\s*)?/i, '').replace(/\s*\(caused by.*\)$/i, '').trim();
      cleanMsg = stripped.length > 0 && stripped.length <= 40 ? stripped : 'Download failed';
    }

    const etaEl = item.querySelector('.dl-eta');
    if (etaEl) {
      etaEl.textContent = cleanMsg;
      etaEl.title = raw || cleanMsg;
      etaEl.style.color = cleanMsg === 'Cancelled' ? 'var(--text-muted)' : '#ef4444';
    }
    const fillEl = item.querySelector('.progress-fill');
    if (fillEl && cleanMsg !== 'Cancelled') {
      fillEl.style.background = '#ef4444';
    }
    const cancelBtn = item.querySelector('.btn-cancel-task');
    if (cancelBtn) cancelBtn.remove();

    updateFilterCounts();
    applyDrawerFilter(currentFilter);
  }

  // Listen for real-time progress events from yt-dlp by taskId
  if (window.broTube?.onDownloadProgress) {
    window.broTube.onDownloadProgress((data) => {
      const item = data && data.taskId ? (activeDownloads.get(data.taskId) || document.getElementById(data.taskId)) : null;
      if (item) {
        const percentEl = item.querySelector('.dl-percent');
        const fillEl = item.querySelector('.progress-fill');
        const speedEl = item.querySelector('.dl-speed');
        const etaEl = item.querySelector('.dl-eta');
        const titleEl = item.querySelector('.dl-title');

        if (data.title && titleEl) {
          const displayTitle = data.playlistInfo ? `[${data.playlistInfo}] ${data.title}` : data.title;
          if (titleEl.textContent !== displayTitle) {
            titleEl.textContent = displayTitle;
            titleEl.title = displayTitle;
          }
        }

        if (data.percent !== undefined) {
          percentEl.textContent = `${data.percent}%`;
          fillEl.style.width = `${data.percent}%`;
        }
        if (data.speed) speedEl.textContent = `${data.speed} (${data.total || ''})`;
        if (data.eta) etaEl.textContent = `ETA: ${data.eta}`;
      }
    });
  }

  // Listen for real-time completion events
  if (window.broTube?.onDownloadComplete) {
    window.broTube.onDownloadComplete((data) => {
      if (data && data.taskId) {
        markDownloadItemDone(data.taskId, data.finalPath, data.alreadyDownloaded);
      }
    });
  }

  // Smooth webview transition once player is ready
  if (webview) {
    webview.addEventListener('dom-ready', () => {
      setTimeout(dismissSplash, 300);
    }, { once: true });

    // Handle external links and share dialog targets (e.g. WhatsApp, Twitter, Facebook, mailto)
    webview.addEventListener('new-window', (e) => {
      e.preventDefault();
      if (e.url) {
        window.broTube?.openExternal(e.url);
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
