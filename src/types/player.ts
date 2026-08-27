export interface SubtitleTrack {
  id?: string | number;
  language?: string;
  name?: string;
  isBilingual?: boolean;
}

export interface AudioTrack {
  id?: string | number;
  language?: string;
  name?: string;
}

export interface SkipMarker {
  startMs: number;
  endMs: number;
}

export interface PlayerState {
  progressionIntervalId: number | NodeJS.Timeout | null;
  controllerElement: HTMLElement | null;
  buttonPlayPause: HTMLElement | null;
  buttonFullScreen: HTMLElement | null;
  progressionBar: HTMLElement | null;
  screenTime: HTMLElement | null;
  videoElement: HTMLVideoElement | null;
  currentEpisodeDuration: number | null;
  currentEpisodeId: string | null;
  volumeSlider: HTMLInputElement | null;
  lastScreenTime: number;
  lastTotalTime: number;
  isControllerAdded: boolean;
  mutationTimeout: number | NodeJS.Timeout | null;
  controllerTimerId: number | NodeJS.Timeout | null;
  isControllerVisible: boolean;
  controllerHideTimer: number | NodeJS.Timeout | null;
  videoOverlay: HTMLElement | null;
  keyboardListener: ((e: KeyboardEvent) => void) | null;
  messageOverlay: HTMLElement | null;
  messageTimer: number | NodeJS.Timeout | null;
  seekAmount: number;
  backButton: HTMLElement | null;
  tipsButton: HTMLElement | null;

  // Subtitle state
  subtitleEnabled: boolean;
  bilingualEnabled: boolean;
  primarySubtitleTrack: SubtitleTrack | null;
  secondarySubtitleTrack: SubtitleTrack | null;
  availableSubtitleTracks: SubtitleTrack[];
  substitleLanguage: number;
  subtitleObserver: MutationObserver | null;
  subtitleContainer: HTMLElement | null;
  subtitleSettingsOpen: boolean;
  subtitleSettingsPanel: HTMLElement | null;

  // Audio state
  availableAudioTracks: AudioTrack[];
  audioLanguage: number;

  // Episodes state
  episodesListOpen: boolean;

  // Tooltip state
  progressTooltip: HTMLElement | null;

  // Autoplay state
  autoplayNextEpisode: boolean;

  // Skip markers (intro/outro)
  skipIntroMarker: SkipMarker | null;
  skipOutroMarker: SkipMarker | null;
  skipIntroDismissed: boolean;
  skipOutroDismissed: boolean;

  // Episode title
  episodeTitle: string | null;
  episodeSubtitle: string | null;
}
