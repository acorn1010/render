#!/usr/bin/env bash
set -e

# Creates a K8 cluster on Hetzner. For configuration, look at fleet.yaml.
# See: https://github.com/vitobotta/hetzner-k3s

# Prerequisites
# sudo apt-get install libssh2-1-dev libevent-dev
# wget https://github.com/vitobotta/hetzner-k3s/releases/download/v0.6.7/hetzner-k3s-linux-x86_64
# chmod +x hetzner-k3s-linux-x86_64
# sudo mv hetzner-k3s-linux-x86_64 /usr/local/bin/hetzner-k3s

echo "Creating cluster."

. .env
export HETZNER_TOKEN="${HETZNER_TOKEN}"
hetzner-k3s create --config <(envsubst < ./fleet.yaml)

# Once-off. If ran again, these are no-op
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
helm repo add jetstack https://charts.jetstack.io
helm repo add traefik https://traefik.github.io/charts
# Update Helm chart repository cache
helm repo update

# kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.10.1/cert-manager.crds.yaml
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.10.1 \
  --set installCRDs=true

helm install rancher rancher-stable/rancher \
  --namespace cattle-system \
  --create-namespace \
  --set hostname=rancher.acorn1010.com \
  --set ingress.tls.source=letsEncrypt \
  --set letsEncrypt.email=admin@foony.com \
  --set letsEncrypt.ingress.class=traefik

# Add traefik so we can access Rancher externally.
helm install traefik traefik/traefik --namespace traefik --create-namespace
