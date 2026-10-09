export default defineUnlistedScript(() => {
  if ((window as any).__nikflixPatched) return;
  (window as any).__nikflixPatched = true;

  const TARGETS = [
    { host: "web.prod.cloud.netflix.com", path: "/graphql" },
    { host: "www.netflix.com", path: "/graphql" },
  ];

  // Opérations GraphQL à bloquer
  const OPERATIONS = [
    "CLCSInterstitialPlaybackAndPostPlayback",
  ];

  const EMPTY = { data: {} };

  const isOnWatch = () => window.location.pathname.startsWith('/watch');

  const matchesTarget = (rawUrl: string) => {
    try {
      const u = new URL(rawUrl, location.href);
      return TARGETS.some(t => u.hostname === t.host && u.pathname === t.path);
    } catch {
      return false;
    }
  };

  const shouldBlock = (url: string, body: string) =>
      isOnWatch() &&
      matchesTarget(url) &&
      OPERATIONS.some(op => url.includes(op) || body.includes(op));

  // fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args: Parameters<typeof fetch>) {
    const [resource, config] = args;
    const url =
        typeof resource === 'string' ? resource
            : resource instanceof URL ? resource.href
                : resource.url;

    let body = typeof config?.body === 'string' ? config.body : '';
    if (!body && resource instanceof Request) {
      try { body = await resource.clone().text(); } catch {}
    }

    if (shouldBlock(url, body)) {
      console.log(`[Nikflix] Blocked fetch: ${url}`);
      return new Response(JSON.stringify(EMPTY), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return originalFetch.apply(this, args);
  };

  // XHR
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
    (this as any)._nikflixUrl = typeof url === 'string' ? url : url.href;
    return originalOpen.apply(this, [method, url, ...rest] as any);
  };

  XMLHttpRequest.prototype.send = function (body?: any) {
    const url = (this as any)._nikflixUrl || '';
    const bodyStr = typeof body === 'string' ? body : '';

    if (shouldBlock(url, bodyStr)) {
      console.log(`[Nikflix] Blocked XHR: ${url}`);
      const text = JSON.stringify(EMPTY);
      const response = this.responseType === 'json' ? EMPTY : text;
      const define = (k: string, v: any) =>
          Object.defineProperty(this, k, { value: v, writable: false, configurable: true });

      define('status', 200);
      define('statusText', 'OK');
      define('readyState', 4);
      define('responseURL', url);
      define('responseText', text);
      define('response', response);

      setTimeout(() => {
        this.dispatchEvent(new Event('readystatechange'));
        this.dispatchEvent(new ProgressEvent('load'));
        this.dispatchEvent(new ProgressEvent('loadend'));
      }, 0);
      return;
    }
    return originalSend.apply(this, [body]);
  };
});