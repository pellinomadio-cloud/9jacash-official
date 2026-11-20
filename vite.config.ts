import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function bankVerifyProxyPlugin(): Plugin {
  const attachMiddleware = (middlewares: {
    use: (
      path: string,
      handler: (
        req: import('http').IncomingMessage & { url?: string; method?: string },
        res: import('http').ServerResponse,
        next: () => void
      ) => void
    ) => void;
  }) => {
    middlewares.use('/api/ping', (_req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.end(JSON.stringify({ ok: true, ts: Date.now() }));
    });

    middlewares.use('/api/verify-account', async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }

      try {
        const urlObj = new URL(req.url || '/', 'http://localhost');
        let bankCode = urlObj.searchParams.get('bank_code') || '';
        let accountNumber = urlObj.searchParams.get('account_number') || '';

        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          await new Promise<void>((resolve) => {
            req.on('data', (chunk: Buffer) => chunks.push(chunk));
            req.on('end', () => resolve());
          });
          const rawBody = Buffer.concat(chunks).toString('utf8').trim();
          if (rawBody) {
            try {
              const parsed = JSON.parse(rawBody);
              bankCode = parsed.bank_code || bankCode;
              accountNumber = parsed.account_number || accountNumber;
            } catch {
              const params = new URLSearchParams(rawBody);
              bankCode = params.get('bank_code') || bankCode;
              accountNumber = params.get('account_number') || accountNumber;
            }
          }
        }

        const cleanCode = String(bankCode).trim();
        const cleanAcc = String(accountNumber).trim().replace(/\D/g, '');

        if (!cleanCode || !cleanAcc) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('Error: Missing bank code or account number');
          return;
        }

        const formData = new URLSearchParams();
        formData.append('bank_code', cleanCode);
        formData.append('account_number', cleanAcc);

        const upstream = await fetch('https://api.wtproject.space/vrf/verify.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });

        const text = (await upstream.text()).trim();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(text || 'Error: Invalid Account');
      } catch {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Error: Unable to reach verification server');
      }
    });
  };

  return {
    name: 'bank-verify-proxy',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      bankVerifyProxyPlugin(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'icon.svg',
          'icon-192.png',
          'icon-512.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'icon-badge.png',
          'sw.js',
          'audio/quickcode-voice-guide.mp3',
          'audio/quickcode-voice-guide.wav',
        ],
        manifest: {
          id: '/',
          name: '9jacash - Digital Banking & Instant Rewards',
          short_name: '9jacash',
          description: 'Secure digital banking, instant transfers, and quick cash code activation.',
          theme_color: '#090d16',
          background_color: '#090d16',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png?v=4',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png?v=4',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png?v=4',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('lucide-react')) return 'icons';
              return 'vendor';
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      forwardConsole: false,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

