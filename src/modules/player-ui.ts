import { state, CONTROLLER_ID, CONTROLLER_HIDE_DELAY, CONTROLLER_INIT_DELAY, NETFLIX_WATCH_REGEX } from './player-state';
import { CLASSES_TO_REMOVE, removeElementsByClasses } from './modal-blocker';
import { adjustOverlayForTeleparty, watchTelepartyFrame } from './teleparty';
import { setupKeyboardShortcuts } from './shortcuts';
import { createSubtitleSettings, toggleSubtitleSettings } from './subtitles-audio';
import { getIdFromUrl, getNextEpisodeId, fetchAndCacheCurrentEpisodeDuration, jumpToNextEpisode, getEffectiveDuration } from './episodes';

export function isOnNetflixWatch(): boolean {
  return NETFLIX_WATCH_REGEX.test(window.location.href);
}

export function timeFormat(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatRuntime(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hrs} h ${remainingMins} min` : `${hrs} h`;
}

function getEpisodeThumb(episode: any): string | null {
  if (episode.thumbs && episode.thumbs[0]?.url) return episode.thumbs[0].url;
  if (episode.interestingMoment && episode.interestingMoment[0]?.url) return episode.interestingMoment[0].url;
  if (episode.boxart && episode.boxart[0]?.url) return episode.boxart[0].url;
  return null;
}

export async function showEpisodesList(): Promise<void> {
  const curEpisodeId = getIdFromUrl();
  if (!curEpisodeId) return;

  try {
    const response = await fetch(
        `https://www.netflix.com/nq/website/memberapi/release/metadata?movieid=${curEpisodeId}`,
        { credentials: "include" }
    );
    const data = await response.json();

    const existingPanel = document.getElementById("netflix-episodes-list");
    if (existingPanel) existingPanel.remove();

    const panel = document.createElement("div");
    panel.id = "netflix-episodes-list";
    panel.className = "visible";

    const seasons = (data.video.seasons || []).sort((a: any, b: any) => a.seq - b.seq);
    if (!seasons.length) return;

    // Find current season index
    let activeSeasonIndex = 0;
    seasons.forEach((season: any, idx: number) => {
      if (season.episodes?.some((ep: any) => ep.id.toString() === curEpisodeId.toString())) {
        activeSeasonIndex = idx;
      }
    });

    const renderSeasonEpisodes = (season: any) => {
      const episodes = season.episodes || [];
      return episodes
          .map((episode: any) => {
            const isCurrent = episode.id.toString() === curEpisodeId.toString();
            const thumbUrl = getEpisodeThumb(episode);
            const runtimeStr = formatRuntime(episode.runtime);
            const synopsis = episode.synopsis || episode.summary || "";

            return `
            <div class="netflix-ep-card ${isCurrent ? "current" : ""}" data-episode-id="${episode.id}">
              <div class="netflix-ep-thumb-wrapper">
                ${
                thumbUrl
                    ? `<img class="netflix-ep-thumb" src="${thumbUrl}" alt="Episode ${episode.seq}" loading="lazy" />`
                    : `<div class="netflix-ep-thumb-placeholder"><span>${episode.seq}</span></div>`
            }
                <div class="netflix-ep-play-overlay">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <span class="netflix-ep-duration-badge">${runtimeStr}</span>
              </div>
              <div class="netflix-ep-details">
                <div class="netflix-ep-header-row">
                  <span class="netflix-ep-seq">${episode.seq}.</span>
                  <span class="netflix-ep-name">${episode.title}</span>
                  ${isCurrent ? `<span class="netflix-ep-playing-badge">${t("nowPlaying")}</span>` : ""}
                </div>
                ${synopsis ? `<p class="netflix-ep-synopsis">${synopsis}</p>` : ""}
              </div>
            </div>
          `;
          })
          .join("");
    };

    panel.innerHTML = `
      <div class="netflix-episodes-header">
        <div class="netflix-episodes-title-wrap">
          <h3 class="netflix-episodes-show-title">${data.video.title}</h3>
          ${
        seasons.length > 1
            ? `
            <div class="netflix-season-select-container">
              <select id="netflix-season-dropdown" class="netflix-season-dropdown">
                ${seasons
                .map(
                    (s: any, idx: number) => `
                  <option value="${idx}" ${idx === activeSeasonIndex ? "selected" : ""}>
                    ${s.title || t("season", String(s.seq))}
                  </option>
                `
                )
                .join("")}
              </select>
              <svg class="netflix-dropdown-arrow" viewBox="0 0 24 24" width="16" height="16" fill="white">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
          `
            : `<span class="netflix-single-season-label">${seasons[0]?.title || t("season", String(seasons[0]?.seq || 1))}</span>`
    }
        </div>
        <button id="netflix-episodes-close-btn" class="netflix-episodes-close-btn" title="${t("closeTooltip")}">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <div id="netflix-episodes-container" class="netflix-episodes-container">
        ${renderSeasonEpisodes(seasons[activeSeasonIndex])}
      </div>
    `;

    document.body.appendChild(panel);
    state.episodesListOpen = true;

    // Attach click listeners to cards
    const attachEpisodeCardListeners = () => {
      panel.querySelectorAll(".netflix-ep-card").forEach((card) => {
        card.addEventListener("click", () => {
          const episodeId = card.getAttribute("data-episode-id");
          if (episodeId) {
            window.location.href = `https://www.netflix.com/watch/${episodeId}`;
          }
        });
      });
    };
    attachEpisodeCardListeners();

    // Season dropdown change
    const seasonSelect = panel.querySelector("#netflix-season-dropdown") as HTMLSelectElement | null;
    if (seasonSelect) {
      seasonSelect.addEventListener("change", (e) => {
        const selectedIdx = parseInt((e.target as HTMLSelectElement).value, 10);
        const epContainer = panel.querySelector("#netflix-episodes-container");
        if (epContainer && seasons[selectedIdx]) {
          epContainer.innerHTML = renderSeasonEpisodes(seasons[selectedIdx]);
          attachEpisodeCardListeners();
        }
      });
    }

    // Close button click
    const closeBtn = panel.querySelector("#netflix-episodes-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        panel.remove();
        state.episodesListOpen = false;
      });
    }

    // Scroll to current episode
    const currentCard = panel.querySelector(".netflix-ep-card.current");
    if (currentCard) {
      setTimeout(() => {
        currentCard.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }, 100);
    }

    const closeHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!panel.contains(target) && !target.closest("#netflix-episodes-button")) {
        panel.remove();
        state.episodesListOpen = false;
        document.removeEventListener("click", closeHandler);
      }
    };
    document.addEventListener("click", closeHandler);
  } catch (error) {
    console.error("Error fetching episodes:", error);
  }
}

