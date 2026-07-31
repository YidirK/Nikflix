export default defineUnlistedScript(() => {
  window.addEventListener("netflixSeekTo", (e: any) => {
    const seekTime = e.detail;
    try {
      const netflix = (window as any).netflix;
      const player = netflix.appContext.state.playerApp.getAPI().videoPlayer;
      const sessionId = player.getAllPlayerSessionIds()[0];
      const videoPlayer = player.getVideoPlayerBySessionId(sessionId);
      videoPlayer.seek(seekTime);
    } catch (err) {
      console.error("[Netflix Ext] Seek failed", err);
    }
  });
});
