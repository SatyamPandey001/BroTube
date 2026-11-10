const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

let safeStorage = null;
try {
  safeStorage = require('electron').safeStorage;
} catch {}

const PYTHON_CMD = 'python';

let cachedYtDlpRunner = undefined;
let downloaderLogger = null;

function setDownloaderLogger(fn) {
  downloaderLogger = fn;
}

function getUserBinDir() {
  const baseDir = process.platform === 'win32'
    ? path.join(os.homedir(), 'AppData', 'Roaming', 'BroTube', 'bin')
    : path.join(os.homedir(), '.config', 'brotube', 'bin');
  if (!fs.existsSync(baseDir)) {
    try { fs.mkdirSync(baseDir, { recursive: true }); } catch {}
  }
  return baseDir;
}

function resolveYtDlpRunner(forceRefresh = false) {
  if (!forceRefresh && cachedYtDlpRunner !== undefined) {
    return cachedYtDlpRunner;
  }

  const exeName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const userBin = path.join(getUserBinDir(), exeName);

  // 1. User-space standalone binary (updatable without administrator elevation)
  if (fs.existsSync(userBin)) {
    cachedYtDlpRunner = {
      command: userBin,
      argsPrefix: [],
      isStandalone: true,
      binaryPath: userBin,
      type: 'user-standalone'
    };
    return cachedYtDlpRunner;
  }

  // 2. Bundled application binary (packaged extraResources or local project bin)
  const bundledCandidates = [
    path.join(__dirname, '..', '..', 'bin', exeName),
    path.join(process.resourcesPath || '', 'bin', exeName),
    path.join(__dirname, '..', '..', 'extraResources', 'bin', exeName)
  ];

  for (const candidate of bundledCandidates) {
    if (candidate && fs.existsSync(candidate)) {
      try {
        fs.copyFileSync(candidate, userBin);
        cachedYtDlpRunner = {
          command: userBin,
          argsPrefix: [],
          isStandalone: true,
          binaryPath: userBin,
          type: 'user-standalone'
        };
        return cachedYtDlpRunner;
      } catch {
        cachedYtDlpRunner = {
          command: candidate,
          argsPrefix: [],
          isStandalone: true,
          binaryPath: candidate,
          type: 'bundled-standalone'
        };
        return cachedYtDlpRunner;
      }
    }
  }

  // 3. System PATH or Local Python Scripts standalone binary
  const systemCandidates = [];
  if (process.platform === 'win32') {
    try {
      const out = execSync('where.exe yt-dlp', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      const first = out.split(/\r?\n/)[0];
      if (first && fs.existsSync(first)) systemCandidates.push(first);
    } catch {}
    const localScripts = path.join(process.env.LOCALAPPDATA || '', 'Python', 'pythoncore-3.14-64', 'Scripts', 'yt-dlp.exe');
    if (fs.existsSync(localScripts)) systemCandidates.push(localScripts);
  } else {
    try {
      const out = execSync('which yt-dlp', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      if (out && fs.existsSync(out)) systemCandidates.push(out);
    } catch {}
  }

  for (const cand of systemCandidates) {
    if (cand && fs.existsSync(cand)) {
      cachedYtDlpRunner = {
        command: cand,
        argsPrefix: [],
        isStandalone: true,
        binaryPath: cand,
        type: 'system-standalone'
      };
      return cachedYtDlpRunner;
    }
  }

  // 4. System Python module fallback
  cachedYtDlpRunner = {
    command: 'python',
    argsPrefix: ['-m', 'yt_dlp'],
    isStandalone: false,
    binaryPath: null,
    type: 'python-module'
  };
  return cachedYtDlpRunner;
}

function stripPythonModuleArgs(args) {
  if (Array.isArray(args) && args.length >= 2 && args[0] === '-m' && args[1] === 'yt_dlp') {
    return args.slice(2);
  }
  return args;
}

function spawnYtDlp(args, spawnOptions = {}) {
  const runner = resolveYtDlpRunner();
  if (runner.isStandalone) {
    const cleanArgs = stripPythonModuleArgs(args);
    return spawn(runner.command, cleanArgs, spawnOptions);
  }
  const fullArgs = (Array.isArray(args) && args[0] === '-m' && args[1] === 'yt_dlp')
    ? args
    : [...runner.argsPrefix, ...args];
  return spawn(runner.command, fullArgs, spawnOptions);
}

function downloadStandaloneYtDlp() {
  return new Promise((resolve, reject) => {
    const exeName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const targetPath = path.join(getUserBinDir(), exeName);
    const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${exeName}`;

    function fetchUrl(currentUrl, redirectCount = 0) {
      if (redirectCount > 5) return reject(new Error('Too many redirects while downloading engine'));
      const client = currentUrl.startsWith('https:') ? require('https') : require('http');
      client.get(currentUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, currentUrl).href;
          return fetchUrl(nextUrl, redirectCount + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Download failed with HTTP ${res.statusCode}`));
        }
        const tempPath = `${targetPath}.part`;
        const fileStream = fs.createWriteStream(tempPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close(() => {
            try {
              if (process.platform !== 'win32') fs.chmodSync(tempPath, 0o755);
              fs.renameSync(tempPath, targetPath);
              resolveYtDlpRunner(true);
              resolve(targetPath);
            } catch (e) {
              reject(e);
            }
          });
        });
        fileStream.on('error', (err) => {
          try { fs.unlinkSync(tempPath); } catch {}
          reject(err);
        });
      }).on('error', reject);
    }

    fetchUrl(url);
  });
}

