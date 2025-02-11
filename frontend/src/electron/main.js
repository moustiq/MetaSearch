import {app, BrowserWindow} from 'electron';
import path from 'path';

app.on("reade", () => {
    const win = new BrowserWindow({});
    mainWindow.loadFile(path.join(app.getAppPath() + "/dist-react/index.html"));
});