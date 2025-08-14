# 🚀 Deployment Guide - Myanmar Grocery Store Inventory System

This guide will help you deploy the inventory management system to production.

## 📋 Prerequisites

- Node.js 18+ installed
- npm 8+ or yarn
- Basic knowledge of terminal/command line
- Web server or hosting platform

## 🏃‍♂️ Quick Production Setup

### Step 1: Clone and Install
```bash
# Clone the repository
git clone https://github.com/MawGyi/mini_store_inv_app.git
cd mini_store_inv_app

# Install all dependencies
npm run install:all
```

### Step 2: Build Frontend
```bash
# Build the production frontend
cd client
npm run build

# The built files will be in client/dist/
cd ..
```

### Step 3: Environment Configuration
```bash
# Create environment file
cd server
echo "NODE_ENV=production" > .env
echo "PORT=3003" >> .env

# Optional: Add database URL if using MongoDB
echo "MONGODB_URI=mongodb://localhost:27017/inventory_app" >> .env
```

### Step 4: Start Production Server
```bash
# From the server directory
npm start

# Or using PM2 for production (recommended)
npm install -g pm2
pm2 start server-simple.js --name "inventory-app"
pm2 save
pm2 startup
```

## 🌐 Hosting Options

### Option 1: VPS/Cloud Server (Recommended)

**1. DigitalOcean Droplet**
```bash
# On your droplet
sudo apt update
sudo apt install nodejs npm nginx
git clone your-repo
cd mini_store_inv_app
npm run install:all
cd client && npm run build && cd ..
cd server && npm start
```

**2. Configure Nginx**
```nginx
# /etc/nginx/sites-available/inventory-app
server {
    listen 80;
    server_name your-domain.com;

    # Serve frontend static files
    location / {
        root /path/to/mini_store_inv_app/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Netlify + Heroku

**Frontend on Netlify:**
```bash
# Build command
npm run build

# Publish directory
client/dist

# Redirect rules (_redirects file)
/api/* https://your-backend-app.herokuapp.com/api/:splat 200
/* /index.html 200
```

**Backend on Heroku:**
```bash
# In server directory
echo "web: node server-simple.js" > Procfile
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
git push heroku main
```

### Option 3: Docker Deployment

**1. Create Dockerfile for Backend**
```dockerfile
# server/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3003
CMD ["node", "server-simple.js"]
```

**2. Create Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./server
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - PORT=3003
    restart: unless-stopped

  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./client/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
    restart: unless-stopped
```

**3. Deploy with Docker**
```bash
# Build frontend first
cd client && npm run build && cd ..

# Start with Docker Compose
docker-compose up -d
```

## 🔧 Production Configuration

### Performance Optimization

**1. Enable Gzip Compression**
```javascript
// In server-simple.js, add after other middleware:
import compression from 'compression';
app.use(compression());
```

**2. Static File Caching**
```javascript
// Add cache headers
app.use(express.static('public', {
  maxAge: '1y',
  etag: false
}));
```

**3. Security Headers**
```javascript
// Already included with helmet middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### Monitoring Setup

**1. Health Check Endpoint**
```javascript
// Already available at /api/health
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

**2. Error Logging**
```javascript
// Add to server-simple.js
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 📱 Mobile Optimization

The application is already mobile-responsive, but for better mobile experience:

**1. PWA Setup (Optional)**
```javascript
// In client/src/app.html, add:
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#3b82f6">
```

**2. Service Worker (Future Enhancement)**
```javascript
// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## 🔐 Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled (Let's Encrypt recommended)
- [ ] CORS properly configured
- [ ] Input validation active
- [ ] Rate limiting enabled
- [ ] Security headers applied
- [ ] Regular backups scheduled

## 📊 Performance Monitoring

### Metrics to Track
- Response time (target: <100ms)
- Error rate (target: <1%)
- Uptime (target: 99.9%)
- Memory usage
- CPU usage

### Tools
- **New Relic**: Application monitoring
- **PM2 Monitor**: Process monitoring
- **Google Analytics**: User behavior
- **Uptime Robot**: Availability monitoring

## 🔄 CI/CD Pipeline (Advanced)

**GitHub Actions Example:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm run install:all
      
    - name: Build frontend
      run: cd client && npm run build
      
    - name: Deploy to server
      run: |
        # Your deployment script here
        rsync -avz . user@your-server:/path/to/app
        ssh user@your-server 'pm2 restart inventory-app'
```

## 🚨 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Find and kill process using port 3003
lsof -ti:3003 | xargs kill -9

# Or use different port
PORT=3004 npm start
```

**2. Build Errors**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Or try with yarn
yarn install
```

**3. Memory Issues**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Logs and Debugging

```bash
# Check PM2 logs
pm2 logs inventory-app

# Check system logs
journalctl -u nginx -f

# Monitor real-time
htop
iotop
```

## 📞 Support

If you encounter issues during deployment:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review server logs for error details
3. Ensure all dependencies are properly installed
4. Verify environment variables are set correctly
5. Check network connectivity and firewall settings

---

**Deployment successful? 🎉**

Your Myanmar Grocery Store Inventory System should now be running in production!

Test all features:
- ✅ Dashboard loads
- ✅ Items can be added/edited
- ✅ POS system works
- ✅ Reports generate
- ✅ Myanmar text displays correctly

---

*For additional support, create an issue on GitHub or contact the development team.*
