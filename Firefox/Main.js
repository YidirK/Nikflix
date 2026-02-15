// Early CSS to hide restriction screens before they even render
const earlyStyle = document.createElement("style");
earlyStyle.textContent = `
  .nf-modal.interstitial-full-screen,
  .nf-modal.uma-modal.two-section-uma,
  .nf-modal.extended-diacritics-language.interstitial-full-screen,
  .css-1nym653.modal-enter-done {
    display: none !important;
  }
`;
(document.head || document.documentElement).appendChild(earlyStyle);

const CLASSES_TO_REMOVE = [
  "layout-item_styles__zc08zp30 default-ltr-cache-7vbe6a ermvlvv0",
  "default-ltr-cache-1sfbp89 e1qcljkj0",
  "default-Itr-iqcdef-cache-ohh5jx e53rikt0",
  "css-1nym653 modal-enter-done",
  "nf-modal interstitial-full-screen",
  "nf-modal uma-modal two-section-uma",
  "nf-modal extended-diacritics-language interstitial-full-screen"
];
// State object that contains all controller elements and state
let state = {
  progressionIntervalId: null,
  controllerElement: null,
  buttonPlayPause: null,
  buttonFullScreen: null,
  progressionBar: null,
  screenTime: null,
  videoElement: null,
  volumeSlider: null,
  lastScreenTime: -1,
  lastTotalTime: -1,
  isControllerAdded: false,
  mutationTimeout: null,
  controllerTimerId: null,
  isControllerVisible: true,
  controllerHideTimer: null,
  videoOverlay: null,
  keyboardListener: null,
  messageOverlay: null,
  messageTimer: null,
  seekAmount: 10, // seconds to seek with arrow keys
  backButton: null, // New property to track the back button element
  tipsButton: null,
  controllerType: "nikflix",

  // Subtitle-related state
  subtitleEnabled: true,
  bilingualEnabled: false,
  primarySubtitleTrack: null,
  secondarySubtitleTrack: null,
  availableSubtitleTracks: [],
  substitleLanguage: 0,
  subtitleObserver: null,
  subtitleContainer: null,
  subtitleSettingsOpen: false,
  subtitleSettingsPanel: null,


  //Audio
  availableAudioTracks: [],
  audioLanguage: 0,

  // Episodes list state
  episodesListOpen: false,

  // Tooltip state
  progressTooltip: null,
};

// Constants
const CONTROLLER_ID = "mon-controleur-netflix";
const NETFLIX_WATCH_REGEX = /^https:\/\/www\.netflix\.com\/watch\/\d+/;
const CONTROLLER_INIT_DELAY = 1500; // Reduced from 3000ms
const CONTROLLER_HIDE_DELAY = 3000; // Hide controller after 3 seconds of inactivity
const SUBTITLE_SETTINGS_ID = "netflix-subtitle-settings";




// script injecter to seek using progress bar
function injectScript(fileName) {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL(fileName);
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

// Inject the script
injectScript("netflix-seeker.js");
injectScript("netflix-audioChange.js")
injectScript("netflix-substitleChange.js")


/**
 * Check if the current URL is a Netflix watch URL
 * @returns {boolean} True if on Netflix watch page
 */
function isOnNetflixWatch() {
  return NETFLIX_WATCH_REGEX.test(window.location.href);
}

/**
 * Format time in seconds to MM:SS format
 * @param {number} timeInSeconds - Time in seconds
 * @returns {string} Formatted time string
 */
function timeFormat(timeInSeconds) {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
}

/**
 * Format duration to MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Change Audio
 */
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data?.type === "FROM_AUDIOCHANGE_SCRIPT") {
    if (typeof state === "object" && state !== null) {
      state.availableAudioTracks = Array.isArray(event.data.audioTracks)
          ? event.data.audioTracks
          : [];

      console.log("Available subtitle tracks set to:", state.availableAudioTracks);
    } else {
      console.warn("state is not defined or is invalid.");
    }
  }
});

/**
 * Change Substitle
 */
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data?.type === "FROM_SUBSTITLECHANGE_SCRIPT") {
    if (typeof state === "object" && state !== null) {
      state.availableSubtitleTracks = Array.isArray(event.data.substitleTracks)
          ? event.data.substitleTracks
          : [];

      console.log("Available subtitle tracks set to:", state.availableSubtitleTracks);
    } else {
      console.warn("state is not defined or is invalid.");
    }
  }
});



/**
 * Show episodes list panel
 */
async function showEpisodesList() {
  const curEpisodeId = getIdFromUrl();
  if (!curEpisodeId) return;

  try {
    const response = await fetch(`https://www.netflix.com/nq/website/memberapi/release/metadata?movieid=${curEpisodeId}`, {
      credentials: "include"
    });
    const data = await response.json();

    // Remove existing panel if any
    const existingPanel = document.getElementById('netflix-episodes-list');
    if (existingPanel) existingPanel.remove();

    // Create new panel
    const panel = document.createElement('div');
    panel.id = 'netflix-episodes-list';
    panel.className = 'visible';

    // Order seasons by sequence number
    const seasons = data.video.seasons.sort((a, b) => a.seq - b.seq);

    panel.innerHTML = `
            <h3>${data.video.title}</h3>
            ${seasons.map(season => `
                <div class="season-container">
                    <div class="season-header">Season ${season.seq}</div>
                    ${season.episodes.map(episode => `
                        <div class="episode-item ${episode.id.toString() === curEpisodeId ? 'current' : ''}" 
                             data-episode-id="${episode.id}">
                            <span class="episode-number">E${episode.seq}</span>
                            <span class="episode-title">${episode.title}</span>
                            <span class="episode-duration">${formatDuration(episode.runtime)}</span>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        `;

    document.body.appendChild(panel);
    state.episodesListOpen = true;

    // Add click handlers
    panel.querySelectorAll('.episode-item').forEach(item => {
      item.addEventListener('click', () => {
        const episodeId = item.getAttribute('data-episode-id');
        if (episodeId) {
          window.location.href = `https://www.netflix.com/watch/${episodeId}`;
        }
      });
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) &&
          !e.target.closest('#netflix-episodes-button')) {
        panel.remove();
        state.episodesListOpen = false;
      }
    });

  } catch (error) {
    console.error('Error fetching episodes:', error);
  }
}

/**
 * Update the progress bar and time display
 */
function updateProgression() {
  const { videoElement, progressionBar, screenTime } = state;

  if (!videoElement || !progressionBar || !screenTime) return;

  if (videoElement.duration) {
    const percentage = (videoElement.currentTime / videoElement.duration) * 100;
    progressionBar.style.width = `${percentage}%`;

    const currentTime = Math.floor(videoElement.currentTime);
    const totalTime = Math.floor(videoElement.duration);

    if (
        state.lastScreenTime !== currentTime ||
        state.lastTotalTime !== totalTime
    ) {
      state.lastScreenTime = currentTime;
      state.lastTotalTime = totalTime;
      screenTime.textContent = `${timeFormat(currentTime)} / ${timeFormat(
          totalTime
      )}`;
    }
  }
}

/**
 * Toggle fullscreen mode
 */
