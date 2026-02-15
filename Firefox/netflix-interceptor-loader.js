browser.storage.local.get("controllerType").then(function(data) {
  if (data.controllerType === "netflix") {
    var s = document.createElement("script");
    s.src = browser.runtime.getURL("netflix-interceptor.js");
    (document.head || document.documentElement).appendChild(s);
  }
});
