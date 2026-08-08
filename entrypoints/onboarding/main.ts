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
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ blockMode: selectedMode });
    }

    // Tell background script to apply rule
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      await chrome.runtime.sendMessage({ type: 'SET_BLOCK_MODE', mode: selectedMode });
    }

    // Redirect to Netflix
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        chrome.tabs.update(tabs[0].id, { url: 'https://www.netflix.com' });
      }
    } else {
      window.location.href = 'https://www.netflix.com';
    }
  });
});
