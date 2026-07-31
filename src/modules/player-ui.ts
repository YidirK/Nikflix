import { state, CONTROLLER_ID, CONTROLLER_HIDE_DELAY, CONTROLLER_INIT_DELAY, NETFLIX_WATCH_REGEX } from './player-state';
import { CLASSES_TO_REMOVE, removeElementsByClasses } from './modal-blocker';
import { adjustOverlayForTeleparty, watchTelepartyFrame } from './teleparty';
import { setupKeyboardShortcuts } from './shortcuts';
import { createSubtitleSettings, toggleSubtitleSettings } from './subtitles-audio';
import { getIdFromUrl, getNextEpisodeId, fetchAndCacheCurrentEpisodeDuration, jumpToNextEpisode } from './episodes';

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

    const seasons = data.video.seasons.sort((a: any, b: any) => a.seq - b.seq);

    panel.innerHTML = `
      <h3>${data.video.title}</h3>
      ${seasons
        .map(
          (season: any) => `
          <div class="season-container">
              <div class="season-header">Season ${season.seq}</div>
              ${season.episodes
                .map(
                  (episode: any) => `
                  <div class="episode-item ${
                    episode.id.toString() === curEpisodeId ? "current" : ""
                  }" data-episode-id="${episode.id}">
                      <span class="episode-number">E${episode.seq}</span>
                      <span class="episode-title">${episode.title}</span>
                      <span class="episode-duration">${formatDuration(episode.runtime)}</span>
                  </div>
              `
                )
                .join("")}
          </div>
      `
        )
        .join("")}
    `;

    document.body.appendChild(panel);
    state.episodesListOpen = true;

    panel.querySelectorAll(".episode-item").forEach((item) => {
      item.addEventListener("click", () => {
        const episodeId = item.getAttribute("data-episode-id");
        if (episodeId) {
          window.location.href = `https://www.netflix.com/watch/${episodeId}`;
        }
      });
    });

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

