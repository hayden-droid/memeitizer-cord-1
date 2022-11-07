var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
function initializeBackgroundIPC() {
  log(["Initializing background IPC"], "ipc");
  let ports = {
    website: {},
    discord: {}
  };
  chrome.runtime.onConnect.addListener((port) => {
    let portSpace = port.name.split("-")[0];
    log(["New", portSpace, "connected", port], "ipc");
    ports[portSpace][port.name] = port;
    port.onDisconnect.addListener(() => delete ports[portSpace][port.name]);
    if (portSpace === "website") {
      port.onMessage.addListener((msg) => {
        var _a;
        if (Object.keys(ports.discord).length > 0) {
          Object.values(ports.discord).at(-1).postMessage(__spreadProps(__spreadValues({}, msg), {
            type: "cumcord-ipc",
            uuid: `${port.name}|${(_a = msg.uuid) != null ? _a : randomUUID()}`
          }));
        } else {
          port.postMessage({ status: "ERROR", name: "CUMLOAD_NO_DISCORD" });
        }
      });
    } else if (portSpace === "discord") {
      port.onMessage.addListener((msg) => {
        if (msg.type === "cumcord-sync") {
          Object.values(ports.discord).filter((e) => e.name !== port.name).forEach((e) => e.postMessage(msg));
        } else {
          let website = msg.uuid.split("|")[0];
          if (ports.website[website]) {
            ports.website[website].postMessage(msg);
          }
        }
      });
    }
  });
}

log(["Loading from", chrome.runtime.id]);
chrome.webRequest.onHeadersReceived.addListener(({ responseHeaders }) => {
  responseHeaders = responseHeaders.filter((header) => header.name !== "content-security-policy");
  return { responseHeaders };
}, { urls: ["*://*.discord.com/*", "*://discord.com/*"] }, ["blocking", "responseHeaders"]);
initializeBackgroundIPC();
