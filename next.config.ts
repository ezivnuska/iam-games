import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['@iam/shared-types', '@iam/db', '@iam/ui'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'iameric-bucket.s3.us-west-1.amazonaws.com',
                pathname: '/**',
            },
        ],
    },
    serverExternalPackages: ['mongoose'],
    async headers() {
        return [
            {
                source: '/_next/static/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
            {
                source: '/_next/data/:path*',
                headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
            },
            {
                source: '/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    // Allow wss: for Socket.IO. If nginx also sends a CSP header the
                    // browser applies both; ensure nginx does not block wss: either.
                    { key: 'Content-Security-Policy', value: "connect-src 'self' wss: ws: https: http:" },
                ],
            },
        ];
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.alias = {
                ...config.resolve.alias,
                '@/app/lib/mongoose': false,
                '@/app/lib/models/user': false,
            };
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                child_process: false,
                mongoose: false,
            };
            config.module.rules.push({
                test: /\.html$/,
                loader: 'ignore-loader',
            });
        }
        return config;
    },
};

export default nextConfig;
