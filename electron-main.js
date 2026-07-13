const { app, BrowserWindow, shell, screen } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const windowWidth = Math.min(Math.round(screenWidth * 0.88), 1500);
  const windowHeight = Math.min(Math.round(screenHeight * 0.88), 960);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 950,
    minHeight: 600,
    center: true,
    icon: path.join(__dirname, 'build/icon.png'),
    titleBarStyle: 'hiddenInset', // macOS sleek sleek glass look with traffic lights
    backgroundColor: '#0a0d14',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Try loading local dev server or production build
  const checkServer = (url, retries = 15) => {
    http.get(url, () => {
      mainWindow.loadURL(url);
    }).on('error', () => {
      if (retries > 0) {
        setTimeout(() => checkServer(url, retries - 1), 500);
      } else {
        // Load production dist file if dev server not running
        mainWindow.loadFile(path.join(__dirname, 'client/dist/index.html'));
      }
    });
  };

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'client/dist/index.html'));
  } else {
    checkServer('http://localhost:5173');
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    try {
      require('./server/server.js');
    } catch (err) {
      console.error('Failed to start embedded server:', err);
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
