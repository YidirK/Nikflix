import { state } from './player-state';

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

export async function getCurrentEpisodeDuration(): Promise<number | null> {
  const curEpisodeId = getIdFromUrl();
  if (!curEpisodeId) return null;

  try {
    const res = await fetch(
      `https://www.netflix.com/nq/website/memberapi/release/metadata?movieid=${curEpisodeId}`,
      { credentials: "include" }
    );
    const data = await res.json();

    if (data?.video?.runtime && Number.isFinite(data.video.runtime)) {
      return data.video.runtime;
    }

    const seasons = data?.video?.seasons || [];
    for (const season of seasons) {
      if (!season || !Array.isArray(season.episodes)) continue;
      const found = season.episodes.find(
        (ep: { id?: string | number; runtime?: number }) =>
          ep.id && ep.id.toString() === curEpisodeId.toString()
      );
      if (found && Number.isFinite(found.runtime)) {
        return found.runtime;
      }
    }

    return null;
  } catch (err) {
    console.warn("Could not fetch metadata duration:", err);
    return null;
  }
}

export function fetchAndCacheCurrentEpisodeDuration(timeFormatFn: (seconds: number) => string): void {
  getCurrentEpisodeDuration()
    .then((runtime) => {
      if (runtime && typeof runtime === "number") {
        state.currentEpisodeDuration = runtime;
        if (state.screenTime && state.videoElement) {
          const cur = Math.floor(state.videoElement.currentTime || 0);
          state.screenTime.textContent = `${timeFormatFn(cur)} / ${timeFormatFn(Math.floor(runtime))}`;
        }
      }
    })
    .catch((e) => {
      console.warn("Error caching episode duration:", e);
    });
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
