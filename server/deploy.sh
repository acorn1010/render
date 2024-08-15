#!/usr/bin/env bash
set -e

# This is the only section you should modify if creating a new deployment.
# TODO(acorn1010): Move the rest of this script into the kubernetes/ folder
export HOST="api.rendermy.site"
export NAMESPACE="prerender"
export REPLICAS=3  # Number of server instances to spin up
export CPU="700m"  # Request 0.7 vCPUs
export MEMORY="1.7Gi"  # Request 1.7 GiB of RAM

# EVERYTHING BELOW THIS LINE SHOULD STAY THE SAME ACROSS ALL DEPLOYMENTS.
echo "Deploying server."

# Source environment variables (needed for $PROJECT_ID)
. ../kubernetes/.env

# Path to where the container will be uploaded. We use gcr.io (Google Container Registry)
DOCKER_IMAGE=gcr.io/${PROJECT_ID}/prerender
# Container version (e.g. "2021.02.03_11.15.30")
VERSION=$(date +"%Y.%m.%d_%H.%M.%S")

# Compile code.
(cd src; npm install && npm run build)

# Build Docker image. We navigate up to our parent directory so that we can include the shared/ library.
(cd ..; docker build --platform linux/amd64 -t ${DOCKER_IMAGE}:latest -t ${DOCKER_IMAGE}:"${VERSION}" --progress=plain -f server/Dockerfile .)

# Deploy to container registry. If this fails, you may need to run the below command:
#  gcloud auth configure-docker
docker push ${DOCKER_IMAGE}:"${VERSION}"
docker push ${DOCKER_IMAGE}:latest

# Replace environment variables in fleet.yaml and update our fleet with the latest image.
export DOCKER_IMAGE="${DOCKER_IMAGE}:${VERSION}"
export GCR_SECRET="${GCR_SECRET}"  # Needed so that K3s can pull the docker image

kubeConfig=~/.kube/config.joes
envsubst < ../kubernetes/templates/deployment.yaml | kubectl --kubeconfig "${kubeConfig}" apply -f -
