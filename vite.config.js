import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from "node:url"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'VITE_')
  let apiOrigin = null

  if (env.VITE_API_URL) {
    try {
      apiOrigin = new URL(env.VITE_API_URL).origin
    } catch {
      // A relative API URL uses the frontend's own origin.
    }
  }

  const connectSources = ["'self'", apiOrigin].filter(Boolean).join(' ')
  const productionCsp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src ${connectSources}`,
  ].join('; ')
  const developmentCsp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src ${connectSources} ws:`,
  ].join('; ')
  const securityHeaders = (contentSecurityPolicy) => ({
    'Content-Security-Policy': contentSecurityPolicy,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  })

  const builtDocumentCsp = {
    name: 'built-document-csp',
    transformIndexHtml(html, context) {
      if (context.server) return html

      const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${productionCsp}">`
      return html.replace('</head>', `  ${cspMeta}\n  </head>`)
    },
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] }),
      builtDocumentCsp,
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      headers: securityHeaders(developmentCsp),
    },
    preview: {
      headers: securityHeaders(`${productionCsp}; frame-ancestors 'none'`),
    },
    build: {
      modulePreload: { polyfill: false },
    },
  }
})
