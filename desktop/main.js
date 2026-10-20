const { app, BrowserWindow, globalShortcut, session } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 960,
    minHeight: 640,
    title: 'Wavelength - Spotify Web Player',
    backgroundColor: '#121212',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#121212',
      symbolColor: '#ffffff',
      height: 36,
    },
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const appUrl = process.env.APP_URL || 'https://mohamednavith.github.io/Spotify-Craft/';
  const localOutHtml = path.join(__dirname, '..', 'frontend', 'out', 'index.html');
  const fs = require('fs');

  mainWindow.loadURL(appUrl).catch(() => {
    if (fs.existsSync(localOutHtml)) {
      mainWindow.loadFile(localOutHtml);
    }
  });

  // Global Media Key Shortcuts for Windows
  try {
    globalShortcut.register('MediaPlayPause', () => {
      mainWindow.webContents.send('media-control', 'play-pause');
    });

    globalShortcut.register('MediaNextTrack', () => {
      mainWindow.webContents.send('media-control', 'next');
    });

    globalShortcut.register('MediaPreviousTrack', () => {
      mainWindow.webContents.send('media-control', 'prev');
    });
  } catch (err) {
    console.warn('Could not register Windows media shortcuts:', err);
  }
}

app.whenReady().then(() => {
  // Ad-Free Media Engine: Intercept and drop all video advertising network requests
  if (session && session.defaultSession) {
    session.defaultSession.webRequest.onBeforeRequest(
      {
        urls: [
          '*://*.doubleclick.net/*',
          '*://*.googleads.g.doubleclick.net/*',
          '*://pagead2.googlesyndication.com/*',
          '*://*.youtube.com/pagead/*',
          '*://*.youtube.com/api/stats/ads*',
          '*://adservice.google.com/*',
          '*://*.googlesyndication.com/*',
          '*://*.pubads.g.doubleclick.net/*',
        ],
      },
      (details, callback) => {
        callback({ cancel: true });
      }
    );
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