function toggleFullScreen() {
  const fullscreenElement = document.documentElement; // Cibler tout le site

  if (!document.fullscreenElement) {
    if (fullscreenElement.requestFullscreen) {
      fullscreenElement.requestFullscreen();
    } else if (fullscreenElement.mozRequestFullScreen) {
      fullscreenElement.mozRequestFullScreen();
    } else if (fullscreenElement.webkitRequestFullscreen) {
      fullscreenElement.webkitRequestFullscreen();
    } else if (fullscreenElement.msRequestFullscreen) {
      fullscreenElement.msRequestFullscreen();
    }

    if (state.buttonFullScreen) {
      state.buttonFullScreen.innerHTML =
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 3.41L16.41 9L18 10.59L23.59 5L22 3.41M2 5L7.59 10.59L9.18 9L3.59 3.41L2 5M18 13.41L16.41 15L22 20.59L23.59 19L18 13.41M9.18 15L7.59 13.41L2 19L3.59 20.59L9.18 15Z" fill="white"/></svg>';
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    if (state.buttonFullScreen) {
      state.buttonFullScreen.innerHTML =
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.59 5.59L18 7L12 13L7.41 18.41L6 17L12 11L18 17L16.59 18.41Z" fill="white"/></svg>';
    }
  }
}

/**
 * Create and add styles if not already present
 */
function createStylesIfNeeded() {
  if (!document.getElementById("netflix-controller-styles")) {
    // Create a link element for the external CSS
    const link = document.createElement("link");
    link.id = "netflix-controller-styles";
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("netflix-controller.css");
    document.head.appendChild(link);
  }
}

/**
 * Clean up controller elements and reset state
 */
function cleanController() {
  if (state.progressionIntervalId) {
    cancelAnimationFrame(state.progressionIntervalId);
    state.progressionIntervalId = null;
  }

  if (state.controllerHideTimer) {
    clearTimeout(state.controllerHideTimer);
    state.controllerHideTimer = null;
  }

  if (state.subtitleObserver) {
    state.subtitleObserver.disconnect();
    state.subtitleObserver = null;
  }

  if (state.controllerElement) {
    state.controllerElement.remove();
  }

  if (state.videoOverlay) {
    state.videoOverlay.remove();
  }

  // Also clean up the video area overlay
  const videoAreaOverlay = document.getElementById(
      "netflix-video-area-overlay"
  );
  if (videoAreaOverlay) {
    videoAreaOverlay.remove();
  }

  if (state.messageOverlay) {
    state.messageOverlay.remove();
  }

  if (state.subtitleSettingsPanel) {
    state.subtitleSettingsPanel.remove();
  }

  // Remove the back button
  if (state.backButton) {
    state.backButton.remove();
  }

  //tips button
  if (state.tipsButton){
    state.tipsButton.remove();
  }

  // Remove keyboard event listener if exists
  if (state.keyboardListener) {
    document.removeEventListener("keydown", state.keyboardListener);
    state.keyboardListener = null;
  }

  // Remove progress tooltip if exists
  if (state.progressTooltip) {
    state.progressTooltip.remove();
    state.progressTooltip = null;
  }

  state = {
    ...state,
    controllerElement: null,
    buttonPlayPause: null,
    buttonFullScreen: null,
    progressionBar: null,
    screenTime: null,
    videoElement: null,
    volumeSlider: null,
    videoOverlay: null,
    keyboardListener: null,
    messageOverlay: null,
    messageTimer: null,
    isControllerAdded: false,
    isControllerVisible: true,
    seekAmount: 10,

    // Keep subtitle preferences, reset other subtitle state
    subtitleEnabled: state.subtitleEnabled,
    bilingualEnabled: state.bilingualEnabled,
    primaryLanguage: state.primaryLanguage,
    secondaryLanguage: state.secondaryLanguage,
    subtitlePosition: state.subtitlePosition,
    subtitleSize: state.subtitleSize,
    primaryColor: state.primaryColor,
    secondaryColor: state.secondaryColor,
    subtitleBackgroundOpacity: state.subtitleBackgroundOpacity,

    primarySubtitleTrack: null,
    secondarySubtitleTrack: null,
    subtitleObserver: null,
    subtitleContainer: null,
    subtitleSettingsOpen: false,
    subtitleSettingsPanel: null,
  };
}

/**
 * Show the controller and set a timer to hide it
 */
function showController() {
  if (!state.controllerElement) return;

  state.controllerElement.classList.remove("hidden");
  if (state.backButton) {
    state.backButton.style.opacity = "1";
  }
  if(state.tipsButton){
    state.tipsButton.style.opacity="1";
  }
  state.isControllerVisible = true;

  // Show cursor when controls are visible
  const videoAreaOverlay = document.getElementById("netflix-video-area-overlay");
  if (videoAreaOverlay) {
    videoAreaOverlay.style.cursor = "pointer";
  }

  if (state.controllerHideTimer) {
    clearTimeout(state.controllerHideTimer);
  }

  state.controllerHideTimer = setTimeout(() => {
    if (
        state.controllerElement &&
        !state.videoElement.paused &&
        !state.subtitleSettingsOpen
    ) {
      state.controllerElement.classList.add("hidden");

      if (state.backButton) {
        state.backButton.style.opacity = "0";
      }
      if(state.tipsButton){
        state.tipsButton.style.opacity="0"
      }

      state.isControllerVisible = false;

      // Hide cursor when controls are hidden
      if (videoAreaOverlay) {
        videoAreaOverlay.style.cursor = "none";
      }
    }
  }, CONTROLLER_HIDE_DELAY);
}

/**
 * Show a message overlay with the given text
 * @param {string} message - Message to display
 * @param {number} duration - Duration to show message in milliseconds
 */
function showMessage(message, duration = 1500) {
  if (state.messageTimer) {
    clearTimeout(state.messageTimer);
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
    state.messageOverlay.style.opacity = "0";
  }, duration);
}


/**
 * Create subtitle settings panel
 * @returns {HTMLElement} The settings panel element
 */
function createSubtitleSettings() {
  // Create settings panel
  const panel = document.createElement("div");
  panel.id = SUBTITLE_SETTINGS_ID;
  panel.className = state.subtitleSettingsOpen ? "visible" : "";

  // Create settings content
  panel.innerHTML = `
        <h3>Language Settings</h3>
        
        <div class="subtitle-settings-row">
            <span class="subtitle-settings-label">Subtitles</span>
            <div class="subtitle-settings-control">
                <label class="subtitle-toggle-switch">
                    <input type="checkbox" id="subtitle-toggle-checkbox">
                    <span class="subtitle-toggle-slider"></span>
                </label>
            </div>
        </div>
        
     
        
        <div class="subtitle-settings-row">
            <span class="subtitle-settings-label">Audio Language</span>
            <div class="subtitle-settings-control">
                <select id="audio-language-select" class="subtitle-select">
                    ${generateAudioLanguageOptions(state.audioLanguage)}
                </select>
            </div>
        </div>
        
        <div class="subtitle-settings-row">
            <span class="subtitle-settings-label">Subtitles Language</span>
            <div class="subtitle-settings-control">
                <select id="subtitle-language-select" class="subtitle-select">
                    ${generateSubtitleLanguageOptions(state.substitleLanguage)}
                </select>
            </div>
        </div>
    `;

  document.body.appendChild(panel);

// Add event listeners for settings controls
  panel
      .querySelector("#subtitle-toggle-checkbox")
      .addEventListener("change", (e) => {
        state.subtitleEnabled = e.target.checked;

        const event = new CustomEvent("netflixSubtitleChange", {
          detail: state.subtitleEnabled ? 1 : 0,
        });

        window.dispatchEvent(event);

        setTimeout(() => {
          doYourJob();
          showMessage(`${state.subtitleEnabled ? "Subtitles enabled" : "Subtitles disabled"}`, 2000);
        }, 500);
      });



  panel
      .querySelector("#audio-language-select")
      .addEventListener("change", (e) => {
        state.audioLanguage = e.target.value;
        console.log("e", e.target.value)
        window.dispatchEvent(
            new CustomEvent("netflixAudioChange", { detail: e.target.value })
        );
        setTimeout(() => {
          doYourJob()
          showMessage(`Audio changed to ${state.availableAudioTracks[e.target.value].displayName} `, 2000);
        }, 500);
      });

  panel
      .querySelector("#subtitle-language-select")
      .addEventListener("change", (e) => {
        const selectedValue = e.target.value;
        state.subtitleLanguage = selectedValue;

        window.dispatchEvent(
            new CustomEvent("netflixSubtitleChange", { detail: selectedValue })
        );

        console.log("izan", state.availableSubtitleTracks[selectedValue]);
        console.log("caca de vache", state.subtitleEnabled);

        setTimeout(() => {
          doYourJob();
          state.subtitleEnabled = selectedValue !== "0";

          // change checkbox etat
          panel.querySelector("#subtitle-toggle-checkbox").checked = state.subtitleEnabled;

          showMessage(
              `Subtitle changed to ${state.availableSubtitleTracks[selectedValue]?.displayName || "Unknown"}`,
              2000
          );
        }, 500);
      });
  return panel;
}

/**
 * Generate HTML options for language dropdown
 * @param {string} selectedLang - Currently selected language code
 * @returns {string} HTML string of options
 */
function generateAudioLanguageOptions(selectedLang) {
  let optionsHTML = "";
  if (state.availableAudioTracks.length > 0) {
    state.availableAudioTracks.forEach((track, index) => {
      const isSelected = track.key === selectedLang ? "selected" : "";
      optionsHTML += `<option value="${index}" ${isSelected}>${track.displayName}</option>`;
    });
  }
  return optionsHTML;
}
function generateSubtitleLanguageOptions(selectedLang) {
  let optionsHTML = "";

  if (state.availableSubtitleTracks.length > 0) {
    state.availableSubtitleTracks.forEach((track, index) => {
      const isSelected = track.key === selectedLang ? "selected" : "";
      optionsHTML += `<option value="${index}" ${isSelected}>${track.displayName}</option>`;
    });
  }
  return optionsHTML;
}


/**
 * Toggle subtitle settings panel visibility
 */
function toggleSubtitleSettings() {
  state.subtitleSettingsOpen = !state.subtitleSettingsOpen;

  if (!state.subtitleSettingsPanel) {
    state.subtitleSettingsPanel = createSubtitleSettings();
  }

  if (state.subtitleSettingsOpen) {
    state.subtitleSettingsPanel.classList.add("visible");

    // Don't hide controller when settings are open
    if (state.controllerHideTimer) {
      clearTimeout(state.controllerHideTimer);
      state.controllerHideTimer = null;
    }
  } else {
    state.subtitleSettingsPanel.classList.remove("visible");
    showController(); // Restart controller hide timer
  }
}