const ICONS = {
  play: '<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M6 4l15 8-15 8V4z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
  rewind10: '<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M12.5 3C7.8 3 4 6.8 4 11.5v.7L1.9 10.1l-1.4 1.4 4.5 4.5 4.5-4.5-1.4-1.4-2.1 2.1v-.7C6 8 8.9 5 12.5 5 16.1 5 19 7.9 19 11.5s-2.9 6.5-6.5 6.5c-1.8 0-3.4-.7-4.6-1.9l-1.4 1.4c1.6 1.5 3.7 2.5 6 2.5 4.7 0 8.5-3.8 8.5-8.5S17.2 3 12.5 3z"/><text x="12.5" y="14.5" font-size="7.5" font-weight="900" fill="white" text-anchor="middle" font-family="sans-serif">10</text></svg>',
  forward10: '<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M11.5 3C16.2 3 20 6.8 20 11.5v.7l2.1-2.1 1.4 1.4-4.5 4.5-4.5-4.5 1.4-1.4 2.1 2.1v-.7C18 8 15.1 5 11.5 5 7.9 5 5 7.9 5 11.5S7.9 18 11.5 18c1.8 0 3.4-.7 4.6-1.9l1.4 1.4c-1.6 1.5-3.7 2.5-6 2.5-4.7 0-8.5-3.8-8.5-8.5S6.8 3 11.5 3z"/><text x="11.5" y="14.5" font-size="7.5" font-weight="900" fill="white" text-anchor="middle" font-family="sans-serif">10</text></svg>',
  nextEpisode: '<svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
  volumeHigh: '<svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
  volumeLow: '<svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>',
  volumeMuted: '<svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
  episodes: '<svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-7-2l5-4-5-4v8z"/></svg>',
  subtitles: '<svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/></svg>',
  speed: '<svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.28-10.43zM10.59 15.41a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z"/></svg>',
  autoplay: '<svg viewBox="0 -960 960 960" width="26" height="26" fill="white"><path d="M380-300v-360l280 180zM480-40q-108 0-202.5-49.5T120-228v108H40v-240h240v80h-98q51 75 129.5 117.5T480-120q115 0 208.5-66T820-361l78 18q-45 136-160 219.5T480-40M42-520q7-67 32-128.5T143-762l57 57q-32 41-52 87.5T123-520zm214-241-57-57q53-44 114-69.5T440-918v80q-51 5-97 25t-87 52m449 0q-41-32-87.5-52T520-838v-80q67 6 128.5 31T762-818zm133 241q-5-51-25-97.5T761-705l57-57q44 52 69 113.5T918-520z"/></svg>',
  fullscreen: '<svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
  exitFullscreen: '<svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
  skipIcon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="margin-right: 8px;"><path d="M4 18l8.5-6L4 6v12zM14 6v12h2V6h-2z"/></svg>'
};

/**
 * i18n helper: wraps chrome.i18n.getMessage so the rest of the file can stay
 * readable, and falls back gracefully to the raw key when chrome.i18n is not
 * available (e.g. running outside the extension context).
 */
function t(key: string, substitutions?: string | string[]): string {
  if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
    const message = chrome.i18n.getMessage(key, substitutions);
    if (message) return message;
  }
  return key;
}

function getVolumeIcon(video: HTMLVideoElement): string {
  if (video.muted || video.volume === 0) return ICONS.volumeMuted;
  if (video.volume < 0.5) return ICONS.volumeLow;
  return ICONS.volumeHigh;
}

export function updateProgression(): void {
  const { videoElement, progressionBar, screenTime } = state;
  if (!videoElement) return;

  const duration = getEffectiveDuration();
  if (duration > 0 && progressionBar && screenTime) {
    const percentage = Math.min(100, Math.max(0, (videoElement.currentTime / duration) * 100));
    progressionBar.style.width = `${percentage}%`;

    const currentTime = Math.floor(videoElement.currentTime);
    const totalTime = Math.floor(duration);

    if (state.lastScreenTime !== currentTime || state.lastTotalTime !== totalTime) {
      state.lastScreenTime = currentTime;
      state.lastTotalTime = totalTime;
      screenTime.textContent = `${timeFormat(currentTime)} / ${timeFormat(totalTime)}`;
    }
  }

  // Update Skip Intro / Outro Buttons dynamically
  const currentTimeMs = videoElement.currentTime * 1000;
  const totalDurationMs = (duration || 0) * 1000;

  const skipIntroBtn = document.getElementById("nikflix-skip-intro-btn");
  if (skipIntroBtn) {
    if (
        state.skipIntroMarker &&
        !state.skipIntroDismissed &&
        currentTimeMs >= state.skipIntroMarker.startMs &&
        currentTimeMs < state.skipIntroMarker.endMs
    ) {
      skipIntroBtn.classList.add("visible");
    } else {
      skipIntroBtn.classList.remove("visible");
    }
  }

  const skipOutroBtn = document.getElementById("nikflix-skip-outro-btn");
  if (skipOutroBtn) {
    const isOutroByMarker = state.skipOutroMarker && currentTimeMs >= state.skipOutroMarker.startMs;
    const isOutroByTime = totalDurationMs > 180000 && currentTimeMs >= totalDurationMs - 90000;
    if (!state.skipOutroDismissed && (isOutroByMarker || isOutroByTime)) {
      skipOutroBtn.classList.add("visible");
    } else {
      skipOutroBtn.classList.remove("visible");
    }
  }
}

