import { state } from './player-state';

const durationCacheMap = new Map<string, number>();

export function getCachedDuration(episodeId: string | null): number | null {
  if (!episodeId) return null;
  if (durationCacheMap.has(episodeId)) {
    return durationCacheMap.get(episodeId)!;
  }
  try {
    const stored = sessionStorage.getItem(`nikflix_duration_${episodeId}`);
    if (stored) {
      const parsed = parseFloat(stored);
      if (Number.isFinite(parsed) && parsed > 0) {
        durationCacheMap.set(episodeId, parsed);
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

export function saveCachedDuration(episodeId: string | null, duration: number): void {
  if (!episodeId || !Number.isFinite(duration) || duration <= 0) return;
  durationCacheMap.set(episodeId, duration);
  try {
    sessionStorage.setItem(`nikflix_duration_${episodeId}`, duration.toString());
  } catch (e) {}
}

export function getEffectiveDuration(): number {
  const episodeId = getIdFromUrl();
  if (state.currentEpisodeDuration && Number.isFinite(state.currentEpisodeDuration) && state.currentEpisodeDuration > 0) {
    saveCachedDuration(episodeId, state.currentEpisodeDuration);
    return state.currentEpisodeDuration;
  }
  const cached = getCachedDuration(episodeId);
  if (cached && Number.isFinite(cached) && cached > 0) {
    state.currentEpisodeDuration = cached;
    return cached;
  }
  if (state.videoElement && state.videoElement.duration && Number.isFinite(state.videoElement.duration) && state.videoElement.duration > 0) {
    const dur = state.videoElement.duration;
    state.currentEpisodeDuration = dur;
    saveCachedDuration(episodeId, dur);
    return dur;
  }
  return 0;
}

export function getIdFromUrl(): string | null {
  const url = window.location.href;
  const parts = url.split("/");
  const watchIndex = parts.indexOf("watch");
  if (watchIndex !== -1 && watchIndex + 1 < parts.length) {
    return parts[watchIndex + 1].split("?")[0];
  }
  return null;
}

export async function getNextEpisodeId(): Promise<string | number | null> {
  const curEpisodeId = getIdFromUrl();
  if (!curEpisodeId) {
    console.log("No current episode ID found in URL");
    return null;
  }

  try {
    const response = await fetch(
      `https://www.netflix.com/nq/website/memberapi/release/metadata?movieid=${curEpisodeId}`,
      { credentials: "include" }
    );
    const data = await response.json();

    const episodes: Array<{ id: string | number }> = data.video.seasons.reduce(
      (acc: Array<{ id: string | number }>, season: { episodes?: Array<{ id: string | number }> }) => {
        if (season.episodes) {
          acc.push(...season.episodes);
        }
        return acc;
      },
      []
    );

    const video = document.querySelector('video');
    if (video) video.disablePictureInPicture = false;

    const curEpisodeIndex = episodes.findIndex(
      (episode) => episode.id.toString() === curEpisodeId
    );
    if (curEpisodeIndex === -1) {
      console.log("Current episode not found");
      return null;
    }

    const nextEpisode = episodes[curEpisodeIndex + 1] || null;
    return nextEpisode ? nextEpisode.id : null;
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return null;
  }
}

export async function fetchEpisodeMetadata(): Promise<any> {
  const curEpisodeId = getIdFromUrl();
  if (!curEpisodeId) return null;

  try {
    const res = await fetch(
      `https://www.netflix.com/nq/website/memberapi/release/metadata?movieid=${curEpisodeId}`,
      { credentials: "include" }
    );
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn("Could not fetch metadata:", err);
    return null;
  }
}

export async function fetchAndCacheCurrentEpisodeDuration(timeFormatFn: (seconds: number) => string): Promise<void> {
  const curEpisodeId = getIdFromUrl();
  if (!curEpisodeId) return;

  try {
    const data = await fetchEpisodeMetadata();
    if (!data?.video) return;

    let runtime: number | null = null;
    let mainTitle: string = data.video.title || "";
    let subTitle: string = "";
    let introMarker: { startMs: number; endMs: number } | null = null;
    let outroMarker: { startMs: number; endMs: number } | null = null;

    if (data.video.runtime && Number.isFinite(data.video.runtime)) {
      runtime = data.video.runtime;
    }

    const seasons = data.video.seasons || [];
    let currentEpisodeObj: any = null;
    let currentSeasonObj: any = null;

    for (const season of seasons) {
      if (!season?.episodes || !Array.isArray(season.episodes)) continue;
      const found = season.episodes.find(
        (ep: any) => ep.id && ep.id.toString() === curEpisodeId.toString()
      );
      if (found) {
        currentEpisodeObj = found;
        currentSeasonObj = season;
        if (Number.isFinite(found.runtime)) {
          runtime = found.runtime;
        }
        break;
      }
    }

    if (currentEpisodeObj && currentSeasonObj) {
      subTitle = `S${currentSeasonObj.seq}:E${currentEpisodeObj.seq} ${currentEpisodeObj.title || ""}`.trim();
    } else if (data.video.title) {
      subTitle = "";
    }

    // Extract skip markers (intro & credits/outro) from metadata
    const markers = currentEpisodeObj?.markers || data.video.markers || currentEpisodeObj?.timelineMarkers || data.video.timelineMarkers;
    if (markers) {
      if (Array.isArray(markers)) {
        for (const m of markers) {
          const type = (m.type || m.name || "").toLowerCase();
          const start = m.startMs ?? (m.start != null ? m.start * 1000 : null) ?? (m.startOffset != null ? m.startOffset * 1000 : null);
          const end = m.endMs ?? (m.end != null ? m.end * 1000 : null) ?? (m.endOffset != null ? m.endOffset * 1000 : null);
          if (start != null && end != null) {
            if (type.includes("intro") || type.includes("opening")) {
              introMarker = { startMs: start, endMs: end };
            } else if (type.includes("credit") || type.includes("outro") || type.includes("tail")) {
              outroMarker = { startMs: start, endMs: end };
            }
          }
        }
      } else if (typeof markers === "object") {
        if (markers.intro) {
          const start = markers.intro.startMs ?? (markers.intro.start != null ? markers.intro.start * 1000 : 0);
          const end = markers.intro.endMs ?? (markers.intro.end != null ? markers.intro.end * 1000 : 0);
          if (end > start) introMarker = { startMs: start, endMs: end };
        }
        if (markers.credits || markers.outro) {
          const m = markers.credits || markers.outro;
          const start = m.startMs ?? (m.start != null ? m.start * 1000 : 0);
          const end = m.endMs ?? (m.end != null ? m.end * 1000 : (runtime ? runtime * 1000 : 0));
          if (start > 0) outroMarker = { startMs: start, endMs: end };
        }
      }
    }

    // Credits offset fallback from metadata
    const creditsOffset = currentEpisodeObj?.creditsOffset || data.video.creditsOffset;
    if (!outroMarker && creditsOffset && Number.isFinite(creditsOffset)) {
      const offsetSeconds = creditsOffset > 100000 ? creditsOffset / 1000 : creditsOffset;
      const totalSec = runtime || (state.videoElement?.duration || 0);
      if (totalSec > offsetSeconds) {
        outroMarker = { startMs: offsetSeconds * 1000, endMs: totalSec * 1000 };
      }
    }

    state.episodeTitle = mainTitle;
    state.episodeSubtitle = subTitle;
    state.skipIntroMarker = introMarker;
    state.skipOutroMarker = outroMarker;

    if (runtime && typeof runtime === "number" && Number.isFinite(runtime) && runtime > 0) {
      state.currentEpisodeDuration = runtime;
      saveCachedDuration(curEpisodeId, runtime);
      if (state.screenTime && state.videoElement) {
        const cur = Math.floor(state.videoElement.currentTime || 0);
        state.screenTime.textContent = `${timeFormatFn(cur)} / ${timeFormatFn(Math.floor(runtime))}`;
      }
    }

    // Update title element in controller if it exists
    const titleEl = document.getElementById("netflix-title-display");
    if (titleEl) {
      titleEl.innerHTML = `
        <span class="netflix-show-title">${mainTitle}</span>
        ${subTitle ? `<span class="netflix-episode-title">${subTitle}</span>` : ""}
      `;
    }
  } catch (e) {
    console.warn("Error caching episode metadata:", e);
  }
}

export function jumpToNextEpisode(): void {
  getNextEpisodeId()
    .then((nextEpisodeId) => {
      if (nextEpisodeId) {
        window.location.href = `https://www.netflix.com/watch/${nextEpisodeId}`;
      } else {
        console.log("No next episode found or error fetching data.");
      }
    })
    .catch((error) => {
      console.error("Error jumping to next episode:", error);
    });
}
