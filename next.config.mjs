/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['xrpl', 'ws', 'bufferutil', 'utf-8-validate'],
  webpack: (config) => {
    config.externals.push('bufferutil', 'utf-8-validate')
    return config
  },
  transpilePackages: ['leaflet', 'leaflet.markercluster'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/feed',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
      {
        source: '/api/restaurants/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
      },
      {
        source: '/api/chefs/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
      },
    ]
  },
}

export default nextConfig
