import type { PlayerState } from '../types/player';

export function createInitialState(): PlayerState {
  return {
    progressionIntervalId: null,
    controllerElement: null,
    buttonPlayPause: null,
    buttonFullScreen: null,
    progressionBar: null,
    screenTime: null,
    videoElement: null,
    currentEpisodeDuration: null,
    currentEpisodeId: null,
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
    seekAmount: 10,
    backButton: null,
    tipsButton: null,

    // Subtitles
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

    // Audio
    availableAudioTracks: [],
    audioLanguage: 0,

    // Episodes list state
    episodesListOpen: false,

    // Tooltip state
    progressTooltip: null,

    // Autoplay next episode state
    autoplayNextEpisode: false,
  };
}

export const state: PlayerState = createInitialState();

export const CONTROLLER_ID = "mon-controleur-netflix";
export const NETFLIX_WATCH_REGEX = /^https:\/\/www\.netflix\.com\/watch\/\d+/;
export const CONTROLLER_INIT_DELAY = 1500;
export const CONTROLLER_HIDE_DELAY = 3000;
export const SUBTITLE_SETTINGS_ID = "netflix-subtitle-settings";
