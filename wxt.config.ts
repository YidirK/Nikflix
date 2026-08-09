import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Nikflix (Household Bypass)',
    description: 'Bypass the account-sharing restrictions on Netflix.',
    version: '2.0.2',
    default_locale: 'en',
    permissions: [
      'storage',
      'declarativeNetRequest',
      'declarativeNetRequestWithHostAccess',
      'tabs',
    ],
    host_permissions: [
      '*://*.netflix.com/*',
      '*://web.prod.cloud.netflix.com/*',
    ],
    icons: {
      '48': 'icons/Nikflix-48.png',
      '64': 'icons/Nikflix-64.png',
    },
    web_accessible_resources: [
      {
        resources: [
          'netflix-seeker.js',
          'netflix-audioChange.js',
          'netflix-substitleChange.js',
          'netflix-apiBlocker.js',
        ],
        matches: ['*://*.netflix.com/*'],
      },
    ],
  },
});
