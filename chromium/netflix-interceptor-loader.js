chrome.storage.local.get("controllerType", function(data) {
  if (data.controllerType === "netflix") {
    var s = document.createElement("script");
    s.src = chrome.runtime.getURL("netflix-interceptor.js");
    (document.head || document.documentElement).appendChild(s);
  }
});
