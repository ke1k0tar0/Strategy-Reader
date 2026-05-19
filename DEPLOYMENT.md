# Deployment Guide

Complete guide for deploying the Strategy Reader to production.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Google Sheets credentials validated
- [ ] Database backups created (if applicable)
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Error handling tested
- [ ] Logging configured
- [ ] CORS settings appropriate
- [ ] Rate limiting configured
- [ ] Monitoring tools set up

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the official Next.js deployment platform.

#### Setup

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Select your GitHub repository
5. Configure environment variables:
   - `GOOGLE_SHEETS_CREDENTIALS_PATH`
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SHEET_RANGE`
6. Click "Deploy"

#### Environment Variables on Vercel

1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. **Important**: For `GOOGLE_SHEETS_CREDENTIALS_PATH`, you have two options:

**Option A: Use JSON string directly** (recommended)

```
# Instead of a file path, store the entire credentials as JSON:
GOOGLE_SHEETS_CREDENTIALS_JSON={"type":"service_account",...}

# Then modify googleSheets.ts:
const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON!);
```

**Option B: Upload credentials file**

- This doesn't work well on Vercel (stateless)
- Use Option A instead

### Option 2: Docker

#### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
```

#### Build and Run

```bash
docker build -t strategy-reader:1.0.0 .
docker run -p 3000:3000 \
  -e GOOGLE_SHEETS_CREDENTIALS_PATH=credentials.json \
  -e GOOGLE_SHEET_ID=xxx \
  -v $(pwd)/credentials.json:/app/credentials.json \
  strategy-reader:1.0.0
```

### Option 3: AWS EC2

#### Steps

1. Launch EC2 instance (Ubuntu 20.04+)
2. SSH into instance
3. Install Node.js 18+
4. Clone repository
5. Install dependencies: `npm install`
6. Configure environment variables
7. Build: `npm run build`
8. Use PM2 for process management:

```bash
npm install -g pm2
pm2 start npm --name strategy-reader -- start
pm2 startup
pm2 save
```

#### Security Groups

Open ports:

- 80 (HTTP)
- 443 (HTTPS)
- 3000 (Node.js app)

#### SSL/TLS

Use Certbot with Let's Encrypt:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
```

### Option 4: Railway

Simple alternative to Vercel.

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Connect GitHub repository
4. Add environment variables
5. Deploy

## Production Environment Variables

Create `.env.production`:

```env
# Google Sheets
GOOGLE_SHEETS_CREDENTIALS_PATH=credentials.json
GOOGLE_SHEET_ID=your_production_sheet_id
GOOGLE_SHEET_RANGE=Sheet1!A:N

# API
NEXT_PUBLIC_API_URL=https://yourdomain.com
NODE_ENV=production

# Optional: Monitoring
SENTRY_DSN=https://your-sentry-key@sentry.io/project
LOG_LEVEL=info
```

## Database Setup (If Using)

If extending with a database:

### PostgreSQL

```bash
# Create database
createdb strategy_reader

# Run migrations
npm run migrate

# Verify connection
psql -U postgres -d strategy_reader -c "SELECT VERSION();"
```

### Environment Variable

```env
DATABASE_URL=postgresql://user:password@localhost:5432/strategy_reader
```

## Scaling Considerations

### Caching Layer

For high traffic, add Redis:

```bash
docker run -d -p 6379:6379 redis:latest
```

Environment variable:

```env
REDIS_URL=redis://localhost:6379
```

### Load Balancing

Use Nginx for load balancing:

```nginx
upstream app {
  server localhost:3000;
  server localhost:3001;
}

server {
  listen 80;
  server_name yourdomain.com;

  location / {
    proxy_pass http://app;
  }
}
```

### CDN

Use CloudFlare or AWS CloudFront to cache static assets.

## Monitoring and Logging

### Application Monitoring

Option 1: Sentry (Error tracking)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

Option 2: DataDog

```typescript
import { StatsD } from "node-dogstatsd";

