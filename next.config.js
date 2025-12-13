/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for API routes
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
    responseLimit: false,
  },
  // Experimental features for larger payloads
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
}

module.exports = nextConfig