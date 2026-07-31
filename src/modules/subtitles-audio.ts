import { state, SUBTITLE_SETTINGS_ID } from './player-state';

export function generateAudioLanguageOptions(selectedLang: number | string): string {
  let optionsHTML = "";
  if (state.availableAudioTracks.length > 0) {
    state.availableAudioTracks.forEach((track: any, index: number) => {
      const isSelected = index.toString() === selectedLang.toString() ? "selected" : "";
      optionsHTML += `<option value="${index}" ${isSelected}>${track.displayName || track.name || 'Audio ' + index}</option>`;
    });
  }
  return optionsHTML;
}

export function generateSubtitleLanguageOptions(selectedLang: number | string): string {
  let optionsHTML = "";
  if (state.availableSubtitleTracks.length > 0) {
    state.availableSubtitleTracks.forEach((track: any, index: number) => {
      const isSelected = index.toString() === selectedLang.toString() ? "selected" : "";
      optionsHTML += `<option value="${index}" ${isSelected}>${track.displayName || track.name || 'Subtitle ' + index}</option>`;
    });
  }
  return optionsHTML;
}

export function createSubtitleSettings(
  doYourJobFn: () => void,
  showMessageFn: (msg: string, duration?: number) => void,
  showControllerFn: () => void
): HTMLElement {
  const panel = document.createElement("div");
  panel.id = SUBTITLE_SETTINGS_ID;
  panel.className = state.subtitleSettingsOpen ? "visible" : "";

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

  const subtitleCheckbox = panel.querySelector("#subtitle-toggle-checkbox") as HTMLInputElement | null;
  if (subtitleCheckbox) {
    subtitleCheckbox.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      state.subtitleEnabled = target.checked;

      const event = new CustomEvent("netflixSubtitleChange", {
        detail: state.subtitleEnabled ? 1 : 0,
      });
      window.dispatchEvent(event);

      setTimeout(() => {
        doYourJobFn();
        showMessageFn(state.subtitleEnabled ? "Subtitles enabled" : "Subtitles disabled", 2000);
      }, 500);
    });
  }

  const audioSelect = panel.querySelector("#audio-language-select") as HTMLSelectElement | null;
  if (audioSelect) {
    audioSelect.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      state.audioLanguage = parseInt(target.value, 10);
      window.dispatchEvent(
        new CustomEvent("netflixAudioChange", { detail: target.value })
      );
      setTimeout(() => {
        doYourJobFn();
        const track = (state.availableAudioTracks as any[])[state.audioLanguage];
        showMessageFn(`Audio changed to ${track?.displayName || track?.name || target.value}`, 2000);
      }, 500);
    });
  }

  const subtitleSelect = panel.querySelector("#subtitle-language-select") as HTMLSelectElement | null;
  if (subtitleSelect) {
    subtitleSelect.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      const selectedValue = target.value;
      state.substitleLanguage = parseInt(selectedValue, 10);

      window.dispatchEvent(
        new CustomEvent("netflixSubtitleChange", { detail: selectedValue })
      );

      setTimeout(() => {
        doYourJobFn();
        state.subtitleEnabled = selectedValue !== "0";

        if (subtitleCheckbox) {
          subtitleCheckbox.checked = state.subtitleEnabled;
        }

        const track = (state.availableSubtitleTracks as any[])[parseInt(selectedValue, 10)];
        showMessageFn(`Subtitle changed to ${track?.displayName || track?.name || 'Unknown'}`, 2000);
      }, 500);
    });
  }

  return panel;
}

export function toggleSubtitleSettings(
  doYourJobFn: () => void,
  showMessageFn: (msg: string, duration?: number) => void,
  showControllerFn: () => void
): void {
  state.subtitleSettingsOpen = !state.subtitleSettingsOpen;

  if (!state.subtitleSettingsPanel) {
    state.subtitleSettingsPanel = createSubtitleSettings(doYourJobFn, showMessageFn, showControllerFn);
  }

  if (state.subtitleSettingsOpen) {
    state.subtitleSettingsPanel.classList.add("visible");
    if (state.controllerHideTimer) {
      clearTimeout(state.controllerHideTimer);
      state.controllerHideTimer = null;
    }
  } else {
    state.subtitleSettingsPanel.classList.remove("visible");
    showControllerFn();
  }
}