const dogstatsd = new StatsD();
dogstatsd.gauge("app.startup", 1);
```

### Logging

Use structured logging:

```typescript
// src/utils/logger.ts
export function logEvent(level, message, data?) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    }),
  );
}
```

### Metrics to Monitor

- API response times
- Error rates
- Cache hit ratios
- Google Sheets API quota usage
- Memory usage
- CPU usage

## Security Hardening

### 1. Environment Variables

Never commit:

- `credentials.json`
- `.env.local`
- `.env.production`

### 2. Rate Limiting

Add rate limiting middleware:

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);
```

### 3. CORS Configuration

```typescript
const cors = require("cors");

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(","),
    credentials: true,
  }),
);
```

### 4. HTTPS

Always use HTTPS in production:

```typescript
// Add HSTS header
response.headers.set(
  "Strict-Transport-Security",
  "max-age=31536000; includeSubDomains",
);
```

### 5. Input Validation

Always validate input with Zod:

```typescript
const schema = z.object({
  strategy: z.string().min(1),
  marketCondition: z.string().optional(),
});

const validated = schema.parse(input);
```

## Rollback Procedure

If deployment fails:

### Vercel

1. Go to Deployments
2. Click on previous successful deployment
3. Click "Rollback to this Deployment"

### Docker/EC2

```bash
# Identify running container
docker ps

# Stop current container
docker stop <container-id>

# Start previous version
docker run -d -p 3000:3000 strategy-reader:0.9.0
```

### Git

```bash
git revert <commit-hash>
git push
# Re-deploy
```

## Health Check Endpoint

Add a health check for monitoring:

```typescript
// src/app/api/health/route.ts

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
```

Use in monitoring:

```bash
# Every 30 seconds
curl https://yourdomain.com/api/health
```

## Performance Optimization

### 1. Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={100}
  height={100}
  priority
/>
```

### 2. Code Splitting

Next.js automatically code-splits pages and API routes.

### 3. Compression

Enable gzip in `next.config.js`:

```javascript
module.exports = {
  compress: true,
};
```

### 4. Caching Headers

```typescript
response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
```

## Database Migrations (If Applicable)

```bash
npm run migrate:up
npm run migrate:down
npm run migrate:status
```

Keep migrations version-controlled in `migrations/` directory.

## Backup Strategy

### Google Sheets

No backup needed - Google Sheets maintains history.

### Database (if added)

Daily automated backups:

```bash
# Backup script
pg_dump strategy_reader > backup_$(date +%Y%m%d).sql
gzip backup_$(date +%Y%m%d).sql
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://my-backups/
```

## Disaster Recovery

In case of data loss:

1. **Google Sheets**: Use Sheet version history (Ctrl+Z or Version History)
2. **Database**: Restore from latest backup
3. **Application**: Redeploy from git

## Post-Deployment Verification

- [ ] Application loads without errors
- [ ] API endpoints respond correctly
- [ ] Google Sheets connection works
- [ ] Recommendations are generated
- [ ] No errors in logs
- [ ] Performance metrics acceptable
- [ ] All env variables loaded
- [ ] Monitoring/alerts working

## Maintenance

### Weekly

- Monitor error rates
- Review API logs
- Check performance metrics
- Verify Google Sheets access

### Monthly

- Update dependencies: `npm update`
- Security audit: `npm audit`
- Review scaling metrics
- Optimize slow queries

### Quarterly

- Major version updates
- Architecture review
- Performance optimization
- Security assessment

## Support and Troubleshooting

### Common Issues

**Issue**: "Cannot find credentials"
**Solution**: Verify GOOGLE_SHEETS_CREDENTIALS_PATH is set and file exists

**Issue**: Slow API response
**Solution**: Check cache status, Google Sheets API quota

**Issue**: Deployment fails
**Solution**: Check build logs, environment variables, dependencies

## Contact and Support

For production issues:

1. Check application logs
2. Verify all env variables
3. Test Google Sheets connection
4. Rollback to last known good state
5. Contact development team

---

Need help? See README.md, QUICKSTART.md, or DEVELOPER.md for more information.
