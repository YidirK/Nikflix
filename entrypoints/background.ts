export default defineBackground(() => {
  // Sync rules on background startup
  chrome.storage.local.get(['blockMode'], (result) => {
    const mode = result.blockMode === 'api' ? 'api' : 'css';
    setBlockMode(mode);
  });

  // Open onboarding page on first install
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      const onboardingUrl = chrome.runtime.getURL('/onboarding.html');
      chrome.tabs.create({ url: onboardingUrl });
    }
  });

  // Listen for block mode changes from popup or onboarding
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'SET_BLOCK_MODE') {
      setBlockMode(message.mode).then(() => {
        // Notify active netflix tabs to update state/reload if needed
        chrome.tabs.query({ url: '*://*.netflix.com/*' }, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { type: 'BLOCK_MODE_CHANGED', mode: message.mode }).catch(() => {});
            }
          });
        });
        sendResponse({ ok: true });
      });
      return true; // keep channel open for async
    }
  });

  async function setBlockMode(_mode: 'css' | 'api') {
    // Clear any network-level declarativeNetRequest rules.
    // Precise page-scoped API blocking is handled in main-world script netflix-apiBlocker.ts on /watch pages.
    await disableApiBlock();
  }

  async function disableApiBlock() {
    try {
      if (chrome.declarativeNetRequest?.updateDynamicRules) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [1, 2],
          addRules: [],
        });
      }
    } catch (e) {
      console.error('[Nikflix] Failed to clear dynamic rules:', e);
    }
  }
});
