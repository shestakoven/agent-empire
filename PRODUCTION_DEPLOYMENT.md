# 🚀 Production Deployment Guide - Agent Empire

## 🚀 Overview

This guide covers deploying Agent Empire to production with real AI-powered trading agents, advanced security, and scalable infrastructure.

## 📋 Prerequisites

- **Node.js 18+** with npm/yarn
- **PostgreSQL 14+** (production database)
- **Redis 6+** (caching and WebSocket scaling)
- **Docker** (recommended for containerized deployment)
- **SSL Certificate** (required for production)

## 🔧 Environment Configuration

1. **Copy environment template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Configure essential variables:**
   ```bash
   # Required for production
   NODE_ENV=production
   APP_URL=https://your-domain.com
   DATABASE_URL=postgresql://user:pass@host:5432/agent_empire
   NEXTAUTH_SECRET=your-super-secret-32-char-minimum-key
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

3. **Set up authentication providers:**
   - Google OAuth: [Google Cloud Console](https://console.cloud.google.com/)
   - GitHub OAuth: [GitHub Developer Settings](https://github.com/settings/developers)
   - Generate strong NEXTAUTH_SECRET: `openssl rand -base64 32`

## 🏗️ Database Setup

### PostgreSQL Production Setup

1. **Create database:**
   ```sql
   CREATE DATABASE agent_empire;
   CREATE USER agent_empire_user WITH ENCRYPTED PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE agent_empire TO agent_empire_user;
   ```

2. **Run migrations:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Verify connection:**
   ```bash
   npx prisma studio
   ```

### Database Performance Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_agents_user_id ON "Agent"(user_id);
CREATE INDEX idx_agents_status ON "Agent"(status);
CREATE INDEX idx_agents_created_at ON "Agent"(created_at);

-- Configure PostgreSQL for production
-- Add to postgresql.conf:
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

## 🐳 Docker Deployment

### 1. Build Production Image

```dockerfile
# Dockerfile.production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 2. Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/agent_empire
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - agent-empire

  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: agent_empire
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - agent-empire

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - agent-empire

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - agent-empire

volumes:
  postgres_data:
  redis_data:

networks:
  agent-empire:
    driver: bridge
```

### 3. Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /socket.io/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            limit_req zone=general burst=50 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## ☁️ Cloud Deployment Options

### 1. Vercel (Recommended for Serverless)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add OPENAI_API_KEY
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
```

**Vercel Configuration (vercel.json):**
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 300
    }
  },
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
```

### 2. AWS EC2 with Auto Scaling

```bash
#!/bin/bash
# deploy-aws.sh

# Launch EC2 instance with User Data
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=AgentEmpire-Production}]'
```

**User Data Script (user-data.sh):**
```bash
#!/bin/bash
yum update -y
yum install -y docker
service docker start
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clone and deploy
git clone https://github.com/your-username/agent-empire.git /app
cd /app
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Google Cloud Run

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/agent-empire', '-f', 'Dockerfile.production', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/agent-empire']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'agent-empire'
      - '--image'
      - 'gcr.io/$PROJECT_ID/agent-empire'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--memory'
      - '2Gi'
      - '--cpu'
      - '2'
      - '--max-instances'
      - '10'
```

### 4. DigitalOcean App Platform

```yaml
# .do/app.yaml
name: agent-empire
services:
- name: web
  source_dir: /
  github:
    repo: your-username/agent-empire
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: professional-xs
  env:
    - key: NODE_ENV
      value: production
    - key: DATABASE_URL
      value: ${db.DATABASE_URL}
  health_check:
    http_path: /api/health

databases:
- name: db
  engine: PG
  num_nodes: 1
  size: db-s-dev-database
  version: "14"
```

## 🔐 Security Hardening

### 1. Environment Security
```bash
# Set secure file permissions
chmod 600 .env.local
chown root:root .env.local

# Use secrets management
export OPENAI_API_KEY=$(aws secretsmanager get-secret-value --secret-id prod/agent-empire/openai-key --query SecretString --output text)
```

### 2. Database Security
```sql
-- Create read-only user for analytics
CREATE USER agent_empire_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE agent_empire TO agent_empire_readonly;
GRANT USAGE ON SCHEMA public TO agent_empire_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO agent_empire_readonly;

