#!/usr/bin/env bash
# Handles application of the Redis Cluster kubectl. Required because ConfigMap needs a password.
set -e

. ../../.env
export REDIS_PASSWORD="${REDIS_PASSWORD}"
envsubst < ./redis.yaml | kubectl apply -f -
