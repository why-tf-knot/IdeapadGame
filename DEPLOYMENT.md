# BuildPaper Deployment Guide

This guide covers deploying BuildPaper to production for both backend API and iOS mobile app.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Backend Deployment](#backend-deployment)
4. [iOS App Deployment](#ios-app-deployment)
5. [Post-Deployment Checklist](#post-deployment-checklist)
6. [Monitoring & Analytics](#monitoring--analytics)

---

## Prerequisites

### Required Accounts
- [ ] MongoDB Atlas account (for production database)
- [ ] Backend hosting service (Heroku, Render, AWS, etc.)
- [ ] Apple Developer account ($99/year for TestFlight/App Store)
- [ ] (Optional) Sentry account for error tracking
- [ ] (Optional) Analytics service (Mixpanel, Amplitude, etc.)
- [ ] (Optional) OpenAI/Anthropic API key for real AI integration

### Development Tools
- [ ] Node.js 18+
- [ ] Xcode 15+
- [ ] CocoaPods
- [ ] Git

---

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in `backend/` with the following:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/buildpaper?retryWrites=true&w=majority

# Authentication
JWT_SECRET=<generate-strong-secret-key-here>

# AI Credit System
MONTHLY_GRANT_AMOUNT_INVESTOR=1000
CREDITS_PER_EQUITY_PERCENT=10000

# AI Integration (Optional - for real AI responses)
OPENAI_API_KEY=sk-your-openai-key-here
AI_MODEL=gpt-4
AI_MAX_TOKENS=1000

# Analytics & Error Tracking (Optional)
SENTRY_DSN=https://...@sentry.io/...
MIXPANEL_TOKEN=your-mixpanel-token
```

### Generate Secure JWT Secret

```bash
# Use a cryptographically secure random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### iOS App Configuration

Update `ios-app/src/services/api.ts`:

```typescript
// For production
const API_BASE_URL = 'https://your-api-domain.com/api';

// For development
// const API_BASE_URL = 'http://localhost:3000/api';
```

---

## Backend Deployment

### Option 1: Heroku

1. **Install Heroku CLI**:
```bash
npm install -g heroku
heroku login
```

2. **Create Heroku app**:
```bash
cd backend
heroku create buildpaper-api
```

3. **Set environment variables**:
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="..."
heroku config:set MONTHLY_GRANT_AMOUNT_INVESTOR=1000
heroku config:set CREDITS_PER_EQUITY_PERCENT=10000
```

4. **Deploy**:
```bash
git push heroku main
```

5. **Verify deployment**:
```bash
heroku open
curl https://your-app.herokuapp.com/health
```

### Option 2: Render

1. **Create new Web Service** on Render dashboard
2. **Connect GitHub repository**
3. **Configure**:
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
4. **Add environment variables** in Render dashboard
5. **Deploy**

### Option 3: AWS (EC2/ECS)

1. **Set up EC2 instance** or ECS cluster
2. **Install Node.js and PM2**:
```bash
npm install -g pm2
```

3. **Clone repository**:
```bash
git clone https://github.com/your-org/IdeapadGame.git
cd IdeapadGame/backend
npm install
```

4. **Set environment variables**:
```bash
cp .env.example .env
nano .env  # Edit with production values
```

5. **Start with PM2**:
```bash
pm2 start npm --name "buildpaper-api" -- start
pm2 save
pm2 startup
```

6. **Configure Nginx as reverse proxy**:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

7. **Set up SSL with Let's Encrypt**:
```bash
sudo certbot --nginx -d api.yourdomain.com
```

---

## MongoDB Atlas Setup

1. **Create MongoDB Atlas cluster**:
   - Go to https://cloud.mongodb.com
   - Create a free tier cluster
   - Name: `buildpaper-prod`

2. **Configure network access**:
   - Add IP whitelist: `0.0.0.0/0` (or specific IPs)
   - Or use VPC peering for AWS/GCP

3. **Create database user**:
   - Username: `buildpaper_admin`
   - Password: Generate strong password
   - Permissions: Read and write to any database

4. **Get connection string**:
   - Click "Connect" > "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password

5. **Set up database indexes** (for performance):
```javascript
// Connect to MongoDB shell
db.users.createIndex({ email: 1 }, { unique: true });
db.ideas.createIndex({ founderId: 1 });
db.ideas.createIndex({ status: 1 });
db.investorideastatuses.createIndex({ investorId: 1, ideaId: 1 }, { unique: true });
db.aicreditallocations.createIndex({ investorId: 1, ideaId: 1 }, { unique: true });
```

---

## iOS App Deployment

### Step 1: Prepare for Archive

1. **Update API URL**:
```typescript
// ios-app/src/services/api.ts
const API_BASE_URL = 'https://your-production-api.com/api';
```

2. **Update app version**:
   - Open `ios/BuildPaper.xcworkspace` in Xcode
   - Select project > General
   - Increment Version and Build number

3. **Configure signing**:
   - Select your Apple Developer Team
   - Choose "Automatically manage signing"

### Step 2: Archive the App

1. **In Xcode**:
   - Select "Any iOS Device" as build target
   - Product > Archive
   - Wait for archive to complete

2. **Validate the Archive**:
   - In Organizer, click "Validate App"
   - Fix any issues

### Step 3: Deploy to TestFlight

1. **Upload to App Store Connect**:
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Select "Upload"

2. **Configure TestFlight**:
   - Go to App Store Connect
   - Select your app
   - TestFlight tab
   - Add internal testers (up to 100)
   - Add external testers (up to 10,000, requires Beta App Review)

3. **Share TestFlight link** with testers

### Step 4: App Store Submission

1. **Complete App Information**:
   - App name, description, keywords
   - Screenshots (required for all device sizes)
   - App icon (1024x1024)
   - Privacy policy URL
   - Support URL

2. **Submit for Review**:
   - Answer App Store questions
   - Submit for review
   - Wait 24-48 hours for approval

3. **Release**:
   - Manual release or automatic after approval

---

## Post-Deployment Checklist

### Backend Verification

- [ ] Health check endpoint responds: `curl https://api.yourdomain.com/health`
- [ ] User registration works
- [ ] User login works and returns JWT
- [ ] Protected endpoints require authentication
- [ ] Database connections are stable
- [ ] Error tracking is active (if Sentry configured)
- [ ] Analytics events are logging (check console or analytics dashboard)

### iOS App Verification

- [ ] App launches without crashes
- [ ] Login/Registration flows work
- [ ] API calls succeed from production app
- [ ] Paper toss gestures work smoothly
- [ ] Credit allocation works
- [ ] AI tools can be accessed (even with placeholder responses)
- [ ] Navigation between screens works

### Performance & Monitoring

- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error alerting
- [ ] Set up log aggregation (Papertrail, Loggly)
- [ ] Monitor API response times
- [ ] Track cache hit rates
- [ ] Monitor database performance

---

## Monitoring & Analytics

### Backend Monitoring

The analytics service tracks the following events:

**User Events:**
- `user_registered` - New user signup
- `user_login` - User login

**Investor Events:**
- `paper_toss` - Gesture action (reject/save)
- `idea_reviewed` - Idea saved or rejected
- `credits_allocated` - AI credits invested

**Founder Events:**
- `idea_created` - New idea submitted
- `ai_tool_used` - AI tool accessed
- `credits_spent` - Credits used for AI service

**System Events:**
- `cache_hit` / `cache_miss` - AI response caching
- `api_error` - API errors
- All errors with stack traces

### Integrate with Analytics Services

To integrate with Mixpanel, Amplitude, or other services:

1. **Install SDK**:
```bash
cd backend
npm install mixpanel
```

2. **Update `analyticsService.ts`**:
```typescript
import Mixpanel from 'mixpanel';

const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN!);

trackEvent(event: AnalyticsEvent): void {
  if (this.isProduction) {
    mixpanel.track(event.name, event.properties);
  }
  // ...
}
```

3. **Set environment variable**:
```bash
MIXPANEL_TOKEN=your-token-here
```

### Integrate with Sentry (Error Tracking)

1. **Install Sentry**:
```bash
cd backend
npm install @sentry/node
```

2. **Initialize in `server.ts`**:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Add before routes
app.use(Sentry.Handlers.requestHandler());

// Add before error handler
app.use(Sentry.Handlers.errorHandler());
```

3. **Update `analyticsService.ts`**:
```typescript
trackError(error: Error, context?: ErrorContext): void {
  if (this.isProduction) {
    Sentry.captureException(error, { contexts: context });
  }
  // ...
}
```

---

## Database Backup Strategy

### Automated MongoDB Atlas Backups

1. **Enable Continuous Backup**:
   - MongoDB Atlas offers continuous backups
   - Retained for 1-7 days (configurable)
   - Point-in-time recovery

2. **Set up scheduled snapshots**:
   - Navigate to cluster > Backup tab
   - Configure snapshot schedule
   - Retention: 7-30 days

3. **Test restore process**:
   - Practice restoring from backup
   - Verify data integrity

---

## Scaling Considerations

### Backend Scaling

**Horizontal Scaling:**
- Deploy multiple instances behind load balancer
- Use sticky sessions or stateless JWT auth
- Cache can be upgraded to Redis for shared state

**Database Scaling:**
- MongoDB Atlas auto-scales storage
- For high traffic, consider read replicas
- Implement connection pooling

**Caching:**
- Current: In-memory cache (single instance)
- Scale: Migrate to Redis for distributed caching
- Benefits: Shared cache across multiple server instances

### iOS App Scaling

- No server-side scaling needed (client app)
- Monitor API rate limits
- Implement request throttling if needed
- Consider CDN for images/assets

---

## Security Hardening

### Backend Security

- [ ] Use HTTPS/TLS for all API endpoints
- [ ] Enable CORS with specific origins only
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add Helmet.js for security headers
- [ ] Sanitize all user inputs
- [ ] Use parameterized queries (Mongoose does this)
- [ ] Rotate JWT secrets periodically
- [ ] Implement request size limits
- [ ] Set up API key rotation for AI services

### iOS App Security

- [ ] Enable App Transport Security (ATS)
- [ ] Use Keychain for sensitive data storage
- [ ] Implement certificate pinning for API
- [ ] Obfuscate API keys
- [ ] Enable data protection
- [ ] Implement jailbreak detection (if required)

---

## Rollback Procedures

### Backend Rollback

**Heroku:**
```bash
heroku releases
heroku rollback v123
```

**PM2:**
```bash
pm2 restart buildpaper-api
git checkout <previous-commit>
pm2 reload buildpaper-api
```

### iOS App Rollback

- Cannot rollback after App Store release
- Prepare hotfix and expedited review
- TestFlight: Can release previous build to testers

### Database Rollback

- Restore from MongoDB Atlas snapshot
- Be cautious with schema changes
- Test migrations thoroughly before production

---

## Support & Troubleshooting

### Common Issues

**Issue: "Unable to connect to database"**
- Check MongoDB Atlas IP whitelist
- Verify connection string
- Check network connectivity

**Issue: "JWT token invalid"**
- Verify JWT_SECRET matches across environments
- Check token expiration (30 days default)
- Ensure authorization header format: `Bearer <token>`

**Issue: "iOS app can't reach API"**
- Verify API_BASE_URL in api.ts
- Check CORS configuration
- Ensure HTTPS is configured
- Test with curl or Postman first

### Getting Help

- Check logs: `heroku logs --tail` or PM2 logs
- Monitor error tracking service (Sentry)
- Review analytics for patterns
- Check GitHub issues
- Contact support team

---

## Maintenance Tasks

### Weekly
- [ ] Review error logs
- [ ] Monitor API response times
- [ ] Check database size and performance
- [ ] Review user feedback

### Monthly
- [ ] Update dependencies
- [ ] Review security advisories
- [ ] Backup database manually
- [ ] Review analytics reports
- [ ] Rotate API keys (if applicable)

### Quarterly
- [ ] Major dependency updates
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Infrastructure cost review

---

## Cost Estimates (Monthly)

**Free Tier:**
- MongoDB Atlas: $0 (512MB)
- Heroku: $0 (hobby tier, sleeps after 30 min)
- Render: $0 (free tier)
- Total: $0/month

**Production Tier:**
- MongoDB Atlas: $9-$57 (M2-M10 shared)
- Heroku: $7-$25 (hobby/standard)
- Domain: $12/year ($1/month)
- Apple Developer: $99/year ($8.25/month)
- Sentry: $0-$26 (free tier available)
- Total: ~$25-$120/month

**Scale Tier (1000+ users):**
- MongoDB Atlas: $180+ (dedicated M20+)
- AWS/GCP: $50-$200 (EC2/Cloud Run)
- Redis: $15-$50 (for caching)
- CDN: $0-$50 (CloudFlare free tier available)
- Monitoring: $50-$100
- Total: $300-$600/month

---

## Next Steps After Deployment

1. **Launch Beta Test**:
   - Invite 10-20 beta testers via TestFlight
   - Collect feedback
   - Monitor crash reports and analytics

2. **Iterate**:
   - Fix critical bugs
   - Improve based on feedback
   - Add most-requested features

3. **Public Launch**:
   - Submit to App Store
   - Launch marketing campaign
   - Monitor closely for first 48 hours

4. **Continuous Improvement**:
   - Weekly deploys with bug fixes
   - Monthly feature releases
   - Quarterly major updates

---

## Additional Resources

- [React Native Deployment Guide](https://reactnative.dev/docs/running-on-device)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Heroku Node.js Deployment](https://devcenter.heroku.com/articles/deploying-nodejs)

---

*Last Updated: February 2026*
*Version: 1.0*
