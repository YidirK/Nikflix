export function adjustOverlayForTeleparty(overlay: HTMLElement): void {
  const tpFrame = document.getElementById('tpChatFrame');

  overlay.style.position = overlay.style.position || 'fixed';
  overlay.style.left = '0';
  overlay.style.top = '0';
  overlay.style.bottom = '0';
  overlay.style.boxSizing = 'border-box';
  overlay.style.zIndex = overlay.style.zIndex || '99997';
  overlay.style.width = 'auto';

  if (!tpFrame) {
    overlay.style.right = '0';
    return;
  }

  const rect = tpFrame.getBoundingClientRect();
  if (rect.width > 0 && rect.left > 0) {
    const chatWidth = Math.round(rect.width);
    overlay.style.right = chatWidth + 'px';
  } else {
    overlay.style.right = '0';
  }
}

export function watchTelepartyFrame(overlay: HTMLElement): void {
  adjustOverlayForTeleparty(overlay);

  const tpFrame = document.getElementById('tpChatFrame');
  let ro: ResizeObserver | null = null;

  if (tpFrame && window.ResizeObserver) {
    try {
      ro = new ResizeObserver(() => {
        adjustOverlayForTeleparty(overlay);
      });
      ro.observe(tpFrame);
    } catch {
      // Ignore observer errors
    }
  }

  const onWinResize = () => adjustOverlayForTeleparty(overlay);
  window.addEventListener('resize', onWinResize, { passive: true });

  const intervalId = setInterval(() => {
    if (!overlay.isConnected) {
      clearInterval(intervalId);
      window.removeEventListener('resize', onWinResize);
      if (ro && tpFrame) {
        try {
          ro.unobserve(tpFrame);
        } catch {}
      }
      return;
    }
    adjustOverlayForTeleparty(overlay);
  }, 1000);
}
