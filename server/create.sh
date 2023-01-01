#!/usr/bin/env bash
set -e

# Creates a K8 cluster on Hetzner. For configuration, look at fleet.yaml.
# See: https://github.com/vitobotta/hetzner-k3s

# Prerequisites
# sudo apt-get install libssh2-1-dev libevent-dev
# wget https://github.com/vitobotta/hetzner-k3s/releases/download/v0.6.5/hetzner-k3s-linux-x86_64
# chmod +x hetzner-k3s-linux-x86_64
# sudo mv hetzner-k3s-linux-x86_64 /usr/local/bin/hetzner-k3s

echo "Creating cluster."

. .env
export HETZNER_TOKEN="${HETZNER_TOKEN}"
hetzner-k3s create --config <(envsubst < ./fleet.yaml)