export function toggleFullScreen(): void {
  const fullscreenElement = document.documentElement;

  if (!document.fullscreenElement) {
    if (fullscreenElement.requestFullscreen) {
      fullscreenElement.requestFullscreen();
    }
    if (state.buttonFullScreen) {
      state.buttonFullScreen.innerHTML = ICONS.exitFullscreen;
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    if (state.buttonFullScreen) {
      state.buttonFullScreen.innerHTML = ICONS.fullscreen;
    }
  }
}

export function cleanController(): void {
  document.body.classList.remove("nikflix-active");

  if (state.progressionIntervalId) {
    cancelAnimationFrame(state.progressionIntervalId as number);
    state.progressionIntervalId = null;
  }

  if (state.controllerHideTimer) {
    clearTimeout(state.controllerHideTimer as number);
    state.controllerHideTimer = null;
  }

  if (state.subtitleObserver) {
    state.subtitleObserver.disconnect();
    state.subtitleObserver = null;
  }

  if (state.controllerElement) state.controllerElement.remove();
  if (state.videoOverlay) state.videoOverlay.remove();

  const videoAreaOverlay = document.getElementById("netflix-video-area-overlay");
  if (videoAreaOverlay) videoAreaOverlay.remove();

  const skipIntroBtn = document.getElementById("nikflix-skip-intro-btn");
  if (skipIntroBtn) skipIntroBtn.remove();

  const skipOutroBtn = document.getElementById("nikflix-skip-outro-btn");
  if (skipOutroBtn) skipOutroBtn.remove();

  if (state.messageOverlay) state.messageOverlay.remove();
  if (state.subtitleSettingsPanel) state.subtitleSettingsPanel.remove();
  if (state.backButton) state.backButton.remove();
  if (state.tipsButton) state.tipsButton.remove();

  if (state.keyboardListener) {
    document.removeEventListener("keydown", state.keyboardListener);
    state.keyboardListener = null;
  }

  if (state.progressTooltip) {
    state.progressTooltip.remove();
    state.progressTooltip = null;
  }

  state.controllerElement = null;
  state.buttonPlayPause = null;
  state.buttonFullScreen = null;
  state.progressionBar = null;
  state.screenTime = null;
  state.videoElement = null;
  state.volumeSlider = null;
  state.videoOverlay = null;
  state.messageOverlay = null;
  state.messageTimer = null;
  state.isControllerAdded = false;
  state.isControllerVisible = true;
  state.subtitleSettingsOpen = false;
  state.subtitleSettingsPanel = null;
  state.backButton = null;
  state.tipsButton = null;
}

export function showController(): void {
  if (!state.controllerElement) return;

  state.controllerElement.classList.remove("hidden");
  if (state.backButton) state.backButton.style.opacity = "1";
  if (state.tipsButton) state.tipsButton.style.opacity = "1";
  state.isControllerVisible = true;

  document.body.classList.add("nikflix-controls-visible");
  if (state.controllerElement) {
    const rect = state.controllerElement.getBoundingClientRect();
    const padTop = parseFloat(getComputedStyle(state.controllerElement).paddingTop) || 0;
    document.body.style.setProperty("--nikflix-controls-height", `${Math.round(rect.height - padTop)}px`);
  }

  const videoAreaOverlay = document.getElementById("netflix-video-area-overlay");
  if (videoAreaOverlay) videoAreaOverlay.style.cursor = "default";

  if (state.controllerHideTimer) clearTimeout(state.controllerHideTimer as number);

  state.controllerHideTimer = setTimeout(() => {
    if (state.controllerElement && state.videoElement && !state.videoElement.paused && !state.subtitleSettingsOpen) {
      state.controllerElement.classList.add("hidden");
      if (state.backButton) state.backButton.style.opacity = "0";
      if (state.tipsButton) state.tipsButton.style.opacity = "0";
      state.isControllerVisible = false;
      document.body.classList.remove("nikflix-controls-visible");

      if (videoAreaOverlay) {
        videoAreaOverlay.style.cursor = "none";
        videoAreaOverlay.classList.remove("over-netflix-button");
      }
    }
  }, CONTROLLER_HIDE_DELAY);
}

export function showMessage(message: string, duration = 1500): void {
  if (state.messageTimer) {
    clearTimeout(state.messageTimer as number);
    state.messageTimer = null;
  }

  let overlay = document.getElementById("netflix-message-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "netflix-message-overlay";
    document.body.appendChild(overlay);
  }
  state.messageOverlay = overlay;

  state.messageOverlay.textContent = message;
  state.messageOverlay.classList.add("visible");
  state.messageOverlay.style.opacity = "1";

  state.messageTimer = setTimeout(() => {
    if (state.messageOverlay) {
      state.messageOverlay.classList.remove("visible");
      state.messageOverlay.style.opacity = "0";
    }
  }, duration);
}

export function createVideoOverlay(): void {
  state.videoOverlay = document.createElement("div");
  state.videoOverlay.id = "netflix-video-overlay";
  state.videoOverlay.style.pointerEvents = "none";
  state.videoOverlay.tabIndex = -1;
  state.videoOverlay.style.outline = "none";

  state.videoOverlay.addEventListener("keydown", (e) => {
    if (state.keyboardListener) state.keyboardListener(e);
  });

  document.body.appendChild(state.videoOverlay);
}

const NETFLIX_PASSTHROUGH_BUTTONS =
    '[data-uia^="player-skip"], [data-uia$="seamless-button"], [data-uia$="seamless-button-draining"]';
const SEAMLESS_END_WINDOW_S = 120;

export function updateSeamlessDistance(): void {
  const video = state.videoElement;
  if (!video || !video.duration || Number.isNaN(video.duration)) return;
  const remaining = video.duration - video.currentTime;
  document.body.classList.toggle("nikflix-away-from-end", remaining > SEAMLESS_END_WINDOW_S);
}

export function cancelNetflixCountdown(): void {
  const container = document.querySelector(".SeamlessControls--container");
  if (!container) return;
  for (let i = 0; i < 8; i++) {
    container.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          composed: true,
          clientX: 200 + i * 20,
          clientY: 300,
        })
    );
  }
}

