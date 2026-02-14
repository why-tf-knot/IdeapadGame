# BuildPaper - Paper Toss Game for Ideas and AI Investing

A mobile application (iOS) that connects early-stage founders with investors through an innovative "paper toss" interface. Investors review ideas by swiping, and allocate AI credits to projects they believe in.

## Features

### For Investors
- **Paper Toss Interface**: Review ideas with intuitive gestures
  - Swipe down to reject (toss to trash)
  - Swipe right to save (toss to saved tray)
- **AI Credit System**: Monthly AI credit grants to invest in promising ideas
- **Saved Ideas Dashboard**: Track your investments and estimated equity
- **Real-time Chat**: Connect with founders

### For Founders
- **Idea Submission**: Create detailed pitches with structured information
- **AI-Powered Tools**: Use invested AI credits for:
  - Pitch improvement
  - Feature roadmap generation
  - Summary enhancement
- **Track Funding**: See how many AI credits your idea has received
- **Investor Communication**: Chat with interested investors

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based auth with bcrypt
- **Real-time**: Socket.io (ready for integration)

### iOS App
- **Framework**: React Native 0.84
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Gestures**: React Native Gesture Handler + Animated API
- **Storage**: AsyncStorage for auth tokens
- **HTTP Client**: Axios

## Project Structure

```
IdeapadGame/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth middleware
│   │   ├── services/       # Business logic
│   │   └── server.ts       # Entry point
│   ├── package.json
│   └── tsconfig.json
│
└── ios-app/                # React Native iOS app
    ├── src/
    │   ├── screens/        # App screens
    │   ├── components/     # Reusable components
    │   ├── services/       # API client
    │   ├── types/          # TypeScript types
    │   └── navigation/     # Navigation config
    ├── ios/                # iOS native code
    ├── App.tsx             # Main app component
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Xcode 15+ (for iOS development)
- CocoaPods (for iOS dependencies)
- iOS Simulator or physical iOS device

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/buildpaper
JWT_SECRET=your-secret-key-here
MONTHLY_GRANT_AMOUNT_INVESTOR=1000
CREDITS_PER_EQUITY_PERCENT=10000
```

5. Start MongoDB (if running locally):
```bash
mongod
```

6. Run the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### iOS App Setup

1. Navigate to the iOS app directory:
```bash
cd ios-app
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS dependencies:
```bash
cd ios
pod install
cd ..
```

4. Update the API URL in `src/services/api.ts`:
```typescript
// For iOS Simulator
const API_BASE_URL = 'http://localhost:3000/api';

// For physical device, use your computer's IP
// const API_BASE_URL = 'http://192.168.1.XXX:3000/api';
```

5. Start the Metro bundler:
```bash
npm start
```

6. In a new terminal, run the iOS app:
```bash
npm run ios
```

Or open `ios/BuildPaper.xcworkspace` in Xcode and run from there.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Ideas (Founders)
- `POST /api/ideas` - Create idea
- `PUT /api/ideas/:id` - Update idea
- `GET /api/ideas/my` - Get founder's ideas
- `GET /api/ideas/:id` - Get idea details

### Review (Investors)
- `GET /api/review/next` - Get next idea to review
- `POST /api/review/:ideaId/save` - Save idea
- `POST /api/review/:ideaId/reject` - Reject idea
- `GET /api/review/saved` - Get saved ideas

### AI Credits
- `GET /api/credits/wallet/me` - Get wallet balance
- `POST /api/credits/invest` - Invest credits in idea
- `POST /api/credits/spend` - Spend credits on AI service
- `GET /api/credits/idea/:ideaId` - Get idea credit info

### Equity
- `GET /api/equity/idea/:ideaId` - Get equity mapping

### Chat
- `POST /api/chat/threads` - Create/get thread
- `GET /api/chat/threads` - List threads
- `GET /api/chat/threads/:id` - Get thread messages
- `POST /api/chat/threads/:id/messages` - Send message

## Usage

### As an Investor

1. **Register**: Create an account with role "INVESTOR"
2. **Review Ideas**: Use the paper toss interface to review ideas
   - Tap to see full details
   - Swipe down to reject
   - Swipe right to save
3. **Allocate Credits**: Choose how many AI credits to invest (25/50/100/200)
4. **Track Investments**: View your saved ideas and equity percentages

### As a Founder

1. **Register**: Create an account with role "FOUNDER"
2. **Create Idea**: Fill out the idea submission form
3. **Wait for Funding**: Investors will review and potentially fund your idea
4. **Use AI Tools**: Spend allocated AI credits on AI-powered features
5. **Connect**: Chat with investors who saved your idea

## Paper Toss Gestures

The core interaction model uses intuitive swipe gestures:

- **Swipe Down + Velocity**: Reject the idea (toss to trash)
- **Swipe Right**: Save the idea (toss to saved tray)
- **Tap**: View full idea details
- **Release in neutral zone**: Card snaps back to center

## AI Credit System

1. **Grant**: Investors receive 1,000 AI credits monthly (configurable)
2. **Invest**: Investors allocate credits to ideas they like
3. **Spend**: Founders use allocated credits for AI services
4. **Equity**: Credits consumed translate to estimated equity percentages

Default: 10,000 credits consumed = 1% equity (configurable)

## Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon for auto-reload
```

### iOS Development
```bash
cd ios-app
npm start    # Start Metro bundler
npm run ios  # Run on iOS simulator
```

### Build for Production

Backend:
```bash
cd backend
npm run build
npm start
```

iOS:
1. Open `ios/BuildPaper.xcworkspace` in Xcode
2. Select "Product" > "Archive"
3. Follow Apple's deployment guide for TestFlight/App Store

## Future Enhancements

- [ ] Real-time Socket.io chat implementation
- [ ] Actual AI integration (OpenAI/Anthropic/Gemini)
- [ ] Image upload for deck slides
- [ ] Push notifications
- [ ] Admin dashboard
- [ ] Monthly credit grant cron job
- [ ] Equity smart contracts (if desired)
- [ ] Android version

## License

MIT

## Contributors

Built with ❤️ for connecting founders and investors