/**
 * Set up keyboard shortcuts globally for the entire website
 */
function setupKeyboardShortcuts() {
  // Remove any existing listeners to avoid duplicates
  if (state.keyboardListener) {
    document.removeEventListener("keydown", state.keyboardListener);
  }

  // Create the keyboard listener function
  state.keyboardListener = function (e) {
    // Only handle events if we're on a Netflix watch page
    if (!isOnNetflixWatch()) return;

    // Don't capture keyboard events if user is typing in an input field
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    // Always ensure video element is current
    const videoElement = document.querySelector("video");
    if (!videoElement) return;

    // Always show controller when key is pressed if the controller exists
    if (state.controllerElement) {
      showController();
    }

    // Handle all other keys normally
    switch (e.key) {
      case " ": // Spacebar - toggle play/pause
        e.preventDefault(); // Prevent page scrolling

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
      case "ArrowLeft": // Left arrow - seek backward
        e.preventDefault(); // Prevent default browser scrolling
        e.stopPropagation(); // Stop event from being handled elsewhere
        sendSeekKeyToNetflix("left"); // Send the key to Netflix player
        break;

      case "ArrowRight": // Right arrow - seek forward
        e.preventDefault(); // Prevent default browser scrolling
        e.stopPropagation(); // Stop event from being handled elsewhere
        sendSeekKeyToNetflix("right"); // Send the key to Netflix player
        break;
      case "ArrowUp": // Up arrow - volume up
        e.preventDefault();
        videoElement.volume = Math.min(1, videoElement.volume + 0.1);
        if (state.volumeSlider) {
          state.volumeSlider.value = videoElement.volume * 100;
        }
        showMessage(`Volume: ${Math.round(videoElement.volume * 100)}%`);
        break;

      case "ArrowDown": // Down arrow - volume down
        e.preventDefault();
        videoElement.volume = Math.max(0, videoElement.volume - 0.1);
        if (state.volumeSlider) {
          state.volumeSlider.value = videoElement.volume * 100;
        }
        showMessage(`Volume: ${Math.round(videoElement.volume * 100)}%`);
        break

      case "f": // F key - toggle fullscreen
        e.preventDefault();
        toggleFullScreen();
        break;

      case "m": // M key - toggle mute
        e.preventDefault();
        videoElement.muted = !videoElement.muted;
        if (state.volumeSlider) {
          state.volumeSlider.value = videoElement.muted ? 0 : videoElement.volume * 100;
        }
        showMessage(videoElement.muted ? "Muted" : `Volume: ${Math.round(videoElement.volume * 100)}%`);
        break;
    }
  };

  // Add the keyboard listener - DO NOT USE CAPTURE MODE for Arrow keys to work properly
  document.addEventListener("keydown", state.keyboardListener);

  // Set up key handler specifically for NetFlix's video element to monitor seeking progress
  const netflixSeekMonitor = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      // Update our progress bar to match Netflix's seeking
      requestAnimationFrame(updateProgression);
    }
  };

  // Add this directly to the video element
  const videoElement = document.querySelector("video");
  if (videoElement) {
    videoElement.addEventListener("keydown", netflixSeekMonitor);

    // Also monitor seeking events
    videoElement.addEventListener("seeking", () => {
      requestAnimationFrame(updateProgression);
    });

    // And timeupdate events
    videoElement.addEventListener("timeupdate", () => {
      requestAnimationFrame(updateProgression);
    });
  }
}




/**
 * Find the Netflix player element and send keyboard events to it
 * @param {string} direction - 'left' or 'right'
 */
function sendSeekKeyToNetflix(direction) {
  // Find the Netflix player - using the class and data attribute you identified
  const netflixPlayer = document.querySelector('div[data-uia="player"]');

  if (!netflixPlayer) {
    console.error("Netflix player element not found");
    return;
  }

  // Store current active element to restore focus later
  const previouslyFocused = document.activeElement;

  // Focus the Netflix player element
  netflixPlayer.focus();

  // Short delay to ensure focus is established
  setTimeout(() => {
    // Create a keyboard event
    const keyEvent = new KeyboardEvent("keydown", {
      key: direction === "left" ? "ArrowLeft" : "ArrowRight",
      code: direction === "left" ? "ArrowLeft" : "ArrowRight",
      keyCode: direction === "left" ? 37 : 39,
      which: direction === "left" ? 37 : 39,
      bubbles: true,
      cancelable: true,
      view: window,
    });

    // Dispatch the event to the Netflix player
    netflixPlayer.dispatchEvent(keyEvent);

    // Show a message to indicate the action
    showMessage(direction === "left" ? "Rewind" : "Fast Forward");

    // Restore previous focus after a short delay
    setTimeout(() => {
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    }, 100);
  }, 50);
}

/**
 * Add video overlay with additional properties to help with focus management
 */
function createVideoOverlay() {
  // Create video overlay that allows clicks to pass through to Netflix controls
  state.videoOverlay = document.createElement("div");
  state.videoOverlay.id = "netflix-video-overlay";
  state.videoOverlay.style.pointerEvents = "none"; // Allow clicks to pass through to Netflix's controls

  // Make overlay focusable but visually unchanged
  state.videoOverlay.tabIndex = -1; // Make focusable without being in tab order
  state.videoOverlay.style.outline = "none"; // Remove focus outline

  // Ensure our overlay can intercept keyboard events
  state.videoOverlay.addEventListener("keydown", (e) => {
    // Pass the event to our global keyboard handler
    if (state.keyboardListener) {
      state.keyboardListener(e);
    }
  });

  document.body.appendChild(state.videoOverlay);
}

