declare module 'next-pwa' {
  import { NextConfig } from 'next';

  interface RuntimeCaching {
    urlPattern: string | RegExp | ((params: { url: URL }) => boolean);
    handler: 'NetworkFirst' | 'CacheFirst' | 'NetworkOnly' | 'CacheOnly' | 'StaleWhileRevalidate';
    options?: {
      cacheName?: string;
      expiration?: {
        maxEntries?: number;
        maxAgeSeconds?: number;
      };
      networkTimeoutSeconds?: number;
    };
  }

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    runtimeCaching?: RuntimeCaching[];
    buildExcludes?: Array<string | RegExp>;
    cacheStartUrl?: boolean;
    dynamicStartUrl?: boolean;
    reloadOnOnline?: boolean;
    customWorkerDir?: string;
    skipWaiting?: boolean;
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}

declare module 'next-pwa/cache' {
  export const NetworkFirst: 'NetworkFirst';
  export const CacheFirst: 'CacheFirst';
  export const NetworkOnly: 'NetworkOnly';
  export const CacheOnly: 'CacheOnly';
  export const StaleWhileRevalidate: 'StaleWhileRevalidate';
}