export function updateProgression(): void {
  const { videoElement, progressionBar, screenTime } = state;
  if (!videoElement || !progressionBar || !screenTime) return;

  const duration = state.currentEpisodeDuration || videoElement.duration;
  if (duration) {
    const percentage = (videoElement.currentTime / duration) * 100;
    progressionBar.style.width = `${percentage}%`;

    const currentTime = Math.floor(videoElement.currentTime);
    const totalTime = Math.floor(duration);

    if (state.lastScreenTime !== currentTime || state.lastTotalTime !== totalTime) {
      state.lastScreenTime = currentTime;
      state.lastTotalTime = totalTime;
      screenTime.textContent = `${timeFormat(currentTime)} / ${timeFormat(totalTime)}`;
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
      state.buttonFullScreen.innerHTML = `
    <svg
      width="24"
      height="24"
      viewBox="0 0 385.331 385.331"
      xmlns="http://www.w3.org/2000/svg"
      fill="white"
    >
      <g>
        <path d="M264.943,156.665h108.273c6.833,0,11.934-5.39,11.934-12.211c0-6.833-5.101-11.85-11.934-11.838h-96.242V36.181
          c0-6.833-5.197-12.03-12.03-12.03s-12.03,5.197-12.03,12.03v108.273c0,0.036,0.012,0.06,0.012,0.084
          c0,0.036-0.012,0.06-0.012,0.096C252.913,151.347,258.23,156.677,264.943,156.665z"/>
        <path d="M120.291,24.247c-6.821,0-11.838,5.113-11.838,11.934v96.242H12.03c-6.833,0-12.03,5.197-12.03,12.03
          c0,6.833,5.197,12.03,12.03,12.03h108.273c0.036,0,0.06-0.012,0.084-0.012c0.036,0,0.06,0.012,0.096,0.012
          c6.713,0,12.03-5.317,12.03-12.03V36.181C132.514,29.36,127.124,24.259,120.291,24.247z"/>
        <path d="M120.387,228.666H12.115c-6.833,0.012-11.934,5.39-11.934,12.223c0,6.833,5.101,11.85,11.934,11.838h96.242v96.423
          c0,6.833,5.197,12.03,12.03,12.03c6.833,0,12.03-5.197,12.03-12.03V240.877c0-0.036-0.012-0.06-0.012-0.084
          c0-0.036,0.012-0.06,0.012-0.096C132.418,233.983,127.1,228.666,120.387,228.666z"/>
        <path d="M373.3,228.666H265.028c-0.036,0-0.06,0.012-0.084,0.012c-0.036,0-0.06-0.012-0.096-0.012
          c-6.713,0-12.03,5.317-12.03,12.03v108.273c0,6.833,5.39,11.922,12.223,11.934c6.821,0.012,11.838-5.101,11.838-11.922v-96.242
          H373.3c6.833,0,12.03-5.197,12.03-12.03S380.134,228.678,373.3,228.666z"/>
      </g>
    </svg>
  `;
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    if (state.buttonFullScreen) {
      state.buttonFullScreen.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.94358 1.25L10 1.25C10.4142 1.25 10.75 1.58579 10.75 2C10.75 2.41421 10.4142 2.75 10 2.75C8.09318 2.75 6.73851 2.75159 5.71085 2.88976C4.70476 3.02502 4.12511 3.27869 3.7019 3.7019C3.27869 4.12511 3.02502 4.70476 2.88976 5.71085C2.75159 6.73851 2.75 8.09318 2.75 10C2.75 10.4142 2.41421 10.75 2 10.75C1.58579 10.75 1.25 10.4142 1.25 10L1.25 9.94358C1.24998 8.10582 1.24997 6.65019 1.40314 5.51098C1.56076 4.33856 1.89288 3.38961 2.64124 2.64124C3.38961 1.89288 4.33856 1.56076 5.51098 1.40314C6.65019 1.24997 8.10582 1.24998 9.94358 1.25ZM18.2892 2.88976C17.2615 2.75159 15.9068 2.75 14 2.75C13.5858 2.75 13.25 2.41421 13.25 2C13.25 1.58579 13.5858 1.25 14 1.25L14.0564 1.25C15.8942 1.24998 17.3498 1.24997 18.489 1.40314C19.6614 1.56076 20.6104 1.89288 21.3588 2.64124C22.1071 3.38961 22.4392 4.33856 22.5969 5.51098C22.75 6.65019 22.75 8.10583 22.75 9.94359V10C22.75 10.4142 22.4142 10.75 22 10.75C21.5858 10.75 21.25 10.4142 21.25 10C21.25 8.09318 21.2484 6.73851 21.1102 5.71085C20.975 4.70476 20.7213 4.12511 20.2981 3.7019C19.8749 3.27869 19.2952 3.02502 18.2892 2.88976ZM2 13.25C2.41421 13.25 2.75 13.5858 2.75 14C2.75 15.9068 2.75159 17.2615 2.88976 18.2892C3.02502 19.2952 3.27869 19.8749 3.7019 20.2981C4.12511 20.7213 4.70476 20.975 5.71085 21.1102C6.73851 21.2484 8.09318 21.25 10 21.25C10.4142 21.25 10.75 21.5858 10.75 22C10.75 22.4142 10.4142 22.75 10 22.75H9.94359C8.10583 22.75 6.65019 22.75 5.51098 22.5969C4.33856 22.4392 3.38961 22.1071 2.64124 21.3588C1.89288 20.6104 1.56076 19.6614 1.40314 18.489C1.24997 17.3498 1.24998 15.8942 1.25 14.0564L1.25 14C1.25 13.5858 1.58579 13.25 2 13.25ZM22 13.25C22.4142 13.25 22.75 13.5858 22.75 14V14.0564C22.75 15.8942 22.75 17.3498 22.5969 18.489C22.4392 19.6614 22.1071 20.6104 21.3588 21.3588C20.6104 22.1071 19.6614 22.4392 18.489 22.5969C17.3498 22.75 15.8942 22.75 14.0564 22.75H14C13.5858 22.75 13.25 22.4142 13.25 22C13.25 21.5858 13.5858 21.25 14 21.25C15.9068 21.25 17.2615 21.2484 18.2892 21.1102C19.2952 20.975 19.8749 20.7213 20.2981 20.2981C20.7213 19.8749 20.975 19.2952 21.1102 18.2892C21.2484 17.2615 21.25 15.9068 21.25 14C21.25 13.5858 21.5858 13.25 22 13.25Z" fill="#ffffff"></path></svg>';
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

  if (!state.messageOverlay) {
    state.messageOverlay = document.createElement("div");
    state.messageOverlay.id = "netflix-message-overlay";
    document.body.appendChild(state.messageOverlay);
  }

  state.messageOverlay.textContent = message;
  state.messageOverlay.style.opacity = "1";

  state.messageTimer = setTimeout(() => {
    if (state.messageOverlay) state.messageOverlay.style.opacity = "0";
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
    if (target.closest("#mon-controleur-netflix") || target.closest("#netflix-subtitle-settings")) return;

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
          state.buttonPlayPause.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 19H18V5H14V19ZM6 19H10V5H6V19Z" fill="white"/></svg>';
        }
      } else {
        state.videoElement.pause();
        if (state.buttonPlayPause) {
          state.buttonPlayPause.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="white"/></svg>';
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
    if (!target.closest("#mon-controleur-netflix") && !target.closest("#netflix-subtitle-settings")) {
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
  state.backButton.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="white"/></svg>';

  state.backButton.style.position = "fixed";
  state.backButton.style.top = "20px";
  state.backButton.style.left = "20px";
  state.backButton.style.zIndex = "10000";
  state.backButton.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  state.backButton.style.border = "none";
  state.backButton.style.borderRadius = "50%";
  state.backButton.style.width = "40px";
  state.backButton.style.height = "40px";
  state.backButton.style.cursor = "pointer";
  state.backButton.style.display = "flex";
  state.backButton.style.alignItems = "center";
  state.backButton.style.justifyContent = "center";
  state.backButton.style.transition = "all 0.2s ease, opacity 0.3s ease";
  state.backButton.style.opacity = "0";

  state.backButton.addEventListener("mouseover", () => {
    if (state.backButton) {
      state.backButton.style.backgroundColor = "rgba(229, 9, 20, 0.8)";
      state.backButton.style.transform = "scale(1.1)";
    }
  });

  state.backButton.addEventListener("mouseout", () => {
    if (state.backButton) {
      state.backButton.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
      state.backButton.style.transform = "scale(1)";
    }
  });

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
  state.tipsButton.innerHTML =
    '<svg viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M566 268.4v66.3H353.9v-66.3h-66.3v-79.5h357.9v79.5H566z" fill="#FFFFFF"></path><path d="M558.5 319.2l98.7 86.4c72.6 50.6 115.8 133.5 115.8 222 0 88-63.7 163-150.5 177.4-55 9.1-110.1 13.6-165.1 13.6s-110.1-4.5-165.1-13.6c-86.8-14.3-150.5-89.4-150.5-177.4 0-88.5 43.3-171.3 115.8-221.9l113.7-86.4h187.2z" fill="#FFFFFF"></path><path d="M457.4 845.1c-56.2 0-113.2-4.7-169.4-14C188 814.6 115.3 729 115.3 627.6c0-97.1 47.5-188.2 127.2-243.7l119.9-91.2h206l105.1 92c78.9 55.6 126 146.2 126 242.8 0 101.4-72.6 187-172.7 203.5-56.1 9.4-113.1 14.1-169.4 14.1z m-77.2-499.4l-106.5 81c-66.3 46.2-105.4 121.1-105.4 200.8 0 75.3 54 138.9 128.3 151.2 106.7 17.6 214.9 17.6 321.6 0 74.3-12.3 128.3-75.9 128.3-151.2 0-79.7-39.1-154.6-104.5-200.2l-2.3-1.8-91.2-79.8H380.2z" fill="#333333"></path><path d="M354 305l-66.7-57.3c-13.8-8.9-21-22.7-20.7-36.7m395.1 0.1c0 14.7-8.3 28.4-22.1 36.5L561.9 308" fill="#FFFFFF"></path><path d="M561.9 334.5c-7.9 0-15.7-3.5-21-10.3-9-11.6-6.9-28.2 4.7-37.2l80.5-62.2c5.7-3.3 9-8.5 9-13.7 0-14.6 11.9-26.5 26.5-26.5s26.5 11.9 26.5 26.5c0 23.6-12.5 45.3-33.6 58.4l-76.6 59.4c-4.6 3.8-10.3 5.6-16 5.6z m-208-3c-6.1 0-12.3-2.1-17.3-6.4l-65.4-56.3c-20-13.6-31.6-35.3-31.2-58.4 0.3-14.6 12.8-26.4 27-26 14.6 0.3 26.3 12.4 26 27-0.1 5.3 3 10.4 8.5 13.9l2.9 2.2 66.7 57.3c11.1 9.5 12.4 26.3 2.8 37.4-5.1 6.2-12.5 9.3-20 9.3z" fill="#333333"></path><path d="M365.4 229.3c-14.6 0-26.5-11.9-26.5-26.5 0-6.6-9.8-13.9-22.9-13.9s-22.9 7.4-22.9 13.9c0 14.6-11.9 26.5-26.5 26.5s-26.5-11.9-26.5-26.5c0-36.9 34-67 75.9-67s75.9 30 75.9 67c0 14.7-11.9 26.5-26.5 26.5zM562.9 229.3c-14.6 0-26.5-11.9-26.5-26.5 0-6.6-9.8-13.9-22.9-13.9-13.1 0-22.9 7.4-22.9 13.9 0 14.6-11.9 26.5-26.5 26.5s-26.5-11.9-26.5-26.5c0-36.9 34.1-67 75.9-67s75.9 30 75.9 67c0.1 14.7-11.8 26.5-26.5 26.5z" fill="#333333"></path><path d="M661.7 229.3c-14.6 0-26.5-11.9-26.5-26.5 0-6.6-9.8-13.9-22.9-13.9s-22.9 7.4-22.9 13.9c0 14.6-11.9 26.5-26.5 26.5s-26.5-11.8-26.5-26.5c0-36.9 34-67 75.9-67s75.9 30 75.9 67c0 14.7-11.8 26.5-26.5 26.5zM464.2 229.3c-14.6 0-26.5-11.9-26.5-26.5 0-6.6-9.8-13.9-22.9-13.9s-22.9 7.4-22.9 13.9c0 14.6-11.9 26.5-26.5 26.5s-26.5-11.9-26.5-26.5c0-36.9 34-67 75.9-67s75.9 30 75.9 67c0 14.7-11.9 26.5-26.5 26.5z" fill="#333333"></path><path d="M679.1 621.5m-205.1 0a205.1 205.1 0 1 0 410.2 0 205.1 205.1 0 1 0-410.2 0Z" fill="#9dff5c"></path><path d="M679.1 853.1c-127.7 0-231.6-103.9-231.6-231.6 0-127.7 103.9-231.6 231.6-231.6s231.6 103.9 231.6 231.6c0 127.7-103.9 231.6-231.6 231.6z m0-410.2C580.6 442.9 500.4 523 500.4 621.5S580.5 800.1 679 800.1 857.7 720 857.7 621.5s-80.2-178.6-178.6-178.6z" fill="#333333"></path><path d="M720.47 621.453l-41.436 41.436-41.437-41.436 41.436-41.437z" fill="#FFFFFF"></path><path d="M679.079 737.919l-116.46-116.46 116.46-116.461 116.46 116.46-116.46 116.46z m-41.508-116.46l41.437 41.436 41.436-41.437-41.436-41.436-41.437 41.436z" fill="#333333"></path><path d="M591.6 302.3l76-20.4c14.1-3.8 28.7 4.6 32.5 18.7 3.8 14.1-4.6 28.7-18.7 32.5l-76 20.4c-14.1 3.8-28.7-4.6-32.5-18.7-3.8-14.2 4.6-28.7 18.7-32.5z" fill="#333333"></path></g></svg>';

  state.tipsButton.style.position = "fixed";
  state.tipsButton.style.top = "20px";
  state.tipsButton.style.right = "20px";
  state.tipsButton.style.zIndex = "10000";
  state.tipsButton.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  state.tipsButton.style.border = "none";
  state.tipsButton.style.borderRadius = "50%";
  state.tipsButton.style.width = "40px";
  state.tipsButton.style.height = "40px";
  state.tipsButton.style.cursor = "pointer";
  state.tipsButton.style.display = "flex";
  state.tipsButton.style.alignItems = "center";
  state.tipsButton.style.justifyContent = "center";
  state.tipsButton.style.transition = "all 0.2s ease, opacity 0.3s ease";
  state.tipsButton.style.opacity = "0";

  state.tipsButton.addEventListener("mouseover", () => {
    if (state.tipsButton) {
      state.tipsButton.style.backgroundColor = "rgba(229, 9, 20, 0.8)";
      state.tipsButton.style.transform = "scale(1.1)";
    }
  });

  state.tipsButton.addEventListener("mouseout", () => {
    if (state.tipsButton) {
      state.tipsButton.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
      state.tipsButton.style.transform = "scale(1)";
    }
  });

  state.tipsButton.addEventListener("click", () => {
    window.open("https://ko-fi.com/yidirk", "_blank");
  });

  document.body.appendChild(state.tipsButton);
}

export function addMediaController(): void {
  if (state.isControllerAdded) return;

  cleanController();

  state.videoElement = document.querySelector("video");
  if (!state.videoElement) return;

  createVideoOverlay();
  const videoAreaOverlay = createVideoAreaOverlay();

  state.controllerElement = document.createElement("div");
  state.controllerElement.id = CONTROLLER_ID;
  state.controllerElement.tabIndex = -1;
  state.controllerElement.style.outline = "none";

  const controlsLeft = document.createElement("div");
  controlsLeft.className = "controls-left";

  const controlsCenter = document.createElement("div");
  controlsCenter.className = "controls-center";

  const controlsRight = document.createElement("div");
  controlsRight.className = "controls-right";

  state.buttonPlayPause = document.createElement("button");
  state.buttonPlayPause.id = "netflix-play-pause";
  state.buttonPlayPause.innerHTML = state.videoElement.paused
    ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="white"/></svg>'
    : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 19H18V5H14V19ZM6 19H10V5H6V19Z" fill="white"/></svg>';

  state.buttonFullScreen = document.createElement("button");
  state.buttonFullScreen.id = "netflix-plein-ecran";
  state.buttonFullScreen.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.94358 1.25L10 1.25C10.4142 1.25 10.75 1.58579 10.75 2C10.75 2.41421 10.4142 2.75 10 2.75C8.09318 2.75 6.73851 2.75159 5.71085 2.88976C4.70476 3.02502 4.12511 3.27869 3.7019 3.7019C3.27869 4.12511 3.02502 4.70476 2.88976 5.71085C2.75159 6.73851 2.75 8.09318 2.75 10C2.75 10.4142 2.41421 10.75 2 10.75C1.58579 10.75 1.25 10.4142 1.25 10L1.25 9.94358C1.24998 8.10582 1.24997 6.65019 1.40314 5.51098C1.56076 4.33856 1.89288 3.38961 2.64124 2.64124C3.38961 1.89288 4.33856 1.56076 5.51098 1.40314C6.65019 1.24997 8.10582 1.24998 9.94358 1.25ZM18.2892 2.88976C17.2615 2.75159 15.9068 2.75 14 2.75C13.5858 2.75 13.25 2.41421 13.25 2C13.25 1.58579 13.5858 1.25 14 1.25L14.0564 1.25C15.8942 1.24998 17.3498 1.24997 18.489 1.40314C19.6614 1.56076 20.6104 1.89288 21.3588 2.64124C22.1071 3.38961 22.4392 4.33856 22.5969 5.51098C22.75 6.65019 22.75 8.10583 22.75 9.94359V10C22.75 10.4142 22.4142 10.75 22 10.75C21.5858 10.75 21.25 10.4142 21.25 10C21.25 8.09318 21.2484 6.73851 21.1102 5.71085C20.975 4.70476 20.7213 4.12511 20.2981 3.7019C19.8749 3.27869 19.2952 3.02502 18.2892 2.88976ZM2 13.25C2.41421 13.25 2.75 13.5858 2.75 14C2.75 15.9068 2.75159 17.2615 2.88976 18.2892C3.02502 19.2952 3.27869 19.8749 3.7019 20.2981C4.12511 20.7213 4.70476 20.975 5.71085 21.1102C6.73851 21.2484 8.09318 21.25 10 21.25C10.4142 21.25 10.75 21.5858 10.75 22C10.75 22.4142 10.4142 22.75 10 22.75H9.94359C8.10583 22.75 6.65019 22.75 5.51098 22.5969C4.33856 22.4392 3.38961 22.1071 2.64124 21.3588C1.89288 20.6104 1.56076 19.6614 1.40314 18.489C1.24997 17.3498 1.24998 15.8942 1.25 14.0564L1.25 14C1.25 13.5858 1.58579 13.25 2 13.25ZM22 13.25C22.4142 13.25 22.75 13.5858 22.75 14V14.0564C22.75 15.8942 22.75 17.3498 22.5969 18.489C22.4392 19.6614 22.1071 20.6104 21.3588 21.3588C20.6104 22.1071 19.6614 22.4392 18.489 22.5969C17.3498 22.75 15.8942 22.75 14.0564 22.75H14C13.5858 22.75 13.25 22.4142 13.25 22C13.25 21.5858 13.5858 21.25 14 21.25C15.9068 21.25 17.2615 21.2484 18.2892 21.1102C19.2952 20.975 19.8749 20.7213 20.2981 20.2981C20.7213 19.8749 20.975 19.2952 21.1102 18.2892C21.2484 17.2615 21.25 15.9068 21.25 14C21.25 13.5858 21.5858 13.25 22 13.25Z" fill="#ffffff"></path></svg>';

  const nextEpisodeButton = document.createElement("button");
  nextEpisodeButton.id = "netflix-next-episode";
  nextEpisodeButton.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" role="img" viewBox="0 0 24 24" width="24" height="24" data-icon="NextEpisodeStandard" aria-hidden="true"><path fill="white" d="M22 3H20V21H22V3ZM4.28615 3.61729C3.28674 3.00228 2 3.7213 2 4.89478V19.1052C2 20.2787 3.28674 20.9977 4.28615 20.3827L15.8321 13.2775C16.7839 12.6918 16.7839 11.3082 15.8321 10.7225L4.28615 3.61729ZM4 18.2104V5.78956L14.092 12L4 18.2104Z" clip-rule="evenodd" fill-rule="evenodd"></path></svg>';
  nextEpisodeButton.disabled = true;
  nextEpisodeButton.style.opacity = "0.5";

  getNextEpisodeId().then((nextEpisodeId) => {
    if (nextEpisodeId) {
      nextEpisodeButton.disabled = false;
      nextEpisodeButton.style.opacity = "1";
    }
  });

  const subtitleToggle = document.createElement("button");
  subtitleToggle.id = "netflix-subtitle-toggle";
  subtitleToggle.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20,4H4C2.9,4 2,4.9 2,6V18C2,19.1 2.9,20 4,20H20C21.1,20 22,19.1 22,18V6C22,4.9 21.1,4 20,4M20,18H4V6H20V18M6,10H8V12H6V10M6,14H14V16H6V14M16,14H18V16H16V14M10,10H18V12H10Z" fill="white"/></svg>';

  const removeToggle = document.createElement("button");
  removeToggle.id = "netflix-remove-toggle";
  removeToggle.innerHTML =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V13C12.75 13.4142 12.4142 13.75 12 13.75C11.5858 13.75 11.25 13.4142 11.25 13V8C11.25 7.58579 11.5858 7.25 12 7.25Z" fill="#ffffff"></path> <path d="M12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z" fill="#ffffff"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M8.2944 4.47643C9.36631 3.11493 10.5018 2.25 12 2.25C13.4981 2.25 14.6336 3.11493 15.7056 4.47643C16.7598 5.81544 17.8769 7.79622 19.3063 10.3305L19.7418 11.1027C20.9234 13.1976 21.8566 14.8523 22.3468 16.1804C22.8478 17.5376 22.9668 18.7699 22.209 19.8569C21.4736 20.9118 20.2466 21.3434 18.6991 21.5471C17.1576 21.75 15.0845 21.75 12.4248 21.75H11.5752C8.91552 21.75 6.84239 21.75 5.30082 21.5471C3.75331 21.3434 2.52637 20.9118 1.79099 19.8569C1.03318 18.7699 1.15218 17.5376 1.65314 16.1804C2.14334 14.8523 3.07658 13.1977 4.25818 11.1027L4.69361 10.3307C6.123 7.79629 7.24019 5.81547 8.2944 4.47643ZM9.47297 5.40432C8.49896 6.64148 7.43704 8.51988 5.96495 11.1299L5.60129 11.7747C4.37507 13.9488 3.50368 15.4986 3.06034 16.6998C2.6227 17.8855 2.68338 18.5141 3.02148 18.9991C3.38202 19.5163 4.05873 19.8706 5.49659 20.0599C6.92858 20.2484 8.9026 20.25 11.6363 20.25H12.3636C15.0974 20.25 17.0714 20.2484 18.5034 20.0599C19.9412 19.8706 20.6179 19.5163 20.9785 18.9991C21.3166 18.5141 21.3773 17.8855 20.9396 16.6998C20.4963 15.4986 19.6249 13.9488 18.3987 11.7747L18.035 11.1299C16.5629 8.51987 15.501 6.64148 14.527 5.40431C13.562 4.17865 12.8126 3.75 12 3.75C11.1874 3.75 10.4379 4.17865 9.47297 5.40432Z" fill="#ffffff"></path> </g></svg>';

  const barreContainer = document.createElement("div");
  barreContainer.id = "netflix-barre-container";

  state.progressionBar = document.createElement("div");
  state.progressionBar.id = "netflix-barre-progression";

  const progressTooltip = document.createElement("div");
  progressTooltip.id = "netflix-progress-tooltip";
  progressTooltip.textContent = "00:00";
  document.body.appendChild(progressTooltip);
  state.progressTooltip = progressTooltip;

  const updateTooltipPosition = (e: MouseEvent) => {
    const duration = state.currentEpisodeDuration || state.videoElement?.duration;
    if (!state.videoElement || !duration) return;

    const rect = barreContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(rect.width, x));

    const pct = x / rect.width;
    const seconds = pct * duration;

    progressTooltip.style.left = `${rect.left + x}px`;
    progressTooltip.style.top = `${rect.top - 32}px`;
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

  state.screenTime = document.createElement("div");
  state.screenTime.id = "netflix-temps";

  const volumeContainer = document.createElement("div");
  volumeContainer.id = "netflix-volume-container";

  const volumeIcon = document.createElement("div");
  volumeIcon.id = "netflix-volume-icon";
  volumeIcon.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.84-5 6.7v2.07c4-.91 7-4.49 7-8.77 0-4.28-3-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03V16c1.5-.71 2.5-2.24 2.5-4M3 9v6h4l5 5V4L7 9H3z" fill="white"/></svg>';

  if (state.videoElement.muted || state.videoElement.volume === 0) {
    volumeIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L9.91 6.09 12 8.18M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.26c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.32 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9" fill="white"/></svg>';
  }

  const volumeSliderContainer = document.createElement("div");
  volumeSliderContainer.id = "netflix-volume-slider-container";

  state.volumeSlider = document.createElement("input");
  state.volumeSlider.type = "range";
  state.volumeSlider.id = "netflix-volume-slider";
  state.volumeSlider.min = "0";
  state.volumeSlider.max = "100";
  state.volumeSlider.value = state.videoElement.muted ? "0" : (state.videoElement.volume * 100).toString();

  const episodesButton = document.createElement("button");
  episodesButton.id = "netflix-episodes-button";
  episodesButton.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M5.00004 16.8669L4.62722 16.9413C2.73914 17.3183 0.98708 15.8303 1.00007 13.8609L1.05413 5.66559C1.06392 4.18207 2.09362 2.91119 3.51587 2.62725L11.3728 1.05866C13.2589 0.682096 15.0093 2.16667 15 4.13309L15.3728 4.05866C17.259 3.6821 19.0094 5.16666 19 7.13308L19.3728 7.05866C21.2608 6.68171 23.0129 8.16969 22.9999 10.1391L22.9459 18.3344C22.9361 19.8179 21.9064 21.0888 20.4841 21.3728L12.6272 22.9413C10.7409 23.3179 8.99026 21.833 9.00004 19.8662L8.62722 19.9413C6.74104 20.3179 4.99061 18.8333 5.00004 16.8669ZM9.01352 17.8248L9.05418 11.6656C9.06395 10.182 10.0936 8.9112 11.5159 8.62722L16.9973 7.5329L17 7.1259C17.005 6.36468 16.3525 5.90253 15.7644 6.01995L7.90743 7.58854C7.44642 7.68057 7.05783 8.112 7.05409 8.67877L7.00003 16.8741C6.99501 17.6353 7.64752 18.0975 8.23566 17.98L9.01352 17.8248ZM13 4.12595L12.9973 4.53291L7.51587 5.62724C6.09362 5.91118 5.06392 7.18207 5.05413 8.66557L5.0135 14.8248L4.23566 14.98C3.64746 15.0975 2.99501 14.6353 3.00003 13.8741L3.05409 5.67878C3.05783 5.112 3.44643 4.68058 3.90743 4.58854L11.7643 3.01995C12.3525 2.90253 13.005 3.36463 13 4.12595ZM20.9459 18.3212C20.9421 18.888 20.5535 19.3194 20.0926 19.4115L12.2357 20.98C11.6475 21.0975 10.9951 20.6353 11 19.8741L11.0541 11.6788C11.0579 11.112 11.4465 10.6806 11.9075 10.5885L19.7643 9.01995C20.3525 8.90252 21.005 9.36473 21 10.1259L20.9459 18.3212Z" fill="#ffffff"></path> </g></svg>';

  const handleControlsClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === state.buttonPlayPause || target.closest("#netflix-play-pause")) {
      if (state.videoElement) {
        if (state.videoElement.paused) {
          state.videoElement.play();
          if (state.buttonPlayPause) {
            state.buttonPlayPause.innerHTML =
              '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 19H18V5H14V19ZM6 19H10V5H6V19Z" fill="white"/></svg>';
          }
        } else {
          state.videoElement.pause();
          if (state.buttonPlayPause) {
            state.buttonPlayPause.innerHTML =
              '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="white"/></svg>';
          }
        }
      }
    } else if (target === state.buttonFullScreen || target.closest("#netflix-plein-ecran")) {
      toggleFullScreen();
    } else if (target === volumeIcon || target.closest("#netflix-volume-icon")) {
      if (state.videoElement) {
        state.videoElement.muted = !state.videoElement.muted;
        volumeIcon.innerHTML = state.videoElement.muted
          ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L9.91 6.09 12 8.18M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.26c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.32 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9" fill="white"/></svg>'
          : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.84-5 6.7v2.07c4-.91 7-4.49 7-8.77 0-4.28-3-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03V16c1.5-.71 2.5-2.24 2.5-4M3 9v6h4l5 5V4L7 9H3z" fill="white"/></svg>';
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
    } else if (target === removeToggle || target.closest("#netflix-remove-toggle")) {
      doYourJob();
      showMessage("bypassed successfully");
      createBackButton();
      createTipsButton();
    }
  };

  state.volumeSlider.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    const volume = parseFloat(target.value) / 100;
    if (state.videoElement) {
      state.videoElement.volume = volume;
      state.videoElement.muted = volume === 0;
    }
    volumeIcon.innerHTML =
      volume === 0
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L9.91 6.09 12 8.18M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.26c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.32 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9" fill="white"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.84-5 6.7v2.07c4-.91 7-4.49 7-8.77 0-4.28-3-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03V16c1.5-.71 2.5-2.24 2.5-4M3 9v6h4l5 5V4L7 9H3z" fill="white"/></svg>';
  });

  state.controllerElement.addEventListener("click", handleControlsClick);

  const speedToggleButton = document.createElement("button");
  speedToggleButton.id = "netflix-speed-toggle";
  speedToggleButton.title = "Speed: 1x";
  speedToggleButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" role="img" viewBox="0 0 24 24" width="24" height="24" data-icon="InternetSpeedStandard" aria-hidden="true">
      <path fill="currentColor" d="M19.0569 6.27006C15.1546 2.20629 8.84535 2.20629 4.94312 6.27006C1.01896 10.3567 1.01896 16.9985 4.94312 21.0852L3.50053 22.4704C-1.16684 17.6098 -1.16684 9.7454 3.50053 4.88481C8.18984 0.0013696 15.8102 0.0013696 20.4995 4.88481C25.1668 9.7454 25.1668 17.6098 20.4995 22.4704L19.0569 21.0852C22.981 16.9985 22.981 10.3567 19.0569 6.27006ZM15 14.0001C15 15.6569 13.6569 17.0001 12 17.0001C10.3431 17.0001 9 15.6569 9 14.0001C9 12.3432 10.3431 11.0001 12 11.0001C12.4632 11.0001 12.9018 11.105 13.2934 11.2924L16.2929 8.29296L17.7071 9.70717L14.7076 12.7067C14.895 13.0983 15 13.5369 15 14.0001Z" clip-rule="evenodd" fill-rule="evenodd"></path>
    </svg>
  `;

  const speedOptions = [1, 1.25, 1.5, 1.75, 2];
  let currentSpeedIndex = 0;

  speedToggleButton.addEventListener("click", () => {
    currentSpeedIndex = (currentSpeedIndex + 1) % speedOptions.length;
    if (state.videoElement) {
      state.videoElement.playbackRate = speedOptions[currentSpeedIndex];
      speedToggleButton.title = `Speed: ${speedOptions[currentSpeedIndex]}x`;
      showMessage(`Speed: ${speedOptions[currentSpeedIndex]}x`);
    }
  });

  const autoplayToggleButton = document.createElement("button");
  autoplayToggleButton.id = "netflix-autoplay-toggle";
  autoplayToggleButton.title = "Autoplay: OFF";
  autoplayToggleButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path fill="white" d="M380-300v-360l280 180zM480-40q-108 0-202.5-49.5T120-228v108H40v-240h240v80h-98q51 75 129.5 117.5T480-120q115 0 208.5-66T820-361l78 18q-45 136-160 219.5T480-40M42-520q7-67 32-128.5T143-762l57 57q-32 41-52 87.5T123-520zm214-241-57-57q53-44 114-69.5T440-918v80q-51 5-97 25t-87 52m449 0q-41-32-87.5-52T520-838v-80q67 6 128.5 31T762-818zm133 241q-5-51-25-97.5T761-705l57-57q44 52 69 113.5T918-520z"/></svg>
  `;

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
      autoplayToggleButton.title = "Autoplay: ON";
      autoplayToggleButton.style.opacity = "1";
    } else {
      autoplayToggleButton.title = "Autoplay: OFF";
      autoplayToggleButton.style.opacity = "0.6";
    }
  }

  autoplayToggleButton.addEventListener("click", () => {
    state.autoplayNextEpisode = !state.autoplayNextEpisode;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ autoplayNextEpisode: state.autoplayNextEpisode });
    }
    updateAutoplayButton();
    showMessage(`Autoplay ${state.autoplayNextEpisode ? "enabled" : "disabled"}`);
  });

  state.videoElement.addEventListener("play", () => {
    if (state.buttonPlayPause) {
      state.buttonPlayPause.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 19H18V5H14V19ZM6 19H10V5H6V19Z" fill="white"/></svg>';
    }
    showController();
  });

  state.videoElement.addEventListener("pause", () => {
    if (state.buttonPlayPause) {
      state.buttonPlayPause.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="white"/></svg>';
    }
    if (state.controllerElement) {
      state.controllerElement.classList.remove("hidden");
      state.isControllerVisible = true;
    }
  });

  state.videoElement.addEventListener("seeked", cancelNetflixCountdown);
  state.videoElement.addEventListener("timeupdate", updateSeamlessDistance);

  state.videoElement.addEventListener("ended", () => {
    if (state.autoplayNextEpisode) {
      showMessage("Playing next episode...");
      setTimeout(() => {
        jumpToNextEpisode();
      }, 1500);
    }
  });

  state.videoElement.addEventListener("volumechange", () => {
    if (!state.videoElement) return;
    const isMuted = state.videoElement.muted || state.videoElement.volume === 0;

    if (state.volumeSlider) {
      state.volumeSlider.value = isMuted ? "0" : (state.videoElement.volume * 100).toString();
    }

    if (volumeIcon) {
      volumeIcon.innerHTML = isMuted
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L9.91 6.09 12 8.18M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.26c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.32 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9" fill="white"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.84-5 6.7v2.07c4-.91 7-4.49 7-8.77 0-4.28-3-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03V16c1.5-.71 2.5-2.24 2.5-4M3 9v6h4l5 5V4L7 9H3z" fill="white"/></svg>';
    }
  });

  setupKeyboardShortcuts(updateProgression, toggleFullScreen, showController, showMessage, isOnNetflixWatch);

  setTimeout(() => {
    if (videoAreaOverlay) videoAreaOverlay.focus();
  }, 500);

  state.videoElement.addEventListener("mousemove", () => showController());
  document.addEventListener("mousemove", () => showController());

  volumeSliderContainer.appendChild(state.volumeSlider);
  volumeContainer.appendChild(volumeIcon);
  volumeContainer.appendChild(volumeSliderContainer);

  if (state.progressionBar) barreContainer.appendChild(state.progressionBar);

  const progressContainer = document.createElement("div");
  progressContainer.style.display = "flex";
  progressContainer.style.alignItems = "center";
  progressContainer.style.flex = "1";
  progressContainer.appendChild(barreContainer);

  controlsLeft.appendChild(state.buttonPlayPause);
  controlsLeft.appendChild(volumeContainer);
  controlsLeft.appendChild(state.screenTime);

  controlsRight.appendChild(nextEpisodeButton);
  controlsRight.appendChild(autoplayToggleButton);
  controlsRight.appendChild(episodesButton);
  controlsRight.appendChild(removeToggle);
  controlsRight.appendChild(subtitleToggle);
  controlsRight.appendChild(speedToggleButton);
  controlsRight.appendChild(state.buttonFullScreen);

  state.controllerElement.appendChild(controlsLeft);
  state.controllerElement.appendChild(progressContainer);
  state.controllerElement.appendChild(controlsRight);

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

  barreContainer.addEventListener("click", (e) => {
    const rect = barreContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;

    const duration = state.currentEpisodeDuration || state.videoElement?.duration || 0;
    const totalVideoTime = Math.floor(duration);
    const seekTime = Math.floor((percent / 100) * totalVideoTime * 1000);

    window.dispatchEvent(new CustomEvent("netflixSeekTo", { detail: seekTime }));
  });

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
        state.buttonPlayPause.innerHTML =
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 19H18V5H14V19ZM6 19H10V5H6V19Z" fill="white"/></svg>';
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
