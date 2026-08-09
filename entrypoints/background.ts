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

  async function setBlockMode(mode: 'css' | 'api') {
    if (mode === 'api') {
      await enableApiBlock();
    } else {
      await disableApiBlock();
    }
  }

  async function enableApiBlock() {
    try {
      const blockAction = (chrome.declarativeNetRequest?.RuleActionType?.BLOCK || 'block') as any;
      const xhrResource = (chrome.declarativeNetRequest?.ResourceType?.XMLHTTPREQUEST || 'xmlhttprequest') as any;

      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1, 2],
        addRules: [
          {
            id: 1,
            priority: 1,
            action: { type: blockAction },
            condition: {
              urlFilter: '*web.prod.cloud.netflix.com/graphql*',
              resourceTypes: [xhrResource],
            },
          },
          {
            id: 2,
            priority: 1,
            action: { type: blockAction },
            condition: {
              urlFilter: '||web.prod.cloud.netflix.com/graphql',
              resourceTypes: [xhrResource],
            },
          },
        ],
      });
      console.log('[Nikflix] API blocking rules enabled.');
    } catch (e) {
      console.error('[Nikflix] Failed to enable API block rule:', e);
    }
  }

  async function disableApiBlock() {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1, 2],
        addRules: [],
      });
      console.log('[Nikflix] API blocking rules disabled.');
    } catch (e) {
      console.error('[Nikflix] Failed to disable API block rule:', e);
    }
  }
});
