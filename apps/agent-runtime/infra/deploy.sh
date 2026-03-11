#!/bin/bash
# Deploy OLU Agent Runtime to ECS Fargate
# Run from repo root: bash apps/agent-runtime/infra/deploy.sh
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Docker installed and running
#   - SSM parameters already stored (run setup.sh first if not done)

set -euo pipefail

AWS_REGION="us-west-2"
ACCOUNT_ID="749391130736"
ECR_REPO="olu-agent-runtime"
ECS_CLUSTER="test-demo"
SERVICE_NAME="olu-agent-runtime"
LOG_GROUP="/ecs/olu-agent-runtime"
IMAGE_TAG="${1:-latest}"
IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG"

echo "=== Deploying OLU Agent Runtime ==="
echo "Image: $IMAGE_URI"
echo ""

# 1. ECR login
echo "[1/5] Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# 2. Build Docker image
echo "[2/5] Building Docker image..."
docker build --platform linux/amd64 -f apps/agent-runtime/Dockerfile -t "$IMAGE_URI" .

# 3. Push to ECR
echo "[3/5] Pushing to ECR..."
docker push "$IMAGE_URI"

# 4. Get execution role ARN
echo "[4/5] Registering task definition..."
EXEC_ROLE_ARN=$(aws iam get-role --role-name ecsTaskExecutionRole --query 'Role.Arn' --output text)

# Generate task definition with real ARNs
TMPFILE=$(mktemp)
sed "s|\${EXECUTION_ROLE_ARN}|$EXEC_ROLE_ARN|g; s|\${TASK_ROLE_ARN}|$EXEC_ROLE_ARN|g" \
  apps/agent-runtime/infra/task-definition.json > "$TMPFILE"
aws ecs register-task-definition --cli-input-json "file://$TMPFILE" >/dev/null
rm -f "$TMPFILE"

# 5. Update or create service
echo "[5/5] Updating ECS service..."
if aws ecs describe-services --cluster "$ECS_CLUSTER" --services "$SERVICE_NAME" \
  --query 'services[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
  # Service exists — force new deployment
  aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$SERVICE_NAME" \
    --task-definition "$SERVICE_NAME" \
    --force-new-deployment \
    --query 'service.taskDefinition' \
    --output text
  echo "  Service updated with new deployment"
else
  # Service doesn't exist — create it with ALB
  VPC_ID="vpc-01ae65cbde060bbc2"
  SUBNETS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[?MapPublicIpOnLaunch==`true`].SubnetId' \
    --output text | tr '\t' ',')

  SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=olu-agent-runtime-sg" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

  TG_ARN=$(aws elbv2 describe-target-groups \
    --names olu-agent-runtime-tg \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text 2>/dev/null || echo "")

  CREATE_ARGS=(
    --cluster "$ECS_CLUSTER"
    --service-name "$SERVICE_NAME"
    --task-definition "$SERVICE_NAME"
    --desired-count 1
    --launch-type FARGATE
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG_ID],assignPublicIp=ENABLED}"
  )

  if [ -n "$TG_ARN" ] && [ "$TG_ARN" != "None" ]; then
    CREATE_ARGS+=(--load-balancers "targetGroupArn=$TG_ARN,containerName=agent-runtime,containerPort=8080")
  fi

  aws ecs create-service "${CREATE_ARGS[@]}" \
    --query 'service.serviceArn' \
    --output text
  echo "  Service created"
fi

echo ""
echo "=== Deploy complete ==="
echo "Check status: aws ecs describe-services --cluster $ECS_CLUSTER --services $SERVICE_NAME"
echo "View logs: aws logs tail $LOG_GROUP --follow"
