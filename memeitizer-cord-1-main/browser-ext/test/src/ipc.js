function sendData(data, eventName = "cumcord-ipc") {
  const ccEvent = new CustomEvent(eventName, {
    detail: data
  });
  return window.dispatchEvent(ccEvent);
}

let port;
log(["Loading client page IPC"], "ipc");
window.addEventListener("cumload", (event) => {
  if (!port) {
    port = chrome.runtime.connect({ name: "website-" + randomUUID() });
    port.onMessage.addListener((msg) => sendData(msg));
  }
  if (event.detail.action && event.detail.action.toUpperCase() == "CUMLOAD") {
    return sendData({ message: chrome.runtime.id });
  } else {
    return port.postMessage(event.detail);
  }
}, false);
