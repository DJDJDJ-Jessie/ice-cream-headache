# Windows 10/11 迁移说明

这个分支的目标是把现有 QQ 宠物网页/Ruffle 版本做成能在 Windows 10 和 Windows 11 上直接运行的本地程序。

## 当前启动方式

安装依赖：

```powershell
npm install
```

如果 Electron 下载失败，可以临时使用国内镜像后再安装：

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
npm install
```

启动桌面版：

```powershell
npm run start:desktop
```

只用浏览器预览：

```powershell
npm run serve:web
```

然后打开：

```text
http://127.0.0.1:5173/
```

打包 Windows 程序：

```powershell
npm run build:win
```

打包后会生成：

```text
dist/QQPet 0.1.0.exe
dist/win-unpacked/QQPet.exe
```

## 当前方案

现阶段先采用 Electron 做 Windows 外壳，内部仍然加载现有的 React 页面、Ruffle 运行时和 SWF 资源。这样可以先绕开虚拟 XP 和旧版 Flash 依赖，让同一套资源在 Win10/Win11 的现代 Chromium 内核里运行。

## 后续迁移路线

1. 确认现有网页版的所有入口：主宠物、企鹅动作资源、钓鱼小游戏和 `sub` 里的 LayaAir 版本。
2. 把桌面窗口改造成更接近原 QQ 宠物的形态：透明背景、置顶、无边框、可拖拽、托盘菜单。
3. 梳理 `Penguin/GG` 下的 SWF 动作，建立动作清单和状态机。
4. 把饥饿、清洁、成长、心情、事件触发、学习、打工、看病等逻辑从网页状态升级为本地持久化数据。
5. 逐步替换或补齐原版 QQ 企鹅 UI、提示气泡、音效和交互流程。
6. 打包成 Windows 可执行文件，分别在 Windows 10 和 Windows 11 上验证。
