/** @type {import('next').NextConfig} */
const nextConfig = {
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
