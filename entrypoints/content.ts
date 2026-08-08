import '../src/styles/netflix-controller.css';
import { injectEarlyCSS, CLASSES_TO_REMOVE, removeElementsByClasses } from '../src/modules/modal-blocker';
import { state } from '../src/modules/player-state';
import { doYourJob, cleanController, createBackButton, createTipsButton, showMessage, isOnNetflixWatch } from '../src/modules/player-ui';
import { setupKeyboardShortcuts } from '../src/modules/shortcuts';
import { getIdFromUrl } from '../src/modules/episodes';

export default defineContentScript({
  matches: ['*://*.netflix.com/*'],
  cssInjectionMode: 'manifest',
  main() {
    function injectScript(fileName: string): void {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL(fileName);
      script.onload = () => script.remove();
      (document.head || document.documentElement).appendChild(script);
    }

    injectScript("netflix-seeker.js");
    injectScript("netflix-audioChange.js");
    injectScript("netflix-substitleChange.js");

    window.addEventListener("message", (event) => {
      if (event.source !== window) return;

      if (event.data?.type === "FROM_AUDIOCHANGE_SCRIPT") {
        state.availableAudioTracks = Array.isArray(event.data.audioTracks)
          ? event.data.audioTracks
          : [];
      } else if (event.data?.type === "FROM_SUBSTITLECHANGE_SCRIPT") {
        state.availableSubtitleTracks = Array.isArray(event.data.substitleTracks)
          ? event.data.substitleTracks
          : [];
      }
    });

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        const controller = document.getElementById("mon-controleur-netflix");
        const overlayArea = document.getElementById("netflix-video-area-overlay");
        const overlay = document.getElementById("netflix-video-overlay");

        if (message.message === "enable") {
          if (controller) controller.style.display = "flex";
          if (overlayArea) overlayArea.style.display = "flex";
          if (overlay) overlay.style.display = "flex";
          document.body.classList.add("nikflix-active");
          showMessage("Controller Enabled");
        } else if (message.message === "disable") {
          if (controller) controller.style.display = "none";
          if (overlayArea) overlayArea.style.display = "none";
          if (overlay) overlay.style.display = "none";
          document.body.classList.remove("nikflix-active");
          showMessage("Controller Disabled");
        } else if (message.message === "debug") {
          doYourJob();
          showMessage("bypassed successfully");
          createBackButton();
          createTipsButton();
        }
      });
    }

    // Read block mode and start accordingly
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['blockMode'], (result) => {
        const blockMode: 'css' | 'api' = result.blockMode === 'api' ? 'api' : 'css';
        startExtension(blockMode);
      });
    } else {
      startExtension('css');
    }

    function startExtension(blockMode: 'css' | 'api') {
      if (blockMode === 'css') {
        // CSS mode: inject early CSS hide rules and run full controller
        injectEarlyCSS();
        startCSSMode();
      } else {
        // API mode: network request is blocked by declarativeNetRequest.
        // We only inject the Tips button (the original Netflix controller handles playback).
        startAPIMode();
      }
    }

    function startCSSMode() {
      const observerOptions = { childList: true, subtree: true };
      const observer = new MutationObserver((mutations) => {
        if (state.mutationTimeout) clearTimeout(state.mutationTimeout as number);

        const episodeId = getIdFromUrl();
        if (episodeId !== state.currentEpisodeId) {
          if (state.currentEpisodeId !== null) {
            cleanController();
            state.currentEpisodeDuration = null;
          }
          state.currentEpisodeId = episodeId;
        }

        const hasRestrictionNode = mutations.some((mutation) =>
          Array.from(mutation.addedNodes).some((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return false;
            const cls = (node as HTMLElement).className || "";
            return typeof cls === "string" && CLASSES_TO_REMOVE.some((c) => cls.includes(c));
          })
        );

        if (hasRestrictionNode) {
          removeElementsByClasses(CLASSES_TO_REMOVE);
          const video = document.querySelector("video");
          if (video) {
            video.play();
            if (state.controllerTimerId) clearTimeout(state.controllerTimerId as number);
            state.controllerTimerId = null;
          }
        }

        state.mutationTimeout = setTimeout(() => {
          const hasRelevantChanges = mutations.some((mutation) =>
            Array.from(mutation.addedNodes).some((node) => {
              if (node.nodeName === "VIDEO") return true;
              if (node.nodeType === Node.ELEMENT_NODE) {
                const nodeClassName = (node as HTMLElement).className || "";
                return (
                  (node as Element).querySelector("video") ||
                  CLASSES_TO_REMOVE.some(
                    (c) => typeof nodeClassName === "string" && nodeClassName.includes(c)
                  )
                );
              }
              return false;
            })
          );

          if (hasRelevantChanges || !state.isControllerAdded) {
            doYourJob();
          }
        }, 100);
      });

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          observer.observe(document.body, observerOptions);
          doYourJob();
        });
      } else {
        observer.observe(document.body, observerOptions);
        doYourJob();
      }
    }

    function startAPIMode() {
      // In API mode, inject main-world fetch/XHR interceptor for CLCSInterstitialPlaybackAndPostPlayback
      injectScript("netflix-apiBlocker.js");

      function maybeInjectTipsButton() {
        if (isOnNetflixWatch()) {
          if (!state.tipsButton || !document.getElementById("nikflix-tips-button")) {
            createTipsButton();
          }
          if (state.tipsButton) {
            state.tipsButton.style.opacity = "1";
            state.tipsButton.style.display = "flex";
          }
        } else if (state.tipsButton) {
          state.tipsButton.style.display = "none";
        }
      }

      // Watch for navigation/URL changes (Netflix is a SPA)
      const observer = new MutationObserver(() => {
        maybeInjectTipsButton();
      });

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          observer.observe(document.body, { childList: true, subtree: true });
          maybeInjectTipsButton();
        });
      } else {
        observer.observe(document.body, { childList: true, subtree: true });
        maybeInjectTipsButton();
      }

      setInterval(maybeInjectTipsButton, 1000);
    }
  },
});
