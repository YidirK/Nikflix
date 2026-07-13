(() => {
  "use strict";

  const CONFIG_MESSAGE_TYPE = "NIKFLIX_NATIVE_MODE_CONFIG_V1";
  const CONFIG_READY_MESSAGE_TYPE = "NIKFLIX_NATIVE_MODE_READY_V1";
  const RESTRICTION_OPERATION = "CLCSInterstitialPlaybackAndPostPlayback";
  const RESTRICTION_HOST = "web.prod.cloud.netflix.com";
  const RESTRICTION_PATH = "/graphql";

  let nativeModeEnabled = false;
  const heldRequests = [];
  const originalFetch = window.fetch;

  function isRestrictionEndpoint(rawUrl) {
    try {
      const url = new URL(rawUrl, location.href);
      return (
        url.hostname === RESTRICTION_HOST &&
        url.pathname === RESTRICTION_PATH
      );
    } catch (_error) {
      return false;
    }
  }

  function getOperationNames(body) {
    if (typeof body !== "string") return [];

    try {
      const parsed = JSON.parse(body);
      const operations = Array.isArray(parsed) ? parsed : [parsed];

      return operations
        .map((operation) => operation?.operationName)
        .filter((name) => typeof name === "string");
    } catch (_error) {
      return [];
    }
  }

  function shouldHold(rawUrl, body) {
    return (
      nativeModeEnabled &&
      isRestrictionEndpoint(rawUrl) &&
      getOperationNames(body).includes(RESTRICTION_OPERATION)
    );
  }

  function holdRequest(thisArg, args) {
    return new Promise((resolve, reject) => {
      heldRequests.push({ thisArg, args, resolve, reject });
    });
  }

  function releaseHeldRequests() {
    const requests = heldRequests.splice(0);

    for (const request of requests) {
      originalFetch
        .apply(request.thisArg, request.args)
        .then(request.resolve, request.reject);
    }
  }

  window.fetch = function (input, init) {
    const thisArg = this;
    const args = arguments;
    const rawUrl =
      typeof input === "string" || input instanceof URL
        ? String(input)
        : input?.url;

    try {
      if (init?.body !== undefined) {
        return shouldHold(rawUrl, init.body)
          ? holdRequest(thisArg, args)
          : originalFetch.apply(thisArg, args);
      }

      if (input instanceof Request && isRestrictionEndpoint(rawUrl)) {
        return input
          .clone()
          .text()
          .catch(() => "")
          .then((body) =>
            shouldHold(rawUrl, body)
              ? holdRequest(thisArg, args)
              : originalFetch.apply(thisArg, args)
          );
      }
    } catch (_error) {
      // Native mode must never interfere with unrelated Netflix requests.
    }

    return originalFetch.apply(thisArg, args);
  };

  addEventListener("message", (event) => {
    if (
      event.source !== window ||
      event.data?.type !== CONFIG_MESSAGE_TYPE ||
      typeof event.data.nativeModeEnabled !== "boolean"
    ) {
      return;
    }

    nativeModeEnabled = event.data.nativeModeEnabled;
    if (!nativeModeEnabled) releaseHeldRequests();
  });

  postMessage({ type: CONFIG_READY_MESSAGE_TYPE }, "*");
})();
