#!/bin/bash
# One-time setup script for OLU Agent Runtime on ECS Fargate
# Run from repo root: bash apps/agent-runtime/infra/setup.sh

set -euo pipefail

AWS_REGION="us-west-2"
ACCOUNT_ID="749391130736"
ECR_REPO="olu-agent-runtime"
ECS_CLUSTER="test-demo"
LOG_GROUP="/ecs/olu-agent-runtime"
VPC_ID="vpc-01ae65cbde060bbc2"

echo "=== OLU Agent Runtime — AWS Setup ==="

# 1. Create ECR repository
echo "[1/5] Creating ECR repository..."
aws ecr create-repository \
  --repository-name "$ECR_REPO" \
  --region "$AWS_REGION" \
  --image-scanning-configuration scanOnPush=true \
  2>/dev/null && echo "  Created $ECR_REPO" || echo "  Already exists"

# 2. Create CloudWatch log group
echo "[2/5] Creating CloudWatch log group..."
aws logs create-log-group \
  --log-group-name "$LOG_GROUP" \
  --region "$AWS_REGION" \
  2>/dev/null && echo "  Created $LOG_GROUP" || echo "  Already exists"

# 3. Create ECS task execution role (if not exists)
echo "[3/5] Checking ECS task execution role..."
EXEC_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole"
if ! aws iam get-role --role-name ecsTaskExecutionRole >/dev/null 2>&1; then
  echo "  Creating ecsTaskExecutionRole..."
  aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }'
  aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
  # Allow reading SSM parameters for secrets
  aws iam put-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-name SSMReadAccess \
    --policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Action": ["ssm:GetParameters", "ssm:GetParameter"],
        "Resource": "arn:aws:ssm:'$AWS_REGION':'$ACCOUNT_ID':parameter/olu/*"
      }]
    }'
else
  echo "  Already exists"
fi

# 4. Find subnets in the VPC
echo "[4/5] Finding subnets..."
SUBNETS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].SubnetId' \
  --output text | tr '\t' ',')
echo "  Subnets: $SUBNETS"

# 5. Create security group for the service
echo "[5/5] Creating security group..."
SG_ID=$(aws ec2 create-security-group \
  --group-name olu-agent-runtime-sg \
  --description "OLU Agent Runtime ECS Fargate" \
  --vpc-id "$VPC_ID" \
  --query 'GroupId' \
  --output text \
  2>/dev/null) && {
  echo "  Created SG: $SG_ID"
  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp --port 8080 \
    --cidr 0.0.0.0/0
} || {
  SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=olu-agent-runtime-sg" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)
  echo "  Already exists: $SG_ID"
}

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Store secrets in SSM Parameter Store:"
echo "     aws ssm put-parameter --name /olu/agent-runtime/SUPABASE_URL --value 'YOUR_URL' --type SecureString"
echo "     aws ssm put-parameter --name /olu/agent-runtime/SUPABASE_SERVICE_ROLE_KEY --value 'YOUR_KEY' --type SecureString"
echo "     aws ssm put-parameter --name /olu/agent-runtime/LLM_API_KEY --value 'YOUR_KEY' --type SecureString"
echo ""
echo "  2. Build and push the Docker image:"
echo "     aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
echo "     docker build -f apps/agent-runtime/Dockerfile -t $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest ."
echo "     docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest"
echo ""
echo "  3. Register task definition and create service:"
echo "     # Edit infra/task-definition.json — replace \${EXECUTION_ROLE_ARN} and \${TASK_ROLE_ARN}"
echo "     aws ecs register-task-definition --cli-input-json file://apps/agent-runtime/infra/task-definition.json"
echo "     aws ecs create-service --cluster $ECS_CLUSTER --service-name olu-agent-runtime \\"
echo "       --task-definition olu-agent-runtime --desired-count 1 --launch-type FARGATE \\"
echo "       --network-configuration 'awsvpcConfiguration={subnets=['${SUBNETS//,/,}'],securityGroups=['$SG_ID'],assignPublicIp=ENABLED}'"
