import type { NextConfig } from 'next';
import { resolve } from 'path';

// Resolve mongoose from iam-games's own node_modules so that all bundles
// (including transpiled @iam/db code) share a single module instance.
const mongoosePath = resolve('./node_modules/mongoose');

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
    serverExternalPackages: ['mongoose', 'jose'],
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
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
        if (isServer) {
            // Pin ALL require('mongoose') calls to the same absolute path so that
            // transpiled @iam/db code and native iam-games code share one instance.
            const existingExternals = Array.isArray(config.externals)
                ? config.externals
                : config.externals ? [config.externals] : [];
            config.externals = [
                ({ request }: { request?: string }, callback: (err?: null, result?: string) => void) => {
                    if (request === 'mongoose') {
                        callback(null, `commonjs ${mongoosePath}`);
                        return;
                    }
                    callback();
                },
                ...existingExternals,
            ];
        }
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
