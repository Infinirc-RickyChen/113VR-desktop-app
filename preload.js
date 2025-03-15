const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API給渲染進程
contextBridge.exposeInMainWorld('electronAPI', {
  // 視窗控制
  windowControls: {
    minimize: () => ipcRenderer.send('window-controls', 'minimize'),
    maximize: () => ipcRenderer.send('window-controls', 'maximize'),
    close: () => ipcRenderer.send('window-controls', 'close')
  },
  
  // 檔案處理
  uploadFiles: () => ipcRenderer.invoke('upload-file'),
  readCSV: (csvPath) => ipcRenderer.invoke('read-csv', csvPath),
  
  // 版本資訊
  getAppVersion: () => process.env.npm_package_version || '1.0.0',
  
  // 系統資訊
  getPlatform: () => process.platform
});

// 在DOM內容加載完成後執行
window.addEventListener('DOMContentLoaded', () => {
  // 添加平台類別以便於CSS樣式區分
  document.body.classList.add(`platform-${process.platform}`);
});