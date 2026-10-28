/**
 * CLCS (household) gate — v2.
 *
 * Netflix now renders the household interstitial from server data:
 *   - `CLCSInterstitialLolomo` on /browse  → data.clcsInterstitialLolomo (CLCSScreen)
 *   - `CLCSInterstitialPlaybackAndPostPlayback` on /watch
 *     → data.clcsInterstitialPlaybackV2 = { configuration, screen }
 *
 * The previous blocker answered both with `{"data":{}}`. The current client does
 * not read that as "no interstitial": the playback query result is used to
 * dispatch `receivePlayerInterstitialData`, and leaving the field missing keeps
 * the session in the interstitial-loading state, so the player stays paused
 * (black screen).
 *
 * The client only clears that state on the query's error path:
 *   catch { ac(sessionId) }  ->  receivePlayerInterstitialData({ pausePlayback: false })
 * Therefore the playback query must be ABORTED, not faked.
 *
 * Runs in the main world at document_start so the patch is in place before
 * Netflix's bundles capture `fetch` and before the first CLCS query.
 */
export default defineContentScript({
  matches: ['*://*.netflix.com/*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    const w = window as any;
    if (w.__nikflixClcsPatched) return;
    w.__nikflixClcsPatched = true;

    const PLAYBACK_OP = 'CLCSInterstitialPlaybackAndPostPlayback';
    const LOLOMO_OP = 'CLCSInterstitialLolomo';
    const LOLOMO_NULL = '{"data":{"clcsInterstitialLolomo":null}}';

    const isGraphql = (url: string) => typeof url === 'string' && url.indexOf('/graphql') !== -1;
    const operationOf = (body: unknown) => {
      if (typeof body !== 'string') return '';
      const match = /"operationName"\s*:\s*"([^"]+)"/.exec(body);
      return match ? match[1] : '';
    };
    const blockedError = () => new DOMException('Blocked by Nikflix', 'NetworkError');

    // --- fetch -------------------------------------------------------------
    const nativeFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      try {
        const url = typeof input === 'string'
          ? input
          : input instanceof URL ? input.href : (input && (input as Request).url) || '';
        const body = init && typeof init.body === 'string' ? init.body : '';

        if (isGraphql(url) && body) {
          const operation = operationOf(body);
          if (operation === PLAYBACK_OP) {
            console.log('[Nikflix] Aborted CLCS playback query');
            return Promise.reject(blockedError());
          }
          if (operation === LOLOMO_OP) {
            console.log('[Nikflix] Nulled CLCS lolomo gate');
            return Promise.resolve(new Response(LOLOMO_NULL, {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }));
          }
        }
      } catch {}
      return nativeFetch.apply(this, arguments as any);
    };

    // --- XMLHttpRequest ----------------------------------------------------
    const nativeOpen = XMLHttpRequest.prototype.open;
    const nativeSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (this: any, method: string, url: string | URL, ...rest: any[]) {
      this.__nikflixUrl = typeof url === 'string' ? url : url.href;
      return nativeOpen.apply(this, [method, url, ...rest] as any);
    };

    XMLHttpRequest.prototype.send = function (this: any, body?: Document | XMLHttpRequestBodyInit | null) {
      try {
        const url = this.__nikflixUrl || '';
        const operation = operationOf(body);

        if (isGraphql(url) && operation === PLAYBACK_OP) {
          console.log('[Nikflix] Aborted CLCS playback XHR');
          setTimeout(() => {
            this.dispatchEvent(new ProgressEvent('error'));
            this.dispatchEvent(new ProgressEvent('loadend'));
          }, 0);
          return;
        }

        if (isGraphql(url) && operation === LOLOMO_OP) {
          const define = (key: string, value: any) =>
            Object.defineProperty(this, key, { value, writable: false, configurable: true });
          define('status', 200);
          define('statusText', 'OK');
          define('readyState', 4);
          define('responseURL', url);
          define('responseText', LOLOMO_NULL);
          define('response', this.responseType === 'json' ? { data: { clcsInterstitialLolomo: null } } : LOLOMO_NULL);
          setTimeout(() => {
            this.dispatchEvent(new Event('readystatechange'));
            this.dispatchEvent(new ProgressEvent('load'));
            this.dispatchEvent(new ProgressEvent('loadend'));
          }, 0);
          return;
        }
      } catch {}
      return nativeSend.apply(this, arguments as any);
    };
  },
});