function getDefaultDownloadDir() {
  const dir = path.join(os.homedir(), 'Videos', 'BroTube');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getDefaultCookiePath() {
  const baseDir = process.platform === 'win32'
    ? path.join(os.homedir(), 'AppData', 'Roaming', 'BroTube', 'YouTubeProfile')
    : path.join(os.homedir(), '.config', 'brotube', 'YouTubeProfile');
  return path.join(baseDir, 'brotube_cookies.txt');
}

function getDefaultEncryptedCookiePath() {
  const baseDir = process.platform === 'win32'
    ? path.join(os.homedir(), 'AppData', 'Roaming', 'BroTube', 'YouTubeProfile')
    : path.join(os.homedir(), '.config', 'brotube', 'YouTubeProfile');
  return path.join(baseDir, 'brotube_cookies.enc');
}

// Cleans YouTube URLs by stripping playlist/radio parameters (&list=, &index=)
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

// Extracts clean YouTube playlist URL (https://www.youtube.com/playlist?list=...)
function cleanPlaylistUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return '';
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

// Netscape format generator for Chromium/Electron cookies
function formatNetscapeCookies(cookies) {
  const lines = [
    '# Netscape HTTP Cookie File',
    '# https://curl.se/docs/http-cookies.html',
    '# This file was generated by BroTube. Do not edit.'
  ];
  for (const c of (cookies || [])) {
    if (!c || !c.domain || !c.name) continue;
    const domain = (c.httpOnly ? '#HttpOnly_' : '') + c.domain;
    const includeSubdomains = c.domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const pathVal = c.path || '/';
    const secureVal = c.secure ? 'TRUE' : 'FALSE';
    const expiry = Math.round(c.expirationDate || (Date.now() / 1000 + 86400 * 30));
    lines.push([domain, includeSubdomains, pathVal, secureVal, expiry, c.name, c.value || ''].join('\t'));
  }
  return lines.join('\n') + '\n';
}

function exportCookiesToFile(cookies, targetPath) {
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const content = formatNetscapeCookies(cookies);
  fs.writeFileSync(targetPath, content, 'utf8');
  return targetPath;
}

function getMachineKey() {
  // Persist a random key in the same directory as the cookie files.
  // shortcut: existing .enc cookies won't decrypt after this change; users re-sync once
  const keyPath = path.join(
    process.platform === 'win32'
      ? path.join(os.homedir(), 'AppData', 'Roaming', 'BroTube', 'YouTubeProfile')
      : path.join(os.homedir(), '.config', 'brotube', 'YouTubeProfile'),
    'machine.key'
  );
  try {
    const existing = fs.readFileSync(keyPath);
    if (existing.length === 32) return existing;
  } catch {}
  const key = crypto.randomBytes(32);
  const dir = path.dirname(keyPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  try { fs.writeFileSync(keyPath, key, { mode: 0o600 }); } catch {}
  return key;
}

function encryptCookieData(plainText) {
  if (safeStorage && typeof safeStorage.isEncryptionAvailable === 'function' && safeStorage.isEncryptionAvailable()) {
    try {
      const encrypted = safeStorage.encryptString(plainText);
      return Buffer.concat([Buffer.from('BT_DPAPI:'), encrypted]);
    } catch {}
  }
  const iv = crypto.randomBytes(12);
  const key = getMachineKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from('BT_GCM:'), iv, tag, encrypted]);
}

