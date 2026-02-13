#!/bin/bash
set -e

# Variables
APP_NAME="ims-website"
IMAGE_NAME="josephchuchu/ims-website:latest"
KUBE_NAMESPACE="default"
DEPLOYMENT_FILE="nextjs-deployment.yaml"
INGRESS_FILE="ims-ingress.yaml"

# 1. Build Docker image
echo "Building Docker image..."
docker build -t $IMAGE_NAME .

# 2. Push to Docker Hub
echo "Pushing Docker image..."
docker push $IMAGE_NAME

# 3. Apply Kubernetes deployment and service
echo "Applying Kubernetes deployment..."
kubectl apply -f $DEPLOYMENT_FILE

# 4. Apply ingress
echo "Applying Ingress..."
kubectl apply -f $INGRESS_FILE

echo "Deployment complete!"
