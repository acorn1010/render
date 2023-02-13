#!/usr/bin/env bash
set -e

# Creates a K8 cluster on Hetzner. For configuration, look at fleet.yaml.
# See: https://github.com/vitobotta/hetzner-k3s

# Error out if dependencies aren't installed.
if [[ ! -f "$(which hetzner-k3s)" ]] ; then
  LIGHT_RED='\033[1;31m'
  LIGHT_CYAN='\033[1;36m'
  echo -e "${LIGHT_RED}hetzner-k3s is not installed. Install it with the following commands:"
  echo -e "${LIGHT_CYAN}  wget https://github.com/vitobotta/hetzner-k3s/releases/download/v1.0.2/hetzner-k3s-linux-x86_64"
  echo "  chmod +x hetzner-k3s-linux-x86_64"
  echo "  sudo mv hetzner-k3s-linux-x86_64 /usr/local/bin/hetzner-k3s"
  exit 1
fi

echo "Creating cluster..."

# Load environment variables
. .env
export HETZNER_TOKEN="${HETZNER_TOKEN}"
export CLUSTER_NAME="${CLUSTER_NAME}"
export CLUSTER_LOCATION="${CLUSTER_LOCATION}"
export MASTERS_POOL_SIZE="${MASTERS_POOL_SIZE}"

export WORKERS_POOL_SIZE="${WORKERS_POOL_SIZE_MIN}"
export WORKERS_POOL_SIZE_MIN="${WORKERS_POOL_SIZE_MIN}"
export WORKERS_POOL_SIZE_MAX="${WORKERS_POOL_SIZE_MAX}"
export WORKERS_INSTANCE_TYPE="${WORKERS_INSTANCE_TYPE}"

if (( "${WORKERS_POOL_SIZE_MIN}" == "${WORKERS_POOL_SIZE_MAX}" )); then
  export AUTOSCALING_ENABLED=false
else
  export AUTOSCALING_ENABLED=true
fi

export LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL}"
hetzner-k3s create --config <(envsubst < ./fleet.yaml)

# Copy kubeconfig to ~/.kube/config directory, backing up the old one if it exists
export KUBECONFIG=./kubeconfig
if [[ -f ~/.kube/config ]]; then
  BACKUP_CONFIG_PATH="$HOME/.kube/config.bak"
  echo "Copying old ~/.kube/config to ${BACKUP_CONFIG_PATH}"
  cp ~/.kube/config "${BACKUP_CONFIG_PATH}"
fi
cp ./kubeconfig ~/.kube/config

# Once-off. If ran again, these are no-op
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
helm repo add jetstack https://charts.jetstack.io
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
# Update Helm chart repository cache
helm repo update

# Install the Ingress controller
echo "Installing the ingress controller..."
export RANCHER_HOSTNAME="${RANCHER_HOSTNAME}"
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  -f <(envsubst < ./ingress-nginx-annotations.yaml) \
  --namespace ingress-nginx \
  --create-namespace
kubectl apply -f ./ingress-nginx-configmap.yaml

# Install LetsEncrypt certificate manager
# kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.10.1/cert-manager.crds.yaml
echo "Installing LetsEncrypt certificate manager..."
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.10.1 \
  --set installCRDs=true
envsubst < ./lets-encrypt.yaml | kubectl apply -f -

# Wait for the Ingress controller to start
# TODO(acorn1010): Improve this. Is it possible to use `kubectl -n ingress-nginx rollout status` here?
INGRESS_NGINX_STATUS=$(kubectl get pods --namespace=ingress-nginx | grep "1/");
while [ ! "${INGRESS_NGINX_STATUS}" ]; do
  echo "Waiting for Ingress Controller to finish starting up...";
  sleep 2;
  INGRESS_NGINX_STATUS=$(kubectl get pods --namespace=ingress-nginx | grep "1/");
done

# Include GCP secret so that we can deploy containers to GCR.
export GCR_SECRET="${GCR_SECRET}"
envsubst < ./gcp-secret.yaml | kubectl apply -f -

# Now that an Ingress controller is installed, we can install Rancher
echo "Installing Rancher..."
RANCHER_PASS=$(mktemp -u XXXXXXXXXX)
helm upgrade --install rancher rancher-stable/rancher \
  --namespace cattle-system \
  --create-namespace \
  --set hostname="${RANCHER_HOSTNAME}" \
  --set bootstrapPassword="${RANCHER_PASS}" \
  --set ingress.ingressClassName=nginx \
  --set ingress.tls.source=letsEncrypt \
  --set letsEncrypt.email="${LETSENCRYPT_EMAIL}" \
  --set letsEncrypt.ingress.class=nginx

COLOR_OFF='\033[0m'
CYAN_UNDERLINE='\033[4;36m'
echo "Finished setting up K8."
echo -e "You will need to visit ${CYAN_UNDERLINE}https://console.hetzner.cloud/projects/${COLOR_OFF} and find your Load Balancer's Public IP"
echo "Set this Public IP as an A record in your DNS for ${RANCHER_HOSTNAME}"
echo ""
echo -e "Once your DNS has propagated, continue setting up Rancher here: ${CYAN_UNDERLINE}https://${RANCHER_HOSTNAME}/dashboard/?setup=${RANCHER_PASS}${COLOR_OFF}"
