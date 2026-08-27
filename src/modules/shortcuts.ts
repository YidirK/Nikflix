import { state } from './player-state';
import { spawnPixelCat } from './pixel-cat';

let easterEggBuffer = "";
let easterEggResetTimer: number | null = null;
const EASTER_EGG_WORD = "cat";

export function sendSeekKeyToNetflix(
  direction: 'left' | 'right',
  showMessageFn: (msg: string) => void
): void {
  const netflixPlayer = document.querySelector<HTMLElement>('div[data-uia="player"]');

  if (!netflixPlayer) {
    console.error("Netflix player element not found");
    return;
  }

  const previouslyFocused = document.activeElement as HTMLElement | null;
  netflixPlayer.focus();

  setTimeout(() => {
    const keyEvent = new KeyboardEvent("keydown", {
      key: direction === "left" ? "ArrowLeft" : "ArrowRight",
      code: direction === "left" ? "ArrowLeft" : "ArrowRight",
      keyCode: direction === "left" ? 37 : 39,
      which: direction === "left" ? 37 : 39,
      bubbles: true,
      cancelable: true,
      view: window,
    });

    netflixPlayer.dispatchEvent(keyEvent);
    showMessageFn(direction === "left" ? "Rewind" : "Fast Forward");

    setTimeout(() => {
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    }, 100);
  }, 50);
}

export function setupKeyboardShortcuts(
  updateProgressionFn: () => void,
  toggleFullScreenFn: () => void,
  showControllerFn: () => void,
  showMessageFn: (msg: string) => void,
  isOnNetflixWatchFn: () => boolean
): void {
  if (state.keyboardListener) {
    document.removeEventListener("keydown", state.keyboardListener);
  }

  state.keyboardListener = function (e: KeyboardEvent) {
    if (!isOnNetflixWatchFn()) return;

    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

    const videoElement = document.querySelector("video");
    if (!videoElement) return;
    videoElement.disablePictureInPicture = false;

    if (state.controllerElement) {
      showControllerFn();
    }
    if (e.key.length === 1 && /[a-z]/i.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      easterEggBuffer = (easterEggBuffer + e.key.toLowerCase()).slice(-EASTER_EGG_WORD.length);

      if (easterEggResetTimer) clearTimeout(easterEggResetTimer);
      easterEggResetTimer = window.setTimeout(() => {
        easterEggBuffer = "";
      }, 1500);

      if (easterEggBuffer === EASTER_EGG_WORD) {
        easterEggBuffer = "";
        spawnPixelCat();
      }
    }

    switch (e.key) {
      case " ":
        e.preventDefault();
        if (videoElement.paused) {
          videoElement.play();
          if (state.buttonPlayPause) {
            state.buttonPlayPause.innerHTML =
              '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 19H18V5H14V19ZM6 19H10V5H6V19Z" fill="white"/></svg>';
          }
        } else {
          videoElement.pause();
          if (state.buttonPlayPause) {
            state.buttonPlayPause.innerHTML =
              '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="white"/></svg>';
          }
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        e.stopPropagation();
        sendSeekKeyToNetflix("left", showMessageFn);
        break;

      case "ArrowRight":
        e.preventDefault();
        e.stopPropagation();
        sendSeekKeyToNetflix("right", showMessageFn);
        break;
      case "ArrowUp":
        e.preventDefault();
        videoElement.volume = Math.min(1, videoElement.volume + 0.1);
        if (state.volumeSlider) {
          state.volumeSlider.value = (videoElement.volume * 100).toString();
        }
        showMessageFn(`Volume: ${Math.round(videoElement.volume * 100)}%`);
        break;

      case "ArrowDown":
        e.preventDefault();
        videoElement.volume = Math.max(0, videoElement.volume - 0.1);
        if (state.volumeSlider) {
          state.volumeSlider.value = (videoElement.volume * 100).toString();
        }
        showMessageFn(`Volume: ${Math.round(videoElement.volume * 100)}%`);
        break;

      case "f":
        e.preventDefault();
        toggleFullScreenFn();
        break;

      case "m":
        e.preventDefault();
        videoElement.muted = !videoElement.muted;
        if (state.volumeSlider) {
          state.volumeSlider.value = videoElement.muted ? "0" : (videoElement.volume * 100).toString();
        }
        showMessageFn(videoElement.muted ? "Muted" : `Volume: ${Math.round(videoElement.volume * 100)}%`);
        break;
    }
  };

  document.addEventListener("keydown", state.keyboardListener);

  const netflixSeekMonitor = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      requestAnimationFrame(updateProgressionFn);
    }
  };

  const videoElement = document.querySelector("video");
  if (videoElement) {
    videoElement.addEventListener("keydown", netflixSeekMonitor as EventListener);
    videoElement.addEventListener("seeking", () => {
      requestAnimationFrame(updateProgressionFn);
    });
    videoElement.addEventListener("timeupdate", () => {
      requestAnimationFrame(updateProgressionFn);
    });
  }
}