export function forwardHover(from: Element | null, to: Element | null): void {
  const fire = (el: Element, types: string[], related: Element | null) => {
    for (const type of types) {
      const Ctor = type.startsWith("pointer") ? PointerEvent : MouseEvent;
      el.dispatchEvent(
          new Ctor(type, {
            bubbles: type.endsWith("over") || type.endsWith("out"),
            cancelable: true,
            composed: true,
            relatedTarget: related || null,
            ...(Ctor === PointerEvent ? { pointerId: 1, pointerType: "mouse", isPrimary: true } : {}),
          })
      );
    }
  };

  if (from) fire(from, ["pointerout", "mouseout", "pointerleave", "mouseleave"], to);
  if (to) fire(to, ["pointerover", "mouseover", "pointerenter", "mouseenter"], from);
}

export function createVideoAreaOverlay(): HTMLElement | null {
  const curEpisodeId = getIdFromUrl();
  if (!curEpisodeId) return null;

  const videoAreaOverlay = document.createElement("div");
  videoAreaOverlay.id = "netflix-video-area-overlay";
  videoAreaOverlay.style.position = "fixed";
  videoAreaOverlay.style.top = "0";
  videoAreaOverlay.style.left = "0";
  videoAreaOverlay.style.width = "100%";
  videoAreaOverlay.style.height = "100%";
  videoAreaOverlay.style.zIndex = "9997";
  videoAreaOverlay.style.cursor = "default";
  videoAreaOverlay.style.backgroundColor = "transparent";
  videoAreaOverlay.tabIndex = -1;
  videoAreaOverlay.style.outline = "none";

  videoAreaOverlay.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (
        target.closest("#mon-controleur-netflix") ||
        target.closest("#netflix-subtitle-settings") ||
        target.closest(".nikflix-skip-button")
    ) return;

    videoAreaOverlay.style.pointerEvents = "none";
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    videoAreaOverlay.style.pointerEvents = "auto";

    if (elementBelow && elementBelow.tagName === "IFRAME" && (elementBelow.id === "tpChatFrame" || (elementBelow as HTMLIFrameElement).src?.includes("teleparty"))) {
      return;
    }

    if (elementBelow && (elementBelow.closest('[id^="tp-"]') || elementBelow.closest('[data-tp-id]'))) {
      elementBelow.click();
      return;
    }

    const passthroughButton = elementBelow && elementBelow.closest(NETFLIX_PASSTHROUGH_BUTTONS) as HTMLElement | null;
    if (passthroughButton) {
      passthroughButton.click();
      return;
    }

    if (state.videoElement) {
      if (state.videoElement.paused) {
        state.videoElement.play();
        if (state.buttonPlayPause) {
          state.buttonPlayPause.innerHTML = ICONS.pause;
        }
      } else {
        state.videoElement.pause();
        if (state.buttonPlayPause) {
          state.buttonPlayPause.innerHTML = ICONS.play;
        }
      }
    }
  });

  let lastCursorCheck = 0;
  let lastHovered: Element | null = null;
  videoAreaOverlay.addEventListener("mousemove", (e) => {
    if (e.timeStamp - lastCursorCheck < 100) return;
    lastCursorCheck = e.timeStamp;

    videoAreaOverlay.style.pointerEvents = "none";
    const below = document.elementFromPoint(e.clientX, e.clientY);
    videoAreaOverlay.style.pointerEvents = "auto";
    const hovered = below && below.closest(NETFLIX_PASSTHROUGH_BUTTONS);

    videoAreaOverlay.classList.toggle("over-netflix-button", !!hovered);

    if (hovered && below) {
      below.dispatchEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: e.clientX,
            clientY: e.clientY,
          })
      );
    }

    if (hovered !== lastHovered) {
      forwardHover(lastHovered, hovered);
      lastHovered = hovered;
    }
  });

  videoAreaOverlay.addEventListener("dblclick", (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest("#mon-controleur-netflix") && !target.closest("#netflix-subtitle-settings") && !target.closest(".nikflix-skip-button")) {
      toggleFullScreen();
    }
  });

  document.body.appendChild(videoAreaOverlay);
  watchTelepartyFrame(videoAreaOverlay);
  return videoAreaOverlay;
}

export function createBackButton(): void {
  if (state.backButton) return;
  state.backButton = document.createElement("button");
  state.backButton.id = "netflix-back-button";
  state.backButton.title = t("backTooltip");
  state.backButton.innerHTML = ICONS.back;

  state.backButton.addEventListener("click", () => {
    const netflixBackButton =
        document.querySelector<HTMLElement>('button[data-uia="player-back-to-browse"]') ||
        document.querySelector<HTMLElement>(".button-nfplayerBack") ||
        document.querySelector<HTMLElement>("button.nf-player-container button") ||
        document.querySelector<HTMLElement>('button[aria-label="Back to Browse"]');

    if (netflixBackButton) {
      netflixBackButton.click();
      return;
    }

    const escKeyEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(escKeyEvent);

    if (window.location.href.includes("netflix.com/watch/")) {
      window.location.href = "https://www.netflix.com/browse";
    }
  });

  document.body.appendChild(state.backButton);
}

