import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'VanTrongScreen',
    description: 'Capture & edit screenshots with visible page, select area, and full page modes',
    // @ts-expect-error
    author: 'trongdn2405',
    version: '1.2.2',
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
    permissions: ['activeTab', 'storage', 'scripting', 'unlimitedStorage'],
    web_accessible_resources: [
      {
        resources: ['tesseract/*'],
        matches: ['<all_urls>'],
      },
    ],
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
  },
});
