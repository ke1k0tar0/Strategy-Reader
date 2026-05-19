# 📚 Project Navigation Guide

Quick navigation to help you get started and find what you need.

## 🚀 Getting Started

**New to the project?** Start here:

1. **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes
2. **[README.md](README.md)** - Complete project documentation
3. **Open http://localhost:3000** - See the dashboard

## 📖 Documentation

### For Developers

- **[DEVELOPER.md](DEVELOPER.md)** - How to extend and customize
  - Architecture overview
  - Module breakdown
  - Extension examples
  - Debugging tips

### For DevOps/Deployment

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy to production
  - Vercel, Docker, AWS, Railway
  - Environment configuration
  - Monitoring and logging
  - Security hardening

### For API Integration

- **[API.md](API.md)** - API reference
  - Endpoint documentation
  - Query parameters
  - Response format
  - Code examples

### Project Overview

- **[README.md](README.md)** - Main documentation
- **[CHANGELOG.md](CHANGELOG.md)** - Version history
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Project overview and checklist
- **[VERIFICATION.md](VERIFICATION.md)** - Implementation checklist

## 🏗️ Project Structure

```
Strategy Reader (trading optimization engine)
│
├── 📱 Frontend (React + Next.js)
│   ├── src/app/page.tsx          → Dashboard
│   ├── src/components/           → UI components
│   └── src/styles/               → TailwindCSS
│
├── 🔧 Backend (Node.js + APIs)
│   ├── src/app/api/              → API routes
│   ├── src/sheets/               → Google Sheets
│   ├── src/parsers/              → Data parsing
│   └── src/optimization/         → Recommendation engine
│
├── 📦 Configuration
│   ├── package.json              → Dependencies
│   ├── tsconfig.json             → TypeScript
│   ├── tailwind.config.js        → Styling
│   └── .env.local                → Environment
│
└── 📚 Documentation
    ├── QUICKSTART.md             → Fast setup
    ├── README.md                 → Full docs
    ├── DEVELOPER.md              → Extension guide
    ├── DEPLOYMENT.md             → Production guide
    └── API.md                    → API reference
```

## 🔑 Key Files by Use Case

### "I want to run it locally"

1. [QUICKSTART.md](QUICKSTART.md) - Step-by-step setup
2. Run `npm install`
3. Run `npm run dev`

### "I want to extend the scoring algorithm"

