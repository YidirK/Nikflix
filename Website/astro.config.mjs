import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';


const SITE_LOCALES = ['fr', 'en', 'es'];
const SITE_DEFAULT_LOCALE = 'fr';

export default defineConfig({

  site: 'https://nikflix.hergol.me',

  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.endsWith('nikflix.hergol.me/'),
      i18n: {
        defaultLocale: 'fr',
        locales: {
          fr: 'fr',
          en: 'en',
          es: 'es',
        },
      },
    }),
  ],

  i18n: {
    defaultLocale: SITE_DEFAULT_LOCALE,
    locales: SITE_LOCALES,
    routing: {
      prefixDefaultLocale: true,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});