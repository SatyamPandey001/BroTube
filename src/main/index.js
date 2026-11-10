const { app, BrowserWindow, ipcMain, shell, session, nativeTheme, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { setupAdblocker } = require('./adblock');
const {
  getVideoInfo,
  startDownload,
  getDefaultDownloadDir,
  updateYtDlp,
  saveEncryptedCookies,
  acquireEphemeralCookieFile,
  releaseEphemeralCookieFile,
  cleanupOrphanedEphemeralCookies,
  importBrowserCookies,
  getDefaultCookiePath,
  getDefaultEncryptedCookiePath,
  clearDownloaderCache,
  convertMediaFile,
  killActiveConversions,
  setDownloaderLogger
} = require('./downloader');

let mainWindow = null;
let isPiPMode = false;
let normalBounds = null;
const activeDownloads = new Map();
let activeConversions = 0;
let isQuitting = false;

// GPU stability switches to prevent Windows D3D11 TDR driver hangs and exit code 34 crashes
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-gpu-watchdog');
app.commandLine.appendSwitch('disable-direct-composition-video-overlays');
app.commandLine.appendSwitch('disable-features', 'DirectCompositionVideoOverlays');

// Diagnostic Debug Logging Engine & Persistent File Log
const debugLogBuffer = [];
const MAX_DEBUG_LOGS = 600;
let isDebugModeEnabled = false;

function getDebugLogFilePath() {
  try {
    return path.join(app.getPath('userData'), 'brotube-debug.log');
  } catch {
    return path.join(os.homedir(), '.brotube-debug.log');
  }
}

function logDebug(category, message, details = null) {
  const ts = new Date().toISOString();
  const entry = {
    timestamp: ts,
    category: category || 'GENERAL',
    message: String(message),
    details: details || null
  };
  debugLogBuffer.push(entry);
  if (debugLogBuffer.length > MAX_DEBUG_LOGS) {
    debugLogBuffer.shift();
  }
  const formatted = `[${ts}] [${entry.category}] ${entry.message}${details ? ' ' + JSON.stringify(details) : ''}\n`;
  try {
    fs.appendFileSync(getDebugLogFilePath(), formatted, 'utf8');
  } catch {}
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('debug-log', entry);
    } catch {}
  }
}

setDownloaderLogger(logDebug);

// Suppress normal navigation abort rejections from webview page transitions
process.on('unhandledRejection', (reason) => {
  if (reason && (reason.code === 'ERR_ABORTED' || reason.errno === -3 || String(reason).includes('ERR_ABORTED'))) {
    return;
  }
  console.warn('[Process unhandledRejection]:', reason);
});

// Persistent User Data Directory for YouTube login, 2FA, and Cookies
const USER_PROFILE_DIR = path.join(app.getPath('userData'), 'YouTubeProfile');
app.setPath('userData', USER_PROFILE_DIR);
const COOKIE_FILE = getDefaultCookiePath();
const ENC_COOKIE_FILE = getDefaultEncryptedCookiePath();