function decryptCookieData(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 10) return '';
  const prefix = buffer.subarray(0, 9).toString('utf8');
  if (prefix === 'BT_DPAPI:' && safeStorage && typeof safeStorage.isEncryptionAvailable === 'function' && safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(buffer.subarray(9));
    } catch {}
  }
  const gcmPrefix = buffer.subarray(0, 7).toString('utf8');
  if (gcmPrefix === 'BT_GCM:') {
    try {
      const iv = buffer.subarray(7, 19);
      const tag = buffer.subarray(19, 35);
      const encrypted = buffer.subarray(35);
      const key = getMachineKey();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
    } catch {}
  }
  return ''; // unknown format — treat as empty rather than returning garbage bytes
}

function saveEncryptedCookies(cookies, targetEncPath) {
  const targetDir = path.dirname(targetEncPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const content = Array.isArray(cookies) ? formatNetscapeCookies(cookies) : String(cookies);
  const encryptedBuffer = encryptCookieData(content);
  fs.writeFileSync(targetEncPath, encryptedBuffer);
  // Wipe any plaintext counterpart at the same location if it exists
  const plainPath = targetEncPath.replace(/\.enc$/, '.txt');
  if (fs.existsSync(plainPath)) {
    try {
      fs.writeFileSync(plainPath, Buffer.alloc(32, 0));
      fs.unlinkSync(plainPath);
    } catch {}
  }
  return targetEncPath;
}

function acquireEphemeralCookieFile(encPath) {
  if (!fs.existsSync(encPath)) return null;
  try {
    const rawBuffer = fs.readFileSync(encPath);
    const decrypted = decryptCookieData(rawBuffer);
    if (!decrypted || decrypted.trim().length === 0) return null;
    const tempFile = path.join(os.tmpdir(), `bt_ephem_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.tmp`);
    fs.writeFileSync(tempFile, decrypted, { encoding: 'utf8', mode: 0o600 });
    return tempFile;
  } catch (err) {
    console.warn('[Ephemeral cookie acquire error]:', err.message);
    return null;
  }
}

function releaseEphemeralCookieFile(tempPath) {
  if (tempPath && typeof tempPath === 'string' && fs.existsSync(tempPath)) {
    try {
      fs.writeFileSync(tempPath, Buffer.alloc(32, 0));
      fs.unlinkSync(tempPath);
    } catch {}
  }
}

function cleanupOrphanedEphemeralCookies() {
  try {
    const tmpDir = os.tmpdir();
    const files = fs.readdirSync(tmpDir);
    for (const f of files) {
      if (f.startsWith('bt_ephem_') && f.endsWith('.tmp')) {
        try { fs.unlinkSync(path.join(tmpDir, f)); } catch {}
      }
    }
  } catch {}
}

// Imports cookies from installed system browsers if no active BroTube login exists
function importBrowserCookies(targetPath) {
  return new Promise((resolve) => {
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const browsers = ['brave', 'chrome', 'edge', 'firefox'];
    let idx = 0;
    function tryNext() {
      if (idx >= browsers.length) {
        return resolve(false);
      }
      const b = browsers[idx++];
      const proc = spawnYtDlp([
        '--cookies-from-browser', b,
        '--cookies', targetPath,
        '--skip-download',
        'https://www.youtube.com'
      ]);
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(targetPath) && fs.statSync(targetPath).size > 100) {
          resolve(true);
        } else {
          tryNext();
        }
      });
      proc.on('error', () => tryNext());
    }
    tryNext();
  });
}

let cachedFfmpegDir = undefined;

