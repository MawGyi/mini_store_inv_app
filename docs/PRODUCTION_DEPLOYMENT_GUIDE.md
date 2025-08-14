# Production Deployment Guide - Mini Store Inventory App

## Overview
This guide provides comprehensive instructions for deploying the Mini Store Inventory Application to production environments.

## Prerequisites

### System Requirements
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher  
- **MongoDB**: v6.x or higher (local or cloud)
- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / macOS / Windows Server

### Hardware Requirements
- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 50GB storage
- **Network**: Stable internet connection with sufficient bandwidth

## Deployment Options

### Option 1: Traditional Server Deployment

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y

# Install MongoDB (if using local instance)
sudo apt install mongodb -y
```

#### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/MawGyi/mini_store_inv_app.git
cd mini_store_inv_app

# Install dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Build frontend
cd client
npm run build
cd ..

# Setup environment variables
cp .env.example .env
# Edit .env with production values
```

#### 3. Environment Configuration

Create production environment files:

**Root `.env`:**
```env
NODE_ENV=production
PORT=3003
MONGODB_URI=mongodb://localhost:27017/mini_store_prod
JWT_SECRET=your-super-secure-jwt-secret-here
CORS_ORIGIN=https://yourdomain.com
```

**Client `.env.production`:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_TITLE=Mini Store Inventory
VITE_APP_ENV=production
```

#### 4. Nginx Configuration

Create `/etc/nginx/sites-available/mini-store`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend
    location / {
        root /path/to/mini_store_inv_app/client/dist;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/mini-store /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 6. PM2 Process Management

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'mini-store-server',
    script: './server/server-simple.js',
    cwd: '/path/to/mini_store_inv_app',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

Start the application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 2: Docker Deployment

#### 1. Create Dockerfiles

**Root `Dockerfile`:**
```dockerfile
# Multi-stage build
FROM node:18-alpine AS frontend-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production

COPY client/ ./
RUN npm run build

FROM node:18-alpine AS backend-build

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy backend
COPY --from=backend-build --chown=nextjs:nodejs /app/server ./server
# Copy frontend build
COPY --from=frontend-build --chown=nextjs:nodejs /app/client/dist ./client/dist

USER nextjs

EXPOSE 3003

ENV NODE_ENV=production

CMD ["node", "server/server-simple.js"]
```

**Docker Compose (`docker-compose.prod.yml`):**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/mini_store_prod
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
    restart: unless-stopped
    networks:
      - app-network

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    environment:
      - MONGO_INITDB_DATABASE=mini_store_prod
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  mongo_data:

networks:
  app-network:
    driver: bridge
```

#### 2. Deploy with Docker
```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale the application
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

### Option 3: Cloud Deployment (AWS/DigitalOcean/Heroku)

#### AWS Deployment
1. **EC2 Instance Setup**
2. **RDS for MongoDB Atlas**
3. **S3 for static assets**
4. **CloudFront for CDN**
5. **Load Balancer for scaling**

#### Heroku Deployment
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create mini-store-app

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-here

# Deploy
git push heroku main
```

## Database Setup and Migration

### 1. Database Initialization

Create `scripts/init-db.js`:
```javascript
// MongoDB initialization script
db = db.getSiblingDB('mini_store_prod');

// Create collections
db.createCollection('items');
db.createCollection('categories');
db.createCollection('sales');
db.createCollection('users');

// Create indexes
db.items.createIndex({ "item_code": 1 }, { unique: true });
db.items.createIndex({ "name": "text" });
db.categories.createIndex({ "category_name_my": 1 });
db.sales.createIndex({ "sale_date": -1 });
db.sales.createIndex({ "customer_phone": 1 });

// Insert default categories
db.categories.insertMany([
  {
    category_name_my: "အစားအသောက်",
    category_name_en: "Food & Beverages",
    created_at: new Date()
  },
  {
    category_name_my: "အိမ်သုံးပစ္စည်း",
    category_name_en: "Household Items",
    created_at: new Date()
  }
]);

print("Database initialized successfully");
```

