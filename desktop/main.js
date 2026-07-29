const fs = require("fs");
const http = require("http");
const path = require("path");
const { app, BrowserWindow, Menu, Tray } = require("electron");

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

function createTray(iconPath) {
  tray = new Tray(iconPath);
  tray.setToolTip("QQ Penguin");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "显示企鹅",
        click: () => {
          if (petWindow) {
            petWindow.show();
            petWindow.focus();
          }
        },
      },
      {
        label: "隐藏企鹅",
        click: () => {
          if (petWindow) {
            petWindow.hide();
          }
        },
      },
      { type: "separator" },
      { label: "退出", click: () => app.quit() },
    ]),
  );
}

async function createPetWindow() {
  const assetRoot = getAssetRoot();
  const iconPath = path.join(assetRoot, "desktop", "assets", "icon.png");

  staticServer = createStaticServer(assetRoot);
  const port = await listen(staticServer);

  createTray(iconPath);

  const { width, height } = require("electron").screen.getPrimaryDisplay().workAreaSize;

  petWindow = new BrowserWindow({
    width: 260,
    height: 300,
    x: Math.max(0, width - 310),
    y: Math.max(0, height - 350),
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
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  petWindow.setAlwaysOnTop(true, "screen-saver");
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  await petWindow.loadURL(`http://127.0.0.1:${port}/desktop/pet.html`);
}

app.whenReady().then(createPetWindow);

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