function createVideoAreaOverlay() {
  const curEpisodeId = getIdFromUrl();
  if (!curEpisodeId) return null; // If we can't get the episode ID, we won't create the overlay

  const videoAreaOverlay = document.createElement("div");
  videoAreaOverlay.id = "netflix-video-area-overlay";
  videoAreaOverlay.style.position = "fixed";
  videoAreaOverlay.style.top = "0";
  videoAreaOverlay.style.left = "0";
  videoAreaOverlay.style.width = "100%";
  videoAreaOverlay.style.height = "calc(100% - 140px)";
  videoAreaOverlay.style.zIndex = "9997";
  videoAreaOverlay.style.cursor = "pointer";
  videoAreaOverlay.style.backgroundColor = "transparent";

  // Make it focusable
  videoAreaOverlay.tabIndex = -1;
  videoAreaOverlay.style.outline = "none";

  // Handle play/pause toggle
  videoAreaOverlay.addEventListener("click", (e) => {
    // Prevent clicks on controller from triggering this
    if (
        !e.target.closest("#mon-controleur-netflix") &&
        !e.target.closest("#netflix-subtitle-settings")
    ) {
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

  // Handle double-click for fullscreen
  videoAreaOverlay.addEventListener("dblclick", (e) => {
    // Prevent double-click on controller
    if (
        !e.target.closest("#mon-controleur-netflix") &&
        !e.target.closest("#netflix-subtitle-settings")
    ) {
      toggleFullScreen();
    }
  });

  document.body.appendChild(videoAreaOverlay);
  return videoAreaOverlay;
}

/**
 * Add the media controller to the page
 */
function addMediaController() {
  if (state.isControllerAdded) return;

  cleanController();

  state.videoElement = document.querySelector("video");
  if (!state.videoElement) return;

  createStylesIfNeeded();

  // Create enhanced video overlays for better focus management
  createVideoOverlay();
  const videoAreaOverlay = createVideoAreaOverlay();

  // Create controller element as before
  state.controllerElement = document.createElement("div");
  state.controllerElement.id = CONTROLLER_ID;

  // Make controller focusable too
  state.controllerElement.tabIndex = -1;
  state.controllerElement.style.outline = "none";

  // Create video overlay that allows clicks to pass through to Netflix controls
  state.videoOverlay = document.createElement("div");
  state.videoOverlay.id = "netflix-video-overlay";
  state.videoOverlay.style.pointerEvents = "none"; // Allow clicks to pass through to Netflix's controls

  // Create a separate overlay just for the video area (excluding controls)
  videoAreaOverlay.id = "netflix-video-area-overlay";
  videoAreaOverlay.style.position = "fixed";
  videoAreaOverlay.style.top = "0";
  videoAreaOverlay.style.left = "0";
  videoAreaOverlay.style.width = "100%";
  videoAreaOverlay.style.height = "calc(100% - 140px)"; // Exclude Netflix controls area
  videoAreaOverlay.style.zIndex = "9997";
  videoAreaOverlay.style.cursor = "pointer";
  videoAreaOverlay.style.backgroundColor = "transparent";

  state.controllerElement = document.createElement("div");
  state.controllerElement.id = CONTROLLER_ID;

  // Create container divs for better layout
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
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M9.94358 1.25L10 1.25C10.4142 1.25 10.75 1.58579 10.75 2C10.75 2.41421 10.4142 2.75 10 2.75C8.09318 2.75 6.73851 2.75159 5.71085 2.88976C4.70476 3.02502 4.12511 3.27869 3.7019 3.7019C3.27869 4.12511 3.02502 4.70476 2.88976 5.71085C2.75159 6.73851 2.75 8.09318 2.75 10C2.75 10.4142 2.41421 10.75 2 10.75C1.58579 10.75 1.25 10.4142 1.25 10L1.25 9.94358C1.24998 8.10582 1.24997 6.65019 1.40314 5.51098C1.56076 4.33856 1.89288 3.38961 2.64124 2.64124C3.38961 1.89288 4.33856 1.56076 5.51098 1.40314C6.65019 1.24997 8.10582 1.24998 9.94358 1.25ZM18.2892 2.88976C17.2615 2.75159 15.9068 2.75 14 2.75C13.5858 2.75 13.25 2.41421 13.25 2C13.25 1.58579 13.5858 1.25 14 1.25L14.0564 1.25C15.8942 1.24998 17.3498 1.24997 18.489 1.40314C19.6614 1.56076 20.6104 1.89288 21.3588 2.64124C22.1071 3.38961 22.4392 4.33856 22.5969 5.51098C22.75 6.65019 22.75 8.10583 22.75 9.94359V10C22.75 10.4142 22.4142 10.75 22 10.75C21.5858 10.75 21.25 10.4142 21.25 10C21.25 8.09318 21.2484 6.73851 21.1102 5.71085C20.975 4.70476 20.7213 4.12511 20.2981 3.7019C19.8749 3.27869 19.2952 3.02502 18.2892 2.88976ZM2 13.25C2.41421 13.25 2.75 13.5858 2.75 14C2.75 15.9068 2.75159 17.2615 2.88976 18.2892C3.02502 19.2952 3.27869 19.8749 3.7019 20.2981C4.12511 20.7213 4.70476 20.975 5.71085 21.1102C6.73851 21.2484 8.09318 21.25 10 21.25C10.4142 21.25 10.75 21.5858 10.75 22C10.75 22.4142 10.4142 22.75 10 22.75H9.94359C8.10583 22.75 6.65019 22.75 5.51098 22.5969C4.33856 22.4392 3.38961 22.1071 2.64124 21.3588C1.89288 20.6104 1.56076 19.6614 1.40314 18.489C1.24997 17.3498 1.24998 15.8942 1.25 14.0564L1.25 14C1.25 13.5858 1.58579 13.25 2 13.25ZM22 13.25C22.4142 13.25 22.75 13.5858 22.75 14V14.0564C22.75 15.8942 22.75 17.3498 22.5969 18.489C22.4392 19.6614 22.1071 20.6104 21.3588 21.3588C20.6104 22.1071 19.6614 22.4392 18.489 22.5969C17.3498 22.75 15.8942 22.75 14.0564 22.75H14C13.5858 22.75 13.25 22.4142 13.25 22C13.25 21.5858 13.5858 21.25 14 21.25C15.9068 21.25 17.2615 21.2484 18.2892 21.1102C19.2952 20.975 19.8749 20.7213 20.2981 20.2981C20.7213 19.8749 20.975 19.2952 21.1102 18.2892C21.2484 17.2615 21.25 15.9068 21.25 14C21.25 13.5858 21.5858 13.25 22 13.25Z" fill="#ffffff"></path> </g></svg>';

  // Jump to next espisode button
  const nextEpisodeButton = document.createElement("button");
  nextEpisodeButton.id = "netflix-next-episode";
  nextEpisodeButton.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" role="img" viewBox="0 0 24 24" width="24" height="24" data-icon="NextEpisodeStandard" aria-hidden="true"><path fill="white" d="M22 3H20V21H22V3ZM4.28615 3.61729C3.28674 3.00228 2 3.7213 2 4.89478V19.1052C2 20.2787 3.28674 20.9977 4.28615 20.3827L15.8321 13.2775C16.7839 12.6918 16.7839 11.3082 15.8321 10.7225L4.28615 3.61729ZM4 18.2104V5.78956L14.092 12L4 18.2104Z" clip-rule="evenodd" fill-rule="evenodd"></path></svg>';

  // grey out the next episode button (default)
  nextEpisodeButton.disabled = true;
  nextEpisodeButton.style.opacity = "0.5";
  // enable button if next episode is available
  getNextEpisodeId().then((nextEpisodeId) => {
    if (nextEpisodeId) {
      nextEpisodeButton.disabled = false;
      nextEpisodeButton.style.opacity = "1"; // Enable button
    } else {
      nextEpisodeButton.disabled = true;
      nextEpisodeButton.style.opacity = "0.5"; // Greyed out
    }
  });


  // Subtitle toggle button
  const subtitleToggle = document.createElement("button");
  subtitleToggle.id = "netflix-subtitle-toggle";
  subtitleToggle.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20,4H4C2.9,4 2,4.9 2,6V18C2,19.1 2.9,20 4,20H20C21.1,20 22,19.1 22,18V6C22,4.9 21.1,4 20,4M20,18H4V6H20V18M6,10H8V12H6V10M6,14H14V16H6V14M16,14H18V16H16V14M10,10H18V12H10Z" fill="white"/></svg>';

  // remove toggle button , to use if you have a bug
  const removeToggle = document.createElement("button");
  removeToggle.id = "netflix-remove-toggle";
  removeToggle.innerHTML =
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V13C12.75 13.4142 12.4142 13.75 12 13.75C11.5858 13.75 11.25 13.4142 11.25 13V8C11.25 7.58579 11.5858 7.25 12 7.25Z" fill="#ffffff"></path> <path d="M12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z" fill="#ffffff"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M8.2944 4.47643C9.36631 3.11493 10.5018 2.25 12 2.25C13.4981 2.25 14.6336 3.11493 15.7056 4.47643C16.7598 5.81544 17.8769 7.79622 19.3063 10.3305L19.7418 11.1027C20.9234 13.1976 21.8566 14.8523 22.3468 16.1804C22.8478 17.5376 22.9668 18.7699 22.209 19.8569C21.4736 20.9118 20.2466 21.3434 18.6991 21.5471C17.1576 21.75 15.0845 21.75 12.4248 21.75H11.5752C8.91552 21.75 6.84239 21.75 5.30082 21.5471C3.75331 21.3434 2.52637 20.9118 1.79099 19.8569C1.03318 18.7699 1.15218 17.5376 1.65314 16.1804C2.14334 14.8523 3.07658 13.1977 4.25818 11.1027L4.69361 10.3307C6.123 7.79629 7.24019 5.81547 8.2944 4.47643ZM9.47297 5.40432C8.49896 6.64148 7.43704 8.51988 5.96495 11.1299L5.60129 11.7747C4.37507 13.9488 3.50368 15.4986 3.06034 16.6998C2.6227 17.8855 2.68338 18.5141 3.02148 18.9991C3.38202 19.5163 4.05873 19.8706 5.49659 20.0599C6.92858 20.2484 8.9026 20.25 11.6363 20.25H12.3636C15.0974 20.25 17.0714 20.2484 18.5034 20.0599C19.9412 19.8706 20.6179 19.5163 20.9785 18.9991C21.3166 18.5141 21.3773 17.8855 20.9396 16.6998C20.4963 15.4986 19.6249 13.9488 18.3987 11.7747L18.035 11.1299C16.5629 8.51987 15.501 6.64148 14.527 5.40431C13.562 4.17865 12.8126 3.75 12 3.75C11.1874 3.75 10.4379 4.17865 9.47297 5.40432Z" fill="#ffffff"></path> </g></svg>'

  const barreContainer = document.createElement("div");
  barreContainer.id = "netflix-barre-container";

  state.progressionBar = document.createElement("div");
  state.progressionBar.id = "netflix-barre-progression";

  // --- Progress tooltip (hover time) ---
  const progressTooltip = document.createElement("div");
  progressTooltip.id = "netflix-progress-tooltip";
  progressTooltip.textContent = "00:00";
  document.body.appendChild(progressTooltip); // <— attach to body
  state.progressTooltip = progressTooltip;

  function updateTooltipPosition(e) {
    if (!state.videoElement || !state.videoElement.duration) return;

    const rect = barreContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(rect.width, x)); // clamp within bar

    const pct = x / rect.width;
    const seconds = pct * state.videoElement.duration;

    // position in viewport coords (center over the cursor)
    progressTooltip.style.left = `${rect.left + x}px`;
    // keep it just above the bar; tweak 32 if you want tighter spacing
    progressTooltip.style.top = `${rect.top - 32}px`;
    progressTooltip.textContent = timeFormat(seconds);
  }

  barreContainer.addEventListener("mousemove", updateTooltipPosition);
  barreContainer.addEventListener("mouseenter", (e) => {
    updateTooltipPosition(e); // show correct value immediately
    progressTooltip.setAttribute("data-visible", "1");
  });
  barreContainer.addEventListener("mouseleave", () => {
    progressTooltip.removeAttribute("data-visible");
  });

  state.screenTime = document.createElement("div");
  state.screenTime.id = "netflix-temps";

  // Volume control
  const volumeContainer = document.createElement("div");
  volumeContainer.id = "netflix-volume-container";

  const volumeIcon = document.createElement("div");
  volumeIcon.id = "netflix-volume-icon";
  volumeIcon.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.84-5 6.7v2.07c4-.91 7-4.49 7-8.77 0-4.28-3-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03V16c1.5-.71 2.5-2.24 2.5-4M3 9v6h4l5 5V4L7 9H3z" fill="white"/></svg>';

  const volumeSliderContainer = document.createElement("div");
  volumeSliderContainer.id = "netflix-volume-slider-container";

  state.volumeSlider = document.createElement("input");
  state.volumeSlider.type = "range";
  state.volumeSlider.id = "netflix-volume-slider";
  state.volumeSlider.min = "0";
  state.volumeSlider.max = "100";
  state.volumeSlider.value = state.videoElement.volume * 100;

  const handleControlsClick = (e) => {
    if (
        e.target === state.buttonPlayPause ||
        e.target.closest("#netflix-play-pause")
    ) {
      if (state.videoElement.paused) {
        state.videoElement.play();
        state.buttonPlayPause.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 19H18V5H14V19ZM6 19H10V5H6V19Z" fill="white"/></svg>';
      } else {
        state.videoElement.pause();
        state.buttonPlayPause.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="white"/></svg>';
      }
    } else if (
        e.target === state.buttonFullScreen ||
        e.target.closest("#netflix-plein-ecran")
    ) {
      toggleFullScreen();
    } else if (
        e.target === volumeIcon ||
        e.target.closest("#netflix-volume-icon")
    ) {
      state.videoElement.muted = !state.videoElement.muted;
      volumeIcon.innerHTML = state.videoElement.muted
          ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L9.91 6.09 12 8.18M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.26c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.32 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9" fill="white"/></svg>'
          : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.84-5 6.7v2.07c4-.91 7-4.49 7-8.77 0-4.28-3-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03V16c1.5-.71 2.5-2.24 2.5-4M3 9v6h4l5 5V4L7 9H3z" fill="white"/></svg>';
    } else if (e.target === nextEpisodeButton || e.target.closest("#netflix-next-episode")) {
      // Trigger next episode action
      jumpToNextEpisode();
    } else if (e.target === episodesButton || e.target.closest('#netflix-episodes-button')) {
      // Toggle episodes list
      const panel = document.getElementById('netflix-episodes-list');
      if (panel) {
        panel.remove();
        state.episodesListOpen = false;
      } else {
        showEpisodesList();
      }
    } else if (
        e.target === subtitleToggle ||
        e.target.closest("#netflix-subtitle-toggle")
    ) {
      // Toggle subtitle settings panel
      toggleSubtitleSettings();
    } else if (
        e.target === removeToggle ||
        e.target.closest("#netflix-remove-toggle")
    ) {
      doYourJob()
      showMessage("bypassed successfully")
      createBackButton();
      createTipsButton();
    }
  };

  state.volumeSlider.addEventListener("input", (e) => {
    const volume = e.target.value / 100;
    state.videoElement.volume = volume;
    state.videoElement.muted = volume === 0;
    volumeIcon.innerHTML =
        volume === 0
            ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L9.91 6.09 12 8.18M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.26c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.32 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9" fill="white"/></svg>'
            : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.84-5 6.7v2.07c4-.91 7-4.49 7-8.77 0-4.28-3-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03V16c1.5-.71 2.5-2.24 2.5-4M3 9v6h4l5 5V4L7 9H3z" fill="white"/></svg>';
  });

  state.controllerElement.addEventListener("click", handleControlsClick);

  document.addEventListener("fullscreenchange", () => {
    if (state.buttonFullScreen) {
      state.buttonFullScreen.innerHTML = document.fullscreenElement
          ? '<svg width="24" height="24"  viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg"  fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_full_screen_zoom_24_filled" fill="#ffffff" fill-rule="nonzero"> <path d="M20,15 C20.5522847,15 21,15.4477153 21,16 C21,16.5522847 20.5522847,17 20,17 L17,17 L17,20 C17,20.5522847 16.5522847,21 16,21 C15.4477153,21 15,20.5522847 15,20 L15,16 C15,15.4477153 15.4477153,15 16,15 L20,15 Z M4,15 L8,15 C8.51283584,15 8.93550716,15.3860402 8.99327227,15.8833789 L9,16 L9,20 C9,20.5522847 8.55228475,21 8,21 C7.48716416,21 7.06449284,20.6139598 7.00672773,20.1166211 L7,20 L7,17 L4,17 C3.44771525,17 3,16.5522847 3,16 C3,15.4871642 3.38604019,15.0644928 3.88337887,15.0067277 L4,15 L8,15 L4,15 Z M16,3 C16.5128358,3 16.9355072,3.38604019 16.9932723,3.88337887 L17,4 L17,7 L20,7 C20.5522847,7 21,7.44771525 21,8 C21,8.51283584 20.6139598,8.93550716 20.1166211,8.99327227 L20,9 L16,9 C15.4871642,9 15.0644928,8.61395981 15.0067277,8.11662113 L15,8 L15,4 C15,3.44771525 15.4477153,3 16,3 Z M8,3 C8.55228475,3 9,3.44771525 9,4 L9,8 C9,8.55228475 8.55228475,9 8,9 L4,9 C3.44771525,9 3,8.55228475 3,8 C3,7.44771525 3.44771525,7 4,7 L7,7 L7,4 C7,3.44771525 7.44771525,3 8,3 Z" id="🎨-Color"> </path> </g> </g> </g></svg>'
          : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M9.94358 1.25L10 1.25C10.4142 1.25 10.75 1.58579 10.75 2C10.75 2.41421 10.4142 2.75 10 2.75C8.09318 2.75 6.73851 2.75159 5.71085 2.88976C4.70476 3.02502 4.12511 3.27869 3.7019 3.7019C3.27869 4.12511 3.02502 4.70476 2.88976 5.71085C2.75159 6.73851 2.75 8.09318 2.75 10C2.75 10.4142 2.41421 10.75 2 10.75C1.58579 10.75 1.25 10.4142 1.25 10L1.25 9.94358C1.24998 8.10582 1.24997 6.65019 1.40314 5.51098C1.56076 4.33856 1.89288 3.38961 2.64124 2.64124C3.38961 1.89288 4.33856 1.56076 5.51098 1.40314C6.65019 1.24997 8.10582 1.24998 9.94358 1.25ZM18.2892 2.88976C17.2615 2.75159 15.9068 2.75 14 2.75C13.5858 2.75 13.25 2.41421 13.25 2C13.25 1.58579 13.5858 1.25 14 1.25L14.0564 1.25C15.8942 1.24998 17.3498 1.24997 18.489 1.40314C19.6614 1.56076 20.6104 1.89288 21.3588 2.64124C22.1071 3.38961 22.4392 4.33856 22.5969 5.51098C22.75 6.65019 22.75 8.10583 22.75 9.94359V10C22.75 10.4142 22.4142 10.75 22 10.75C21.5858 10.75 21.25 10.4142 21.25 10C21.25 8.09318 21.2484 6.73851 21.1102 5.71085C20.975 4.70476 20.7213 4.12511 20.2981 3.7019C19.8749 3.27869 19.2952 3.02502 18.2892 2.88976ZM2 13.25C2.41421 13.25 2.75 13.5858 2.75 14C2.75 15.9068 2.75159 17.2615 2.88976 18.2892C3.02502 19.2952 3.27869 19.8749 3.7019 20.2981C4.12511 20.7213 4.70476 20.975 5.71085 21.1102C6.73851 21.2484 8.09318 21.25 10 21.25C10.4142 21.25 10.75 21.5858 10.75 22C10.75 22.4142 10.4142 22.75 10 22.75H9.94359C8.10583 22.75 6.65019 22.75 5.51098 22.5969C4.33856 22.4392 3.38961 22.1071 2.64124 21.3588C1.89288 20.6104 1.56076 19.6614 1.40314 18.489C1.24997 17.3498 1.24998 15.8942 1.25 14.0564L1.25 14C1.25 13.5858 1.58579 13.25 2 13.25ZM22 13.25C22.4142 13.25 22.75 13.5858 22.75 14V14.0564C22.75 15.8942 22.75 17.3498 22.5969 18.489C22.4392 19.6614 22.1071 20.6104 21.3588 21.3588C20.6104 22.1071 19.6614 22.4392 18.489 22.5969C17.3498 22.75 15.8942 22.75 14.0564 22.75H14C13.5858 22.75 13.25 22.4142 13.25 22C13.25 21.5858 13.5858 21.25 14 21.25C15.9068 21.25 17.2615 21.2484 18.2892 21.1102C19.2952 20.975 19.8749 20.7213 20.2981 20.2981C20.7213 19.8749 20.975 19.2952 21.1102 18.2892C21.2484 17.2615 21.25 15.9068 21.25 14C21.25 13.5858 21.5858 13.25 22 13.25Z" fill="#ffffff"></path> </g></svg>' ;
    }
  });

  // === Speed toggle button ===
  const speedToggleButton = document.createElement("button");
  speedToggleButton.id = "netflix-speed-toggle";
  speedToggleButton.title = "Speed: 1x";
  speedToggleButton.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" role="img" viewBox="0 0 24 24" width="24" height="24" data-icon="InternetSpeedStandard" aria-hidden="true">
<path fill="currentColor" d="M19.0569 6.27006C15.1546 2.20629 8.84535 2.20629 4.94312 6.27006C1.01896 10.3567 1.01896 16.9985 4.94312 21.0852L3.50053 22.4704C-1.16684 17.6098 -1.16684 9.7454 3.50053 4.88481C8.18984 0.0013696 15.8102 0.0013696 20.4995 4.88481C25.1668 9.7454 25.1668 17.6098 20.4995 22.4704L19.0569 21.0852C22.981 16.9985 22.981 10.3567 19.0569 6.27006ZM15 14.0001C15 15.6569 13.6569 17.0001 12 17.0001C10.3431 17.0001 9 15.6569 9 14.0001C9 12.3432 10.3431 11.0001 12 11.0001C12.4632 11.0001 12.9018 11.105 13.2934 11.2924L16.2929 8.29296L17.7071 9.70717L14.7076 12.7067C14.895 13.0983 15 13.5369 15 14.0001Z" clip-rule="evenodd" fill-rule="evenodd"></path>
</svg>
`;

  let speedOptions = [1, 1.25, 1.5, 1.75, 2];
  let currentSpeedIndex = 0;

  speedToggleButton.addEventListener("click", () => {
    currentSpeedIndex = (currentSpeedIndex + 1) % speedOptions.length;
    if (state.videoElement) {
      state.videoElement.playbackRate = speedOptions[currentSpeedIndex];
      speedToggleButton.title = `Speed: ${speedOptions[currentSpeedIndex]}x`;
      showMessage(`Speed: ${speedOptions[currentSpeedIndex]}x`);
    }
  });

  // Append to right controls bar
  controlsRight.appendChild(speedToggleButton);

  // === End of Video Speed Control Integration ===

  state.videoElement.addEventListener("play", () => {
    if (state.buttonPlayPause)
      state.buttonPlayPause.innerHTML =
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 19H18V5H14V19ZM6 19H10V5H6V19Z" fill="white"/></svg>';
    showController();
  });

  state.videoElement.addEventListener("pause", () => {
    if (state.buttonPlayPause)
      state.buttonPlayPause.innerHTML =
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="white"/></svg>';
    if (state.controllerElement) {
      state.controllerElement.classList.remove("hidden");
      state.isControllerVisible = true;
    }
  });

  setupKeyboardShortcuts();

  setTimeout(() => {
    if (videoAreaOverlay) {
      videoAreaOverlay.focus();
    }
  }, 500);

  // Prevent Netflix from stealing focus
  document.addEventListener("focusin", (e) => {
    if (
        state.isControllerAdded &&
        !e.target.closest("#mon-controleur-netflix") &&
        !e.target.closest("#netflix-subtitle-settings") &&
        e.target.tagName !== "INPUT" &&
        e.target.tagName !== "TEXTAREA" &&
        state.videoOverlay
    ) {
      // Wait to avoid focus fighting and only if not user-initiated
      if (!state.userInitiatedFocus) {
        setTimeout(() => {
          state.videoOverlay.focus();
        }, 10);
      }
    }
  });

  // Track user-initiated focus
  document.addEventListener("mousedown", () => {
    state.userInitiatedFocus = true;
    setTimeout(() => {
      state.userInitiatedFocus = false;
    }, 100);
  });

  // Auto-hide controller after inactivity
  state.videoElement.addEventListener("mousemove", () => {
    showController();
  });

  document.addEventListener("mousemove", () => {
    showController();
  });

  // Add click event to overlay for play/pause toggle
  state.videoOverlay.addEventListener("click", (e) => {
    // Prevent clicks on controller from triggering this
    if (
        !e.target.closest("#mon-controleur-netflix") &&
        !e.target.closest("#netflix-subtitle-settings")
    ) {
      if (state.videoElement.paused) {
        state.videoElement.play();
        state.buttonPlayPause.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 19H18V5H14V19ZM6 19H10V5H6V19Z" fill="white"/></svg>';
      } else {
        state.videoElement.pause();
        state.buttonPlayPause.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="white"/></svg>';
      }
    }
  });

  // Set up keyboard shortcuts

  volumeSliderContainer.appendChild(state.volumeSlider);
  volumeContainer.appendChild(volumeIcon);
  volumeContainer.appendChild(volumeSliderContainer);

  barreContainer.appendChild(state.progressionBar);

  // Create a container for the progress bar to ensure vertical alignment
  const progressContainer = document.createElement("div");
  progressContainer.style.display = "flex";
  progressContainer.style.alignItems = "center"; // Center items vertically
  progressContainer.style.flex = "1";
  progressContainer.appendChild(barreContainer);

  // Organize controls
  controlsLeft.appendChild(state.buttonPlayPause);
  controlsLeft.appendChild(volumeContainer);
  controlsLeft.appendChild(state.screenTime);

  const episodesButton = document.createElement("button");
  episodesButton.id = "netflix-episodes-button";
  episodesButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M5.00004 16.8669L4.62722 16.9413C2.73914 17.3183 0.98708 15.8303 1.00007 13.8609L1.05413 5.66559C1.06392 4.18207 2.09362 2.91119 3.51587 2.62725L11.3728 1.05866C13.2589 0.682096 15.0093 2.16667 15 4.13309L15.3728 4.05866C17.259 3.6821 19.0094 5.16666 19 7.13308L19.3728 7.05866C21.2608 6.68171 23.0129 8.16969 22.9999 10.1391L22.9459 18.3344C22.9361 19.8179 21.9064 21.0888 20.4841 21.3728L12.6272 22.9413C10.7409 23.3179 8.99026 21.833 9.00004 19.8662L8.62722 19.9413C6.74104 20.3179 4.99061 18.8333 5.00004 16.8669ZM9.01352 17.8248L9.05418 11.6656C9.06395 10.182 10.0936 8.9112 11.5159 8.62722L16.9973 7.5329L17 7.1259C17.005 6.36468 16.3525 5.90253 15.7644 6.01995L7.90743 7.58854C7.44642 7.68057 7.05783 8.112 7.05409 8.67877L7.00003 16.8741C6.99501 17.6353 7.64752 18.0975 8.23566 17.98L9.01352 17.8248ZM13 4.12595L12.9973 4.53291L7.51587 5.62724C6.09362 5.91118 5.06392 7.18207 5.05413 8.66557L5.0135 14.8248L4.23566 14.98C3.64746 15.0975 2.99501 14.6353 3.00003 13.8741L3.05409 5.67878C3.05783 5.112 3.44643 4.68058 3.90743 4.58854L11.7643 3.01995C12.3525 2.90253 13.005 3.36463 13 4.12595ZM20.9459 18.3212C20.9421 18.888 20.5535 19.3194 20.0926 19.4115L12.2357 20.98C11.6475 21.0975 10.9951 20.6353 11 19.8741L11.0541 11.6788C11.0579 11.112 11.4465 10.6806 11.9075 10.5885L19.7643 9.01995C20.3525 8.90252 21.005 9.36473 21 10.1259L20.9459 18.3212Z" fill="#ffffff"></path> </g></svg>';

  controlsRight.appendChild(nextEpisodeButton);
  controlsRight.appendChild(episodesButton);
  controlsRight.appendChild(removeToggle);
  controlsRight.appendChild(subtitleToggle);
  controlsRight.appendChild(state.buttonFullScreen);
  controlsRight.appendChild(speedToggleButton);


  state.controllerElement.appendChild(controlsLeft);
  state.controllerElement.appendChild(progressContainer);
  state.controllerElement.appendChild(controlsRight);

  // Add the overlay first, then the controller (so controller is on top)
  document.body.appendChild(state.videoOverlay);
  document.body.appendChild(state.controllerElement);
  state.isControllerAdded = true;

  updateProgression();

  const rafCallback = () => {
    updateProgression();
    if (state.controllerElement) {
      state.progressionIntervalId = requestAnimationFrame(rafCallback);
    }
  };
  state.progressionIntervalId = requestAnimationFrame(rafCallback);

  // Set up Event listener to allow seeking using progress bar
  barreContainer.addEventListener("click", (e) => {
    const rect = barreContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100; // allows us to determine where user wants to seek to

    const totalVideoTime = Math.floor(state.videoElement.duration); // seconds
    const seekTime = Math.floor((percent / 100) * totalVideoTime * 1000); // ms

    // Send to injected script for custom seeking
    window.dispatchEvent(
        new CustomEvent("netflixSeekTo", { detail: seekTime })
    );
  });

  // Initial auto-hide if video is playing
  if (!state.videoElement.paused) {
    showController();
  }

  // Create subtitle settings panel
  state.subtitleSettingsPanel = createSubtitleSettings();

  // If subtitles were previously enabled, re-enable them
  // Create and add back button
  createBackButton();
  //create and add tips button
  createTipsButton();
}

/**
 * Remove elements by class name
 * @param {string[]} classesNames - Array of class names to remove
 */
function removeElementsByClasses(classesNames) {
  classesNames.forEach((className) => {
    const elementsToRemove = document.querySelectorAll(
        `[class*="${className}"]`
    );
    if (elementsToRemove.length > 0) {
      elementsToRemove.forEach((el) => el.remove());
    }
  });
}

/**
 * Main function to initialize or cleanup the controller
 */
function doYourJob() {
  if (state.controllerType === "netflix") {
    removeElementsByClasses(CLASSES_TO_REMOVE);
    return;
  }

  //get audio trackliste
  window.dispatchEvent(
      new CustomEvent("GetAudioTracksList"),
  );
  //get substitle trackliste
  window.dispatchEvent(
      new CustomEvent("GetSubtitleTracksList")
  );
  if (isOnNetflixWatch()) {
    removeElementsByClasses(CLASSES_TO_REMOVE);

    // Use debounce technique to prevent multiple calls
    if (state.controllerTimerId) {
      clearTimeout(state.controllerTimerId);
    }

    state.controllerTimerId = setTimeout(() => {
      addMediaController();
      state.controllerTimerId = null;
      state.videoElement.play();
      state.buttonPlayPause.innerHTML =
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 19H18V5H14V19ZM6 19H10V5H6V19Z" fill="white"/></svg>';
    }, CONTROLLER_INIT_DELAY);
  } else {
    removeElementsByClasses(CLASSES_TO_REMOVE);
    cleanController();
  }
}

// Set up MutationObserver to detect DOM changes
const observerOptions = {
  childList: true,
  subtree: true,
};

const observer = new MutationObserver((mutations) => {
  if (state.mutationTimeout) clearTimeout(state.mutationTimeout);

  // Handle restriction screen: remove it, resume video and show controller
  const hasRestrictionNode = mutations.some((mutation) =>
    Array.from(mutation.addedNodes).some((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return false;
      const cls = node.className || "";
      return typeof cls === "string" && CLASSES_TO_REMOVE.some((c) => cls.includes(c));
    })
  );
  if (hasRestrictionNode) {
    removeElementsByClasses(CLASSES_TO_REMOVE);
    const video = document.querySelector("video");
    if (video) {
      video.play();
      if (state.controllerTimerId) clearTimeout(state.controllerTimerId);
      state.controllerTimerId = null;
      addMediaController();
    }
  }

  state.mutationTimeout = setTimeout(() => {
    const hasRelevantChanges = mutations.some((mutation) => {
      return Array.from(mutation.addedNodes).some((node) => {
        if (node.nodeName === "VIDEO") return true;

        // Check if relevant to our controller
        if (node.nodeType === Node.ELEMENT_NODE) {
          // More robust class checking
          const nodeClassName = node.className || "";
          return (
              node.querySelector("video") ||
              CLASSES_TO_REMOVE.some(
                  (c) =>
                      typeof nodeClassName === "string" && nodeClassName.includes(c)
              )
          );
        }
        return false;
      });
    });

    if (hasRelevantChanges || !state.isControllerAdded) {
      doYourJob();
    }
  }, 100); // Debounce time
});

browser.storage.local.get(["controllerType"]).then((result) => {
  if (result.controllerType) state.controllerType = result.controllerType;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (state.controllerType === "nikflix") setupKeyboardShortcuts();
      observer.observe(document.body, observerOptions);
      doYourJob();
    });
  } else {
    if (state.controllerType === "nikflix") setupKeyboardShortcuts();
    observer.observe(document.body, observerOptions);
    doYourJob();
  }
});

/**
 * Create and add back button to exit Netflix video player
 */
function createBackButton() {
  if (state.backButton) return; // Don't create if it already exists
  state.backButton = document.createElement("button");
  state.backButton.id = "netflix-back-button";
  state.backButton.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="white"/></svg>';

  // Style the back button
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
  state.backButton.style.opacity = "0"

  // Add hover effect
  state.backButton.addEventListener("mouseover", () => {
    state.backButton.style.backgroundColor = "rgba(229, 9, 20, 0.8)";
    state.backButton.style.transform = "scale(1.1)";
  });

  state.backButton.addEventListener("mouseout", () => {
    state.backButton.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    state.backButton.style.transform = "scale(1)";
  });

  // Add click event to exit Netflix player
  state.backButton.addEventListener("click", () => {
    // Try multiple approaches to exit the Netflix video player

    // Approach 1: Look for Netflix's own back button and click it
    const netflixBackButton =
        document.querySelector('button[data-uia="player-back-to-browse"]') ||
        document.querySelector(".button-nfplayerBack") ||
        document.querySelector("button.nf-player-container button") ||
        document.querySelector('button[aria-label="Back to Browse"]');

    if (netflixBackButton) {
      netflixBackButton.click();
      return;
    }

    // Approach 2: Simulate Escape key press (commonly exits fullscreen video players)
    const escKeyEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true,
    });

    document.body.dispatchEvent(escKeyEvent);

    // Approach 3: Look for back button within specific Netflix player containers
    const playerContainer =
        document.querySelector(".nf-player-container") ||
        document.querySelector(".watch-video--player-view");

    if (playerContainer) {
      const backBtn = playerContainer.querySelector("button");
      if (backBtn) {
        backBtn.click();
        return;
      }
    }

    // Approach 4: As a fallback, try to return to the browse page
    const currentUrl = window.location.href;
    if (currentUrl.includes("netflix.com/watch/")) {
      window.location.href = "https://www.netflix.com/browse";
    }
  });

  document.body.appendChild(state.backButton);
  // Connect to controller visibility changes
  const originalShowController = showController;
  showController = function () {
    originalShowController();
  };

  // Handle controller hide timer completion
  const originalControllerHideTimer = state.controllerHideTimer;
  if (originalControllerHideTimer) {
    clearTimeout(originalControllerHideTimer);
    state.controllerHideTimer = setTimeout(() => {
      if (
          state.controllerElement &&
          !state.videoElement.paused &&
          !state.subtitleSettingsOpen
      ) {
        state.controllerElement.classList.add("hidden");
        state.isControllerVisible = false;
        state.backButton.style.opacity = "0";
        state.tipsButton.style.opacity="0";
      }
    }, CONTROLLER_HIDE_DELAY);
  }
}

/**
 * Create and add tips button
 */
function createTipsButton() {
  if (state.tipsButton) return; // Don't create if it already exists
  state.tipsButton = document.createElement("button");
  state.tipsButton.id = "nikflix-tips-button";
  state.tipsButton.innerHTML =
      '<svg viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M566 268.4v66.3H353.9v-66.3h-66.3v-79.5h357.9v79.5H566z" fill="#FFFFFF"></path><path d="M558.5 319.2l98.7 86.4c72.6 50.6 115.8 133.5 115.8 222 0 88-63.7 163-150.5 177.4-55 9.1-110.1 13.6-165.1 13.6s-110.1-4.5-165.1-13.6c-86.8-14.3-150.5-89.4-150.5-177.4 0-88.5 43.3-171.3 115.8-221.9l113.7-86.4h187.2z" fill="#FFFFFF"></path><path d="M457.4 845.1c-56.2 0-113.2-4.7-169.4-14C188 814.6 115.3 729 115.3 627.6c0-97.1 47.5-188.2 127.2-243.7l119.9-91.2h206l105.1 92c78.9 55.6 126 146.2 126 242.8 0 101.4-72.6 187-172.7 203.5-56.1 9.4-113.1 14.1-169.4 14.1z m-77.2-499.4l-106.5 81c-66.3 46.2-105.4 121.1-105.4 200.8 0 75.3 54 138.9 128.3 151.2 106.7 17.6 214.9 17.6 321.6 0 74.3-12.3 128.3-75.9 128.3-151.2 0-79.7-39.1-154.6-104.5-200.2l-2.3-1.8-91.2-79.8H380.2z" fill="#333333"></path><path d="M354 305l-66.7-57.3c-13.8-8.9-21-22.7-20.7-36.7m395.1 0.1c0 14.7-8.3 28.4-22.1 36.5L561.9 308" fill="#FFFFFF"></path><path d="M561.9 334.5c-7.9 0-15.7-3.5-21-10.3-9-11.6-6.9-28.2 4.7-37.2l80.5-62.2c5.7-3.3 9-8.5 9-13.7 0-14.6 11.9-26.5 26.5-26.5s26.5 11.9 26.5 26.5c0 23.6-12.5 45.3-33.6 58.4l-76.6 59.4c-4.6 3.8-10.3 5.6-16 5.6z m-208-3c-6.1 0-12.3-2.1-17.3-6.4l-65.4-56.3c-20-13.6-31.6-35.3-31.2-58.4 0.3-14.6 12.8-26.4 27-26 14.6 0.3 26.3 12.4 26 27-0.1 5.3 3 10.4 8.5 13.9l2.9 2.2 66.7 57.3c11.1 9.5 12.4 26.3 2.8 37.4-5.1 6.2-12.5 9.3-20 9.3z" fill="#333333"></path><path d="M365.4 229.3c-14.6 0-26.5-11.9-26.5-26.5 0-6.6-9.8-13.9-22.9-13.9s-22.9 7.4-22.9 13.9c0 14.6-11.9 26.5-26.5 26.5s-26.5-11.9-26.5-26.5c0-36.9 34-67 75.9-67s75.9 30 75.9 67c0 14.7-11.9 26.5-26.5 26.5zM562.9 229.3c-14.6 0-26.5-11.9-26.5-26.5 0-6.6-9.8-13.9-22.9-13.9-13.1 0-22.9 7.4-22.9 13.9 0 14.6-11.9 26.5-26.5 26.5s-26.5-11.9-26.5-26.5c0-36.9 34.1-67 75.9-67s75.9 30 75.9 67c0.1 14.7-11.8 26.5-26.5 26.5z" fill="#333333"></path><path d="M661.7 229.3c-14.6 0-26.5-11.9-26.5-26.5 0-6.6-9.8-13.9-22.9-13.9s-22.9 7.4-22.9 13.9c0 14.6-11.9 26.5-26.5 26.5s-26.5-11.8-26.5-26.5c0-36.9 34-67 75.9-67s75.9 30 75.9 67c0 14.7-11.8 26.5-26.5 26.5zM464.2 229.3c-14.6 0-26.5-11.9-26.5-26.5 0-6.6-9.8-13.9-22.9-13.9s-22.9 7.4-22.9 13.9c0 14.6-11.9 26.5-26.5 26.5s-26.5-11.9-26.5-26.5c0-36.9 34-67 75.9-67s75.9 30 75.9 67c0 14.7-11.9 26.5-26.5 26.5z" fill="#333333"></path><path d="M679.1 621.5m-205.1 0a205.1 205.1 0 1 0 410.2 0 205.1 205.1 0 1 0-410.2 0Z" fill="#9dff5c"></path><path d="M679.1 853.1c-127.7 0-231.6-103.9-231.6-231.6 0-127.7 103.9-231.6 231.6-231.6s231.6 103.9 231.6 231.6c0 127.7-103.9 231.6-231.6 231.6z m0-410.2C580.6 442.9 500.4 523 500.4 621.5S580.5 800.1 679 800.1 857.7 720 857.7 621.5s-80.2-178.6-178.6-178.6z" fill="#333333"></path><path d="M720.47 621.453l-41.436 41.436-41.437-41.436 41.436-41.437z" fill="#FFFFFF"></path><path d="M679.079 737.919l-116.46-116.46 116.46-116.461 116.46 116.46-116.46 116.46z m-41.508-116.46l41.437 41.436 41.436-41.437-41.436-41.436-41.437 41.436z" fill="#333333"></path><path d="M591.6 302.3l76-20.4c14.1-3.8 28.7 4.6 32.5 18.7 3.8 14.1-4.6 28.7-18.7 32.5l-76 20.4c-14.1 3.8-28.7-4.6-32.5-18.7-3.8-14.2 4.6-28.7 18.7-32.5z" fill="#333333"></path></g></svg>';

  // Style the back button
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
  state.tipsButton.style.opacity = "0"

  // Add hover effect
  state.tipsButton.addEventListener("mouseover", () => {
    state.tipsButton.style.backgroundColor = "rgba(229, 9, 20, 0.8)";
    state.tipsButton.style.transform = "scale(1.1)";
  });

  state.tipsButton.addEventListener("mouseout", () => {
    state.tipsButton.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    state.tipsButton.style.transform = "scale(1)";
  });

  // Add click event
  state.tipsButton.addEventListener("click", () => {
    window.open("https://ko-fi.com/yidirk", '_blank').focus();
  });

  document.body.appendChild(state.tipsButton);

  // Connect to controller visibility changes
  const originalShowController = showController;
  showController = function () {
    originalShowController();
  };

  // Handle controller hide timer completion
  const originalControllerHideTimer = state.controllerHideTimer;
  if (originalControllerHideTimer) {
    clearTimeout(originalControllerHideTimer);
    state.controllerHideTimer = setTimeout(() => {
      if (
          state.controllerElement &&
          !state.videoElement.paused &&
          !state.subtitleSettingsOpen
      ) {
        state.controllerElement.classList.add("hidden");
        state.isControllerVisible = false;
        state.backButton.style.opacity = "0";
        state.tipsButton.style.opacity="0";
      }
    }, CONTROLLER_HIDE_DELAY);
  }
}

function getIdFromUrl() {
  const url = window.location.href;
  const parts = url.split('/');
  const watchIndex = parts.indexOf('watch');
  if (watchIndex !== -1 && watchIndex + 1 < parts.length) {
    return parts[watchIndex + 1].split('?')[0];
  }
  return null;
}

function getNextEpisodeId() {
  const curEpisodeId = getIdFromUrl(); // Get current episode ID from the URL
  if (!curEpisodeId) {
    console.log("No current episode ID found in URL");
    return null;
  }

  // Fetch the metadata for the current episode
  return fetch(`https://www.netflix.com/nq/website/memberapi/release/metadata?movieid=${curEpisodeId}`, {
    credentials: "include", // Important: includes your session cookies
  })
      .then(response => response.json())
      .then(response => {
        const episodes = response.video.seasons.reduce((acc, season) => {
          if (season.episodes) {
            acc.push(...season.episodes);
          }
          return acc;
        }, []);

        console.log("Current Episode ID: ", curEpisodeId);

        // Find the index of the current episode
        const curEpisodeIndex = episodes.findIndex(episode => episode.id.toString() === curEpisodeId);
        if (curEpisodeIndex === -1) {
          console.log("Current episode not found");
          return null;
        }

        // Get the next episode
        const nextEpisode = episodes[curEpisodeIndex + 1] || null;
        if (nextEpisode) {
          return nextEpisode.id;
        } else {
          console.log("No next episode found");
          return null;
        }
      })
      .catch(error => {
        console.error("Error fetching metadata:", error);
        return null;
      });
}