export function createTipsButton(): void {
  if (state.tipsButton) return;
  state.tipsButton = document.createElement("button");
  state.tipsButton.id = "nikflix-tips-button";
  state.tipsButton.title = t("supportNikflix");
  state.tipsButton.innerHTML = `
   <svg viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M566 268.4v66.3H353.9v-66.3h-66.3v-79.5h357.9v79.5H566z" fill="#FFFFFF"></path><path d="M558.5 319.2l98.7 86.4c72.6 50.6 115.8 133.5 115.8 222 0 88-63.7 163-150.5 177.4-55 9.1-110.1 13.6-165.1 13.6s-110.1-4.5-165.1-13.6c-86.8-14.3-150.5-89.4-150.5-177.4 0-88.5 43.3-171.3 115.8-221.9l113.7-86.4h187.2z" fill="#FFFFFF"></path><path d="M457.4 845.1c-56.2 0-113.2-4.7-169.4-14C188 814.6 115.3 729 115.3 627.6c0-97.1 47.5-188.2 127.2-243.7l119.9-91.2h206l105.1 92c78.9 55.6 126 146.2 126 242.8 0 101.4-72.6 187-172.7 203.5-56.1 9.4-113.1 14.1-169.4 14.1z m-77.2-499.4l-106.5 81c-66.3 46.2-105.4 121.1-105.4 200.8 0 75.3 54 138.9 128.3 151.2 106.7 17.6 214.9 17.6 321.6 0 74.3-12.3 128.3-75.9 128.3-151.2 0-79.7-39.1-154.6-104.5-200.2l-2.3-1.8-91.2-79.8H380.2z" fill="#333333"></path><path d="M354 305l-66.7-57.3c-13.8-8.9-21-22.7-20.7-36.7m395.1 0.1c0 14.7-8.3 28.4-22.1 36.5L561.9 308" fill="#FFFFFF"></path><path d="M561.9 334.5c-7.9 0-15.7-3.5-21-10.3-9-11.6-6.9-28.2 4.7-37.2l80.5-62.2c5.7-3.3 9-8.5 9-13.7 0-14.6 11.9-26.5 26.5-26.5s26.5 11.9 26.5 26.5c0 23.6-12.5 45.3-33.6 58.4l-76.6 59.4c-4.6 3.8-10.3 5.6-16 5.6z m-208-3c-6.1 0-12.3-2.1-17.3-6.4l-65.4-56.3c-20-13.6-31.6-35.3-31.2-58.4 0.3-14.6 12.8-26.4 27-26 14.6 0.3 26.3 12.4 26 27-0.1 5.3 3 10.4 8.5 13.9l2.9 2.2 66.7 57.3c11.1 9.5 12.4 26.3 2.8 37.4-5.1 6.2-12.5 9.3-20 9.3z" fill="#333333"></path><path d="M365.4 229.3c-14.6 0-26.5-11.9-26.5-26.5 0-6.6-9.8-13.9-22.9-13.9s-22.9 7.4-22.9 13.9c0 14.6-11.9 26.5-26.5 26.5s-26.5-11.9-26.5-26.5c0-36.9 34-67 75.9-67s75.9 30 75.9 67c0 14.7-11.9 26.5-26.5 26.5zM562.9 229.3c-14.6 0-26.5-11.9-26.5-26.5 0-6.6-9.8-13.9-22.9-13.9-13.1 0-22.9 7.4-22.9 13.9 0 14.6-11.9 26.5-26.5 26.5s-26.5-11.9-26.5-26.5c0-36.9 34.1-67 75.9-67s75.9 30 75.9 67c0.1 14.7-11.8 26.5-26.5 26.5z" fill="#333333"></path><path d="M661.7 229.3c-14.6 0-26.5-11.9-26.5-26.5 0-6.6-9.8-13.9-22.9-13.9s-22.9 7.4-22.9 13.9c0 14.6-11.9 26.5-26.5 26.5s-26.5-11.8-26.5-26.5c0-36.9 34-67 75.9-67s75.9 30 75.9 67c0 14.7-11.8 26.5-26.5 26.5zM464.2 229.3c-14.6 0-26.5-11.9-26.5-26.5 0-6.6-9.8-13.9-22.9-13.9s-22.9 7.4-22.9 13.9c0 14.6-11.9 26.5-26.5 26.5s-26.5-11.9-26.5-26.5c0-36.9 34-67 75.9-67s75.9 30 75.9 67c0 14.7-11.9 26.5-26.5 26.5z" fill="#333333"></path><path d="M679.1 621.5m-205.1 0a205.1 205.1 0 1 0 410.2 0 205.1 205.1 0 1 0-410.2 0Z" fill="#9dff5c"></path><path d="M679.1 853.1c-127.7 0-231.6-103.9-231.6-231.6 0-127.7 103.9-231.6 231.6-231.6s231.6 103.9 231.6 231.6c0 127.7-103.9 231.6-231.6 231.6z m0-410.2C580.6 442.9 500.4 523 500.4 621.5S580.5 800.1 679 800.1 857.7 720 857.7 621.5s-80.2-178.6-178.6-178.6z" fill="#333333"></path><path d="M720.47 621.453l-41.436 41.436-41.437-41.436 41.436-41.437z" fill="#FFFFFF"></path><path d="M679.079 737.919l-116.46-116.46 116.46-116.461 116.46 116.46-116.46 116.46z m-41.508-116.46l41.437 41.436 41.436-41.437-41.436-41.436-41.437 41.436z" fill="#333333"></path><path d="M591.6 302.3l76-20.4c14.1-3.8 28.7 4.6 32.5 18.7 3.8 14.1-4.6 28.7-18.7 32.5l-76 20.4c-14.1 3.8-28.7-4.6-32.5-18.7-3.8-14.2 4.6-28.7 18.7-32.5z" fill="#333333"></path></g></svg>
  `;

  state.tipsButton.addEventListener("click", () => {
    window.open("https://ko-fi.com/yidirk", "_blank");
  });

  document.body.appendChild(state.tipsButton);
}

