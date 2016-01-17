'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({width: 1200, height: 800});
  mainWindow.loadURL('file://' + __dirname + '/front/index.html');

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', e => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
