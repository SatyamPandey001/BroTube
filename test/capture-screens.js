const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-gpu-watchdog');
app.commandLine.appendSwitch('disable-direct-composition-video-overlays');

// Mock all IPC handlers to prevent any console/handler errors
ipcMain.handle('get-default-download-dir', () => 'C:\\Users\\GAURI\\Videos\\BroTube');
ipcMain.handle('get-debug-mode', () => false);
ipcMain.handle('set-debug-mode', () => true);
ipcMain.handle('get-debug-logs', () => []);
ipcMain.handle('scan-debug-logs', () => ({ logs: [] }));
ipcMain.handle('set-theme', () => true);
ipcMain.handle('set-language', () => true);
ipcMain.handle('check-active-tasks', () => ({ count: 0 }));
ipcMain.handle('sync-cookies', () => ({ success: true, count: 24 }));
ipcMain.handle('open-external-url', () => true);
ipcMain.handle('select-download-dir', () => 'C:\\Users\\GAURI\\Videos\\BroTube');
ipcMain.handle('open-folder', () => true);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture(win, filename) {
  const image = await win.webContents.capturePage();
  const filePath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filePath, image.toPNG());
  console.log(`Saved screenshot: ${filename} (${image.getSize().width}x${image.getSize().height})`);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 880,
    frame: false,
    backgroundColor: '#0c0e17',
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'preload', 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false
    },
    show: true
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'renderer', 'index.html'));

  // 1. Capture Splash Screen
  console.log('Capturing 01-splash-screen.png...');
  await sleep(1000);
  await capture(win, '01-splash-screen.png');

  // Now dismiss splash screen and ACCEPT EULA permanently!
  console.log('Dismissing splash screen and dismissing EULA modal...');
  await win.webContents.executeJavaScript(`
    try {
      localStorage.setItem('brotube_eula_v1_accepted', 'true');
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.classList.add('fade-out');
        splash.style.display = 'none';
      }
      const eula = document.getElementById('eula-modal');
      if (eula) {
        eula.classList.add('hidden');
        eula.style.display = 'none';
      }
      const kofi = document.getElementById('kofi-modal');
      if (kofi) kofi.classList.add('hidden');
    } catch(e) {
      console.error(e);
    }
  `);

  // Allow webview to load YouTube feed
  console.log('Waiting 5 seconds for YouTube interface to render...');
  await sleep(5000);

  // Guarantee EULA is completely gone before taking main interface shot
  await win.webContents.executeJavaScript(`
    const eula = document.getElementById('eula-modal');
    if (eula) {
      eula.classList.add('hidden');
      eula.style.display = 'none';
    }
  `);

  // 2. Capture Main Interface
  console.log('Capturing 02-main-interface.png...');
  await capture(win, '02-main-interface.png');

  // 3. Configure and Capture Pro Download Modal
  console.log('Triggering and capturing 03-download-modal.png...');
  await win.webContents.executeJavaScript(`
    try {
      const eula = document.getElementById('eula-modal');
      if (eula) { eula.classList.add('hidden'); eula.style.display = 'none'; }

      const modal = document.getElementById('pro-modal');
      const modalLoading = document.getElementById('modal-loading');
      const modalContent = document.getElementById('modal-content');
      const previewThumb = document.getElementById('preview-thumb');
      const previewTitle = document.getElementById('preview-title');
      const previewChannel = document.getElementById('preview-channel');
      const previewDuration = document.getElementById('preview-duration');

      if (modal && modalContent) {
        if (modalLoading) modalLoading.classList.add('hidden');
        modalContent.classList.remove('hidden');
        if (previewTitle) previewTitle.textContent = 'Cyberpunk 2077 - Official 8K Ultra HDR Next-Gen Gameplay';
        if (previewChannel) previewChannel.textContent = 'CD PROJEKT RED • 4.8M views';
        if (previewDuration) previewDuration.textContent = '14m 28s';
        if (previewThumb) {
          previewThumb.src = 'assets/installerSplash.bmp';
          previewThumb.style.display = 'block';
        }
        modal.classList.remove('hidden');
      }
    } catch(e) {
      console.error(e);
    }
  `);
  await sleep(800);
  await capture(win, '03-download-modal.png');

  // Close Download Modal
  await win.webContents.executeJavaScript(`
    try {
      const modal = document.getElementById('pro-modal');
      if (modal) modal.classList.add('hidden');
    } catch(e) {}
  `);
  await sleep(400);

  // 4. Capture Settings Popover (Audio DSP)
  console.log('Capturing 04-audio-dsp-settings.png...');
  await win.webContents.executeJavaScript(`
    try {
      const eula = document.getElementById('eula-modal');
      if (eula) { eula.classList.add('hidden'); eula.style.display = 'none'; }

      const pop = document.getElementById('settings-popover');
      if (pop) {
        pop.classList.remove('hidden');
        document.querySelectorAll('.settings-nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.settings-tab-panel').forEach(p => p.classList.remove('active'));
        const audioTab = document.querySelector('.settings-nav-tab[data-tab="audio"]');
        const audioPanel = document.getElementById('settings-panel-audio');
        if (audioTab) audioTab.classList.add('active');
        if (audioPanel) audioPanel.classList.add('active');
      }
    } catch(e) {
      console.error(e);
    }
  `);
  await sleep(800);
  await capture(win, '04-audio-dsp-settings.png');

  // Close Settings Popover
  await win.webContents.executeJavaScript(`
    try {
      const pop = document.getElementById('settings-popover');
      if (pop) pop.classList.add('hidden');
    } catch(e) {}
  `);
  await sleep(400);

  // 5. Capture Downloads Hub Drawer
  console.log('Capturing 05-downloads-hub.png...');
  await win.webContents.executeJavaScript(`
    try {
      const eula = document.getElementById('eula-modal');
      if (eula) { eula.classList.add('hidden'); eula.style.display = 'none'; }

      const drawer = document.getElementById('download-drawer');
      const backdrop = document.getElementById('drawer-backdrop');
      const list = document.getElementById('drawer-downloads-list');
      if (drawer) {
        drawer.classList.remove('closed');
        if (backdrop) backdrop.classList.remove('hidden');
        if (list) {
          list.innerHTML = \`
            <div class="dl-item active">
              <div class="dl-item-thumb">
                <img src="assets/installerSplash.bmp" alt="Thumb" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">
              </div>
              <div class="dl-item-info">
                <div class="dl-item-title">Hans Zimmer - Interstellar Live in Prague (Official 4K HDR)</div>
                <div class="dl-item-meta">
                  <span class="dl-badge-quality">2160p 4K HDR</span>
                  <span class="dl-speed" style="color:#06b6d4;">⚡ 18.4 MB/s</span>
                  <span class="dl-eta">ETA: 00:24</span>
                </div>
                <div class="dl-progress-bar" style="margin-top:6px;">
                  <div class="dl-progress-fill" style="width: 74%; background: linear-gradient(90deg, #ec4899, #8b5cf6);"></div>
                </div>
              </div>
            </div>
            <div class="dl-item completed">
              <div class="dl-item-thumb">
                <img src="assets/installerSidebar.bmp" alt="Thumb" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">
              </div>
              <div class="dl-item-info">
                <div class="dl-item-title">Pink Floyd - Comfortably Numb (Pulse 1994 Remastered)</div>
                <div class="dl-item-meta">
                  <span class="dl-badge-quality" style="background:rgba(16,185,129,0.2);color:#34d399;">Lossless FLAC</span>
                  <span class="dl-size">84.2 MB</span>
                  <span class="dl-status-done" style="color:#34d399;font-weight:600;">✓ Completed</span>
                </div>
              </div>
            </div>
          \`;
        }
      }
    } catch(e) {
      console.error(e);
    }
  `);
  await sleep(800);
  await capture(win, '05-downloads-hub.png');

  console.log('All 5 screenshots recaptured without EULA!');
  win.destroy();
  app.quit();
  process.exit(0);
});
