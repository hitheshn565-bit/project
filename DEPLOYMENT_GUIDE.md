# 🚀 Truetag Backend - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ **Environment Setup**
```bash
# 1. Clone and setup
git clone <repository>
cd truetag-backend
npm install

# 2. Environment configuration
cp .env.example .env
# Configure all required environment variables

# 3. Database setup
docker-compose up -d postgres redis kafka
npm run migrate

# 4. Test locally
npm run dev
./test-api.sh
```

### ✅ **Required Environment Variables**
```bash
# Server Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@host:5432/truetag_db

# Redis
REDIS_URL=redis://host:6379

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secure-access-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# eBay API (Production)
EBAY_APP_ID=your-production-app-id
EBAY_CERT_ID=your-production-cert-id
EBAY_DEV_ID=your-dev-id
EBAY_USER_TOKEN=your-user-token
EBAY_SANDBOX=false

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://yourdomain.com
```

## 🐳 **Docker Production Deployment**

### **1. Create Production Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### **2. Docker Compose for Production**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: truetag_db
      POSTGRES_USER: truetag
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    
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

volumes:
  postgres_data:
```

## ☁️ **Cloud Deployment Options**

### **AWS Deployment**
```bash
# Using AWS ECS with Fargate
aws ecs create-cluster --cluster-name truetag-cluster
aws ecs create-service --cluster truetag-cluster --service-name truetag-api

# Using AWS Elastic Beanstalk
eb init truetag-backend
eb create production
eb deploy
```

### **Google Cloud Platform**
```bash
# Using Cloud Run
gcloud run deploy truetag-api --source . --platform managed --region us-central1

# Using GKE
kubectl apply -f k8s/
```

### **Digital Ocean**
```bash
# Using App Platform
doctl apps create --spec app.yaml
```

## 🔧 **Performance Optimization**

### **1. Database Optimization**
```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_products_brand ON products(brand);
CREATE INDEX CONCURRENTLY idx_products_category ON products(category);
CREATE INDEX CONCURRENTLY idx_offers_product_id ON offers(product_id);
CREATE INDEX CONCURRENTLY idx_offers_price ON offers(current_price);
CREATE INDEX CONCURRENTLY idx_price_snapshots_offer_timestamp ON price_snapshots(offer_id, timestamp);

-- Enable query optimization
ANALYZE;
```

### **2. Redis Configuration**
```bash
# redis.conf optimizations
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### **3. Application Optimizations**
```javascript
// Enable compression
app.use(compression());

// Connection pooling
const db = knex({
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000
  }
});
```

## 📊 **Monitoring & Observability**

### **1. Health Checks**
```bash
# Application health
GET /health
GET /api/v1/health

# Database health
GET /api/v1/health/db

# Redis health  
GET /api/v1/health/redis
```

### **2. Metrics Collection**
```javascript
// Prometheus metrics
const promClient = require('prom-client');
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});
```

### **3. Logging Configuration**
```javascript
// Production logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔒 **Security Hardening**

### **1. SSL/TLS Configuration**
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

### **2. Rate Limiting**
```javascript
// Production rate limits
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP'
});
```

### **3. Security Headers**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

## 🚀 **Scaling Strategies**

### **1. Horizontal Scaling**
- Load balancer with multiple app instances
- Database read replicas
- Redis cluster for caching
- CDN for static assets

### **2. Vertical Scaling**
- Increase CPU/Memory for database
- Optimize Redis memory usage
- Application server resources

### **3. Auto-scaling Configuration**
```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: truetag-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: truetag-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 📈 **Performance Targets**

### **Production SLAs**
- **Response Time**: <500ms p95 latency
- **Availability**: 99.9% uptime
- **Throughput**: 1000+ requests/second
- **Error Rate**: <0.1% error rate

### **Monitoring Alerts**
- Response time > 1000ms
- Error rate > 1%
- Database connections > 80%
- Redis memory usage > 90%
- Disk usage > 85%

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Example**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build application
        run: npm run build
      - name: Deploy to production
        run: |
          docker build -t truetag-api .
          docker push $REGISTRY/truetag-api:latest
          kubectl set image deployment/truetag-api truetag-api=$REGISTRY/truetag-api:latest
```

## ✅ **Post-Deployment Verification**

### **1. Smoke Tests**
```bash
# Run comprehensive API tests
./test-api.sh

# Check all endpoints
curl https://api.truetag.com/health
curl https://api.truetag.com/api/v1/connectors/ebay/test
curl https://api.truetag.com/api/v1/recommendations/trending
```

### **2. Performance Testing**
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://api.truetag.com/api/v1/products/search?q=laptop

# Stress testing with Artillery
artillery run load-test.yml
```

### **3. Monitoring Setup**
- Configure alerts for key metrics
- Set up log aggregation
- Enable error tracking
- Monitor business metrics

---

## 🎉 **Deployment Complete!**

Your Truetag Backend is now production-ready with:
- ✅ Scalable architecture
- ✅ Security hardening
- ✅ Performance optimization
- ✅ Monitoring & alerting
- ✅ CI/CD pipeline

**The system is ready to handle thousands of concurrent users with sub-500ms response times!**
