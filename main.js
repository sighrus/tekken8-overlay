const { app, BrowserWindow, screen } = require('electron');

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const winWidth = 460;
  const winHeight = 320;

  const win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: width - winWidth - 20,
    y: height - winHeight - 20,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 'screen-saver' level keeps this above fullscreen/borderless games on
  // both macOS and Windows, not just other regular windows.
  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadFile('renderer/index.html');

  // Click-through (so clicks/focus pass to the game underneath) is left off
  // during dev so the window can be inspected/moved. Flip on for real use:
  // win.setIgnoreMouseEvents(true, { forward: true });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