function getFfmpegDir() {
  if (cachedFfmpegDir !== undefined) {
    return cachedFfmpegDir;
  }

  const exeName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const candidates = [
    // 1. User appData bin directory
    getUserBinDir(),
    path.join(getUserBinDir(), 'ffmpeg', 'bin'),
    path.join(getUserBinDir(), 'ffmpeg'),
    // 2. Project local or bundled extraResources bin directory
    path.join(__dirname, '..', '..', 'bin'),
    path.join(__dirname, '..', '..', 'extraResources', 'bin'),
    path.join(process.resourcesPath || '', 'bin'),
    // 3. Local Winget Gyan FFmpeg
    path.join(
      process.env.LOCALAPPDATA || '',
      'Microsoft',
      'WinGet',
      'Packages',
      'Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe',
      'ffmpeg-9.0.1-essentials_build',
      'bin'
    )
  ];

  for (const cand of candidates) {
    if (cand && fs.existsSync(path.join(cand, exeName))) {
      cachedFfmpegDir = cand;
      return cachedFfmpegDir;
    }
  }

  try {
    const lookupCmd = process.platform === 'win32' ? 'where.exe ffmpeg' : 'which ffmpeg';
    const stdout = execSync(lookupCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    const firstLine = stdout.split(/\r?\n/)[0];
    if (firstLine && fs.existsSync(firstLine)) {
      cachedFfmpegDir = path.dirname(firstLine);
      return cachedFfmpegDir;
    }
  } catch {}

  cachedFfmpegDir = null;
  return null;
}

function getBaseYtDlpArgs(cookiePath) {
  const args = [
    '-m', 'yt_dlp',
    '--no-warnings',
    '--js-runtimes', 'node',
    '--remote-components', 'ejs:github',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  ];
  const ffmpegDir = getFfmpegDir();
  if (ffmpegDir) {
    args.push('--ffmpeg-location', ffmpegDir);
  }
  const targetCookie = cookiePath || getDefaultCookiePath();
  if (targetCookie && fs.existsSync(targetCookie)) {
    try {
      if (fs.statSync(targetCookie).size > 0) {
        args.push('--cookies', targetCookie);
      }
    } catch {
      // ignore stat errors
    }
  }
  return args;
}

function getVideoInfo(url, options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://')) || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      return reject(new Error('Invalid YouTube URL'));
    }

    const isPlaylist = url.includes('/playlist') || (url.includes('list=') && !url.includes('watch?v='));
    const targetUrl = isPlaylist ? cleanPlaylistUrl(url) : cleanVideoUrl(url);
    const baseArgs = getBaseYtDlpArgs(options.cookiePath);
    const args = isPlaylist
      ? [...baseArgs, '--dump-single-json', '--flat-playlist', '--playlist-items', '1', '--skip-download', '--', targetUrl]
      : [...baseArgs, '--dump-single-json', '--no-playlist', '--skip-download', '--', targetUrl];
    const proc = spawnYtDlp(args);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to launch download engine: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        let errMessage = stderr.trim();
        if (/Sign in to confirm you'?re not a bot|bot challenge|HTTP Error 429|confirm you are not a bot/i.test(errMessage)) {
          errMessage = "YouTube anti-bot challenge: Please sign in to your YouTube account inside BroTube (click 'Sign in' at top right) or sync browser cookies in Settings.";
        }
        return reject(new Error(errMessage || `yt-dlp exited with code ${code}`));
      }
      try {
        const data = JSON.parse(stdout);
        const firstEntry = (data.entries && data.entries[0]) || data;
        const thumbnail = data.thumbnail ||
          (data.thumbnails && data.thumbnails.length && data.thumbnails[data.thumbnails.length - 1].url) ||
          (firstEntry && firstEntry.thumbnail) ||
          (firstEntry && firstEntry.thumbnails && firstEntry.thumbnails.length && firstEntry.thumbnails[firstEntry.thumbnails.length - 1].url) ||
          (firstEntry && firstEntry.id ? `https://i.ytimg.com/vi/${firstEntry.id}/hqdefault.jpg` : '');

        const formats = (data.formats || []).map((f) => ({
          format_id: f.format_id,
          ext: f.ext,
          resolution: f.resolution || (f.height ? `${f.height}p` : 'audio'),
          height: f.height || 0,
          fps: f.fps || 0,
          vcodec: f.vcodec,
          acodec: f.acodec,
          filesize: f.filesize || f.filesize_approx || 0,
          has_video: f.vcodec && f.vcodec !== 'none',
          has_audio: f.acodec && f.acodec !== 'none'
        }));

        resolve({
          id: data.id,
          title: data.title,
          uploader: data.uploader,
          channel_url: data.channel_url,
          duration: data.duration,
          thumbnail,
          webpage_url: data.webpage_url,
          description: data.description ? data.description.substring(0, 300) : '',
          formats,
          isPlaylist: data._type === 'playlist'
        });
      } catch (err) {
        reject(new Error(`Failed to parse video info: ${err.message}`));
      }
    });
  });
}

