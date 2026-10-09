const TELEPARTY_CHAT_WIDTH = 340;
const OFFSET_VAR = '--nf-chat-offset';

function getTelepartyOffset(): number {
  const tpFrame = document.getElementById('chat-wrapper');
  if (!tpFrame) return 0;

  const rect = tpFrame.getBoundingClientRect();
  // Le chat est présent et visible
  return rect.width > 0 && rect.left > 0 ? TELEPARTY_CHAT_WIDTH : 0;
}

function applyOffset(): number {
  const offset = getTelepartyOffset();
  document.documentElement.style.setProperty(OFFSET_VAR, offset + 'px');
  return offset;
}

export function adjustOverlayForTeleparty(overlay: HTMLElement): void {
  const offset = applyOffset();

  overlay.style.position = overlay.style.position || 'fixed';
  overlay.style.left = '0';
  overlay.style.top = '0';
  overlay.style.bottom = '0';
  overlay.style.boxSizing = 'border-box';
  overlay.style.zIndex = overlay.style.zIndex || '99997';
  overlay.style.width = 'auto';
  overlay.style.right = offset + 'px';
}

export function watchTelepartyFrame(overlay: HTMLElement): void {
  adjustOverlayForTeleparty(overlay);

  const tpFrame = document.getElementById('chat-wrapper');
  let ro: ResizeObserver | null = null;

  if (tpFrame && window.ResizeObserver) {
    try {
      ro = new ResizeObserver(() => adjustOverlayForTeleparty(overlay));
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
      ro?.disconnect();
      document.documentElement.style.removeProperty(OFFSET_VAR);
      return;
    }
    adjustOverlayForTeleparty(overlay);
  }, 1000);
}