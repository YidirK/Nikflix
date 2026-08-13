export default defineUnlistedScript(() => {
  const RESTRICTION_OPERATION = "CLCSInterstitialPlaybackAndPostPlayback";
  const RESTRICTION_HOST = "web.prod.cloud.netflix.com";
  const RESTRICTION_PATH = "/graphql";

  console.log("[Nikflix] API Blocker script initialized with target operation:", RESTRICTION_OPERATION);

  // Override fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const [resource, config] = args;
    const url = typeof resource === 'string'
      ? resource
      : resource instanceof URL
      ? resource.href
      : (resource as Request)?.url || '';

    const isOnWatch = window.location.pathname.includes('/watch');

    if (isOnWatch && url.includes(RESTRICTION_HOST) && url.includes(RESTRICTION_PATH)) {
      const isRestrictionOp = url.includes(RESTRICTION_OPERATION);
      const bodyStr = typeof config?.body === 'string' ? config.body : '';
      const isBodyOp = bodyStr.includes(RESTRICTION_OPERATION);

      if (isRestrictionOp || isBodyOp) {
        console.log(`[Nikflix] Intercepted & blocked GraphQL fetch request for: ${RESTRICTION_OPERATION}`);
        return new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return originalFetch.apply(this, args);
  };

  // Override XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
    (this as any)._nikflixUrl = typeof url === 'string' ? url : url.href;
    return originalOpen.apply(this, [method, url, ...rest] as any);
  };

  XMLHttpRequest.prototype.send = function (body?: any) {
    const url = (this as any)._nikflixUrl || '';
    const isOnWatch = window.location.pathname.includes('/watch');

    if (isOnWatch && url.includes(RESTRICTION_HOST) && url.includes(RESTRICTION_PATH)) {
      const isRestrictionOp = url.includes(RESTRICTION_OPERATION);
      const bodyStr = typeof body === 'string' ? body : '';
      const isBodyOp = bodyStr.includes(RESTRICTION_OPERATION);

      if (isRestrictionOp || isBodyOp) {
        console.log(`[Nikflix] Intercepted & blocked GraphQL XHR request for: ${RESTRICTION_OPERATION}`);
        Object.defineProperty(this, 'status', { value: 200, writable: false });
        Object.defineProperty(this, 'readyState', { value: 4, writable: false });
        Object.defineProperty(this, 'responseText', { value: JSON.stringify({ data: {} }), writable: false });
        Object.defineProperty(this, 'response', { value: JSON.stringify({ data: {} }), writable: false });

        setTimeout(() => {
          this.dispatchEvent(new Event('readystatechange'));
          this.dispatchEvent(new Event('load'));
          this.dispatchEvent(new Event('loadend'));
        }, 0);
        return;
      }
    }
    return originalSend.apply(this, [body]);
  };
});