function buildDownloadArgs(options = {}) {
  const {
    url,
    quality = 'best',
    isAudioOnly = false,
    audioFormat = 'mp3',
    downloadDir = getDefaultDownloadDir(),
    cookiePath,
    embedSubs = true,
    embedThumbnail = true,
    isPlaylist = false,
    timeRange = null,
    isThumbnailOnly = false,
    isSubtitlesOnly = false
  } = options;

  const targetUrl = isPlaylist ? cleanPlaylistUrl(url) : cleanVideoUrl(url);

  // Standalone thumbnail extraction
  if (isThumbnailOnly) {
    const targetFolder = path.join(downloadDir, 'thumbnails');
    if (!fs.existsSync(targetFolder)) {
      try { fs.mkdirSync(targetFolder, { recursive: true }); } catch {}
    }
    const baseArgs = getBaseYtDlpArgs(cookiePath);
    return [
      ...baseArgs,
      '--newline',
      '--progress',
      '--print', 'after_video:video_title:%(title)s',
      '--no-simulate',
      '--no-playlist',
      '--skip-download',
      '--write-thumbnail',
      '--convert-thumbnails', 'png',
      '-o', path.join(targetFolder, '%(title)s.%(ext)s'),
      '--', targetUrl
    ];
  }

  // Standalone subtitles extraction
  if (isSubtitlesOnly) {
    const targetFolder = path.join(downloadDir, 'subtitles');
    if (!fs.existsSync(targetFolder)) {
      try { fs.mkdirSync(targetFolder, { recursive: true }); } catch {}
    }
    const baseArgs = getBaseYtDlpArgs(cookiePath);
    return [
      ...baseArgs,
      '--newline',
      '--progress',
      '--print', 'after_video:video_title:%(title)s',
      '--no-simulate',
      '--no-playlist',
      '--skip-download',
      '--write-subs',
      '--write-auto-subs',
      '--sub-langs', 'en.*',
      '--convert-subs', 'srt',
      '-o', path.join(targetFolder, '%(title)s.%(ext)s'),
      '--', targetUrl
    ];
  }

  let formatSelector;
  if (isAudioOnly) {
    formatSelector = 'bestaudio/best';
  } else if (quality === 'best') {
    formatSelector = 'bestvideo+bestaudio/best';
  } else {
    const height = parseInt(quality, 10);
    formatSelector = (!isNaN(height) && height > 0)
      ? `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`
      : 'bestvideo+bestaudio/best';
  }

  const subFolder = isAudioOnly ? 'audios' : 'videos';
  const targetFolder = path.join(downloadDir, subFolder);
  if (!fs.existsSync(targetFolder)) {
    try {
      fs.mkdirSync(targetFolder, { recursive: true });
    } catch {}
  }

  const outputTemplate = isPlaylist
    ? (isAudioOnly
        ? path.join(targetFolder, '%(playlist_title|Playlist)s', '%(playlist_index|01)02d - %(title)s.%(ext)s')
        : path.join(targetFolder, '%(playlist_title|Playlist)s', '%(playlist_index|01)02d - %(title)s [%(resolution)s].%(ext)s'))
    : (isAudioOnly
        ? path.join(targetFolder, '%(title)s.%(ext)s')
        : path.join(targetFolder, '%(title)s [%(resolution)s].%(ext)s'));

  const baseArgs = getBaseYtDlpArgs(cookiePath);
  const args = [
    ...baseArgs,
    '--newline',
    '--progress',
    '--print', 'after_video:video_title:%(title)s',
    '--no-simulate',
    isPlaylist ? '--yes-playlist' : '--no-playlist',
    '-f', formatSelector,
    '-o', outputTemplate
  ];

  if (isAudioOnly) {
    // For audio extraction, -x extracts audio and --audio-format sets the target codec
    args.push('-x', '--audio-format', audioFormat, '--audio-quality', '0');
    // Limit ffmpeg post-processing threads to 2 to prevent GPU/CPU starvation & Windows TDR display freezes
    args.push('--postprocessor-args', 'ExtractAudio:-threads 2');
  } else {
    // --merge-output-format is only valid for video containers (e.g. mkv, mp4)
    args.push('--merge-output-format', 'mkv');
    // Limit ffmpeg video merger threads to 2 to prevent GPU/CPU bus starvation & Windows TDR display freezes
    args.push('--postprocessor-args', 'Merger:-threads 2');
  }

  // Embed subtitles only on video streams (MP3/audio containers do not support subtitle streams)
  if (embedSubs && !isAudioOnly) {
    args.push('--embed-subs', '--sub-langs', 'en.*');
  }

  // Embed artwork; convert to PNG when saving audio since MP3 ID3v2 cannot accept WebP artwork
  if (embedThumbnail) {
    args.push('--embed-thumbnail');
    if (isAudioOnly) {
      args.push('--convert-thumbnails', 'png');
    }
  }

  args.push('--embed-chapters');

  // Prevent one unavailable or age-restricted video from aborting entire playlist download
  if (isPlaylist) {
    args.push('--ignore-errors', '--no-abort-on-error');
  }

  if (timeRange && typeof timeRange === 'string' && timeRange.trim().length > 0) {
    const cleanRange = timeRange.startsWith('*') ? timeRange.trim() : `*${timeRange.trim()}`;
    args.push('--download-sections', cleanRange);
    args.push('--force-keyframes-at-cuts');
  }

  args.push('--', targetUrl);

  return args;
}