function jumpToNextEpisode() {
  getNextEpisodeId()
      .then(nextEpisodeId => {
        if (nextEpisodeId) {
          const nextEpisodeUrl = `https://www.netflix.com/watch/${nextEpisodeId}`;
          window.location.href = nextEpisodeUrl; // Redirect to the next episode
        } else {
          console.log("No next episode found or error fetching data.");
        }
      })
      .catch(error => {
        console.error("Error jumping to next episode:", error);
      });
  console.log("Next episode triggered....");
}

// disable controller (Firefox)
browser.runtime.onMessage.addListener((message, sender) => {

  const controller = document.getElementById('mon-controleur-netflix');
  const overlayArea = document.getElementById("netflix-video-area-overlay");
  const overlay = document.getElementById("netflix-video-overlay")


  if (message.message === "enable") {
    if (controller) controller.style.display = "flex";
    if (overlayArea) overlayArea.style.display = "flex";
    if (overlay) overlay.style.display = "flex";
    showMessage("Controller Enabled");
  } else if (message.message === "disable") {
    if (controller) controller.style.display = "none";
    if (overlayArea) overlayArea.style.display = "none";
    if (overlay) overlay.style.display = "none";
    showMessage("Controller Disabled");
    console.log("Disabled");
  } else if (message.message === "debug") {
    doYourJob();
    showMessage("bypassed successfully");
    if (state.controllerType === "nikflix") {
      createBackButton();
      createTipsButton();
    }
  } else if (message.message === "controllerType") {
    state.controllerType = message.value;
    browser.storage.local.set({ controllerType: message.value });
  }
});

