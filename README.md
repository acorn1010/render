Prerender service based on https://prerender.io

**NOTE:** All commits should use https://www.conventionalcommits.org/en/v1.0.0/.
**TODO(acorn1010):** Use https://github.com/semantic-release/semantic-release

# Prerequisites
You'll need the following dependencies before you can run this project:
  * CLI tools:
    * Ubuntu:<br>
      * `sudo apt install -y packer kubectl hcloud-cli`
      * Go to https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli#install-terraform and install Terraform
    * Mac: `brew install terraform packer kubectl hcloud`
  * Make an `ed25519` SSH key (`rsa` isn't supported):<br>
    `[ -f ~/.ssh/id_ed25519 ] || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 && chmod 400 ~/.ssh/id_ed25519*`
  * Set up an hcloud context: `hcloud context create <project-name>`
  * Add this Bash alias:<br>
    `alias createkh='tmp_script=$(mktemp) && curl -sSL -o "${tmp_script}" https://raw.githubusercontent.com/kube-hetzner/terraform-hcloud-kube-hetzner/master/scripts/create.sh && chmod +x "${tmp_script}" && "${tmp_script}" && rm "${tmp_script}"'`

# Deployment
  * Run `createkh` from your repository root. Press `Enter` to skip directory choice, then `yes` when creating the MicroOS snapshots.

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
  1. Create a Terraform user API token [here](https://app.terraform.io) and set up an `organization` and `workspace`. This is your `TF_API_TOKEN`.
  2. Get your `SSH_PUBLIC_KEY` from your https://github.com/acorn1010.keys
  2. Add `SSH_PUBLIC_KEY`, `TF_API_TOKEN`, `GCR_SECRET`, `HETZNER_TOKEN` to your `GitHub Settings > Secrets and Variables > New repository secret`

# Overview
 * Backend Service on K8 handles API requests to render pages, store the pages in our Storage solution