function startDownload(options, onProgress, onComplete, onError) {
  const { url, taskId = '' } = options;

  const cleanupCookies = () => {
    if (options.ephemeralCookiePath) {
      releaseEphemeralCookieFile(options.ephemeralCookiePath);
    }
  };

  if (typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    cleanupCookies();
    if (typeof onError === 'function') {
      onError(new Error('Invalid URL: must be an http(s) URL'));
    }
    return { kill: () => {} };
  }

  let isCancelled = false;
  let isAlreadyDownloaded = false;
  const args = buildDownloadArgs(options);
  if (downloaderLogger) {
    downloaderLogger('YT-DLP', `Task ${taskId} spawning: yt-dlp ${args.join(' ')}`, { taskId, isAudioOnly: options.isAudioOnly });
  }
  const proc = spawnYtDlp(args);
  if (downloaderLogger && proc.pid) {
    downloaderLogger('YT-DLP', `Task ${taskId} started with PID ${proc.pid}`, { taskId, pid: proc.pid });
  }
  let finalPath = '';
  let stderr = '';
  let playlistInfo = '';
  let currentTitle = '';

  proc.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    const lines = text.split(/[\r\n]+/);

    for (const line of lines) {
      if (!line) continue;

      if (line.includes('has already been downloaded')) {
        isAlreadyDownloaded = true;
        if (downloaderLogger) downloaderLogger('YT-DLP', `[${taskId}] Existing track detected: ${line}`, { taskId });
      } else if (downloaderLogger && (line.startsWith('video_title:') || line.includes('Destination:') || line.includes('ExtractAudio') || line.includes('Merger'))) {
        downloaderLogger('YT-DLP', `[${taskId}] ${line}`, { taskId });
      }

      // Capture video title from yt-dlp print template
      const titleMatch = line.match(/^video_title:(.+)$/);
      if (titleMatch) {
        currentTitle = titleMatch[1].trim();
        if (typeof onProgress === 'function') {
          onProgress({
            taskId,
            title: currentTitle,
            playlistInfo,
            line
          });
        }
      }

      // Track playlist item index if downloading a playlist
      const itemMatch = line.match(/\[download\]\s+Downloading\s+(?:item|video)\s+(\d+)\s+of\s+(\d+)/i);
      if (itemMatch) {
        playlistInfo = `Track ${itemMatch[1]}/${itemMatch[2]}`;
        if (typeof onProgress === 'function') {
          onProgress({
            taskId,
            title: currentTitle,
            playlistInfo,
            line
          });
        }
      }

      // Parse download progress:
      // Standard: [download]  42.5% of   50.12MiB at    5.12MiB/s ETA 00:05
      // Completed: [download] 100% of  314.82KiB in 00:00:00 at 954.90KiB/s
      const m1 = line.match(/\[download\]\s+([\d.]+)%\s+of\s+([~\w\d.]+)(?:\s+at\s+([~\w\d./]+|\w+\s+speed))?(?:\s+ETA\s+([~\w\d.:]+))?/i);
      const m2 = !m1 && line.match(/\[download\]\s+([\d.]+)%\s+of\s+([~\w\d.]+)\s+in\s+([\d:]+)(?:\s+at\s+([~\w\d./]+))?/i);
      const progMatch = m1 || m2;

      if (progMatch) {
        const percent = parseFloat(progMatch[1]);
        const total = progMatch[2];
        const speed = m1 ? (m1[3] || '') : (m2[4] || '');
        const eta = m1 ? (m1[4] || '') : (m2[3] || '');
        if (typeof onProgress === 'function') {
          onProgress({
            taskId,
            title: currentTitle,
            playlistInfo,
            percent,
            total,
            speed,
            eta: playlistInfo ? `${eta} (${playlistInfo})` : eta,
            line
          });
        }
      }

      // Capture final destination file (both newly merged/downloaded and already-downloaded files)
      const destMatch = line.match(/\[(?:Merger|download|ExtractAudio|Thumbnails|Subtitles)\]\s+.*?(?:Merging formats into|Destination:|into|Writing(?: video)? thumbnail to:|Writing video subtitles to:)\s+["']?([^"'\r\n]+\.(?:mkv|mp4|webm|mp3|m4a|flac|opus|png|jpg|webp|srt|vtt))["']?/i) ||
                        line.match(/\[download\]\s+["']?([^"'\r\n]+\.(?:mkv|mp4|webm|mp3|m4a|flac|opus|png|jpg|webp|srt|vtt))["']?\s+has already been downloaded/i) ||
                        line.match(/(?:Writing(?: video)? thumbnail to:|Writing video subtitles to:)\s+["']?([^"'\r\n]+\.(?:png|jpg|webp|srt|vtt))["']?/i);
      if (destMatch) {
        finalPath = destMatch[1];
        if (!currentTitle) {
          const fileBase = path.basename(destMatch[1]).replace(/\.[^.]+$/, '').replace(/\s*\[\d+p\]$/, '');
          if (fileBase) currentTitle = fileBase;
        }
      }
    }
  });

  proc.stderr.on('data', (chunk) => {
    const msg = chunk.toString();
    stderr += msg;
    const trimmed = msg.trim();
    if (trimmed) {
      console.warn('[yt-dlp stderr]:', trimmed);
      if (downloaderLogger) downloaderLogger('YT-DLP-STDERR', `[${taskId}] ${trimmed}`, { taskId });
    }
  });

  proc.on('error', (err) => {
    cleanupCookies();
    if (downloaderLogger) downloaderLogger('ERROR', `Task ${taskId} spawn error: ${err.message}`, { taskId, error: err.message });
    if (typeof onError === 'function') {
      onError(new Error(`Failed to launch download engine: ${err.message}`));
    }
  });

  proc.on('close', (code) => {
    cleanupCookies();
    if (isCancelled) {
      if (downloaderLogger) downloaderLogger('DOWNLOAD', `Task ${taskId} cancelled by user`, { taskId });
      if (typeof onError === 'function') {
        onError(new Error('Cancelled'));
      }
      return;
    }
    let subFolder = 'videos';
    if (options.isAudioOnly) subFolder = 'audios';
    else if (options.isThumbnailOnly) subFolder = 'thumbnails';
    else if (options.isSubtitlesOnly) subFolder = 'subtitles';
    const targetFolder = path.join(options.downloadDir || getDefaultDownloadDir(), subFolder);
    if (code === 0) {
      if (downloaderLogger) {
        downloaderLogger('DOWNLOAD', `Task ${taskId} finished successfully (alreadyDownloaded: ${isAlreadyDownloaded})`, { taskId, finalPath: finalPath || targetFolder, alreadyDownloaded: isAlreadyDownloaded });
      }
      if (typeof onComplete === 'function') {
        onComplete({ taskId, finalPath: finalPath || targetFolder, alreadyDownloaded: isAlreadyDownloaded });
      }
    } else {
      if (downloaderLogger) {
        downloaderLogger('ERROR', `Task ${taskId} exited with error code ${code}: ${stderr.trim()}`, { taskId, code, error: stderr.trim() });
      }
      if (typeof onError === 'function') {
        let errMessage = stderr.trim();
        if (/Sign in to confirm you'?re not a bot|bot challenge|HTTP Error 429|confirm you are not a bot/i.test(errMessage)) {
          errMessage = "YouTube anti-bot challenge: Please sign in to your YouTube account inside BroTube (click 'Sign in' at top right) to continue downloading.";
        }
        onError(new Error(errMessage || `Download exited with error code ${code}`));
      }
    }
  });

  return {
    kill: () => {
      isCancelled = true;
      cleanupCookies();
      if (process.platform === 'win32' && proc.pid) {
        try {
          const killer = spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F']);
          killer.on('error', () => { proc.kill(); });
        } catch {
          proc.kill();
        }
      } else {
        proc.kill();
      }
    }
  };
}

