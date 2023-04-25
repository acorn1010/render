Prerender service based on https://prerender.io

**NOTE:** All commits should use https://www.conventionalcommits.org/en/v1.0.0/.
**TODO(acorn1010):** Use https://github.com/semantic-release/semantic-release

# Tech Stack
 * Hetzner for K3s cluster (CPX31)
   * Terraform
 * **client:**
   * [Vite](https://vitejs.dev/) + TypeScript SPA + [Tailwind](https://tailwindcss.com/) + [Redis](https://redis.io/) + [Shadcn UI](ui.shadcn.com/)
 * **server:**
   * **Compute:** Hetzner shared cloud (cheap compute + network)
     * Alternatives:
       * Contabo (cheap compute)
       * OVH (cheap network)
   * **Storage:** Hetzner volumes
     * Alternatives:
       * [Cloudflare R2](https://www.cloudflare.com/products/r2/) ($15 / TB, $4.50 / 1M writes, $0.36 / 1M reads)
       * [Wasabi](https://wasabi.com/cloud-storage-pricing) ($6 / TB, no egress)
   * **Network:** Hetzner Load Balancer
   * **CDN:** Cloudflare Pages (it's free)
   * Playwright for browser rendering
   * Worker scripts for clients to interface with API:
     * [https://github.com/prerender/prerender-cloudflare-worker/blob/master/index.js#L154](https://github.com/prerender/prerender-cloudflare-worker/blob/master/index.js#L154)
 * **shared**
   * A repo shared by both client and server. Safe way to allow typed APIs without leaking server code. `ts-json-schema-generator` is used for validation on the server.

# Deployment
 * Add `GCR_SECRET`, `HETZNER_TOKEN`, and `REDIS_PASSWORD` to your `GitHub Settings > Secrets and Variables > New repository secret`

# Overview
 * Backend Service on K8 handles API requests to render pages, store the pages in our Storage solution