function createFloatingSkipButtons(): void {
  // 1. Skip Intro Button
  let skipIntroBtn = document.getElementById("nikflix-skip-intro-btn");
  if (!skipIntroBtn) {
    skipIntroBtn = document.createElement("button");
    skipIntroBtn.id = "nikflix-skip-intro-btn";
    skipIntroBtn.className = "nikflix-skip-button";
    skipIntroBtn.innerHTML = `${ICONS.skipIcon}<span>${t("skipIntro")}</span>`;
    skipIntroBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.skipIntroMarker) {
        const seekMs = state.skipIntroMarker.endMs;
        window.dispatchEvent(new CustomEvent("netflixSeekTo", { detail: seekMs }));
        state.skipIntroDismissed = true;
        skipIntroBtn?.classList.remove("visible");
        showMessage(t("introSkippedMessage"));
      }
    });
    document.body.appendChild(skipIntroBtn);
  }

  // 2. Skip Outro / Next Episode Button
  let skipOutroBtn = document.getElementById("nikflix-skip-outro-btn");
  if (!skipOutroBtn) {
    skipOutroBtn = document.createElement("button");
    skipOutroBtn.id = "nikflix-skip-outro-btn";
    skipOutroBtn.className = "nikflix-skip-button";
    skipOutroBtn.innerHTML = `${ICONS.skipIcon}<span>${t("nextEpisodeLabel")}</span>`;
    skipOutroBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.skipOutroDismissed = true;
      skipOutroBtn?.classList.remove("visible");
      jumpToNextEpisode();
    });
    document.body.appendChild(skipOutroBtn);
  }
}