async function syncSessionCookies(acquireEphemeral = false) {
  try {
    const webviewSession = session.fromPartition('persist:brotube');
    const cookies = await webviewSession.cookies.get({});
    const ytCookies = cookies.filter((c) =>
      c.domain.includes('youtube.com') ||
      c.domain.includes('google.com') ||
      c.domain.includes('googlevideo.com') ||
      c.domain.includes('youtube-nocookie.com')
    );
    const hasLogin = ytCookies.some((c) => c.name === 'LOGIN_INFO' || c.name === 'SAPISID' || c.name === '__Secure-3PSID');
    if (hasLogin) {
      saveEncryptedCookies(ytCookies, ENC_COOKIE_FILE);
      return acquireEphemeral ? acquireEphemeralCookieFile(ENC_COOKIE_FILE) : null;
    }

    // If active encrypted credentials already exist, yield ephemeral session file if requested
    if (fs.existsSync(ENC_COOKIE_FILE)) {
      return acquireEphemeral ? acquireEphemeralCookieFile(ENC_COOKIE_FILE) : null;
    }

    // Migrate any legacy plaintext cookie file to encrypted format, then shred plaintext
    if (fs.existsSync(COOKIE_FILE)) {
      try {
        const existing = fs.readFileSync(COOKIE_FILE, 'utf8');
        const fileHasLogin = existing.includes('LOGIN_INFO') || existing.includes('SAPISID');
        if (fileHasLogin) {
          saveEncryptedCookies(existing, ENC_COOKIE_FILE);
          try { fs.unlinkSync(COOKIE_FILE); } catch {}
          return acquireEphemeral ? acquireEphemeralCookieFile(ENC_COOKIE_FILE) : null;
        } else {
          try { fs.unlinkSync(COOKIE_FILE); } catch {}
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[Session cookie export]:', err.message);
  }

  return null;
}

function createMainWindow() {
  isQuitting = false;
  const icoPath = path.join(__dirname, '..', 'renderer', 'assets', 'icon.ico');
  const pngPath = path.join(__dirname, '..', 'renderer', 'assets', 'logo.png');
  const appIcon = process.platform === 'win32' && fs.existsSync(icoPath) ? icoPath : pngPath;

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    icon: appIcon,
    backgroundColor: '#0c0e17',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    },
    show: false
  });
  mainWindow.webContents.setMaxListeners(50);

  if (appIcon && fs.existsSync(appIcon)) {
    mainWindow.setIcon(appIcon);
  }

  // Enable hardware acceleration flags for peak 4K/8K 60fps decoding
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load BroTube Window Shell
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  const onAdBlocked = (count, url) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ad-blocked', { count, url });
    }
  };

  // Setup Brave-parity network adblocker on both webview partitioned session and default session
  const webviewSession = session.fromPartition('persist:brotube');
  const cleanUA = webviewSession.getUserAgent().replace(/Electron\/[0-9.]+\s*/i, '');
  webviewSession.setUserAgent(cleanUA);
  setupAdblocker(webviewSession, onAdBlocked);
  setupAdblocker(session.defaultSession, onAdBlocked);

  mainWindow.on('maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized-state', true);
    }
  });

  mainWindow.on('unmaximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized-state', false);
    }
  });

  mainWindow.on('close', (e) => {
    if (isQuitting) return;

    e.preventDefault();
    const runningTasks = activeDownloads.size + activeConversions;
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.webContents.send('show-exit-modal', { runningTasks });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window lifecycle & IPC
app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.brotube.app');
  }
  createMainWindow();

  // Plaintext ephemeral cookie files must be wiped even on hard crash (before-quit doesn't fire then)
  process.on('exit', cleanupOrphanedEphemeralCookies);

  // Background auto-sync YouTube session cookies on startup
  syncSessionCookies().catch(() => {});

  // Silent background yt-dlp update on startup — keeps downloads working as YouTube evolves
  updateYtDlp().catch(() => {});

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// Safe External Link Opener (Supports Web URLs, native WhatsApp app, Mailto)
async function openExternalUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const isSafe = url.startsWith('https://') ||
    url.startsWith('http://') ||
    url.startsWith('mailto:') ||
    url.startsWith('whatsapp:');
  if (!isSafe) return false;

  // Try opening native WhatsApp application directly if WhatsApp URL
  if (url.includes('api.whatsapp.com/send') || url.includes('web.whatsapp.com/send')) {
    try {
      const parsed = new URL(url);
      const text = parsed.searchParams.get('text') || '';
      const phone = parsed.searchParams.get('phone') || '';
      const nativeUrl = `whatsapp://send?${phone ? `phone=${encodeURIComponent(phone)}&` : ''}text=${encodeURIComponent(text)}`;
      await shell.openExternal(nativeUrl);
      return true;
    } catch (_) {
      // Fallback to browser URL
    }
  }

  try {
    await shell.openExternal(url);
    return true;
  } catch (_) {
    return false;
  }
}

