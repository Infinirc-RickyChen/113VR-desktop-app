const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 保持對視窗物件的全局引用，避免JavaScript垃圾回收時視窗關閉
let mainWindow;

function createWindow() {
  // 創建瀏覽器視窗
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: '光合之旅學習歷程數據分析平台',
    backgroundColor: '#f5f5f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    titleBarStyle: 'hiddenInset', // macOS上有更好的外觀
    frame: false, // 無框架視窗
    transparent: true, // 視窗透明
    vibrancy: 'under-window', // macOS上的毛玻璃效果
    visualEffectState: 'active',
    roundedCorners: true // 啟用圓角
  });

  // 載入應用的index.html
  mainWindow.loadFile('index.html');

  // 當視窗關閉時觸發
  mainWindow.on('closed', function () {
    // 取消引用視窗物件
    mainWindow = null;
  });

  // 處理視窗控制
  ipcMain.on('window-controls', (event, command) => {
    switch (command) {
      case 'minimize':
        mainWindow.minimize();
        break;
      case 'maximize':
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
        break;
      case 'close':
        mainWindow.close();
        break;
    }
  });

  // 處理檔案上傳
  ipcMain.handle('upload-file', async (event) => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Text Files', extensions: ['txt'] }
      ]
    });
    
    if (!result.canceled) {
      const fileContents = await Promise.all(
        result.filePaths.map(async (filePath) => {
          const content = await fs.promises.readFile(filePath, 'utf8');
          return {
            filePath,
            fileName: path.basename(filePath),
            content
          };
        })
      );
      return fileContents;
    }
    return [];
  });

  // 讀取CSV檔案
  ipcMain.handle('read-csv', async (event, csvPath) => {
    try {
      const csvContent = await fs.promises.readFile(path.join(__dirname, csvPath), 'utf8');
      return csvContent;
    } catch (error) {
      console.error('Error reading CSV:', error);
      return null;
    }
  });
}

// 當Electron完成初始化並準備創建瀏覽器視窗時調用此方法
app.whenReady().then(() => {
  createWindow();

  // 在macOS上，當dock圖標被點擊且沒有其他視窗打開時，通常會重新創建一個視窗
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 當所有視窗關閉時退出應用，macOS除外
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});