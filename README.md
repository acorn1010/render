Prerender service based on https://prerender.io

# Tech Stack
 * Hetzner for K8 cluster (CPX21)
  * https://github.com/vitobotta/hetzner-k3s for quick provisioning / deployment?
 * client:
  * Vite + TypeScript SPA + Tailwind + Planetscale + Prisma + MUI
 * server:
   * [https://github.com/prerender/prerender](https://github.com/prerender/prerender)
   * Backblaze for Storage / Caching of assets
    * Alternatives:
     * [Cloudflare R2](https://www.cloudflare.com/products/r2/) ($15 / TB, $4.50 / 1M writes, $0.36 / 1M reads)
     * [Wasabi](https://wasabi.com/cloud-storage-pricing) ($6 / TB, no egress)
  * Worker scripts for clients to interface with API:
   * [https://github.com/prerender/prerender-cloudflare-worker/blob/master/index.js#L154](https://github.com/prerender/prerender-cloudflare-worker/blob/master/index.js#L154)

# Overview
 * Backend Service on K8 handles API requests to render pages, store the pages in our Storage solution
