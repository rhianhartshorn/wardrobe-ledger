/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Loaded from node_modules at runtime rather than bundled: PGlite ships a
    // WebAssembly Postgres, and pg has optional native bindings.
    serverComponentsExternalPackages: ['@electric-sql/pglite', 'pg'],
  },
  async headers() {
    return [
      {
        // Prevent the app shell HTML from being cached so a stale page never
        // ends up referencing JS chunks that no longer exist after a new deploy
        // (iOS "Add to Home Screen" pages in particular cache this aggressively).
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
