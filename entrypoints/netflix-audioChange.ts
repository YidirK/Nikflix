export default defineUnlistedScript(() => {
  window.addEventListener("GetAudioTracksList", () => {
    try {
      const netflix = (window as any).netflix;
      const videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
      const player = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
      const AudioTracksObject = player.getAudioTrackList();
      window.postMessage({
        type: "FROM_AUDIOCHANGE_SCRIPT",
        audioTracks: AudioTracksObject,
      }, "*");
    } catch (err) {
      console.error('[Netflix Ext] Get AudioTracksList failed', err);
    }
  });

  window.addEventListener("netflixAudioChange", (e: any) => {
    const AudioLanguageKey = e.detail;
    try {
      const netflix = (window as any).netflix;
      const videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
      const player = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
      player.setAudioTrack(player.getAudioTrackList()[AudioLanguageKey]);
    } catch (err) {
      console.error("[Netflix Ext] audio change failed", err);
    }
  });
});
