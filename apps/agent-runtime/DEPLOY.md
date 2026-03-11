# Agent Runtime — Deployment Guide

## AWS Resources

| Resource | Details |
|----------|---------|
| ECR | `749391130736.dkr.ecr.us-west-2.amazonaws.com/olu-agent-runtime` |
| ECS Cluster | `test-demo` |
| ECS Service | `olu-agent-runtime` |
| Task Definition | `olu-agent-runtime` (latest revision) |
| ALB | `olu-agent-runtime-alb-316192720.us-west-2.elb.amazonaws.com` |
| SSM Parameters | `/olu/agent-runtime/*` |
| Log Group | `/ecs/olu-agent-runtime` |

## Environment Variables

### Required (in SSM Parameter Store as SecureString)

```
/olu/agent-runtime/SUPABASE_URL
/olu/agent-runtime/SUPABASE_SERVICE_ROLE_KEY
/olu/agent-runtime/LLM_API_KEY              # Kimi API key (named provider)
/olu/agent-runtime/VOLCENGINE_API_KEY        # Doubao image generation
/olu/agent-runtime/MODEL_CLAUDE_API_KEY      # Claude via api123.icu proxy (default model)
/olu/agent-runtime/LARK_APP_ID              # Lark Suite API
/olu/agent-runtime/LARK_APP_SECRET
```

### Optional (placeholder until configured)

```
/olu/agent-runtime/FB_ACCESS_TOKEN           # Facebook Ads
/olu/agent-runtime/FB_AD_ACCOUNT_ID
/olu/agent-runtime/GOOGLE_PLAY_SERVICE_ACCOUNT_KEY
/olu/agent-runtime/GOOGLE_PLAY_PACKAGE_NAME
```

### Set in task-definition.json (non-secret)

```
NODE_ENV=production
PORT=8080
LLM_BASE_URL=https://api123.icu/v1
LLM_MODEL=claude-opus-4-6
VOLCENGINE_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VOLCENGINE_IMAGE_MODEL=doubao-seedream-5-0-260128
MODEL_CLAUDE_BASE_URL=https://api123.icu/v1
MODEL_CLAUDE_MODEL=claude-sonnet-4-6
```

## Deployment Steps

### 1. ECR Login

```bash
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin \
  749391130736.dkr.ecr.us-west-2.amazonaws.com
```

### 2. Build Docker Image (AMD64 for Fargate)

```bash
# IMPORTANT: Must build for linux/amd64, not ARM64
docker build --platform linux/amd64 \
  -t olu-agent-runtime \
  -f apps/agent-runtime/Dockerfile .
```

### 3. Tag and Push to ECR

```bash
docker tag olu-agent-runtime:latest \
  749391130736.dkr.ecr.us-west-2.amazonaws.com/olu-agent-runtime:latest

docker push \
  749391130736.dkr.ecr.us-west-2.amazonaws.com/olu-agent-runtime:latest
```

### 4. Register Task Definition

```bash
cd apps/agent-runtime/infra

# Substitute the IAM role ARN
EXECUTION_ROLE_ARN="arn:aws:iam::749391130736:role/ecsTaskExecutionRole" \
  envsubst < task-definition.json > /tmp/task-def-rendered.json

aws ecs register-task-definition \
  --cli-input-json file:///tmp/task-def-rendered.json \
  --region us-west-2
```

### 5. Deploy to ECS

```bash
aws ecs update-service \
  --cluster test-demo \
  --service olu-agent-runtime \
  --task-definition olu-agent-runtime:<revision> \
  --force-new-deployment \
  --region us-west-2
```

### 6. Verify Deployment

```bash
# Check deployment status
aws ecs describe-services \
  --cluster test-demo \
  --services olu-agent-runtime \
  --region us-west-2

# Check health
curl http://olu-agent-runtime-alb-316192720.us-west-2.elb.amazonaws.com/health

# Check models
curl http://olu-agent-runtime-alb-316192720.us-west-2.elb.amazonaws.com/models
```

## Adding SSM Parameters

```bash
aws ssm put-parameter \
  --name /olu/agent-runtime/PARAM_NAME \
  --value "value" \
  --type SecureString \
  --overwrite \
  --region us-west-2
```

## Adding a New Model Provider

1. Set env vars: `MODEL_<NAME>_API_KEY`, `MODEL_<NAME>_BASE_URL`, `MODEL_<NAME>_MODEL`
2. Add SSM parameter for the API key
3. Add to task-definition.json secrets section
4. Redeploy

## Task Definition Configuration

- **CPU**: 1024 (1 vCPU)
- **Memory**: 2048 MB (for Playwright/Chromium)
- **Network**: awsvpc
- **IAM Roles**: `ecsTaskExecutionRole` (both execution and task role)
- **Health Check**: `GET /health` every 30s

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `exec format error` | Build with `--platform linux/amd64` |
| `unable to assume role` | Check taskRoleArn matches executionRoleArn |
| Task keeps restarting | Check CloudWatch logs: `/ecs/olu-agent-runtime` |
| Model returns 400 | Some proxies reject `$schema` in tool params — already fixed |
| Chromium crashes | Ensure 2048 MB memory in task definition |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/chat` | Chat with agent (tool-calling) |
| POST | `/invoke` | Invoke task agent |
| POST | `/batch` | Run all workspace agents |
| POST | `/resume/:threadId` | Resume interrupted graph |
| GET | `/threads/:threadId` | Get thread state |
| GET | `/agents/:workspaceId` | List workspace agents |
| POST | `/webhook/task-created` | Supabase webhook trigger |
| POST | `/webhook/lark` | Lark bot webhook |
| GET | `/models` | List available models |
| GET | `/bots` | List registered Lark bots |
| GET | `/mcp/tools` | List MCP tools |
| GET | `/scheduler/jobs` | List active cron jobs |
