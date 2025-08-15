// Progress Bar Seeker
window.addEventListener("netflixSeekTo", (e) => {
	const seekTime = e.detail;

	try {
		const player = netflix.appContext.state.playerApp.getAPI().videoPlayer;
		const sessionId = player.getAllPlayerSessionIds()[0];
		const videoPlayer = player.getVideoPlayerBySessionId(sessionId);
		videoPlayer.seek(seekTime);
	} catch (err) {
		console.error("[Netflix Ext] Seek failed", err);
	}
});