function updateYtDlp() {
  return new Promise((resolve, reject) => {
    const runner = resolveYtDlpRunner();
    let proc;
    if (runner.isStandalone) {
      proc = spawn(runner.command, ['-U']);
    } else {
      proc = spawn(runner.command, [...runner.argsPrefix, '-U']);
    }
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    proc.on('error', (err) => reject(new Error(`Failed to run update: ${err.message}`)));
    proc.on('close', (code) => {
      resolveYtDlpRunner(true);
      if (code === 0 || stdout.includes('is up to date') || stderr.includes('is up to date')) {
        resolve(stdout || stderr || 'yt-dlp engine updated successfully.');
      } else {
        reject(new Error(stderr.trim() || stdout.trim() || `Update failed with code ${code}`));
      }
    });
  });
}

async function clearDownloaderCache() {
  const cacheDirs = [
    path.join(os.homedir(), '.cache', 'yt-dlp'),
    path.join(process.env.LOCALAPPDATA || '', 'yt-dlp', 'cache')
  ];
  for (const dir of cacheDirs) {
    if (dir && fs.existsSync(dir)) {
      try {
        await fs.promises.rm(dir, { recursive: true, force: true });
      } catch {}
    }
  }

  // Purge stale unauthenticated cookie export if it has no active login
  const cookiePath = getDefaultCookiePath();
  if (fs.existsSync(cookiePath)) {
    try {
      const content = await fs.promises.readFile(cookiePath, 'utf8');
      const hasLogin = content.includes('LOGIN_INFO') || content.includes('SAPISID');
      if (!hasLogin) {
        await fs.promises.unlink(cookiePath);
      }
    } catch {}
  }

  return new Promise((resolve) => {
    const proc = spawnYtDlp(['--rm-cache-dir']);
    proc.on('close', () => resolve(true));
    proc.on('error', () => resolve(false));
  });
}

