#!/usr/bin/env bash

export KUBECONFIG=../kubeconfig
# Apply CRDs and common ceph storage stuff
ROOK_REPO="https://raw.githubusercontent.com/rook/rook/release-1.10/deploy/examples/"
kubectl apply -f <(curl -Ls "${ROOK_REPO}/crds.yaml") -f <(curl -Ls "${ROOK_REPO}/common.yaml") -f <(curl -Ls "${ROOK_REPO}/operator.yaml")

# Apply the Ceph storage configuration
kubectl apply -f ./storage.yaml

# Load environment variables to get Rancher hostname
. ../.env
echo "View the Ceph dashboard at: https://${RANCHER_HOSTNAME}/api/v1/namespaces/rook-ceph/services/https:rook-ceph-mgr-dashboard:8443/proxy/#/login?returnUrl=%2Fdashboard"
echo "Run the following command to get your Ceph dashboard password. Username is \"admin\":"
echo "  kubectl -n rook-ceph get secret rook-ceph-dashboard-password -o jsonpath=\"{['data']['password']}\" | base64 --decode && echo"
