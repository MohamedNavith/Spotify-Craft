const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: 'win32',
  onMediaControl: (callback) =>
    ipcRenderer.on('media-control', (_event, action) => callback(action)),
});