export function addMediaController(): void {
  if (state.isControllerAdded) return;

  cleanController();

  state.videoElement = document.querySelector("video");
  if (!state.videoElement) return;

  createVideoOverlay();
  const videoAreaOverlay = createVideoAreaOverlay();
  createFloatingSkipButtons();

  state.controllerElement = document.createElement("div");
  state.controllerElement.id = CONTROLLER_ID;
  state.controllerElement.tabIndex = -1;
  state.controllerElement.style.outline = "none";

  // --- TOP ROW (Timeline & Time) ---
  const topRow = document.createElement("div");
  topRow.className = "netflix-timeline-wrapper";

  const barreContainer = document.createElement("div");
  barreContainer.id = "netflix-barre-container";

  state.progressionBar = document.createElement("div");
  state.progressionBar.id = "netflix-barre-progression";
  barreContainer.appendChild(state.progressionBar);

  const progressTooltip = document.createElement("div");
  progressTooltip.id = "netflix-progress-tooltip";
  progressTooltip.textContent = "00:00";
  document.body.appendChild(progressTooltip);
  state.progressTooltip = progressTooltip;

  const updateTooltipPosition = (e: MouseEvent) => {
    const duration = getEffectiveDuration();
    if (!state.videoElement || !duration) return;

    const rect = barreContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(rect.width, x));

    const pct = x / rect.width;
    const seconds = pct * duration;

    progressTooltip.style.left = `${rect.left + x}px`;
    progressTooltip.style.top = `${rect.top - 36}px`;
    progressTooltip.textContent = timeFormat(seconds);
  };

  barreContainer.addEventListener("mousemove", updateTooltipPosition);
  barreContainer.addEventListener("mouseenter", (e) => {
    updateTooltipPosition(e);
    progressTooltip.setAttribute("data-visible", "1");
  });
  barreContainer.addEventListener("mouseleave", () => {
    progressTooltip.removeAttribute("data-visible");
  });

  barreContainer.addEventListener("click", (e) => {
    const rect = barreContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;

    const duration = getEffectiveDuration();
    const totalVideoTime = Math.floor(duration);
    const seekTime = Math.floor((percent / 100) * totalVideoTime * 1000);

    window.dispatchEvent(new CustomEvent("netflixSeekTo", { detail: seekTime }));
  });

  state.screenTime = document.createElement("div");
  state.screenTime.id = "netflix-temps";
  state.screenTime.textContent = "00:00 / 00:00";

  topRow.appendChild(barreContainer);
  topRow.appendChild(state.screenTime);

  // --- BOTTOM ROW (Controls) ---
  const bottomRow = document.createElement("div");
  bottomRow.className = "netflix-bottom-row";

  // Left controls: Play/Pause, Rewind 10, Forward 10, Volume
  const controlsLeft = document.createElement("div");
  controlsLeft.className = "controls-left";

  state.buttonPlayPause = document.createElement("button");
  state.buttonPlayPause.id = "netflix-play-pause";
  state.buttonPlayPause.title = state.videoElement.paused ? t("playTooltip") : t("pauseTooltip");
  state.buttonPlayPause.innerHTML = state.videoElement.paused ? ICONS.play : ICONS.pause;

  const rewindButton = document.createElement("button");
  rewindButton.id = "netflix-rewind-10";
  rewindButton.title = t("rewindTooltip");
  rewindButton.innerHTML = ICONS.rewind10;

  const forwardButton = document.createElement("button");
  forwardButton.id = "netflix-forward-10";
  forwardButton.title = t("forwardTooltip");
  forwardButton.innerHTML = ICONS.forward10;

  const volumeContainer = document.createElement("div");
  volumeContainer.id = "netflix-volume-container";

  const volumeIcon = document.createElement("div");
  volumeIcon.id = "netflix-volume-icon";
  volumeIcon.title = t("volumeTooltip");
  volumeIcon.innerHTML = getVolumeIcon(state.videoElement);

  const volumeSliderContainer = document.createElement("div");
  volumeSliderContainer.id = "netflix-volume-slider-container";

  state.volumeSlider = document.createElement("input");
  state.volumeSlider.type = "range";
  state.volumeSlider.id = "netflix-volume-slider";
  state.volumeSlider.min = "0";
  state.volumeSlider.max = "100";
  const initialVolPct = state.videoElement.muted ? 0 : Math.round(state.videoElement.volume * 100);
  state.volumeSlider.value = initialVolPct.toString();
  state.volumeSlider.style.setProperty("--volume-pct", `${initialVolPct}%`);

  volumeSliderContainer.appendChild(state.volumeSlider);
  volumeContainer.appendChild(volumeIcon);
  volumeContainer.appendChild(volumeSliderContainer);

  controlsLeft.appendChild(state.buttonPlayPause);
  controlsLeft.appendChild(rewindButton);
  controlsLeft.appendChild(forwardButton);
  controlsLeft.appendChild(volumeContainer);

  // Center: Show Title & Episode Title
  const controlsCenter = document.createElement("div");
  controlsCenter.className = "controls-center";
  controlsCenter.id = "netflix-title-display";
  controlsCenter.innerHTML = `
    <span class="netflix-show-title">${state.episodeTitle || ""}</span>
    ${state.episodeSubtitle ? `<span class="netflix-episode-title">${state.episodeSubtitle}</span>` : ""}
  `;

  // Right controls: Next Episode, Episodes list, Subtitles, Speed, Autoplay, Fullscreen
  const controlsRight = document.createElement("div");
  controlsRight.className = "controls-right";

  const nextEpisodeButton = document.createElement("button");
  nextEpisodeButton.id = "netflix-next-episode";
  nextEpisodeButton.title = t("nextEpisodeTooltip");
  nextEpisodeButton.innerHTML = ICONS.nextEpisode;
  nextEpisodeButton.disabled = true;
  nextEpisodeButton.style.opacity = "0.5";

  getNextEpisodeId().then((nextEpisodeId) => {
    if (nextEpisodeId) {
      nextEpisodeButton.disabled = false;
      nextEpisodeButton.style.opacity = "1";
    }
  });

  const episodesButton = document.createElement("button");
  episodesButton.id = "netflix-episodes-button";
  episodesButton.title = t("episodesTooltip");
  episodesButton.innerHTML = ICONS.episodes;

  const subtitleToggle = document.createElement("button");
  subtitleToggle.id = "netflix-subtitle-toggle";
  subtitleToggle.title = t("subtitlesTooltip");
  subtitleToggle.innerHTML = ICONS.subtitles;

  const speedToggleButton = document.createElement("button");
  speedToggleButton.id = "netflix-speed-toggle";
  speedToggleButton.title = t("speedTooltip", "1");
  speedToggleButton.innerHTML = ICONS.speed;

  const speedOptions = [1, 1.25, 1.5, 0.75, 0.5];
  let currentSpeedIndex = 0;

  speedToggleButton.addEventListener("click", () => {
    currentSpeedIndex = (currentSpeedIndex + 1) % speedOptions.length;
    if (state.videoElement) {
      state.videoElement.playbackRate = speedOptions[currentSpeedIndex];
      const speedLabel = String(speedOptions[currentSpeedIndex]);
      speedToggleButton.title = t("speedTooltip", speedLabel);
      showMessage(t("speedMessage", speedLabel));
    }
  });

  const autoplayToggleButton = document.createElement("button");
  autoplayToggleButton.id = "netflix-autoplay-toggle";
  autoplayToggleButton.title = t("autoplayTooltipOff");
  autoplayToggleButton.innerHTML = ICONS.autoplay;

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(["autoplayNextEpisode"], (result) => {
      if (result.autoplayNextEpisode !== undefined) {
        state.autoplayNextEpisode = result.autoplayNextEpisode;
        updateAutoplayButton();
      }
    });
  }

  function updateAutoplayButton() {
    if (state.autoplayNextEpisode) {
      autoplayToggleButton.title = t("autoplayTooltipOn");
      autoplayToggleButton.style.opacity = "1";
    } else {
      autoplayToggleButton.title = t("autoplayTooltipOff");
      autoplayToggleButton.style.opacity = "0.5";
    }
  }

  autoplayToggleButton.addEventListener("click", () => {
    state.autoplayNextEpisode = !state.autoplayNextEpisode;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ autoplayNextEpisode: state.autoplayNextEpisode });
    }
    updateAutoplayButton();
    showMessage(state.autoplayNextEpisode ? t("autoplayMessageOn") : t("autoplayMessageOff"));
  });

  state.buttonFullScreen = document.createElement("button");
  state.buttonFullScreen.id = "netflix-plein-ecran";
  state.buttonFullScreen.title = t("fullscreenTooltip");
  state.buttonFullScreen.innerHTML = document.fullscreenElement ? ICONS.exitFullscreen : ICONS.fullscreen;

  controlsRight.appendChild(nextEpisodeButton);
  controlsRight.appendChild(episodesButton);
  controlsRight.appendChild(subtitleToggle);
  controlsRight.appendChild(speedToggleButton);
  controlsRight.appendChild(autoplayToggleButton);
  controlsRight.appendChild(state.buttonFullScreen);

  bottomRow.appendChild(controlsLeft);
  bottomRow.appendChild(controlsCenter);
  bottomRow.appendChild(controlsRight);

  state.controllerElement.appendChild(topRow);
  state.controllerElement.appendChild(bottomRow);

  // Click & Event handlers
  const handleControlsClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    if (target === state.buttonPlayPause || target.closest("#netflix-play-pause")) {
      if (state.videoElement) {
        if (state.videoElement.paused) {
          state.videoElement.play();
          if (state.buttonPlayPause) state.buttonPlayPause.innerHTML = ICONS.pause;
        } else {
          state.videoElement.pause();
          if (state.buttonPlayPause) state.buttonPlayPause.innerHTML = ICONS.play;
        }
      }
    } else if (target === rewindButton || target.closest("#netflix-rewind-10")) {
      if (state.videoElement) {
        const duration = getEffectiveDuration();
        const newTime = Math.max(0, (state.videoElement.currentTime - 10) * 1000);
        window.dispatchEvent(new CustomEvent("netflixSeekTo", { detail: Math.floor(newTime) }));
        showMessage(t("rewindMessage"));
      }
    } else if (target === forwardButton || target.closest("#netflix-forward-10")) {
      if (state.videoElement) {
        const duration = getEffectiveDuration();
        const maxTimeMs = duration > 0 ? duration * 1000 : (state.videoElement.currentTime + 10) * 1000;
        const newTime = Math.min(maxTimeMs, (state.videoElement.currentTime + 10) * 1000);
        window.dispatchEvent(new CustomEvent("netflixSeekTo", { detail: Math.floor(newTime) }));
        showMessage(t("forwardMessage"));
      }
    } else if (target === state.buttonFullScreen || target.closest("#netflix-plein-ecran")) {
      toggleFullScreen();
    } else if (target === volumeIcon || target.closest("#netflix-volume-icon")) {
      if (state.videoElement) {
        if (state.videoElement.muted || state.videoElement.volume === 0) {
          state.videoElement.muted = false;
          if (state.videoElement.volume === 0) state.videoElement.volume = 1.0;
          const pct = Math.round(state.videoElement.volume * 100);
          if (state.volumeSlider) {
            state.volumeSlider.value = pct.toString();
            state.volumeSlider.style.setProperty("--volume-pct", `${pct}%`);
          }
        } else {
          state.videoElement.muted = true;
          if (state.volumeSlider) {
            state.volumeSlider.value = "0";
            state.volumeSlider.style.setProperty("--volume-pct", "0%");
          }
        }
        volumeIcon.innerHTML = getVolumeIcon(state.videoElement);
      }
    } else if (target === nextEpisodeButton || target.closest("#netflix-next-episode")) {
      jumpToNextEpisode();
    } else if (target === episodesButton || target.closest("#netflix-episodes-button")) {
      const panel = document.getElementById("netflix-episodes-list");
      if (panel) {
        panel.remove();
        state.episodesListOpen = false;
      } else {
        showEpisodesList();
      }
    } else if (target === subtitleToggle || target.closest("#netflix-subtitle-toggle")) {
      toggleSubtitleSettings(doYourJob, showMessage, showController);
    }
  };

  state.volumeSlider.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    const volume = parseFloat(target.value) / 100;
    if (state.videoElement) {
      state.videoElement.volume = volume;
      state.videoElement.muted = volume === 0;
      target.style.setProperty("--volume-pct", `${target.value}%`);
      volumeIcon.innerHTML = getVolumeIcon(state.videoElement);
    }
  });

  state.controllerElement.addEventListener("click", handleControlsClick);

  state.videoElement.addEventListener("play", () => {
    if (state.buttonPlayPause) state.buttonPlayPause.innerHTML = ICONS.pause;
    showController();
  });

  state.videoElement.addEventListener("pause", () => {
    if (state.buttonPlayPause) state.buttonPlayPause.innerHTML = ICONS.play;
    if (state.controllerElement) {
      state.controllerElement.classList.remove("hidden");
      state.isControllerVisible = true;
    }
  });

  state.videoElement.addEventListener("seeked", cancelNetflixCountdown);
  state.videoElement.addEventListener("timeupdate", updateSeamlessDistance);

  state.videoElement.addEventListener("ended", () => {
    if (state.autoplayNextEpisode) {
      showMessage(t("nextEpisodePlayingMessage"));
      setTimeout(() => {
        jumpToNextEpisode();
      }, 1500);
    }
  });

  state.videoElement.addEventListener("volumechange", () => {
    if (!state.videoElement) return;
    const isMuted = state.videoElement.muted || state.videoElement.volume === 0;
    const pct = isMuted ? 0 : Math.round(state.videoElement.volume * 100);
    if (state.volumeSlider) {
      state.volumeSlider.value = pct.toString();
      state.volumeSlider.style.setProperty("--volume-pct", `${pct}%`);
    }
    if (volumeIcon) {
      volumeIcon.innerHTML = getVolumeIcon(state.videoElement);
    }
  });

  setupKeyboardShortcuts(updateProgression, toggleFullScreen, showController, showMessage, isOnNetflixWatch);

  setTimeout(() => {
    if (videoAreaOverlay) videoAreaOverlay.focus();
  }, 500);

  state.videoElement.addEventListener("mousemove", () => showController());
  document.addEventListener("mousemove", () => showController());

  if (state.videoOverlay) document.body.appendChild(state.videoOverlay);
  document.body.appendChild(state.controllerElement);
  state.isControllerAdded = true;
  document.body.classList.add("nikflix-active");

  updateProgression();

  const rafCallback = () => {
    updateProgression();
    if (state.controllerElement) {
      state.progressionIntervalId = requestAnimationFrame(rafCallback);
    }
  };
  state.progressionIntervalId = requestAnimationFrame(rafCallback);

  if (!state.videoElement.paused) {
    showController();
  }

  state.subtitleSettingsPanel = createSubtitleSettings(doYourJob, showMessage, showController);

  createBackButton();
  createTipsButton();
  fetchAndCacheCurrentEpisodeDuration(timeFormat);

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(["status"], (result) => {
      const status = result.status || "enable";
      const controller = document.getElementById(CONTROLLER_ID);
      const overlayArea = document.getElementById("netflix-video-area-overlay");
      const overlay = document.getElementById("netflix-video-overlay");

      if (status === "disable" && controller) {
        controller.style.display = "none";
        if (overlayArea) overlayArea.style.display = "none";
        if (overlay) overlay.style.display = "none";
      }
    });
  }
}

export function doYourJob(): void {
  window.dispatchEvent(new CustomEvent("GetAudioTracksList"));
  window.dispatchEvent(new CustomEvent("GetSubtitleTracksList"));

  if (isOnNetflixWatch()) {
    removeElementsByClasses(CLASSES_TO_REMOVE);

    if (state.controllerTimerId) {
      clearTimeout(state.controllerTimerId as number);
      state.controllerTimerId = null;
    }

    const startController = () => {
      state.controllerTimerId = null;
      const alreadyBuilt = state.isControllerAdded;
      addMediaController();

      if (alreadyBuilt || !state.isControllerAdded || !state.videoElement) return;

      state.videoElement.play();
      if (state.buttonPlayPause) {
        state.buttonPlayPause.innerHTML = ICONS.pause;
      }
    };

    const video = document.querySelector("video");
    if (video && video.readyState >= 1) {
      startController();
    } else {
      if (video) {
        video.addEventListener("loadedmetadata", startController, { once: true });
      }
      state.controllerTimerId = setTimeout(startController, CONTROLLER_INIT_DELAY);
    }
  } else {
    removeElementsByClasses(CLASSES_TO_REMOVE);
    cleanController();
  }
}