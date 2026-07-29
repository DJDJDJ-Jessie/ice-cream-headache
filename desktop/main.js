const fs = require("fs");
const http = require("http");
const path = require("path");
const { app, BrowserWindow, Menu, Tray, ipcMain, screen } = require("electron");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".swf": "application/x-shockwave-flash",
  ".wasm": "application/wasm",
  ".map": "application/json; charset=utf-8",
};

let tray;
let staticServer;
let petWindow;
let actionViewerWindow;

function getAssetRoot() {
  return path.resolve(__dirname, "..");
}

function isInsideRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function createStaticServer(root) {
  return http.createServer((request, response) => {
    const rawPath = (request.url || "/").split("?")[0];
    const urlPath = decodeURIComponent(rawPath);
    let targetPath = path.resolve(root, `.${urlPath === "/" ? "/desktop/pet.html" : urlPath}`);

    if (!isInsideRoot(root, targetPath)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.stat(targetPath, (statError, stats) => {
      if (!statError && stats.isDirectory()) {
        targetPath = path.join(targetPath, "index.html");
      }

      fs.readFile(targetPath, (readError, data) => {
        if (readError) {
          response.writeHead(404);
          response.end("Not found");
          return;
        }

        const contentType = MIME_TYPES[path.extname(targetPath).toLowerCase()] || "application/octet-stream";
        response.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "no-store",
        });
        response.end(data);
      });
    });
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve(server.address().port);
    });
  });
}

function statePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function getSavedBounds() {
  try {
    return JSON.parse(fs.readFileSync(statePath(), "utf8"));
  } catch {
    return null;
  }
}

function saveBounds(bounds) {
  fs.mkdirSync(path.dirname(statePath()), { recursive: true });
  fs.writeFileSync(statePath(), JSON.stringify(bounds, null, 2));
}

function clampBounds(bounds) {
  const display = screen.getDisplayMatching(bounds);
  const area = display.workArea;
  const width = bounds.width || 280;
  const height = bounds.height || 340;
  const x = Math.min(Math.max(bounds.x, area.x), area.x + area.width - width);
  const y = Math.min(Math.max(bounds.y, area.y), area.y + area.height - height);
  return { ...bounds, width, height, x, y };
}

function sendPetCommand(command) {
  if (petWindow) {
    petWindow.webContents.send("pet:command", command);
  }
}

function createTray(iconPath) {
  tray = new Tray(iconPath);
  tray.setToolTip("QQ Penguin");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "显示企鹅",
        click: () => {
          petWindow?.show();
          petWindow?.focus();
        },
      },
      {
        label: "隐藏企鹅",
        click: () => petWindow?.hide(),
      },
      { type: "separator" },
      { label: "退出", click: () => app.quit() },
    ]),
  );
}

function showPetMenu() {
  Menu.buildFromTemplate([
    { label: "喂食", click: () => sendPetCommand("feed") },
    { label: "喝水", click: () => sendPetCommand("drink") },
    { label: "清洁", click: () => sendPetCommand("clean") },
    { label: "逗宠", click: () => sendPetCommand("play") },
    { type: "separator" },
    { label: "学习", click: () => sendPetCommand("study") },
    { label: "打工", click: () => sendPetCommand("work") },
    { label: "吃药", click: () => sendPetCommand("medicine") },
    { type: "separator" },
    { label: "状态", click: () => sendPetCommand("status") },
    { label: "隐藏", click: () => petWindow?.hide() },
    { type: "separator" },
    { label: "退出", click: () => app.quit() },
  ]).popup({ window: petWindow });
}

function registerIpc() {
  ipcMain.handle("pet:move-by", (_event, delta) => {
    if (!petWindow) {
      return null;
    }

    const bounds = petWindow.getBounds();
    const nextBounds = clampBounds({
      ...bounds,
      x: bounds.x + Math.round(delta.x || 0),
      y: bounds.y + Math.round(delta.y || 0),
    });
    petWindow.setBounds(nextBounds);
    saveBounds(nextBounds);
    return nextBounds;
  });

  ipcMain.handle("pet:get-bounds", () => ({
    window: petWindow?.getBounds(),
    workArea: screen.getPrimaryDisplay().workArea,
  }));

  ipcMain.handle("pet:show-menu", () => {
    showPetMenu();
  });
}

async function createPetWindow() {
  const assetRoot = getAssetRoot();
  const iconPath = path.join(assetRoot, "desktop", "assets", "icon.png");

  staticServer = createStaticServer(assetRoot);
  const port = await listen(staticServer);

  createTray(iconPath);

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const defaultBounds = {
    width: 280,
    height: 340,
    x: Math.max(0, width - 330),
    y: Math.max(0, height - 390),
  };
  const initialBounds = clampBounds(getSavedBounds() || defaultBounds);

  petWindow = new BrowserWindow({
    ...initialBounds,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: "#00000000",
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  petWindow.setAlwaysOnTop(true, "screen-saver");
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.on("moved", () => saveBounds(petWindow.getBounds()));
  await petWindow.loadURL(`http://127.0.0.1:${port}/desktop/pet.html`);
}

async function createActionViewerWindow() {
  const assetRoot = getAssetRoot();
  staticServer = createStaticServer(assetRoot);
  const port = await listen(staticServer);

  actionViewerWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 760,
    minHeight: 560,
    title: "QQ Penguin Action Viewer",
    backgroundColor: "#f4f7fb",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await actionViewerWindow.loadURL(`http://127.0.0.1:${port}/desktop/action-viewer.html`);
}

app.whenReady().then(() => {
  if (process.argv.includes("--actions")) {
    createActionViewerWindow();
    return;
  }

  registerIpc();
  createPetWindow();
});

app.on("window-all-closed", () => {
  if (staticServer) {
    staticServer.close();
  }
  app.quit();
});

app.on("before-quit", () => {
  if (staticServer) {
    staticServer.close();
  }
});
