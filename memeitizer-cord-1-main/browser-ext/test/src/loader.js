function sendData(data, eventName = "cumcord-ipc") {
  const ccEvent = new CustomEvent(eventName, {
    detail: data
  });
  return window.dispatchEvent(ccEvent);
}
function initializeContentIPC() {
  log(["Initializing content script IPC"], "ipc");
  let port;
  window.addEventListener("cumload", (event) => {
    if (event.detail.action && event.detail.action == "CUMCORD_LOADED" && !port) {
      port = chrome.runtime.connect({ name: "discord-" + randomUUID() });
      port.onMessage.addListener((e) => window.postMessage(e, "*"));
    } else if (port) {
      port.postMessage(event.detail);
    }
  }, false);
}
function initializePageIPC() {
  log(["Initializing page IPC"], "ipc");
  const orders = /* @__PURE__ */ new Map();
  window.addEventListener("message", (event) => {
    if (event.data.type) {
      if (event.data.type === "cumcord-ipc") {
        cumcord.websocket.triggerHandler(JSON.stringify(event.data), (data) => sendData(JSON.parse(data), "cumload"));
      } else if (event.data.type === "cumcord-sync") {
        if (event.data.action === "PLUGIN_SET") {
          if (cumcord.plugins.installed.ghost[event.data.url] == null) {
            orders.set(event.data.url);
            cumcord.plugins.importPlugin(event.data.url);
          } else if (event.data.enabled !== void 0 && event.data.enabled !== cumcord.plugins.installed.ghost[event.data.url].enabled) {
            orders.set(event.data.url);
            cumcord.plugins.togglePlugin(event.data.url);
          }
        } else if (event.data.action === "PLUGIN_DELETE" && cumcord.plugins.installed.ghost[event.data.url] !== null) {
          orders.set(event.data.url);
          cumcord.plugins.removePlugin(event.data.url);
        } else if (event.data.action === "PLUGIN_IDB") {
          setTimeout(() => {
            orders.set(event.data.url);
            cumcord.plugins.togglePlugin(event.data.url);
            orders.set(event.data.url);
            cumcord.plugins.togglePlugin(event.data.url);
          }, 50);
        }
      }
    }
  });
  function handlePluginUpdate(action, data) {
    const [url] = data.path;
    if (orders.has(url))
      return orders.delete(url);
    let toSend = {
      type: "cumcord-sync",
      action: `PLUGIN_${action}`,
      url
    };
    if (data.path.length == 2) {
      toSend[data.path[1]] = data.value;
    }
    return sendData(toSend, "cumload");
  }
  cumcord.plugins.installed.on("SET", handlePluginUpdate);
  cumcord.plugins.installed.on("DELETE", handlePluginUpdate);
  cumcord.patcher.after("set", cumcord.modules.internal.idbKeyval, ([child, data]) => {
    if (child.endsWith("_CUMCORD_STORE") && isURLValid(child)) {
      sendData({
        type: "cumcord-sync",
        action: "PLUGIN_IDB",
        url: child.replace(/_CUMCORD_STORE$/, "")
      }, "cumload");
    }
  });
  sendData({
    action: "CUMCORD_LOADED"
  }, "cumload");
}

initializeContentIPC();
injectScriptTag(() => {
  log(["Waiting for inject time..."]);
  waitForDiscordToLoad().then(async () => {
    log(["Injecting Cumcord"]);
    injectScriptTag(await (await fetch("https://raw.githubusercontent.com/Cumcord/builds/main/build.js")).text());
    await cumcord.cum();
    initializePageIPC();
  }).catch((e) => {
    log(["Cumcord will not be injected", "\n", e], "error");
  });
}, [...loaderContext, injectScriptTag, sendData, initializePageIPC]);