### 2. Data Migration (if upgrading)

Create `scripts/migrate.js`:
```javascript
// Migration script for data updates
const { MongoClient } = require('mongodb');

async function migrate() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Example migration: Add new fields
    await db.collection('items').updateMany(
      { low_stock_threshold: { $exists: false } },
      { $set: { low_stock_threshold: 10 } }
    );
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrate();
```

## Security Configuration

### 1. Server Security

**Security headers middleware:**
```javascript
// Add to server/server-simple.js
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

### 2. Environment Security

- Use strong JWT secrets (minimum 32 characters)
- Enable MongoDB authentication
- Use HTTPS everywhere
- Implement rate limiting
- Set up monitoring and alerting

### 3. Firewall Configuration
```bash
# Ubuntu UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 27017  # MongoDB (only allow local)
```

## Monitoring and Logging

### 1. Application Monitoring

**PM2 Monitoring:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 2. Database Monitoring

Create `scripts/health-check.js`:
```javascript
const { MongoClient } = require('mongodb');

async function healthCheck() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const stats = await client.db().stats();
    console.log('Database health:', {
      status: 'healthy',
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize
    });
    
    await client.close();
  } catch (error) {
    console.error('Database health check failed:', error);
    process.exit(1);
  }
}

healthCheck();
```

### 3. Log Management

**Centralized logging with winston:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

## Backup and Recovery

### 1. Database Backup

Create `scripts/backup.sh`:
```bash
#!/bin/bash

# Variables
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="mini_store_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
mongodump --db $DB_NAME --out $BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR $DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.tar.gz"
```

Schedule with cron:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/scripts/backup.sh
```

### 2. Application Backup

```bash
#!/bin/bash
# Backup application files
tar -czf /backups/app_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  /path/to/mini_store_inv_app
```

## Performance Optimization

### 1. Database Optimization

- Create appropriate indexes
- Use connection pooling
- Implement query optimization
- Monitor slow queries

### 2. Application Optimization

- Enable gzip compression
- Implement caching strategies
- Optimize bundle size
- Use CDN for static assets

### 3. Server Optimization

```nginx
# Nginx optimization
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json;
```

## Troubleshooting

### Common Issues

1. **Connection refused errors**
   - Check if services are running
   - Verify firewall settings
   - Check port availability

2. **Database connection issues**
   - Verify MongoDB is running
   - Check connection string
   - Verify authentication

3. **Performance issues**
   - Check resource usage
   - Monitor database queries
   - Review application logs

### Health Check Endpoints

Add to server:
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## Rollback Procedures

### 1. Application Rollback

```bash
# With PM2
pm2 stop mini-store-server
git checkout previous-stable-tag
npm install
pm2 start mini-store-server
```

### 2. Database Rollback

```bash
# Restore from backup
mongorestore --db mini_store_prod /backups/mongodb/backup_date/mini_store_prod/
```

## Maintenance Schedule

### Daily
- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor resource usage

### Weekly
- [ ] Database maintenance
- [ ] Security updates
- [ ] Performance review
- [ ] Backup verification

### Monthly
- [ ] Security audit
- [ ] Dependency updates
- [ ] Capacity planning
- [ ] Disaster recovery testing

## Production Checklist

### Pre-Deployment
- [ ] Code reviewed and tested
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup systems in place

### Post-Deployment
- [ ] Application responding correctly
- [ ] Database connections working
- [ ] SSL/HTTPS working
- [ ] Monitoring alerts configured
- [ ] Performance metrics baseline established

### Security Verification
- [ ] No sensitive data in logs
- [ ] Authentication working
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] Database access restricted

This guide provides a comprehensive approach to deploying the Mini Store Inventory Application in production environments with proper security, monitoring, and maintenance procedures.
