/** @type {import('next').NextConfig} */
// Completely disable Jest worker usage
process.env.JEST_WORKER_ID = undefined
process.env.NODE_ENV_JEST = undefined

const nextConfig = {
  poweredByHeader: false,
  // Force all pages to be dynamic to avoid SSR prerendering errors
  // output: 'standalone', // Disabled - not compatible with Netlify
  // Completely disable experimental features that might use workers
  // Move serverComponentsExternalPackages to serverExternalPackages (Next.js 15 change)
  serverExternalPackages: ['yjs', 'y-prosemirror', '@tiptap/core', '@tiptap/react'],
  // Disable legacy error page generation
  generateEtags: false,
  experimental: {
    optimizePackageImports: ['@tanstack/react-query'],
    // Explicitly disable Jest integration
    forceSwcTransforms: true,
    // Disable worker threads completely
    workerThreads: false,
  },
  // Skip error page generation
  skipTrailingSlashRedirect: true,
  // Disable static optimization for error pages
  generateBuildId: async () => {
    return 'build-' + Math.random().toString(36).substr(2, 9)
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  webpack(config, { dev, isServer }) {
    
    // Completely disable workers and parallelism to prevent Jest conflicts
    if (dev && !isServer) {
      // Aggressively disable all worker usage
      config.parallelism = 1
      config.optimization = {
        ...config.optimization,
        minimize: false,
        minimizer: [],
        // Disable SWC minifier which uses workers
        usedExports: false,
        sideEffects: false,
      }
      // Disable caching completely to avoid worker conflicts
      config.cache = false
      // Disable any plugins that might use workers
      config.plugins = config.plugins.filter(plugin => {
        return !plugin.constructor.name.includes('Worker') && 
               !plugin.constructor.name.includes('Jest')
      })
      // Prevent worker-related fallbacks
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        child_process: false,
        worker_threads: false,
      }
    }
    
    // Basic SVG handling - single rule without duplication
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            dimensions: false,
          },
        },
      ],
    })

    // Ensure server chunk files are placed under the expected directory so the
    // server runtime can resolve them (prevents "Cannot find module './<id>.js'")
    if (isServer) {
      config.output = {
        ...config.output,
        chunkFilename: 'chunks/[id].js',
      }
    }


    // Note: Removing externals config as it was causing webpack validation errors
    // Y.js packages are already handled in serverComponentsExternalPackages

    return config
  },
  async redirects() {
    return [
      {
        source: '/portal/projects/:projectId/documents/:docId',
        destination: '/portal/writer/:docId',
        permanent: false,
      },
      {
        source: '/portal/projects/:projectId/docs/:docId',
        destination: '/portal/writer/:docId',
        permanent: false,
      },
      {
        source: '/bCccDwkKkN',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
