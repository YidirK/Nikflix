(() => {
  "use strict";

  const CONFIG_MESSAGE_TYPE = "NIKFLIX_NATIVE_MODE_CONFIG_V1";
  const CONFIG_READY_MESSAGE_TYPE = "NIKFLIX_NATIVE_MODE_READY_V1";
  let currentNativeMode = false;

  function publishNativeMode(nativeModeEnabled) {
    currentNativeMode = nativeModeEnabled;
    postMessage(
      {
        type: CONFIG_MESSAGE_TYPE,
        nativeModeEnabled,
      },
      "*"
    );
  }

  // Remove temporary diagnostic data left by development builds.
  chrome.storage.local.remove([
    "nikflixDiagnosticTimelineV1",
    "nikflixNetworkDiagnosticTimelineV1",
  ]);

  chrome.storage.local.get(["status"], (result) => {
    publishNativeMode(result.status === "disable");
  });

  addEventListener("message", (event) => {
    if (
      event.source === window &&
      event.data?.type === CONFIG_READY_MESSAGE_TYPE
    ) {
      publishNativeMode(currentNativeMode);
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.message === "disable") {
      publishNativeMode(true);
    } else if (message?.message === "enable") {
      publishNativeMode(false);
    }
  });
})();
