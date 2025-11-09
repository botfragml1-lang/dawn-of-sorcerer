// preload.js
// Expose minimal, secure API if needed in future.
const { contextBridge } = require('electron')
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform
})