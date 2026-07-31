import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Nikflix (Household Bypass)',
    description: 'Bypass the account-sharing restrictions on Netflix.',
    version: '1.9.4',
    default_locale: 'en',
    permissions: ['storage'],
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
        ],
        matches: ['*://*.netflix.com/*'],
      },
    ],
  },
});
