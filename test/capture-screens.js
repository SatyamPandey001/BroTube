const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-gpu-watchdog');

// IPC mocks
ipcMain.handle('get-default-download-dir', () => 'C:\\Users\\GAURI\\Videos\\BroTube');
ipcMain.handle('get-debug-mode', () => false);
ipcMain.handle('check-active-tasks', () => ({ count: 0 }));
ipcMain.handle('sync-cookies', () => ({ success: true, count: 18 }));

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
    width: 1360,
    height: 860,
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

  win.webContents.on('console-message', (e, level, msg) => {
    console.log('[Renderer]', msg);
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'renderer', 'index.html'));

  // 1. Splash Screen
  console.log('Capturing Splash Screen...');
  await sleep(1000);
  await capture(win, '01-splash-screen.png');

  // Wait for splash fade out
  console.log('Waiting for splash fade-out...');
  await sleep(2800);

  // 2. Main Interface
  console.log('Capturing Main Interface...');
  await capture(win, '02-main-interface.png');

  // 3. Pro Download Modal
  console.log('Capturing Download Modal...');
  await win.webContents.executeJavaScript(`
    try {
      const modal = document.getElementById('pro-modal');
      const modalLoading = document.getElementById('modal-loading');
      const modalContent = document.getElementById('modal-content');
      const previewTitle = document.getElementById('preview-title');
      const previewChannel = document.getElementById('preview-channel');
      const previewDuration = document.getElementById('preview-duration');

      if (modal && modalContent) {
        if (modalLoading) modalLoading.classList.add('hidden');
        modalContent.classList.remove('hidden');
        if (previewTitle) previewTitle.textContent = 'Cyberpunk 2077 - Official 8K Ultra HDR Showcase Gameplay';
        if (previewChannel) previewChannel.textContent = 'CD PROJEKT RED • 4.2M views';
        if (previewDuration) previewDuration.textContent = '14m 28s';
        modal.classList.remove('hidden');
      }
    } catch (e) {
      console.error(e);
    }
  `);
  await sleep(800);
  await capture(win, '03-download-modal.png');

  // Reset Modal
  await win.webContents.executeJavaScript(`
    try {
      const modal = document.getElementById('pro-modal');
      if (modal) modal.classList.add('hidden');
    } catch (e) {}
  `);
  await sleep(400);

  // 4. Settings Popover & Audio DSP
  console.log('Capturing Settings Popover (Audio DSP)...');
  await win.webContents.executeJavaScript(`
    try {
      const btn = document.getElementById('btn-settings-toggle');
      if (btn) btn.click();
      setTimeout(() => {
        const audioTab = document.querySelector('.settings-nav-tab[data-tab="audio"]');
        if (audioTab) audioTab.click();
      }, 100);
    } catch (e) {
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
    } catch (e) {}
  `);
  await sleep(400);

  // 5. Downloads Hub Drawer
  console.log('Capturing Downloads Hub Drawer...');
  await win.webContents.executeJavaScript(`
    try {
      const drawerBtn = document.getElementById('btn-drawer-toggle');
      if (drawerBtn) drawerBtn.click();
      const list = document.getElementById('drawer-downloads-list');
      if (list) {
        list.innerHTML = \`
          <div class="dl-item active">
            <div class="dl-item-thumb">
              <img src="assets/installerSplash.bmp" alt="Thumb" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">
            </div>
            <div class="dl-item-info">
              <div class="dl-item-title">Hans Zimmer - Interstellar Main Theme (Live in Prague 4K)</div>
              <div class="dl-item-meta">
                <span class="dl-badge-quality">2160p 4K HDR</span>
                <span class="dl-speed">14.8 MB/s</span>
                <span class="dl-eta">ETA: 00:32</span>
              </div>
              <div class="dl-progress-bar">
                <div class="dl-progress-fill" style="width: 68%;"></div>
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
                <span class="dl-badge-quality">Lossless FLAC</span>
                <span class="dl-size">82.4 MB</span>
                <span class="dl-status-done">Completed</span>
              </div>
            </div>
          </div>
        \`;
      }
    } catch (e) {
      console.error(e);
    }
  `);
  await sleep(800);
  await capture(win, '05-downloads-hub.png');

  console.log('All screenshots captured successfully!');
  win.destroy();
  app.quit();
  process.exit(0);
});
