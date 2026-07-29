const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("qqPetDesktop", {
  moveBy: (delta) => ipcRenderer.invoke("pet:move-by", delta),
  getBounds: () => ipcRenderer.invoke("pet:get-bounds"),
  showMenu: () => ipcRenderer.invoke("pet:show-menu"),
  onCommand: (callback) => {
    const listener = (_event, command) => callback(command);
    ipcRenderer.on("pet:command", listener);
    return () => ipcRenderer.off("pet:command", listener);
  },
});
