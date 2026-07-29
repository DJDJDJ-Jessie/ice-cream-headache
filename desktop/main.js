const fs = require("fs");
const http = require("http");
const path = require("path");
const { app, BrowserWindow, Menu, shell } = require("electron");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".cur": "image/x-icon",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".swf": "application/x-shockwave-flash",
  ".wasm": "application/wasm",
  ".map": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

let staticServer;

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
    let targetPath = path.resolve(root, `.${urlPath === "/" ? "/index.html" : urlPath}`);

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

function createMenu() {
  const template = [
    {
      label: "QQPet",
      submenu: [
        { role: "reload", label: "重新加载" },
        { type: "separator" },
        { role: "quit", label: "退出" },
      ],
    },
    {
      label: "查看",
      submenu: [
        { role: "toggleDevTools", label: "开发者工具" },
        { role: "resetZoom", label: "实际大小" },
        { role: "zoomIn", label: "放大" },
        { role: "zoomOut", label: "缩小" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  const assetRoot = getAssetRoot();
  staticServer = createStaticServer(assetRoot);
  const port = await listen(staticServer);

  createMenu();

  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 900,
    minHeight: 640,
    title: "QQPet",
    icon: path.join(assetRoot, "build", "icon.png"),
    backgroundColor: "#ffffff",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  await win.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (staticServer) {
    staticServer.close();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
