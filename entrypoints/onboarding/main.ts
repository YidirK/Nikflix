import { t, applyI18n } from '../../src/modules/i18n';

type BlockMode = 'css' | 'api';

let selectedMode: BlockMode = 'css';

document.addEventListener('DOMContentLoaded', () => {
  applyI18n();

  const cardCss = document.getElementById('card-css');
  const cardApi = document.getElementById('card-api');
  const checkCss = document.getElementById('check-css');
  const checkApi = document.getElementById('check-api');
  const confirmBtn = document.getElementById('confirm-btn');
  const confirmText = document.getElementById('confirm-text');

  function selectMode(mode: BlockMode) {
    selectedMode = mode;

    if (cardCss) cardCss.classList.toggle('selected', mode === 'css');
    if (cardApi) cardApi.classList.toggle('selected', mode === 'api');

    if (checkCss) checkCss.style.display = mode === 'css' ? 'flex' : 'none';
    if (checkApi) checkApi.style.display = mode === 'api' ? 'none' : 'flex';

    if (confirmText) {
      confirmText.textContent = mode === 'css' ? t('confirmCssBtn') : t('confirmApiBtn');
    }
  }

  cardCss?.addEventListener('click', () => selectMode('css'));
  cardApi?.addEventListener('click', () => selectMode('api'));

  // Initial selection
  selectMode('css');

  confirmBtn?.addEventListener('click', async () => {
    confirmBtn.setAttribute('disabled', 'true');
    (confirmBtn as HTMLButtonElement).style.opacity = '0.7';

    // Save to storage
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ blockMode: selectedMode });
      }
    } catch (e) {
      console.error('[Nikflix] Failed to save storage:', e);
    }

    // Tell background script to apply rule
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        await chrome.runtime.sendMessage({ type: 'SET_BLOCK_MODE', mode: selectedMode });
      }
    } catch (e) {
      console.error('[Nikflix] Failed to send block mode message:', e);
    }

    // Redirect to Netflix
    const netflixUrl = 'https://www.netflix.com';
    const doRedirect = () => {
      window.location.href = netflixUrl;
    };

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        if (chrome.tabs.getCurrent) {
          chrome.tabs.getCurrent((tab) => {
            if (tab && tab.id) {
              chrome.tabs.update(tab.id, { url: netflixUrl }).catch(() => doRedirect());
            } else {
              chrome.tabs.update({ url: netflixUrl }).catch(() => doRedirect());
            }
          });
        } else {
          chrome.tabs.update({ url: netflixUrl }).catch(() => doRedirect());
        }
      } catch (e) {
        doRedirect();
      }
    } else {
      doRedirect();
    }
  });
});