// Intercept all in-page window.open and protocol links (YouTube Share to WhatsApp, Twitter, Facebook, etc.)
app.on('web-contents-created', (event, contents) => {
  contents.setMaxListeners(50);
  contents.setWindowOpenHandler(({ url }) => {
    if (url && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:') || url.startsWith('whatsapp:'))) {
      openExternalUrl(url);
    }
    return { action: 'deny' };
  });

  contents.on('will-navigate', (e, navUrl) => {
    const isExternal = navUrl && (
      navUrl.startsWith('mailto:') ||
      navUrl.startsWith('whatsapp:') ||
      (!navUrl.includes('youtube.com') && !navUrl.includes('google.com') && !navUrl.includes('gstatic.com') && !navUrl.includes('googlevideo.com'))
    );
    if (isExternal) {
      e.preventDefault();
      openExternalUrl(navUrl);
    }
  });
});

let gpuCrashCount = 0;
app.on('child-process-gone', (event, details) => {
  if (details && details.type === 'GPU') {
    gpuCrashCount++;
    console.warn(`[GPU process exited]: exitCode=${details.exitCode}, count=${gpuCrashCount}`);
    logDebug('GPU', `GPU process exited with code ${details.exitCode} (cumulative count: ${gpuCrashCount}) - display reset/TDR event`, details);
  } else if (details) {
    logDebug('SYSTEM', `Child process terminated: ${details.type} with exit code ${details.exitCode}`, details);
  }
});

app.on('before-quit', (e) => {
  if (!isQuitting && (activeDownloads.size > 0 || activeConversions > 0)) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
      if (!isQuitting) {
        e.preventDefault();
        return;
      }
    }
  }
  activeDownloads.forEach((handle) => {
    try {
      if (handle && typeof handle.kill === 'function') handle.kill();
    } catch {}
  });
  activeDownloads.clear();
  killActiveConversions();
  cleanupOrphanedEphemeralCookies();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window controls IPC
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  if (win && !win.isDestroyed()) {
    win.minimize();
  }
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  if (win && !win.isDestroyed()) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  if (win && !win.isDestroyed()) {
    win.close();
  }
});

ipcMain.handle('check-active-tasks', () => {
  return { count: activeDownloads.size + activeConversions };
});

ipcMain.on('confirm-exit', () => {
  isQuitting = true;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});

ipcMain.on('toggle-pip', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!isPiPMode) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    }
    normalBounds = mainWindow.getBounds();
    mainWindow.setMinimumSize(0, 0);
    mainWindow.setBounds({
      width: 440,
      height: 260,
      x: normalBounds.x + normalBounds.width - 460,
      y: normalBounds.y + normalBounds.height - 280
    });
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    isPiPMode = true;
  } else {
    mainWindow.setMinimumSize(900, 600);
    if (normalBounds) mainWindow.setBounds(normalBounds);
    mainWindow.setAlwaysOnTop(false);
    isPiPMode = false;
  }
});

// Theme IPC
ipcMain.handle('set-theme', async (event, theme) => {
  const isLight = theme === 'light';
  nativeTheme.themeSource = isLight ? 'light' : 'dark';
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setBackgroundColor(isLight ? '#f4f6fb' : '#0c0e17');
  }
  try {
    const webviewSession = session.fromPartition('persist:brotube');
    const cookies = await webviewSession.cookies.get({ url: 'https://www.youtube.com', name: 'PREF' });
    let prefVal = isLight ? 'f6=40000000' : 'f6=400';
    if (cookies.length > 0 && cookies[0].value) {
      const existing = cookies[0].value;
      prefVal = existing.includes('f6=')
        ? existing.replace(/f6=\d+/, isLight ? 'f6=40000000' : 'f6=400')
        : `${existing}&${prefVal}`;
    }
    await webviewSession.cookies.set({
      url: 'https://www.youtube.com',
      name: 'PREF',
      value: prefVal,
      domain: '.youtube.com',
      path: '/',
      expirationDate: Math.floor(Date.now() / 1000) + 86400 * 365
    });
  } catch (_) {}
  return true;
});

