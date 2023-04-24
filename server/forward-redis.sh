#!/usr/bin/env bash
set -e

echo "Starting port forwarding. You'll need your REDIS_PASSWORD from ../kubernetes/.env to connect."
echo "Run this command in a safe terminal to get it:"
echo "cat ../kubernetes/.env | grep REDIS_PASSWORD"
kubectl port-forward --kubeconfig=../kubernetes/kubeconfig --namespace=redis redis-statefulset-0 6379:6379