const activeConversionProcesses = new Set();

function convertMediaFile(inputPath, targetFormat = 'mp4', preset = 'quality') {
  return new Promise((resolve, reject) => {
    if (!inputPath || typeof inputPath !== 'string' || !fs.existsSync(inputPath)) {
      return reject(new Error('Input media file does not exist'));
    }
    const ffmpegDir = getFfmpegDir();
    const ffmpegExe = ffmpegDir ? path.join(ffmpegDir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg') : 'ffmpeg';
    const inputDir = path.dirname(inputPath);
    const inputBase = path.basename(inputPath, path.extname(inputPath));
    const suffix = inputBase.endsWith('_converted') ? '_remastered' : '_converted';
    let outputPath = path.join(inputDir, `${inputBase}${suffix}.${targetFormat}`);
    if (path.resolve(outputPath) === path.resolve(inputPath)) {
      outputPath = path.join(inputDir, `${inputBase}_${Date.now()}.${targetFormat}`);
    }

    const args = ['-y', '-threads', '2', '-i', inputPath];

    if (targetFormat === 'mp4') {
      if (preset === 'fast') {
        args.push('-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k');
      } else {
        args.push('-c:v', 'libx264', '-crf', '20', '-preset', 'fast', '-c:a', 'aac', '-b:a', '192k');
      }
    } else if (targetFormat === 'mkv') {
      args.push('-c', 'copy');
    } else if (targetFormat === 'mp3') {
      args.push('-vn', '-c:a', 'libmp3lame', '-b:a', '320k');
    } else if (targetFormat === 'flac') {
      args.push('-vn', '-c:a', 'flac');
    } else if (targetFormat === 'wav') {
      args.push('-vn', '-c:a', 'pcm_s16le');
    } else if (targetFormat === 'm4a') {
      args.push('-vn', '-c:a', 'aac', '-b:a', '256k');
    }

    args.push(outputPath);

    const proc = spawn(ffmpegExe, args);
    activeConversionProcesses.add(proc);
    let stderr = '';
    proc.stderr.on('data', (c) => { stderr += c.toString(); });
    proc.on('error', (err) => {
      activeConversionProcesses.delete(proc);
      reject(new Error(`Failed to launch conversion engine: ${err.message}`));
    });
    proc.on('close', (code) => {
      activeConversionProcesses.delete(proc);
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve({ success: true, outputPath });
      } else {
        reject(new Error(stderr.trim() || `Conversion failed with code ${code}`));
      }
    });
  });
}

function killActiveConversions() {
  activeConversionProcesses.forEach((proc) => {
    try {
      if (process.platform === 'win32' && proc.pid) {
        spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F']);
      } else {
        proc.kill();
      }
    } catch {}
  });
  activeConversionProcesses.clear();
}

module.exports = {
  getDefaultDownloadDir,
  getDefaultCookiePath,
  getDefaultEncryptedCookiePath,
  cleanVideoUrl,
  cleanPlaylistUrl,
  getBaseYtDlpArgs,
  formatNetscapeCookies,
  exportCookiesToFile,
  saveEncryptedCookies,
  acquireEphemeralCookieFile,
  releaseEphemeralCookieFile,
  cleanupOrphanedEphemeralCookies,
  encryptCookieData,
  decryptCookieData,
  importBrowserCookies,
  getVideoInfo,
  buildDownloadArgs,
  startDownload,
  updateYtDlp,
  clearDownloaderCache,
  getFfmpegDir,
  getUserBinDir,
  resolveYtDlpRunner,
  spawnYtDlp,
  downloadStandaloneYtDlp,
  convertMediaFile,
  killActiveConversions,
  setDownloaderLogger
};