// Language IPC: Syncs global language preference to YouTube PREF cookie
ipcMain.handle('set-language', async (event, lang) => {
  try {
    const validLangs = ['en', 'es', 'de', 'fr', 'hi', 'ja'];
    const chosen = validLangs.includes(lang) ? lang : 'en';
    const webviewSession = session.fromPartition('persist:brotube');
    const cookies = await webviewSession.cookies.get({ url: 'https://www.youtube.com', name: 'PREF' });
    let prefVal = `hl=${chosen}`;
    if (cookies.length > 0 && cookies[0].value) {
      const existing = cookies[0].value;
      prefVal = existing.includes('hl=')
        ? existing.replace(/hl=[a-zA-Z-]+/, `hl=${chosen}`)
        : `${existing}&${prefVal}`;
    }
    await webviewSession.cookies.set({
      url: 'https://www.youtube.com',
      name: 'PREF',
      value: prefVal,
      domain: '.youtube.com',
      path: '/',
      expirationDate: Math.floor(Date.now() / 1000) + 86400 * 365
    });
    return { success: true, lang: chosen };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Safe External Link Opener (Supports Web URLs, WhatsApp, Mailto)
ipcMain.handle('open-external-url', async (event, url) => {
  return await openExternalUrl(url);
});

// Lossless Media Transcoder IPC
ipcMain.handle('convert-media', async (event, { inputPath, targetFormat, preset }) => {
  activeConversions++;
  try {
    return await convertMediaFile(inputPath, targetFormat, preset);
  } finally {
    activeConversions = Math.max(0, activeConversions - 1);
  }
});

// File Selection Dialog for Transcoder
ipcMain.handle('select-file', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Media File to Convert',
    properties: ['openFile'],
    filters: [
      { name: 'Media Files', extensions: ['mkv', 'mp4', 'webm', 'avi', 'mov', 'mp3', 'm4a', 'wav', 'flac', 'opus'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
    return res.filePaths[0];
  }
  return null;
});

// Download & Information IPC
ipcMain.handle('get-video-info', async (event, url) => {
  const cookiePath = await syncSessionCookies(true);
  try {
    return await getVideoInfo(url, { cookiePath });
  } finally {
    if (cookiePath) releaseEphemeralCookieFile(cookiePath);
  }
});

ipcMain.handle('get-default-download-dir', () => {
  return getDefaultDownloadDir();
});

ipcMain.handle('select-download-dir', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Select BroTube Download Directory',
    defaultPath: getDefaultDownloadDir(),
    properties: ['openDirectory', 'createDirectory']
  });
  if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
    return res.filePaths[0];
  }
  return null;
});

ipcMain.handle('start-download', async (event, options) => {
  // Strip any renderer-supplied cookie paths — only use the server-acquired ephemeral cookie
  const { cookiePath: _rc, ephemeralCookiePath: _re, ...safeOptions } = options;
  const taskId = safeOptions.taskId || `dl-${Date.now()}`;
  logDebug('DOWNLOAD', `Initiating download ${taskId} for: ${safeOptions.url}`, {
    taskId,
    quality: safeOptions.quality,
    isAudioOnly: safeOptions.isAudioOnly,
    audioFormat: safeOptions.audioFormat,
    isPlaylist: safeOptions.isPlaylist
  });
  const cookiePath = await syncSessionCookies(true);
  return new Promise((resolve, reject) => {
    const handle = startDownload(
      { ...safeOptions, taskId, cookiePath, ephemeralCookiePath: cookiePath },
      (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-progress', progress);
        }
      },
      (res) => {
        activeDownloads.delete(taskId);
        logDebug('DOWNLOAD', `Download ${taskId} completed (alreadyDownloaded: ${res?.alreadyDownloaded})`, res);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-complete', res);
        }
        resolve(res);
      },
      (err) => {
        activeDownloads.delete(taskId);
        logDebug('ERROR', `Download ${taskId} failed: ${err.message}`, { taskId, error: err.message });
        reject(err);
      }
    );
    activeDownloads.set(taskId, handle);
  });
});