1. Read [DEVELOPER.md](DEVELOPER.md#3-optimization-module)
2. Edit `src/optimization/scoring.ts`
3. Restart dev server

### "I want to deploy to production"

1. Read [DEPLOYMENT.md](DEPLOYMENT.md)
2. Choose platform (Vercel recommended)
3. Configure environment variables
4. Deploy!

### "I want to integrate the API"

1. Read [API.md](API.md)
2. Use endpoint: `GET /api/recommendation?strategy=...`
3. See code examples for your language

### "I want to add a new feature"

1. Read [DEVELOPER.md](DEVELOPER.md#adding-new-features)
2. Follow the examples
3. Keep architecture modular

## 💻 Quick Commands

```bash
# Development
npm install                    # Install dependencies
npm run dev                   # Start dev server (localhost:3000)
npm run build                 # Build for production
npm start                     # Run production server
npm run type-check            # Check TypeScript errors
npm run lint                  # Run ESLint

# Utility
npm run dev -- --port 4000   # Run on different port
npm run build && npm start   # Build and start production
```

## 🎯 Core Modules

### Frontend

- **Dashboard** (`src/app/page.tsx`)
  - Strategy selector
  - Market condition filter
  - Recommendation display
  - Historical data table

- **Components** (`src/components/`)
  - RecommendationCard - Main recommendation display
  - FilterControls - Filter selection
  - HistoricalDataTable - Data visualization
  - ErrorAlert - Error messaging
  - LoadingSkeleton - Loading states

### Backend

- **API Route** (`src/app/api/recommendation/route.ts`)
  - GET /api/recommendation
  - Query validation
  - Error handling

- **Google Sheets** (`src/sheets/googleSheets.ts`)
  - Connect and authenticate
  - Fetch raw data
  - Map columns

- **Optimization** (`src/optimization/`)
  - filtering.ts - Filter experiments
  - scoring.ts - Calculate scores
  - ranking.ts - Rank parameter sets
  - recommendation.ts - Generate recommendations
  - explanations.ts - Create explanations

## 📊 Data Flow

```
Google Sheets
     ↓
Google Sheets API Client (sheets/googleSheets.ts)
     ↓
Parameter Parser (parsers/parameterParser.ts)
     ↓
Optimization Pipeline:
  1. Filter (filtering.ts)
  2. Score (scoring.ts)
  3. Group (ranking.ts)
  4. Rank (ranking.ts)
     ↓
Recommendation Engine (recommendation.ts)
     ↓
API Response (api/recommendation/route.ts)
     ↓
Frontend (React Dashboard)
```

## 🔗 External Resources

### Google Cloud Setup

- [Google Cloud Console](https://console.cloud.google.com)
- [Google Sheets API Docs](https://developers.google.com/sheets/api)
- [Service Accounts Guide](https://cloud.google.com/iam/docs/service-accounts)

### Deployment Platforms

- [Vercel](https://vercel.com) - Recommended for Next.js
- [Docker Docs](https://docs.docker.com)
- [AWS EC2](https://aws.amazon.com/ec2/)
- [Railway](https://railway.app)

### Development Tools

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org)
- [TailwindCSS Docs](https://tailwindcss.com)
- [Zod Docs](https://zod.dev)

## ❓ FAQ

**Q: How long to set up?**
A: 5 minutes with QUICKSTART.md

**Q: Can I use my own data?**
A: Yes! Just add your data to Google Sheets and configure the sheet ID.

**Q: How do I change the scoring?**
A: Edit `src/optimization/scoring.ts` and adjust the weights.

**Q: Can I deploy this?**
A: Yes! See DEPLOYMENT.md for step-by-step instructions.

**Q: Can I add authentication?**
A: Yes, it's not included in MVP but easy to add. See DEVELOPER.md.

## 🎓 Learning Path

1. **Understand the System** → Read README.md
2. **Get It Running** → Follow QUICKSTART.md
3. **Explore the Code** → Review DEVELOPER.md
4. **Extend Features** → Follow examples in DEVELOPER.md
5. **Deploy** → Follow DEPLOYMENT.md

## 🐛 Troubleshooting

**Problem**: Can't connect to Google Sheets

- Solution: Check credentials.json exists and path is correct

**Problem**: No recommendations generated

- Solution: Verify sheet has data with required columns

**Problem**: Slow API response

- Solution: Normal on first call (fetching from Sheets)

**Problem**: Type errors in TypeScript

- Solution: Run `npm run type-check` to see issues

See **Troubleshooting** section in README.md for more.

## 📝 Version Info

- **Current Version**: 0.1.0 (MVP)
- **Last Updated**: January 2024
- **Status**: Production-Ready

## 🚀 What's Next?

**Immediate**:

1. Follow QUICKSTART.md to run locally
2. Add your Google Sheets data
3. Test recommendations

**Short-term**:

1. Customize scoring weights
2. Add custom filters
3. Extend explanations

**Medium-term**:

1. Deploy to production
2. Set up monitoring
3. Add analytics

**Long-term**:

1. Add database
2. Implement ML models
3. Auto-backtesting
4. Live trading integration

## 📞 Support

- 📖 **Documentation**: See files listed above
- 💻 **Code Examples**: In DEVELOPER.md
- 🚀 **Deploy Help**: See DEPLOYMENT.md
- 🔌 **API Help**: See API.md
- 🐛 **Troubleshooting**: See README.md

---

**Ready to get started?** → Open [QUICKSTART.md](QUICKSTART.md)

**Questions?** → Check [README.md](README.md)

**Want to extend?** → Read [DEVELOPER.md](DEVELOPER.md)

Good luck! 🎉