-- Enable row-level security
ALTER TABLE "Agent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_user_policy ON "Agent" FOR ALL TO agent_empire_user USING (user_id = current_setting('app.current_user_id'));
```

### 3. API Security
```typescript
// middleware/security.ts
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { getClientIP } from '@/lib/utils'

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://api.openai.com", "wss:", "ws:"],
      },
    },
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  })
]
```

## 📊 Monitoring & Observability

### 1. Application Monitoring

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})

// Health check endpoint
export async function healthCheck() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkOpenAI(),
    checkAgentEngine(),
  ])
  
  return {
    status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
    checks: checks.map((c, i) => ({
      name: ['database', 'redis', 'openai', 'agents'][i],
      status: c.status,
      details: c.status === 'fulfilled' ? c.value : c.reason
    }))
  }
}
```

### 2. Performance Monitoring

```typescript
// lib/performance.ts
import { performance } from 'perf_hooks'

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  
  startTimer(name: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordMetric(name, duration)
    }
  }
  
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
    
    // Keep only last 1000 measurements
    const values = this.metrics.get(name)!
    if (values.length > 1000) {
      values.splice(0, values.length - 1000)
    }
  }
  
  getStats(name: string) {
    const values = this.metrics.get(name) || []
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99)
    }
  }
}
```

### 3. Log Management

```typescript
// lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ] : [])
  ]
})
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

      - name: Run database migrations
        run: |
          npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## 🔧 Operational Tasks

### 1. Database Backups

```bash
#!/bin/bash
# backup.sh

# Create backup
BACKUP_FILE="agent_empire_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/database/

# Clean up local file
rm $BACKUP_FILE

# Retain only last 30 days of backups
aws s3 ls s3://your-backup-bucket/database/ | \
  awk '$1 < "'$(date -d '30 days ago' '+%Y-%m-%d')'" {print $4}' | \
  xargs -I {} aws s3 rm s3://your-backup-bucket/database/{}
```

### 2. Log Rotation

```bash
# /etc/logrotate.d/agent-empire
/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    postrotate
        docker exec agent-empire-app kill -USR1 1
    endscript
}
```

### 3. Health Monitoring Script

```bash
#!/bin/bash
# monitor.sh

HEALTH_URL="https://your-domain.com/api/health"
SLACK_WEBHOOK="your-slack-webhook-url"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -ne 200 ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚨 Agent Empire health check failed! Status: '$response'"}' \
        $SLACK_WEBHOOK
fi
```

## 📈 Performance Optimization

### 1. Next.js Optimizations

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['prisma']
  },
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif']
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
    ]
  }
}
```

### 2. Database Optimizations

```sql
-- Query performance indexes
CREATE INDEX CONCURRENTLY idx_agents_active_user ON "Agent"(user_id) WHERE status = 'ACTIVE';
CREATE INDEX CONCURRENTLY idx_executions_agent_timestamp ON "AgentExecution"(agent_id, timestamp DESC);

-- Connection pooling optimization
-- Add to DATABASE_URL: ?pgbouncer=true&connection_limit=10
```

### 3. Redis Caching Strategy

```typescript
// lib/cache.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export class CacheManager {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  }
  
  async set(key: string, value: any, ttlSeconds = 3600) {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  }
  
  async invalidate(pattern: string) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Issues:**
   ```bash
   # Check connection
   pg_isready -h your-db-host -p 5432
   
   # Check connection pool
   SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
   ```

2. **Memory Issues:**
   ```bash
   # Monitor Node.js memory
   node --max-old-space-size=4096 server.js
   
   # Check container memory
   docker stats agent-empire-app
   ```

3. **High CPU Usage:**
   ```bash
   # Profile application
   clinic doctor -- node server.js
   
   # Check agent engine load
   curl https://your-domain.com/api/health | jq '.components.agentEngine'
   ```

## 📞 Support & Maintenance

### Monitoring Checklist
- [ ] Health endpoints responding < 500ms
- [ ] Database connections < 80% of pool
- [ ] Redis memory usage < 80%
- [ ] Error rate < 1%
- [ ] Agent execution success rate > 95%
- [ ] SSL certificate valid > 30 days
- [ ] Backup completed within 24 hours
- [ ] No security vulnerabilities in dependencies

### Monthly Tasks
- [ ] Review and rotate API keys
- [ ] Update dependencies (`npm audit`)
- [ ] Analyze performance metrics
- [ ] Review database query performance
- [ ] Test disaster recovery procedures
- [ ] Review and update documentation

---

**Need help?** Check our [troubleshooting guide](./TROUBLESHOOTING.md) or contact support at support@agent-empire.com