ipcMain.handle('cancel-download', (event, taskId) => {
  const handle = activeDownloads.get(taskId);
  if (handle && typeof handle.kill === 'function') {
    handle.kill();
    activeDownloads.delete(taskId);
    return true;
  }
  return false;
});

ipcMain.handle('sync-cookies', async () => {
  try {
    const webviewSession = session.fromPartition('persist:brotube');
    const cookies = await webviewSession.cookies.get({});
    const ytCookies = cookies.filter((c) =>
      c.domain.includes('youtube.com') ||
      c.domain.includes('google.com') ||
      c.domain.includes('googlevideo.com') ||
      c.domain.includes('youtube-nocookie.com')
    );
    const hasLogin = ytCookies.some((c) => c.name === 'LOGIN_INFO' || c.name === 'SAPISID' || c.name === '__Secure-3PSID');
    if (hasLogin) {
      saveEncryptedCookies(ytCookies, ENC_COOKIE_FILE);
      return { success: true, count: ytCookies.length, source: 'BroTube YouTube Login (Encrypted)' };
    }
    const tempImportPath = path.join(os.tmpdir(), `bt_import_${Date.now()}.tmp`);
    try {
      const imported = await importBrowserCookies(tempImportPath);
      if (imported && fs.existsSync(tempImportPath)) {
        try {
          const fileContent = fs.readFileSync(tempImportPath, 'utf8');
          saveEncryptedCookies(fileContent, ENC_COOKIE_FILE);
          return { success: true, count: 1, source: 'System Browser (Encrypted)' };
        } catch {}
      }
    } finally {
      try {
        if (fs.existsSync(tempImportPath)) fs.unlinkSync(tempImportPath);
      } catch {}
    }
    return {
      success: false,
      message: 'No active YouTube login detected. Please click "Sign in" at the top right of the YouTube player or in your desktop browser.'
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('logout-session', async () => {
  try {
    const webviewSession = session.fromPartition('persist:brotube');
    await webviewSession.clearStorageData();
    await webviewSession.clearCache();
    await clearDownloaderCache();
    if (fs.existsSync(ENC_COOKIE_FILE)) {
      try {
        fs.writeFileSync(ENC_COOKIE_FILE, Buffer.alloc(32, 0));
        fs.unlinkSync(ENC_COOKIE_FILE);
      } catch {}
    }
    if (fs.existsSync(COOKIE_FILE)) {
      try {
        fs.writeFileSync(COOKIE_FILE, Buffer.alloc(32, 0));
        fs.unlinkSync(COOKIE_FILE);
      } catch {}
    }
    cleanupOrphanedEphemeralCookies();
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('open-folder', async (event, targetPath) => {
  try {
    if (targetPath && typeof targetPath === 'string' && fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      if (stat.isFile()) {
        shell.showItemInFolder(targetPath);
        return true;
      } else if (stat.isDirectory()) {
        await shell.openPath(targetPath);
        return true;
      }
    }

    const defaultDir = getDefaultDownloadDir();
    const videosSubDir = path.join(defaultDir, 'videos');
    const audiosSubDir = path.join(defaultDir, 'audios');
    if (!fs.existsSync(videosSubDir)) fs.mkdirSync(videosSubDir, { recursive: true });
    if (!fs.existsSync(audiosSubDir)) fs.mkdirSync(audiosSubDir, { recursive: true });
    await shell.openPath(defaultDir);
    return true;
  } catch (err) {
    console.error('Failed to open folder:', err);
    return false;
  }
});

ipcMain.handle('update-yt-dlp', async () => {
  return await updateYtDlp();
});

// Diagnostic Debug IPC Endpoints
ipcMain.handle('get-debug-mode', () => isDebugModeEnabled);

ipcMain.handle('set-debug-mode', (event, enabled) => {
  isDebugModeEnabled = !!enabled;
  logDebug('SYSTEM', `Debug Engine mode toggled to: ${isDebugModeEnabled ? 'ACTIVE' : 'DISABLED'}`);
  return isDebugModeEnabled;
});

ipcMain.handle('get-debug-logs', () => debugLogBuffer);

ipcMain.handle('clear-debug-logs', () => {
  debugLogBuffer.length = 0;
  try {
    fs.writeFileSync(getDebugLogFilePath(), '', 'utf8');
  } catch {}
  logDebug('SYSTEM', 'Debug logs reset by user');
  return true;
});

ipcMain.handle('scan-debug-logs', () => {
  const issues = [];
  let botChallenges = 0;
  let alreadyDownloadedCount = 0;
  let rateLimits = 0;
  let failedTasks = 0;

  let unavailableCount = 0;

  for (const log of debugLogBuffer) {
    const text = (log.message || '') + ' ' + (log.details ? JSON.stringify(log.details) : '');
    if (/bot challenge|confirm you'?re not a bot|Sign in to confirm/i.test(text)) {
      botChallenges++;
    }
    if (/HTTP Error 429|Too Many Requests/i.test(text)) {
      rateLimits++;
    }
    if (/has already been downloaded|alreadyDownloaded: true/i.test(text)) {
      alreadyDownloadedCount++;
    }
    if (/Video unavailable|Private video|Members-only/i.test(text)) {
      unavailableCount++;
    }
    if (/finished with exit code [1-9]|exited with error code [1-9]|Failed to launch download engine/i.test(text)) {
      failedTasks++;
    }
  }

  if (unavailableCount > 0) {
    issues.push({
      severity: 'warning',
      title: 'Unavailable or Restricted Content Detected',
      description: `Detected ${unavailableCount} video(s) reported as unavailable, private, or restricted by YouTube.`,
      action: 'Check that the video still exists and is publicly accessible in your browser.'
    });
  }

  if (botChallenges > 0 || rateLimits > 0) {
    issues.push({
      severity: 'error',
      title: 'YouTube Anti-Bot Challenge / Throttling Detected',
      description: `Detected ${botChallenges + rateLimits} YouTube challenge response(s). After multiple consecutive audio downloads, YouTube blocks guest access.`,
      action: 'Click "Sign in" at the top right of BroTube to authorize your downloads with active session cookies.'
    });
  }

  if (alreadyDownloadedCount > 0) {
    issues.push({
      severity: 'warning',
      title: 'Identical Audio Files Already Present (Skipped)',
      description: `Detected ${alreadyDownloadedCount} track(s) where yt-dlp reported "has already been downloaded" because files with matching names exist in your destination folder.`,
      action: 'Check your download folder or choose a different destination in the Downloads Hub.'
    });
  }

  if (gpuCrashCount > 0) {
    issues.push({
      severity: 'warning',
      title: 'Windows GPU Driver Reset (TDR Hang) Detected',
      description: `Detected ${gpuCrashCount} GPU process recovery event(s). Windows temporarily resets the display driver when GPU/CPU is overwhelmed.`,
      action: 'BroTube enabled watchdog suppression and capped FFmpeg audio encoding threads to 2 to eliminate screen freezes.'
    });
  }

  if (failedTasks > 0) {
    issues.push({
      severity: 'warning',
      title: 'Task Failures Detected',
      description: `Detected ${failedTasks} failed download process execution(s).`,
      action: 'Review the recent error entries in the log below for specific stream/audio error details.'
    });
  }

  return {
    status: issues.length === 0 ? 'Healthy' : (issues.some(i => i.severity === 'error') ? 'Issues Found' : 'Warnings Found'),
    totalLogs: debugLogBuffer.length,
    activeTasks: activeDownloads.size + activeConversions,
    gpuCrashCount,
    issues
  };
});
