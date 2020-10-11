const { app, BrowserWindow } = require("electron");

let createWindow = async () => {
    const window = new BrowserWindow({
        width: 1080,
        height: 720,
        minWidth: 1080,
        minHeight: 720,
        backgroundColor: '#333333',
        frame: false,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true
        }
    })
    window.loadFile("./app/index.html");
}

app.whenReady().then(createWindow);
