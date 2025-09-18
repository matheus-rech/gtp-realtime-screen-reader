# Deployment Guide

This guide covers deploying the Realtime Multimodal Assistant to various platforms.

## Overview

The application consists of two main components:
- **Frontend**: Next.js 14 application (React + TypeScript)
- **Backend**: Express.js server with WebSocket support

## Prerequisites

- Node.js 18+ (recommended: 20.x)
- OpenAI API key
- Redis instance (optional, but recommended for production)

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

### Backend (.env)
```bash
OPENAI_API_KEY=your_openai_api_key_here
REDIS_URL=redis://localhost:6379
PORT=8080
FRAME_RATE_LIMIT=2
MAX_SESSIONS=100
VISUAL_MAX_RESOLUTION=1024
```

## Deployment Options

### 1. Docker Deployment (Recommended)

#### Full Stack with Docker Compose
```bash
# Clone the repository
git clone https://github.com/matheus-rech/gtp-realtime-screen-reader.git
cd gtp-realtime-screen-reader

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up -d
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Redis: localhost:6379
- Nginx: http://localhost:80 (or https://localhost:443 with SSL)

#### Individual Docker Images
```bash
# Build frontend
docker build -t gtp-frontend --target frontend .

# Build backend  
docker build -t gtp-backend --target backend .

# Run frontend
docker run -p 3000:3000 -e NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 gtp-frontend

# Run backend
docker run -p 8080:8080 -e OPENAI_API_KEY=your_key gtp-backend
```

### 2. Vercel Deployment (Frontend Only)

Vercel is ideal for the frontend deployment with serverless functions.

#### Setup
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend: `cd apps/frontend`
3. Deploy: `vercel --prod`

#### Environment Variables
Set in Vercel dashboard:
- `NEXT_PUBLIC_BACKEND_URL`: Your backend URL

#### GitHub Integration
The repository includes `.github/workflows/deploy-vercel.yml` for automatic deployments.

Required secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `BACKEND_URL`

### 3. Netlify Deployment (Frontend Only)

#### Manual Deployment
1. Build the frontend: `npm run build --workspace frontend`
2. Deploy the `apps/frontend/.next` folder to Netlify

#### GitHub Integration
The repository includes `.github/workflows/deploy-netlify.yml` for automatic deployments.

Required secrets:
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`
- `BACKEND_URL`

#### Configuration
The `netlify.toml` file handles redirects and headers automatically.

### 4. Traditional VPS Deployment

#### Prerequisites
- Ubuntu 20.04+ or similar
- Node.js 20.x
- PM2 process manager
- Nginx reverse proxy
- SSL certificate

#### Setup Steps
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone https://github.com/matheus-rech/gtp-realtime-screen-reader.git
cd gtp-realtime-screen-reader

# Install dependencies
npm install

# Set up environment
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
# Edit these files with your values

# Build frontend
npm run build --workspace frontend

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
    
    location /visual {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### 5. Heroku Deployment

#### Frontend (Static Export)
```bash
cd apps/frontend
npm install -g heroku
heroku create your-app-name
heroku buildpacks:set heroku/nodejs
git subtree push --prefix apps/frontend heroku main
```

#### Backend
```bash
cd apps/backend
heroku create your-backend-name
heroku config:set OPENAI_API_KEY=your_key
heroku addons:create heroku-redis:mini
git subtree push --prefix apps/backend heroku main
```

## Production Considerations

### Security
- Always use HTTPS in production
- Keep API keys secure using environment variables
- Implement rate limiting
- Use secure headers (implemented in nginx.conf)

### Performance
- Enable Redis for session storage
- Use CDN for static assets
- Implement proper caching strategies
- Monitor memory usage for WebSocket connections

### Monitoring
- Set up application monitoring (e.g., Sentry)
- Monitor WebSocket connection metrics
- Track API usage and rate limits
- Monitor Redis memory usage

### Scaling
- Use horizontal scaling for multiple backend instances
- Implement sticky sessions for WebSocket connections
- Consider using Redis Cluster for high availability
- Use load balancers with WebSocket support

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure proxy supports WebSocket upgrades
   - Check firewall settings
   - Verify SSL certificate for WSS connections

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API rate limits
   - Ensure sufficient credits

3. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables are set

4. **Performance Issues**
   - Monitor memory usage
   - Optimize frame rate settings
   - Check Redis connection

### Logs
- Frontend: Check browser console and Vercel/Netlify logs
- Backend: Check server logs and PM2 logs (`pm2 logs`)
- Docker: `docker-compose logs -f`

## Support

For deployment issues:
1. Check the GitHub Issues page
2. Review the application logs
3. Verify all environment variables are correctly set
4. Test local deployment first

## CI/CD

The repository includes GitHub Actions workflows for:
- Continuous Integration (testing and building)
- Vercel deployment
- Netlify deployment  
- Docker image building and publishing

All workflows are in `.github/workflows/` directory.