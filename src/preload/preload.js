const { contextBridge, ipcRenderer } = require('electron');

// Expose safe API to host HUD renderer
contextBridge.exposeInMainWorld('broTube', {
  getVideoInfo: (url) => ipcRenderer.invoke('get-video-info', url),
  startDownload: (options) => ipcRenderer.invoke('start-download', options),
  cancelDownload: (taskId) => ipcRenderer.invoke('cancel-download', taskId),
  getDefaultDownloadDir: () => ipcRenderer.invoke('get-default-download-dir'),
  selectDownloadDir: () => ipcRenderer.invoke('select-download-dir'),
  openFolder: (dir) => ipcRenderer.invoke('open-folder', dir),
  updateYtDlp: () => ipcRenderer.invoke('update-yt-dlp'),
  syncCookies: () => ipcRenderer.invoke('sync-cookies'),
  logoutSession: () => ipcRenderer.invoke('logout-session'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  confirmExit: () => ipcRenderer.send('confirm-exit'),
  checkActiveTasks: () => ipcRenderer.invoke('check-active-tasks'),
  togglePiP: () => ipcRenderer.send('toggle-pip'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  setLanguage: (lang) => ipcRenderer.invoke('set-language', lang),
  openExternal: (url) => ipcRenderer.invoke('open-external-url', url),
  convertMedia: (opts) => ipcRenderer.invoke('convert-media', opts),
  selectFile: () => ipcRenderer.invoke('select-file'),
  getDebugMode: () => ipcRenderer.invoke('get-debug-mode'),
  setDebugMode: (enabled) => ipcRenderer.invoke('set-debug-mode', enabled),
  getDebugLogs: () => ipcRenderer.invoke('get-debug-logs'),
  clearDebugLogs: () => ipcRenderer.invoke('clear-debug-logs'),
  scanDebugLogs: () => ipcRenderer.invoke('scan-debug-logs'),
  onDebugLog: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('debug-log', handler);
    return () => ipcRenderer.removeListener('debug-log', handler);
  },
  onDownloadProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },
  onDownloadComplete: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-complete', handler);
    return () => ipcRenderer.removeListener('download-complete', handler);
  },
  onAdBlocked: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('ad-blocked', handler);
    return () => ipcRenderer.removeListener('ad-blocked', handler);
  },
  onMaximizedState: (callback) => {
    const handler = (event, isMax) => callback(isMax);
    ipcRenderer.on('window-maximized-state', handler);
    return () => ipcRenderer.removeListener('window-maximized-state', handler);
  },
  onShowExitModal: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('show-exit-modal', handler);
    return () => ipcRenderer.removeListener('show-exit-modal', handler);
  }
});
